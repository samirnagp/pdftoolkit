/* EasyPDF service worker: offline shell, share target, push/sync hooks */
const CACHE = "easypdf-v2";
const SHARE = "pdfkit-share";
const SHELL = [
  "./", "./index.html", "./offline.html", "./privacy.html", "./manifest.webmanifest", "./pwa.js", "./assets/easypdf.css", "./assets/easypdf.js", "./assets/config.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png"
];

self.addEventListener("install", e => {
  // Cache each file separately so one missing file never blocks installation
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== SHARE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const r = e.request;
  const u = new URL(r.url);

  // Web Share Target: files shared to the app from other apps
  if (r.method === "POST" && u.pathname.endsWith("/share-target")) {
    e.respondWith((async () => {
      const files = (await r.formData()).getAll("files").filter(f => f && f.name);
      const c = await caches.open(SHARE);
      for (const k of await c.keys()) await c.delete(k);
      let i = 0;
      for (const f of files) {
        await c.put(new Request(self.registration.scope + "__shared/" + i++),
          new Response(f, { headers: { "Content-Type": f.type, "X-Name": encodeURIComponent(f.name) } }));
      }
      return Response.redirect(new URL("./?shared=" + i, self.registration.scope).href, 303);
    })());
    return;
  }

  if (r.method !== "GET") return;   // uploads to the backend API are never touched
  if (u.origin !== location.origin && u.hostname !== "cdnjs.cloudflare.com") return;

  // Network first, cache fallback, offline page for navigations
  e.respondWith(
    fetch(r).then(res => {
      if (res.ok || res.type === "opaque") {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(r, copy));
      }
      return res;
    }).catch(async () => {
      const hit = await caches.match(r, { ignoreSearch: true });
      if (hit) return hit;
      if (r.mode === "navigate") return (await caches.match("./index.html")) || caches.match("./offline.html");
      return Response.error();
    })
  );
});

/* ---- Optional hooks. They do nothing until you add a push server or register a sync. ---- */
self.addEventListener("push", e => {
  const d = e.data ? e.data.json() : { title: "EasyPDF", body: "You have an update." };
  e.waitUntil(self.registration.showNotification(d.title, { body: d.body, icon: "icons/icon-192.png", badge: "icons/icon-96.png" }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.openWindow("./"));
});
self.addEventListener("sync", () => { /* background sync placeholder */ });
self.addEventListener("periodicsync", e => {
  if (e.tag === "refresh-shell") e.waitUntil(caches.open(CACHE).then(c => c.add("./index.html")));
});
