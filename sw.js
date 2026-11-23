/* EasyPDF service worker: cache only static app assets, never documents/API. */
const CACHE = "easypdf-v8";
const SHARE = "pdfkit-share";
const SHELL = [
  "./", "./index.html", "./offline.html", "./privacy.html", "./manifest.webmanifest",
  "./pwa.js", "./assets/easypdf.css", "./assets/easypdf.js", "./assets/config.js",
  "./assets/icons.js", "./assets/tools.js", "./assets/site-enhancements.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.allSettled(SHELL.map(path => cache.add(path))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key !== CACHE && key !== SHARE)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  // Preserve the existing PWA Share Target flow for files explicitly shared
  // by the user. This is separate from ordinary HTTP response caching.
  if (request.method === "POST" && url.origin === self.location.origin &&
      url.pathname.endsWith("/share-target")) {
    event.respondWith((async () => {
      const files = (await request.formData()).getAll("files")
        .filter(file => file && file.name);
      const cache = await caches.open(SHARE);
      for (const key of await cache.keys()) await cache.delete(key);
      let index = 0;
      for (const file of files) {
        await cache.put(
          new Request(self.registration.scope + "__shared/" + index++),
          new Response(file, {
            headers: {
              "Content-Type": file.type || "application/octet-stream",
              "X-Name": encodeURIComponent(file.name)
            }
          })
        );
      }
      return Response.redirect(
        new URL("./?shared=" + index, self.registration.scope).href, 303
      );
    })());
    return;
  }

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Do not intercept navigations, API calls, document fetches, or generic
  // fetch() requests. Only static scripts, styles, images and fonts qualify.
  if (!["script", "style", "image", "font"].includes(request.destination)) {
    if (request.mode === "navigate") {
      event.respondWith(fetch(request).catch(async () =>
        (await caches.match("./index.html")) ||
        (await caches.match("./offline.html")) ||
        Response.error()
      ));
    }
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request);
      const cacheControl = response.headers.get("Cache-Control") || "";
      const vary = response.headers.get("Vary") || "";
      if (response.ok && response.type === "basic" &&
          !/no-store|private/i.test(cacheControl) && vary.trim() !== "*") {
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      return (await cache.match(request)) || Response.error();
    }
  })());
});

/* Optional push/sync hooks. */
self.addEventListener("push", event => {
  const data = event.data ? event.data.json() :
    { title: "EasyPDF", body: "You have an update." };
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, icon: "icons/icon-192.png", badge: "icons/icon-96.png"
  }));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(clients.openWindow("./"));
});
self.addEventListener("sync", () => {});
self.addEventListener("periodicsync", event => {
  if (event.tag === "refresh-shell") {
    event.waitUntil(caches.open(CACHE).then(cache => cache.add("./index.html")));
  }
});
