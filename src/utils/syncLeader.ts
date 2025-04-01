/**
 * 전체 흐름 요약
	1.	여러 브라우저 탭이 동시에 열려 있음을 전제로 함.
	2.	각 탭은 setupSyncLeader()를 호출해서 리더인지 아닌지 판단하려고 함.
	3.	BroadcastChannel을 통해 서로 “누가 리더야?” 물어봄.
	4.	100ms 후 응답이 없으면 내가 리더가 됨.
	5.	리더는 주기적으로(3초마다) leader-ping 메시지를 보냄.
	6.	팔로워는 ping이 6초간 없으면 리더가 죽었다고 판단하고 다시 리더 선출 시도.
	7.	PWA가 있다면 우선적으로 리더가 되도록 설계되어 있음.
 */

import { ChannelMessage } from '@/types/types';
import { isPWA } from './isPWA';
import { getFlightList } from '@/services/flightService';
import { updateUI } from './updateUI';

const CHANNEL_NAME = 'fids-sync-leader'; // 브라우저 탭 간 동기화를 위한 채널 이름 정의
const channel = new BroadcastChannel(CHANNEL_NAME); // BroadcastChannel 인스턴스 생성 (브라우저 탭 간 통신용)

let isLeader = false; // 현재 탭이 리더인지 여부
let isInitialized = false; // 리더 선출 초기화 여부 (중복 실행 방지)
let leaderHeartbeatTimer: NodeJS.Timeout | null = null; // 리더가 되었을 때 주기적으로 ping 보내는 타이머
let leaderTimeoutTimer: NodeJS.Timeout | null = null; // 팔로워가 리더의 ping을 감시하는 타이머
let syncIntervalTimer: NodeJS.Timeout | null = null; // 중복 setInterval 방지용

/** 외부에서 현재 탭이 리더인지 확인하는 함수 */
export function isCurrentLeader(): boolean {
  return isLeader;
}

/**
 * 타이머 초기화용 빈 껍데기 함수.
 * 타이머 초기화 함수 자리라고 생각하면 됨.
 * 팔로워로 진입하면 실제 초기화 로직으로 대체됨
 * */
let resetLeaderTimeout: () => void = () => {};

/** 외부에서 호출할 함수 - 리더 선출 시작 */
export function setupSyncLeader(): void {
  if (isInitialized) return; // 이미 초기화되었으면 중복 실행 방지
  isInitialized = true;

  const iAmPWA: boolean = isPWA(); // 현재 환경이 PWA인지 여부 확인
  let leaderResponded = false; // 다른 리더가 응답했는지 여부
  let pwaAlreadyExists = false; // 이미 PWA 환경의 리더가 있는지 여부

  // 채널 메시지 수신 처리
  channel.onmessage = (event: MessageEvent<ChannelMessage>) => {
    const { type, iAmPWA } = event.data;

    // 리더가 살아있으면
    if (type === 'leader-alive') {
      leaderResponded = true; // 누군가 리더라고 응답함
      if (iAmPWA) pwaAlreadyExists = true; // 응답한 리더가 PWA임
    }

    // 리더가 살아있다는 핑을 수신했으면
    if (type === 'leader-ping') {
      // 리더 타이머 초기화
      resetLeaderTimeout();
    }
  };

  // 다른 리더가 있는지 전체 탭에 질문
  channel.postMessage({ type: 'is-there-a-leader', iAmPWA });

  // 100ms 기다렸다가 리더가 응답했는지 확인 -> 없으면 내가 리더 됨
  setTimeout(() => {
    /**
     * 리더가 되어야 하는지 여부 저장.
     * 리더가 응답하지 않았거나, 내가 pwa면서 이미 존재하는 다른 pwa가 없을 때 true
     */
    const shouldBeLeader = !leaderResponded || (iAmPWA && !pwaAlreadyExists);

    if (shouldBeLeader) {
      becomeLeader(iAmPWA);
    } else {
      // 다른 리더가 있으므로 나는 팔로워 -> 리더 ping 감시 시작
      console.log('[SYNC] 리더 있음, 대기 (PWA:', iAmPWA, ')');
      startLeaderTimeoutWatcher();
    }
  }, 100);
}

/** 리더로 전환하는 함수 */
function becomeLeader(isPWA: boolean): void {
  isLeader = true;

  // 자신이 리더라고 전체 탭에 알림
  channel.postMessage({ type: 'leader-alive', iAmPWA: isPWA });
  console.log('[SYNC] 리더로 선정됨 (PWA:', isPWA, ')');

  // 리더가 해야 할 동기화 로직 실행
  startSyncTask();

  // 주기적으로 리더가 살아있다는 ping을 전체 탭에 보냄
  leaderHeartbeatTimer = setInterval(() => {
    channel.postMessage({ type: 'leader-ping' });
  }, 3000); // 3초마다 ping
}

/** 팔로워 모드일 때 리더의 ping 감시 타이머 시작 */
function startLeaderTimeoutWatcher(): void {
  resetLeaderTimeout(); // 초기 타이머 설정

  // 리더의 ping이 끊기면 호출 -> 리더 재선출 시도
  function reelectLeader() {
    console.log('[SYNC] 리더 ping 없음 → 재선출 시도');
    isInitialized = false;
    setupSyncLeader();
  }

  // ping이 들어올 때마다 이 reset 함수가 호출되어 타이머 갱신됨
  function reset() {
    if (leaderTimeoutTimer) clearTimeout(leaderTimeoutTimer);
    leaderTimeoutTimer = setTimeout(reelectLeader, 6000); // 6초 동안 ping 없으면 리더 죽었다고 판단
  }

  resetLeaderTimeout = reset;
}

/**
 * 항공편 목록 동기화 시작하는 함수
 * 1분마다 항공편 목록 가져오기
 * */
function startSyncTask(): void {
  if (syncIntervalTimer) return; // 이미 실행 중이면 중복 방지

  console.log('[startSyncTask] 항공편 목록 동기화 작업 시작');

  syncIntervalTimer = setInterval(async () => {
    try {
      const data = await getFlightList();
      broadcastSyncedData(data); // 전체 탭에 전파
      updateUI(data); // 리더 자신의 UI도 갱신
    } catch (err) {
      console.error('[startSyncTask] 항공편 목록 동기화 실패:', err);
    }
  }, 60000); // 1분 주기
}

/** 리더가 데이터를 받은 뒤 전체 탭에 브로드캐스트 */
export function broadcastSyncedData(data: any): void {
  channel.postMessage({ type: 'sync-data', payload: data });
}

/** 외부에서 수신 리스너를 등록할 수 있도록 channel export */
export const syncChannel = channel;
