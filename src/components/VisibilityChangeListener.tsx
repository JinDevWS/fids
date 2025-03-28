'use client';

import { handleManualRefresh } from '@/utils/handleManualRefresh';
import { isCurrentLeader } from '@/utils/syncLeader';
import { useEffect } from 'react';

export default function VisibilityChangeListener() {
  useEffect(() => {
    // 포그라운드 복귀 시 항공편 목록 갱신
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && isCurrentLeader()) {
        handleManualRefresh(); // 목록 수동 갱신 함수 호출
      }
    });
  }, []);

  return null;
}
