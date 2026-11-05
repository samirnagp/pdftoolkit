/* EasyPDF PWA helper: service worker, install button, offline banner,
   tool shortcuts (#merge), opened files and shared files. */
(function () {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").then(function (reg) {
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

  // Install button: appears in the header menu (never floats over the tool buttons)
  var deferred = null;
  var btn = document.createElement("button");
  btn.className = "inst"; btn.type = "button"; btn.textContent = "Install app"; btn.hidden = true;
  document.addEventListener("DOMContentLoaded", function () { var nav = document.querySelector("header nav"); if (nav) nav.appendChild(btn); });
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

  // Hand files opened with the app, or shared to it, to the EasyPDF engine
  function useFiles(list) { if (window.EasyPDF && list.length) window.EasyPDF.useFiles(list); }

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

  window.addEventListener("load", fromShare);
})();
