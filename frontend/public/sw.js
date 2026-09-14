// Service Worker de Camplink para Notificaciones Web Push y PWA
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Recepción de Notificaciones Web Push en segundo plano
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      titulo: 'Camplink',
      mensaje: event.data ? event.data.text() : 'Tienes una nueva notificación nómada'
    };
  }

  const title = data.titulo || data.title || 'Camplink';
  const options = {
    body: data.mensaje || data.body || 'Novedades en tu comunidad camper',
    icon: data.icon || '/camplink-logo.png',
    badge: data.badge || '/camplink-logo.png',
    data: {
      url: data.url || data.enlace || '/',
      id: data.id || null
    },
    vibrate: [100, 50, 100],
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Manejo del click en la notificación push
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
