// 서버에서 SyncConfig 변경 감지하면 cron 재시작 (폴링(주기적 검사))

import { startSelectedSync } from './syncJob';
import { findSyncConfig } from '@/daos/syncConfigDao';

let lastHash = '';

export const watchSyncConfig = async () => {
  setInterval(async () => {
    const config = await findSyncConfig();
    const hash = `${config?.airport}-${config?.line}-${config?.io}`;

    if (hash !== lastHash) {
      console.log('[WATCH] SyncConfig 변경 감지. cron 재시작.');
      lastHash = hash;
      await startSelectedSync(); // 새 cron 시작
    }
  }, 5000); // 5초마다 체크
};
