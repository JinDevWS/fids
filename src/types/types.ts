import { Prisma } from '@prisma';

export type FlightItem = {
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
  etd?: string; // 실제 출발시간
  rmkKor?: string; // 상태 (한글)
  rmkEng?: string; // 상태 (영문)
};

export type SyncFlightsOptions = {
  schAirCode: string;
  schLineType: 'I' | 'D'; // 국제선/국내선
  schIOType: 'I' | 'O'; // 출발편/도착편
  forceInit?: boolean;
};

export type SyncConfigOptions = {
  airport: string;
  line: string;
  io: string;
};

export type NotificationPayload = {
  title: string;
  body: string;
  url?: string;
};

export type PushSubscriptionUniqueKeys = {
  userId: string;
  airportCode: string;
  lineType: string;
  ioType: string;
};

export type PushSubscriptionFields = {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
  userId: string;
  airportCode: string;
  lineType: string;
  ioType: string;
  enabled?: boolean;
};

export type PushUpdateOptions = {
  userId: string;
  airportCode: string;
  lineType: string;
  ioType: string;
  enabled?: boolean;
};

export interface FlightState {
  flights: FlightList;
  setFlights: (list: FlightList) => void;
}

export type FlightHistoryDTO = {
  flightId: string; // BigInt -> string
  flightNumber: string;
  std: string;
  etd?: string | null;
  airport: string;
  line: string;
  io: string;

  prevStatus?: string | null;
  newStatus?: string | null;
  changedAt: Date;

  gate?: string | null;
  statusKor?: string | null;
  statusEng?: string | null;

  airlineKor: string;
  airlineEng: string;
  boardingKor: string;
  boardingEng: string;
  arrivedKor: string;
  arrivedEng: string;
  city: string;

  rmkKor?: string | null;
  rmkEng?: string | null;
};

export type PushSubscriptionEnabled = {
  enabled: boolean;
};

export type FlightList = Prisma.FlightGetPayload<{ include: { histories: true } }>[] | null;

/**
 * 리더가 되었을 때 호출할 콜백 함수 타입
 */
export type SyncLeaderCallback = () => void;

/**
 * BroadcastChannel을 통해 주고받는 메시지 타입 정의
 *
 * @property {'is-there-a-leader' | 'leader-alive' | 'leader-ping' | 'sync-data' | 'push-received'} type
 * @property {boolean=} iAmPWA 내가 pwa인지 여부
 * @property {any=} payload 기타 전송 데이터
 */
export interface ChannelMessage {
  /**
   * 'is-there-a-leader': 다른 리더가 있는지 전체 탭에 질문 |
   * 'leader-alive': 리더가 살아 있음을 알림 |
   * 'leader-ping': 리더가 살아있다는 ping 수신 |
   * 'sync-data': 리더가 데이터를 받은 뒤 전체 탭에 브로드캐스트 |
   * 'push-received': 푸시를 수신받음
   */
  type: 'is-there-a-leader' | 'leader-alive' | 'leader-ping' | 'sync-data' | 'push-received';
  iAmPWA?: boolean;
  payload?: any;
}
