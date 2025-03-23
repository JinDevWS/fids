'use client';

import { useEffect, useState } from 'react';

type Props = {
  userId: string;
  airportCode: string;
  lineType: string;
  ioType: string;
};

export default function PushNotificationToggle({ userId, airportCode, lineType, ioType }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  // 초기 스위치 상태 불러오기
  useEffect(() => {
    const fetchStatus = async () => {
      const res = await fetch(
        `/api/subscription?userId=${userId}&airportCode=${airportCode}&lineType=${lineType}&ioType=${ioType}`,
      );
      const data = await res.json();
      setEnabled(data.enabled);
      setLoading(false);
    };
    fetchStatus();
  }, [userId, airportCode, lineType, ioType]);

  const handleToggle = async () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);

    if (newEnabled) {
      // 사용자가 알림을 허용하고 있는지 확인
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('알림 권한이 허용되지 않았습니다.');
        setEnabled(false);
        return;
      }

      // Service Worker 등록 및 푸시 구독 요청
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      // 서버에 구독 정보 저장
      await fetch('/api/subscription', {
        method: 'POST',
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: subscription.toJSON().keys,
          userId,
          airportCode,
          lineType,
          ioType,
          enabled: true,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      // 스위치 끄면 서버에 enabled: false로만 PATCH
      await fetch('/api/subscription', {
        method: 'PATCH',
        body: JSON.stringify({
          userId,
          airportCode,
          lineType,
          ioType,
          enabled: false,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  };

  if (loading) return <p>알림 설정 불러오는 중...</p>;

  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={enabled} onChange={handleToggle} />
      <span>푸시 알림 받기</span>
    </label>
  );
}
