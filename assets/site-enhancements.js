/* EasyPDF V2 progressive enhancements. No dependencies. */
(function () {
  'use strict';
  var root = document.documentElement;
  var storageKey = 'easypdf-theme';
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  var saved = '';
  try { saved = localStorage.getItem(storageKey) || ''; } catch (e) {}
  var theme = saved || (prefersDark ? 'dark' : 'light');
  root.setAttribute('data-theme', theme);

  function addThemeButton() {
    var nav = document.querySelector('header nav');
    if (!nav || nav.querySelector('.theme-toggle')) return;
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-toggle';
    button.setAttribute('aria-label', 'Switch colour theme');
    function paint() {
      var dark = root.getAttribute('data-theme') === 'dark';
      button.textContent = dark ? '☀ Light' : '☾ Dark';
      button.setAttribute('aria-pressed', String(dark));
    }
    button.addEventListener('click', function () {
      theme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', theme);
      try { localStorage.setItem(storageKey, theme); } catch (e) {}
      paint();
    });
    paint();
    nav.appendChild(button);
  }

  function loadAnalytics() {
    var id = typeof GA_MEASUREMENT_ID !== 'undefined' ? GA_MEASUREMENT_ID : '';
    if (!/^G-[A-Z0-9]+$/i.test(id || '') || window.__easypdfGaLoaded) return;
    window.__easypdfGaLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id, { anonymize_ip: true });
  }

  function loadAdsense() {
    var client = typeof ADSENSE_CLIENT_ID !== 'undefined' ? ADSENSE_CLIENT_ID : '';
    if (!/^ca-pub-[0-9]{16}$/.test(client || '') || window.__easypdfAdsLoaded) return;
    window.__easypdfAdsLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(client);
    document.head.appendChild(s);
    // Ad units are rendered only where a valid data-ad-slot has been configured.
    document.querySelectorAll('.ad-slot[data-ad-slot]').forEach(function (slot) {
      if (!/^[0-9]+$/.test(slot.getAttribute('data-ad-slot') || '')) return;
      slot.innerHTML = '<ins class="adsbygoogle" style="display:block" data-ad-client="' +
        client + '" data-ad-slot="' + slot.getAttribute('data-ad-slot') +
        '" data-ad-format="auto" data-full-width-responsive="true"></ins>';
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    addThemeButton();
    loadAnalytics();
    loadAdsense();
  });
})();
