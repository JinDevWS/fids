import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:your@email.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

type NotificationPayload = {
  title: string;
  body: string;
  url?: string;
};

export const sendPushNotification = async (
  subscription: webpush.PushSubscription,
  payload: NotificationPayload,
) => {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log('푸시 알림 전송 완료:', payload.title);
  } catch (error) {
    console.error('푸시 알림 전송 실패:', error);
  }
};
