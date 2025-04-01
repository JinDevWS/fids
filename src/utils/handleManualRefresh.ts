// 수동 새로고침

import { updateUI } from './updateUI';

export async function handleManualRefresh() {
  try {
    const res = await fetch('/api/list');
    const data = await res.json();
    // console.log(data);

    updateUI(data); // 현재 탭만 갱신
  } catch (err) {
    console.error('[REFRESH] 수동 새로고침 실패:', err);
  }
}
