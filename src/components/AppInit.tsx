// 앱 초기화용 컴포넌트

'use client';

import { handleManualRefresh } from '@/utils/handleManualRefresh';
import { isCurrentLeader } from '@/utils/syncLeader';
import { useEffect } from 'react';

export default function AppInit() {
  useEffect(() => {
    // cron 백그라운드 작업 호출
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/init`, {
      method: 'GET',
    })
      .then((r) => r.json())
      .then((result) => {
        console.log(result);
      });

    // 포그라운드 복귀 시 항공편 목록 갱신
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && isCurrentLeader()) {
        handleManualRefresh(); // 목록 수동 갱신 함수 호출
      }
    });
  }, []);

  return null;
}
