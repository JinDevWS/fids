// public/service-worker.js

self.addEventListener('push', function (event) {
  console.log('[SW] 푸시 이벤트 수신됨:', event);

  const data = event.data?.json() || {};

  console.log('푸시 payload:', data);

  const title = data.title || '알림';
  const options = {
    body: data.body || '',
    tag: data.id, // tag를 넣으면 중복 방지됨(tag 속성은 같은 tag의 알림이 이미 떠 있으면 새로 뜨지 않게 해주는 기능)
    icon: '/icons/airplane_icon_192x192.png', // PWA 아이콘 (선택)
    badge: '/icons/airplane_icon_72x72.png',
    data: {
      url: data.url || '/', // 클릭 시 이동할 경로
    },
  };

  console.log('showNotification 호출됨:', title, options);

  event.waitUntil(self.registration.showNotification(title, options));
});

// 알림 클릭 시 이동
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
