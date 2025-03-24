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
      numOfRows: 200,
      serviceKey,
      _type: 'json',
    },
  });

  return data.response?.body?.items?.item || [];
};

// 2. 동기화 및 푸시 알림 전송
export const syncFlights = async ({ forceInit = false } = {}) => {
  const flights = await fetchFlightStatus();
  const limit = pLimit(10); // 병렬 처리 제한

  await Promise.all(
    flights.map((item) =>
      limit(async () => {
        const { airFln, std, rmkKor } = item;
        const newStatus = rmkKor || null;

        // 이전 상태 조회
        const existing = await prisma.flightStatusHistory.findUnique({
          where: {
            flightNumber_std: {
              flightNumber: airFln,
              std,
            },
          },
        });

        const prevStatus = existing?.newStatus || null;

        // 상태가 동일하고 강제 기록도 아니면 스킵
        if (!forceInit && prevStatus === newStatus) return;

        // 변경 내역 기록
        await prisma.flightStatusHistory.upsert({
          where: {
            flightNumber_std: {
              flightNumber: airFln,
              std,
            },
          },
          update: {
            prevStatus,
            newStatus,
            changedAt: new Date(),
          },
          create: {
            flightNumber: airFln,
            std,
            prevStatus,
            newStatus,
          },
        });

        console.log(
          `[${forceInit ? '초기 기록' : '상태 변경'}] ${airFln} (${prevStatus} → ${newStatus})`,
        );

        // 최초 초기화 시엔 푸시 알림 생략
        if (forceInit) return;

        // 구독자 필터링
        const subscriptions = await prisma.pushSubscription.findMany({
          where: {
            airportCode: item.airport,
            lineType: item.line,
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
              await sendPushNotification(subscription, {
                title: `${airFln} 상태 변경`,
                body: `상태: ${prevStatus ?? '없음'} → ${newStatus}`,
                url: `/flights/${airFln}`,
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
