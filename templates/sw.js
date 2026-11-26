/*
 * Service worker de avisos (plantilla de Kaos para KaosPush).
 * Cópialo a public/sw.js y cambia APP_NAME. Muestra los avisos que manda
 * Komunly ({ title, body, icon, image, url }) y, al tocarlos, abre esa página
 * de la web (nunca otra web).
 */
const APP_NAME = "Kaoticode";
const ICON = "/icon-192.png";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING" || event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }
  const options = {
    body: payload.body || "Tienes un aviso nuevo.",
    icon: payload.icon || ICON,
    badge: payload.badge || ICON,
    tag: payload.tag || undefined,
    data: { url: payload.url || "/" },
  };
  if (payload.image) options.image = payload.image;
  event.waitUntil(self.registration.showNotification(payload.title || APP_NAME, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const target = new URL(event.notification.data?.url || "/", self.location.origin);
      // Solo páginas de esta web.
      if (target.origin !== self.location.origin) return;
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        if ("focus" in client) {
          await client.navigate(target.href).catch(() => undefined);
          return client.focus();
        }
      }
      return self.clients.openWindow(target.href);
    })(),
  );
});
