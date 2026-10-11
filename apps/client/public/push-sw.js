// Web Push handlers, imported into the Workbox-generated service worker
// (workbox.importScripts in vite.config.ts). Payload sent by the API's
// NotificationsService: { titre, message, url? }.

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { titre: 'ChapExpress', message: event.data ? event.data.text() : '' };
  }

  event.waitUntil(
    self.registration.showNotification(data.titre || 'ChapExpress', {
      body: data.message || '',
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      lang: 'fr',
      data: { url: data.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((fenetres) => {
      // Reuse an open app window rather than stacking new ones.
      for (const fenetre of fenetres) {
        if ('focus' in fenetre) {
          fenetre.navigate(url);
          return fenetre.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
