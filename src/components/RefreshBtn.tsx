'use client';

import { handleManualRefresh } from '@/utils/handleManualRefresh';

export default function RefreshBtn() {
  const btnClickHandler = () => {
    handleManualRefresh(); // 목록 수동 갱신 함수 호출
  };

  return <button onClick={btnClickHandler}>목록 새로고침</button>;
}
