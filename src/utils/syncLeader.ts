import { isPWA } from './isPWA';

const CHANNEL_NAME = 'fids-sync-leader';
const channel = new BroadcastChannel(CHANNEL_NAME);

let isLeader = false;
let isInitialized = false;
let leaderHeartbeatTimer: NodeJS.Timeout | null = null;
let leaderTimeoutTimer: NodeJS.Timeout | null = null;

type SyncLeaderCallback = () => void;

interface ChannelMessage {
  type: 'is-there-a-leader' | 'leader-alive' | 'leader-ping' | 'sync-data' | 'push-received';
  fromPWA?: boolean;
  payload?: any;
}

// 외부에서 사용할 수 있게 export
export function isCurrentLeader(): boolean {
  return isLeader;
}

// 초기값은 빈 함수지만, 나중에 팔로워 모드에서 정의됨
let resetLeaderTimeout: () => void = () => {};

export function setupSyncLeader(startSyncCallback: SyncLeaderCallback): void {
  if (isInitialized) return;
  isInitialized = true;

  const iAmPWA: boolean = isPWA();
  let responded = false;
  let pwaAlreadyExists = false;

  // 리더 선출 관련 메시지 처리
  channel.onmessage = (event: MessageEvent<ChannelMessage>) => {
    const { type, fromPWA } = event.data;

    if (type === 'leader-alive') {
      responded = true;
      if (fromPWA) pwaAlreadyExists = true;
    }

    if (type === 'leader-ping') {
      resetLeaderTimeout();
    }
  };

  // 리더가 있는지 확인
  channel.postMessage({ type: 'is-there-a-leader', fromPWA: iAmPWA });

  setTimeout(() => {
    const shouldBeLeader = !responded || (iAmPWA && !pwaAlreadyExists);

    if (shouldBeLeader) {
      becomeLeader(startSyncCallback, iAmPWA);
    } else {
      console.log('[SYNC] 리더 있음, 대기 (PWA:', iAmPWA, ')');
      startLeaderTimeoutWatcher(startSyncCallback, iAmPWA);
    }
  }, 100);
}

function becomeLeader(startSyncCallback: SyncLeaderCallback, isPWA: boolean): void {
  isLeader = true;

  channel.postMessage({ type: 'leader-alive', fromPWA: isPWA });
  console.log('[SYNC] 리더로 선정됨 (PWA:', isPWA, ')');
  startSyncCallback();

  // 리더는 ping 주기적으로 보냄
  leaderHeartbeatTimer = setInterval(() => {
    channel.postMessage({ type: 'leader-ping' });
  }, 3000);
}

function startLeaderTimeoutWatcher(startSyncCallback: SyncLeaderCallback, isPWA: boolean): void {
  resetLeaderTimeout();

  function reelectLeader() {
    console.log('[SYNC] 리더 ping 없음 → 재선출 시도');
    isInitialized = false;
    setupSyncLeader(startSyncCallback);
  }

  function reset() {
    if (leaderTimeoutTimer) clearTimeout(leaderTimeoutTimer);
    leaderTimeoutTimer = setTimeout(reelectLeader, 6000);
  }

  resetLeaderTimeout = reset;
}

// 리더가 데이터를 받은 후 브로드캐스트
export function broadcastSyncedData(data: any): void {
  channel.postMessage({ type: 'sync-data', payload: data });
}

// 외부에서 수신 리스너 등록용 채널 export
export const syncChannel = channel;
