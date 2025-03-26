// 데이터베이스에 초기 항공편 상태값 넣는 스크립트

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { syncFlights } from '@/services/flightService';

(async () => {
  console.log('항공편 상태 초기화 시작');
  console.log('[DEBUG] VAPID_PUBLIC_KEY:', process.env.VAPID_PUBLIC_KEY);
  await syncFlights(true, 'GMP', 'I', 'I');
  console.log('초기화 완료');
})();
