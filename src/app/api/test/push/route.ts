import { findPushSubscFirst } from '@/services/pushSubscriptionService';
import { sendPushNotification } from '@/utils/pushNotification';
import { NextResponse } from 'next/server';

// POSTMAN으로 http://localhost:3000/api/test/push 경로로 post 요청 날리는 테스트용 코드
export async function POST() {
  const sub = await findPushSubscFirst();

  if (!sub) return NextResponse.json({ error: 'No subscriber' }, { status: 404 });

  await sendPushNotification(
    {
      endpoint: sub.endpoint,
      keys: { auth: sub.auth, p256dh: sub.p256dh },
    },
    {
      title: '테스트 알림',
      body: '푸시 알림이 정상적으로 작동합니다!',
      url: '/',
    },
  );

  return NextResponse.json({ success: true });
}
