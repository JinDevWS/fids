import { watchSyncConfig } from '@/cron/watchSyncConfig';

let jobsStarted = false;

// 매 1분마다 실행하는 cron 백그라운드 작업 시작하는 함수
export const initServerJobs = async () => {
  if (!jobsStarted) {
    jobsStarted = true;
    await watchSyncConfig();
    console.log('백그라운드 작업 시작됨');
  }
};
