import axios from 'axios';
import { prisma } from '@/lib/prisma';
import { sendPushNotification } from '@/utils/pushNotification';
import pLimit from 'p-limit';

type FlightItem = {
  airFln: string;
  airlineEnglish: string;
  airlineKorean: string;
  airport: string;
  boardingKor: string;
  boardingEng: string;
  arrivedKor: string;
  arrivedEng: string;
  city: string;
  gate?: string;
  io: string; // 출/도착 구분: I or O
  line: string; // 국내/국제선: D or I
  std: string; // 예정 출발시간
  etd: string; // 실제 출발시간
  rmkKor?: string; // 상태 (한글)
  rmkEng?: string; // 상태 (영문)
};

// 1. 항공편 상태 조회
export const fetchFlightStatus = async (): Promise<FlightItem[]> => {
  const url = 'http://openapi.airport.co.kr:80/service/rest/FlightStatusList/getFlightStatusList';
  const serviceKey = process.env.AIRPORT_API_KEY;

  const { data } = await axios.get(url, {
    params: {
      schStTime: '0000',
      schEdTime: '2359',
      schAirCode: 'GMP',
      schLineType: 'I', // 국제선/국내선
      schIOType: 'I', // 출발편/도착편
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

// 2. 동기화 및 푸시 알림 전송
export const syncFlights = async ({ forceInit = false } = {}) => {
  const flights = await fetchFlightStatus();

  // console.log('[DEBUG] 가져온 항공편 수:', flights.length);
  // console.log('[DEBUG] 원본 응답:', JSON.stringify(flights, null, 2));

  const limit = pLimit(10); // 병렬 처리 제한

  const existingCount = await prisma.flightStatusHistory.count(); // 테이블이 비어있는지 확인
  const isInitialSync = forceInit || existingCount === 0; // 최초 sync 상태 여부 판별

  await Promise.all(
    flights.map((item) =>
      limit(async () => {
        // console.log('[DEBUG] item: ', item);

        const flightNumber = item.airFln;
        const std = String(item.std); // std가 숫자로 들어와서 String으로 바꿔줌
        const newStatus = item.rmkKor ?? null;

        // 이전 상태 조회
        const existing = await prisma.flightStatusHistory.findUnique({
          where: {
            flightNumber_std: {
              flightNumber,
              std,
            },
          },
        });

        const prevStatus = existing?.newStatus || null;

        // console.log(`[DEBUG] forceInit: ${forceInit}`);
        // console.log(
        //   `[DEBUG] flight: ${flightNumber}, std: ${std}, prev: ${prevStatus}, new: ${newStatus}`,
        // );

        // 강제 기록이 아니면서 상태가 동일하면 스킵
        if (!forceInit && prevStatus === newStatus) return;

        // 변경 내역 기록
        await prisma.flightStatusHistory.upsert({
          where: {
            flightNumber_std: {
              flightNumber: item.airFln,
              std: String(item.std),
            },
          },
          update: {
            prevStatus,
            newStatus,
            changedAt: new Date(),
            airlineKor: item.airlineKorean,
            airlineEng: item.airlineEnglish,
            airport: item.airport,
            boardingKor: item.boardingKor,
            boardingEng: item.boardingEng,
            arrivedKor: item.arrivedKor,
            arrivedEng: item.arrivedEng,
            gate: String(item.gate) ?? ' ',
            io: item.io,
            line: item.line,
            city: item.city,
            etd: String(item.etd),
            rmkKor: item.rmkKor,
            rmkEng: item.rmkEng,
          },
          create: {
            flightNumber: item.airFln,
            std: String(item.std),
            prevStatus,
            newStatus,
            airlineKor: item.airlineKorean,
            airlineEng: item.airlineEnglish,
            airport: item.airport,
            boardingKor: item.boardingKor,
            boardingEng: item.boardingEng,
            arrivedKor: item.arrivedKor,
            arrivedEng: item.arrivedEng,
            gate: String(item.gate) ?? ' ',
            io: item.io,
            line: item.line,
            city: item.city,
            etd: String(item.etd),
            rmkKor: item.rmkKor,
            rmkEng: item.rmkEng,
          },
        });

        console.log(
          `[${forceInit ? '초기 기록' : '상태 변경'}] ${flightNumber} (${prevStatus} → ${newStatus})`,
        );

        // 최초 초기화 또는 newStatus가 null인 경우 푸시 알림 생략
        if (isInitialSync || newStatus === null) return;

        // 구독자 필터링
        const subscriptions = await prisma.pushSubscription.findMany({
          where: {
            airportCode: item.airport,
            lineType: item.line === '국제' ? 'I' : 'D',
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
              const splittedEtd = String(item.etd).split('');
              await sendPushNotification(subscription, {
                title: `[${splittedEtd[0]}${splittedEtd[1]} : ${splittedEtd[2]}${splittedEtd[3]}] ${flightNumber} 상태 변경`,
                body: `상태: ${newStatus}, 게이트: ${item.gate}`,
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
      }),
    ),
  );
};
