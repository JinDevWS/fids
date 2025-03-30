import axios from 'axios';
import { prisma } from '@/lib/prisma';
import { sendPushNotification } from '@/utils/pushNotification';
import pLimit from 'p-limit';
import { FlightHistoryDTO, FlightItem, SyncConfigOptions, SyncFlightsOptions } from '@/types/types';
import { Flight } from '@prisma';
import { toFlightHistoryDTO } from './flightHistoryMapper';

const url = 'http://openapi.airport.co.kr:80/service/rest/FlightStatusList/getFlightStatusList';
const serviceKey = process.env.AIRPORT_API_KEY;
const limit = pLimit(10); // 병렬 처리 제한

// DB에서 항공편 동기화용 필터링 설정값(공항코드, 국제선/국내선, 출발/도착) 조회
export const getSyncConfig = async (): Promise<SyncConfigOptions> => {
  const config = await prisma.syncConfig.findUnique({ where: { id: 1 } });

  // DB에 값이 없으면 upsert해주고 기본셋팅값(김포, 국제선, 도착) 리턴
  if (config === null) {
    const req = { airport: 'GMP', line: 'I', io: 'I' };
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/sync/config/update`, {
      method: 'POST',
      body: JSON.stringify(req),
    });
    return req;
  }

  const syncConfig: SyncConfigOptions = {
    airport: config.airport,
    line: config.line,
    io: config.io,
  };
  return syncConfig;
};

// DB에서 항공편 목록 조회
export const getFlightList = async (): Promise<Flight[]> => {
  const config = await getSyncConfig();

  const flightList = await prisma.flight.findMany({
    where: {
      airport: config.airport,
      line: config.line,
      io: config.io,
    },
    include: {
      histories: {
        orderBy: { changedAt: 'desc' },
        take: 1, // 가장 최근 상태만
      },
    },
  });

  return flightList;
};

// 전체 항공편 상태 조회(모든 공항, 국제선+국내선, 출발편+도착편 모두 다)
export const fetchFlightStatusAll = async (): Promise<FlightItem[]> => {
  const { data } = await axios.get(url, {
    params: {
      schStTime: '0000',
      schEdTime: '2359',
      numOfRows: 3000,
      serviceKey,
      _type: 'json',
    },
  });

  // console.log(
  //   '[API 응답 상태]',
  //   data.response?.header?.resultCode,
  //   data.response?.header?.resultMsg,
  // );

  // 인증키 문제 방어코드(인증키나 호출 문제 시 명확히 에러 뜨게 처리)
  if (data?.response?.header?.resultCode !== '00') {
    throw new Error(`공공 API 오류: ${data.response?.header?.resultMsg}`);
  }

  return data.response?.body?.items?.item || [];
};

// 항공편 상태 조회(공항코드, 국제/국내, 출발/도착 필터링 적용)
export const fetchFlightStatus = async ({
  schAirCode,
  schLineType, // 국제선/국내선
  schIOType, // 출발편/도착편
}: SyncFlightsOptions): Promise<FlightItem[]> => {
  const { data } = await axios.get(url, {
    params: {
      schStTime: '0000',
      schEdTime: '2359',
      schAirCode,
      schLineType, // 국제선/국내선
      schIOType, // 출발편/도착편
      numOfRows: 300,
      serviceKey,
      _type: 'json',
    },
  });

  // console.log(
  //   '[API 응답 상태]',
  //   data.response?.header?.resultCode,
  //   data.response?.header?.resultMsg,
  // );

  // 인증키 문제 방어코드(인증키나 호출 문제 시 명확히 에러 뜨게 처리)
  if (data?.response?.header?.resultCode !== '00') {
    throw new Error(`공공 API 오류: ${data.response?.header?.resultMsg}`);
  }

  return data.response?.body?.items?.item || [];
};

// 푸시 알림 전송
export const sendPush = async (item: FlightItem) => {
  const flightNumber = item.airFln;
  const etd = item.etd ? String(item.etd) : null;
  const gate = item.gate ? String(item.gate) : '';
  const line = item.line === '국제' ? 'I' : 'D';
  const newStatus = item.rmkKor ?? null;

  // 구독자 필터링
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      airportCode: item.airport,
      lineType: line,
      ioType: item.io,
      enabled: true,
    },
  });

  // 푸시 알림 병렬 전송
  await Promise.all(
    subscriptions.map(async (sub) => {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth,
          p256dh: sub.p256dh,
        },
      };

      try {
        const formattedEtd = etd
          ? `${etd.split('')[0]}${etd.split('')[1]}:${etd.split('')[2]}${etd.split('')[3]}`
          : '--:--'; // 시간 [00:00] 형식으로 표시하려고 split 함
        await sendPushNotification(subscription, {
          title: `[${formattedEtd}] ${flightNumber} 상태 변경`,
          body: `상태: ${newStatus}, 게이트: ${gate}`,
          // url: `/flights/${flightNumber}`,
        });
      } catch (e: any) {
        console.error('푸시 실패:', e.message);

        if (e.statusCode === 410 || e.statusCode === 404) {
          try {
            await prisma.pushSubscription.delete({
              where: { id: sub.id },
            });
            console.log(`만료된 구독 제거됨: ${sub.endpoint}`);
          } catch (deleteError) {
            console.error('구독 삭제 실패:', deleteError);
          }
        }
      }
    }),
  );
};

// Flight 스냅샷 테이블 upsert 함수
export const flightsUpsert = async () => {
  const flightsAll = await fetchFlightStatusAll();

  await Promise.all(
    flightsAll.map((item) =>
      limit(async () => {
        // console.log('[DEBUG] item: ', item);

        const flightNumber = item.airFln;
        const std = item.std ? String(item.std) : '';
        const etd = item.etd ? String(item.etd) : '';
        const gate = item.gate ? String(item.gate) : '';
        const line = item.line === '국제' ? 'I' : 'D';

        // Flight 스냅샷 테이블 upsert
        await prisma.flight.upsert({
          where: {
            flightNumber_std_airport_io_line: {
              flightNumber,
              std,
              airport: item.airport,
              io: item.io,
              line,
            },
          },
          update: {
            etd,
            gate,
            rmkKor: item.rmkKor,
            rmkEng: item.rmkEng,
            airlineKor: item.airlineKorean,
            airlineEng: item.airlineEnglish,
            boardingKor: item.boardingKor,
            boardingEng: item.boardingEng,
            arrivedKor: item.arrivedKor,
            arrivedEng: item.arrivedEng,
            city: item.city,
          },
          create: {
            flightNumber,
            std,
            etd,
            airport: item.airport,
            io: item.io,
            line,
            gate,
            rmkKor: item.rmkKor,
            rmkEng: item.rmkEng,
            airlineKor: item.airlineKorean,
            airlineEng: item.airlineEnglish,
            boardingKor: item.boardingKor,
            boardingEng: item.boardingEng,
            arrivedKor: item.arrivedKor,
            arrivedEng: item.arrivedEng,
            city: item.city,
          },
        });
      }),
    ),
  );
};

// flight 테이블에서 FlightItem으로 일치하는 flight 하나 찾기(id 찾아내기용)
export const findFlightOne = async (item: FlightItem) => {
  const flight = await prisma.flight.findUnique({
    where: {
      flightNumber_std_airport_io_line: {
        flightNumber: item.airFln,
        std: item.std ? String(item.std) : '',
        airport: item.airport,
        io: item.io,
        line: item.line === '국제' ? 'I' : 'D',
      },
    },
  });

  return flight;
};

// flightStatusHistory 테이블에서 Flight의 id와 일치하는 history를 최신데이터 하나만 찾는 함수
export const findFlightStatusHistoryOne = async (flightId: number) => {
  const flightStatusHistory = await prisma.flightStatusHistory.findFirst({
    where: {
      flightId,
    },
    orderBy: {
      changedAt: 'desc',
    },
  });

  return flightStatusHistory;
};

// FlightStatusHistory 데이터 업데이트
export const updateFlightStatusHistory = async (id: number, flightHistoryDto: FlightHistoryDTO) => {
  await prisma.flightStatusHistory.update({
    where: { id },
    data: {
      ...flightHistoryDto,
      flightId: Number(flightHistoryDto.flightId),
    },
  });
};

// FlightStatusHistory에 데이터 추가
export const createFlightStatusHistory = async (flightHistoryDto: FlightHistoryDTO) => {
  await prisma.flightStatusHistory.create({
    data: {
      ...flightHistoryDto,
      flightId: Number(flightHistoryDto.flightId),
    },
  });
};

// 동기화
export const syncFlights = async (options: SyncFlightsOptions) => {
  const forceInit = options.forceInit ?? false;
  const flights = await fetchFlightStatus(options);

  // console.log('[DEBUG] 가져온 항공편 수:', flights.length);
  // console.log('[DEBUG] 원본 응답:', JSON.stringify(flights, null, 2));

  // Flight 스냅샷 테이블 upsert
  flightsUpsert();

  const existingCount = await prisma.flightStatusHistory.count(); // 테이블이 비어있는지 확인
  const isInitialSync = forceInit || existingCount === 0; // 최초 변경사항 sync 상태 여부 판별

  await Promise.all(
    flights.map((item) =>
      limit(async () => {
        // console.log('[DEBUG] item: ', item);

        const flightNumber = item.airFln;
        const newStatus = item.rmkKor ?? null;

        // 이전 상태 이력 조회
        // 1. Flight 테이블에서 flightId 찾기
        const flight = await findFlightOne(item);

        // 2. flightId로 상태 이력 조회
        if (flight === null) return null;
        const existing = await findFlightStatusHistoryOne(Number(flight.id));

        const prevStatus = existing?.newStatus || null;

        // console.log(`[DEBUG] forceInit: ${forceInit}`);
        // console.log(
        //   `[DEBUG] flight: ${flightNumber}, std: ${std}, prev: ${prevStatus}, new: ${newStatus}`,
        // );

        // 강제 기록이 아니면서 상태가 동일하면 스킵
        if (!forceInit && prevStatus === newStatus) return;

        // 변경 내역 기록
        if (prevStatus !== newStatus) {
          const flightHistoryDto = toFlightHistoryDTO(
            item,
            prevStatus,
            newStatus,
            flight.id.toString(),
          );

          // FlightStatusHistory 테이블 update or create
          if (existing) {
            await updateFlightStatusHistory(Number(existing.id), flightHistoryDto);
          } else {
            await createFlightStatusHistory(flightHistoryDto);
          }

          console.log(
            `[${forceInit ? '초기 기록' : '상태 변경'}] ${flightNumber} (${prevStatus} → ${newStatus})`,
          );

          // 푸시 생략 조건
          if (isInitialSync || newStatus === null) return;

          // 푸시 알림 전송
          sendPush(item);
        }
      }),
    ),
  );
};
