import { startSelectedSync } from '@/cron/syncJob';

let jobsStarted = false;

// 매 1분마다 실행하는 cron 백그라운드 작업 시작하는 함수
export const initServerJobs = () => {
  if (!jobsStarted) {
    jobsStarted = true;
    startSelectedSync();
    console.log('백그라운드 작업 시작됨');
  }
};
