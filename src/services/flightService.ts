import axios from 'axios';
import { prisma } from '@/lib/prisma';
import { sendPushNotification } from '@/utils/pushNotification';

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
      airportCode: 'GMP',
      schLineType: 'I', // 국제선/국내선 (필요시 동적으로 처리 가능)
      schIOType: 'I', // 출발편/도착편
      numOfRows: 200,
      serviceKey,
      _type: 'json',
    },
  });

  return data.response?.body?.items?.item || [];
};

// 2. 동기화 및 푸시 알림 전송
export const syncFlights = async () => {
  const flights = await fetchFlightStatus();

  for (const item of flights) {
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

    // 상태가 변하지 않았다면 스킵
    if (prevStatus === newStatus) continue;

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

    console.log(`상태 변경됨: ${airFln} (${prevStatus} → ${newStatus})`);

    // 푸시 알림 구독자 찾기 (조건: 공항 + 노선 + 출/도착 + enabled)
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        airportCode: item.airport,
        lineType: item.line,
        ioType: item.io,
        enabled: true,
      },
    });

    for (const sub of subscriptions) {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth,
          p256dh: sub.p256dh,
        },
      };

      // 푸시 알림 전송
      await sendPushNotification(subscription, {
        title: `${airFln} 상태 변경`,
        body: `상태: ${prevStatus ?? '없음'} → ${newStatus}`,
        url: `/flights/${airFln}`,
      });
    }
  }
};
