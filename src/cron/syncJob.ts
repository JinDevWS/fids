import cron from 'node-cron';
import { syncFlights } from '@/services/flightService';

export const startFlightSyncJob = () => {
  // 매 1분마다 실행
  cron.schedule('* * * * *', async () => {
    console.log('[Cron] 항공편 동기화 시작');
    try {
      await syncFlights();
      console.log('[Cron] 항공편 동기화 완료');
    } catch (error) {
      console.error('[Cron] 동기화 실패:', error);
    }
  });
};
