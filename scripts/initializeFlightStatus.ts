// 데이터베이스에 초기 항공편 상태값 넣는 스크립트

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { syncFlights } from '@/services/flightService';
import { SyncFlightsOptions } from '@/types/types';

(async () => {
  console.log('항공편 상태 초기화 시작');
  console.log('[DEBUG] VAPID_PUBLIC_KEY:', process.env.VAPID_PUBLIC_KEY);
  const options: SyncFlightsOptions = {
    schAirCode: 'GMP',
    schLineType: 'I',
    schIOType: 'I',
    forceInit: true,
  };
  await syncFlights(options);
  console.log('초기화 완료');
})();
