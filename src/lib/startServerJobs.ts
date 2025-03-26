import { startFlightSyncJob } from '@/cron/syncJob';

let jobsStarted = false;

// 매 1분마다 실행하는 cron 백그라운드 작업 시작하는 함수
export const initServerJobs = (schAirCode: string, schLineType: string, schIOType: string) => {
  if (!jobsStarted) {
    jobsStarted = true;
    startFlightSyncJob(schAirCode, schLineType, schIOType);
    console.log('백그라운드 작업 시작됨');
  }
};
