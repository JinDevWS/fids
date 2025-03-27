// import cron from 'node-cron';
// import { syncFlights } from '@/services/flightService';
// import { DateTime } from 'luxon';

// export const startFlightSyncJob = (schAirCode: string, schLineType: string, schIOType: string) => {
//   // 매 1분마다 실행
//   cron.schedule('* * * * *', async () => {
//     const dateTime = DateTime.now().setZone('Asia/Seoul').toFormat('yyyy-MM-dd HH:mm:ss');

//     console.log('[Cron] 항공편 동기화 시작: ', dateTime);
//     try {
//       await syncFlights(false, schAirCode, schLineType, schIOType);
//       console.log('[Cron] 항공편 동기화 완료: ', dateTime);
//     } catch (error) {
//       console.error('[Cron] 동기화 실패:', error, dateTime);
//     }
//   });
// };

import cron, { ScheduledTask } from 'node-cron';
import { prisma } from '@/lib/prisma';
import { syncFlights } from '@/services/flightService';
import { DateTime } from 'luxon';
import { SyncFlightsOptions } from '@/types/types';

let currentTask: ScheduledTask | null = null;

export const startSelectedSync = async () => {
  console.log('[CRON] startSelectedSync() 실행됨');

  const config = await prisma.syncConfig.findUnique({ where: { id: 1 } });
  let dateTime = DateTime.now().setZone('Asia/Seoul').toFormat('yyyy-MM-dd HH:mm:ss');

  if (!config) {
    console.warn('[CRON] 동기화 설정 없음. cron 미시작', dateTime);
    return;
  }

  if (currentTask) {
    currentTask.stop();
    console.log('[CRON] 기존 cron 중단됨', dateTime);
  }

  currentTask = cron.schedule('* * * * *', async () => {
    dateTime = DateTime.now().setZone('Asia/Seoul').toFormat('yyyy-MM-dd HH:mm:ss');

    console.log(`[CRON] 실행: ${config.airport} ${config.line} ${config.io}`, dateTime);
    await syncFlights({
      schAirCode: config.airport,
      schLineType: config.line,
      schIOType: config.io,
    } as SyncFlightsOptions);
    console.log(
      `[CRON] 항공편 동기화 완료: ${config.airport} ${config.line} ${config.io}`,
      dateTime,
    );
  });

  console.log(`[CRON] 새 cron 시작됨: ${config.airport} ${config.line} ${config.io}`, dateTime);
};
