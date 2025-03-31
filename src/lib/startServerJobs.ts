import { watchSyncConfig } from '@/cron/watchSyncConfig';

// declare global 구문은 .ts에서 global 속성을 타입으로 확장할 때 필수
// 타입스크립트에게 전역 변수 존재를 알림
declare global {
  // eslint-disable-next-line no-var
  var __jobsStarted__: boolean | undefined;
}

// 매 1분마다 실행하는 cron 백그라운드 작업 시작하는 함수
export const initServerJobs = async () => {
  if (globalThis.__jobsStarted__) {
    // 중복 실행 방지
    console.log('[SKIP] 백그라운드 작업 이미 시작됨');
    return;
  }

  globalThis.__jobsStarted__ = true;
  await watchSyncConfig();
  console.log('백그라운드 작업 시작됨');
};
