// public/service-worker.js

self.addEventListener('push', function (event) {
  const data = event.data?.json() || {};
  const title = data.title || '알림';
  const options = {
    body: data.body || '',
    icon: '/icons/airplane_icon_192x192.png', // PWA 아이콘 (선택)
    badge: '/icons/airplane_icon_72x72.png',
    data: {
      url: data.url || '/', // 클릭 시 이동할 경로
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 알림 클릭 시 이동
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
