'use client';

//import { handleManualRefresh } from '@/utils/handleManualRefresh';
import { isCurrentLeader } from '@/utils/syncLeader';
import { useEffect } from 'react';

export default function VisibilityChangeListener() {
  useEffect(() => {
    // 포그라운드 복귀 시 항공편 목록 갱신
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && isCurrentLeader()) {
        //await handleManualRefresh(); // 목록 수동 갱신 함수 호출
      }
    });

    // 푸시 수신 시 수신받았다고 채널 전송
    // navigator.serviceWorker.addEventListener('message', (event) => {
    //   if (event.data?.type === 'push-received') {
    //     const channel = new BroadcastChannel('fids-sync-leader');
    //     channel.postMessage({ type: 'push-received' });
    //   }
    // });
  }, []);

  return null;
}
