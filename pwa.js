/* PDFKit PWA helper: service worker, install button, offline banner,
   tool shortcuts (#merge), opened files and shared files. */
(function () {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").then(function (reg) {
        // Ask for periodic background refresh where the browser allows it
        if (reg.periodicSync) navigator.permissions.query({ name: "periodic-background-sync" })
          .then(function (p) { if (p.state === "granted") reg.periodicSync.register("refresh-shell", { minInterval: 86400000 }); })
          .catch(function () {});
      }).catch(function () {});
    });
  }

  function badge(text, css) {
    var b = document.createElement("div");
    b.textContent = text;
    b.style.cssText = "position:fixed;z-index:50;left:50%;transform:translateX(-50%);padding:10px 18px;border-radius:99px;font:600 14px system-ui,sans-serif;" + css;
    return b;
  }

  // Install button
  var deferred = null;
  var btn = document.createElement("button");
  btn.textContent = "Install app";
  btn.hidden = true;
  btn.style.cssText = "position:fixed;z-index:50;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));padding:11px 18px;border:0;border-radius:99px;background:var(--ac,#d9480f);color:var(--acx,#fff);font:600 14px system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)";
  document.addEventListener("DOMContentLoaded", function () { document.body.appendChild(btn); });
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferred = e; btn.hidden = false; });
  btn.onclick = function () { if (!deferred) return; deferred.prompt(); deferred.userChoice.finally(function () { deferred = null; btn.hidden = true; }); };
  window.addEventListener("appinstalled", function () { btn.hidden = true; });

  // Offline banner
  var off = null;
  function net() {
    if (!navigator.onLine && !off) {
      off = badge("You are offline. Server tools need internet.", "top:calc(70px + env(safe-area-inset-top,0px));background:#1c1b1a;color:#fff");
      document.body.appendChild(off);
    } else if (navigator.onLine && off) { off.remove(); off = null; }
  }
  window.addEventListener("online", net); window.addEventListener("offline", net);
  document.addEventListener("DOMContentLoaded", net);

  // Load files into the right tool (uses T, open and setF from index.html)
  function useFiles(list) {
    if (!list.length || typeof T === "undefined") return;
    var imgs = list.every(function (f) { return /^image\//.test(f.type); });
    var t = T.find(function (x) { return x.id === (imgs ? "img" : "merge"); });
    if (t) { open(t); setF(list); }
  }

  // Shortcuts such as index.html#merge
  function fromHash() {
    var id = location.hash.slice(1);
    if (!id || typeof T === "undefined") return;
    var t = T.find(function (x) { return x.id === id; });
    if (t) open(t);
  }
  window.addEventListener("hashchange", fromHash);

  // Files opened with the installed app (Chrome desktop file handler)
  if ("launchQueue" in window) {
    launchQueue.setConsumer(function (p) {
      if (!p.files || !p.files.length) return;
      Promise.all(p.files.map(function (h) { return h.getFile(); })).then(useFiles);
    });
  }

  // Files shared to the app from other apps (Android share sheet)
  function fromShare() {
    if (!/[?&]shared=/.test(location.search) || !window.caches) return;
    caches.open("pdfkit-share").then(function (c) {
      return c.keys().then(function (keys) {
        return Promise.all(keys.map(function (k) {
          return c.match(k).then(function (r) {
            return r.blob().then(function (b) {
              return new File([b], decodeURIComponent(r.headers.get("X-Name") || "file"), { type: b.type });
            });
          });
        }));
      });
    }).then(function (files) {
      useFiles(files);
      history.replaceState(null, "", location.pathname);
    }).catch(function () {});
  }

  window.addEventListener("load", function () { fromHash(); fromShare(); });
})();
