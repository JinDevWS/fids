// 수동 새로고침

import { getFlightList } from '@/services/flightService';
import { updateUI } from './updateUI';

export async function handleManualRefresh() {
  try {
    const data = await getFlightList();

    updateUI(data); // 현재 탭만 갱신
  } catch (err) {
    console.error('[REFRESH] 수동 새로고침 실패:', err);
  }
}
