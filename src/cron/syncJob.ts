import cron from 'node-cron';
import { syncFlights } from '@/services/flightService';
import { DateTime } from 'luxon';

export const startFlightSyncJob = (schAirCode: string, schLineType: string, schIOType: string) => {
  // 매 1분마다 실행
  cron.schedule('* * * * *', async () => {
    const dateTime = DateTime.now().setZone('Asia/Seoul').toFormat('yyyy-MM-dd HH:mm:ss');

    console.log('[Cron] 항공편 동기화 시작: ', dateTime);
    try {
      await syncFlights(false, schAirCode, schLineType, schIOType);
      console.log('[Cron] 항공편 동기화 완료: ', dateTime);
    } catch (error) {
      console.error('[Cron] 동기화 실패:', error, dateTime);
    }
  });
};
