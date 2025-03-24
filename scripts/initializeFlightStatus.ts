import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { syncFlights } from '@/services/flightService';

(async () => {
  console.log('항공편 상태 초기화 시작');
  console.log('[DEBUG] VAPID_PUBLIC_KEY:', process.env.VAPID_PUBLIC_KEY);
  await syncFlights({ forceInit: true });
  console.log('초기화 완료');
})();
