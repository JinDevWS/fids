import { NotificationPayload } from '@/types/types';
import webpush from 'web-push';

let isVapidConfigured = false;

export const setupVapidKeys = () => {
  if (!isVapidConfigured) {
    webpush.setVapidDetails(
      'mailto:your@email.com',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );
    isVapidConfigured = true;
  }
};

export const sendPushNotification = async (
  subscription: webpush.PushSubscription,
  payload: NotificationPayload,
) => {
  setupVapidKeys();

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log('푸시 알림 전송 완료:', payload.title);
  } catch (error) {
    console.error('푸시 알림 전송 실패:', error);
  }
};
