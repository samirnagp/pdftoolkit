/* EasyPDF progressive enhancements. Integrations are opt-in and require consent. */
(function () {
  'use strict';
  var root = document.documentElement;
  var storageKey = 'easypdf-theme';
  var consentKey = 'easypdf_consent';
  var saved = '';
  try { saved = localStorage.getItem(storageKey) || ''; } catch (e) {}
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.setAttribute('data-theme', saved || (prefersDark ? 'dark' : 'light'));

  function addThemeButton() {
    var nav = document.querySelector('header nav');
    if (!nav || nav.querySelector('.theme-toggle')) return;
    var button = document.createElement('button');
    button.type = 'button'; button.className = 'theme-toggle';
    button.setAttribute('aria-label', 'Switch colour theme');
    function paint() {
      var dark = root.getAttribute('data-theme') === 'dark';
      button.textContent = dark ? '☀ Light' : '☾ Dark';
      button.setAttribute('aria-pressed', String(dark));
    }
    button.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(storageKey, next); } catch (e) {}
      paint();
    });
    paint(); nav.appendChild(button);
  }

  function loadAnalytics() {
    var id = typeof GA_MEASUREMENT_ID !== 'undefined' ? GA_MEASUREMENT_ID : '';
    if (!/^G-[A-Z0-9]+$/i.test(id || '') || window.__easypdfGaLoaded) return;
    window.__easypdfGaLoaded = true;
    var s = document.createElement('script'); s.async = true;
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
    var s = document.createElement('script'); s.async = true; s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(client);
    document.head.appendChild(s);
    document.querySelectorAll('.ad-slot[data-ad-slot]').forEach(function (slot) {
      var slotId = slot.getAttribute('data-ad-slot') || '';
      if (!/^[0-9]+$/.test(slotId)) return;
      slot.innerHTML = '<ins class="adsbygoogle" style="display:block" data-ad-client="' +
        client + '" data-ad-slot="' + slotId + '" data-ad-format="auto" data-full-width-responsive="true"></ins>';
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
    });
  }

  function loadIntegrations() {
    var consent = '';
    try { consent = localStorage.getItem(consentKey) || ''; } catch (e) {}
    if (consent !== 'yes') return;
    loadAnalytics(); loadAdsense();
  }

  function showConsent() {
    var existing = document.getElementById('easypdf-consent');
    var consent = '';
    try { consent = localStorage.getItem(consentKey) || ''; } catch (e) {}
    if (consent || existing) return;
    var panel = document.createElement('section');
    panel.id = 'easypdf-consent'; panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Cookie preferences');
    panel.style.cssText = 'position:fixed;z-index:9999;left:12px;right:12px;bottom:12px;max-width:720px;margin:auto;padding:16px;background:#fff;color:#222;border:1px solid #bbb;border-radius:12px;box-shadow:0 4px 24px #0003;font:14px/1.5 system-ui,sans-serif';
    panel.innerHTML = '<p style="margin:0 0 12px">Optional analytics and advertising help support EasyPDF. Choose whether to allow them. Read our <a href="/privacy.html">Privacy Policy</a>.</p><button type="button" data-choice="yes" style="padding:9px 16px;margin-right:8px">Accept</button><button type="button" data-choice="no" style="padding:9px 16px">Reject</button>';
    panel.addEventListener('click', function (event) {
      var choice = event.target && event.target.getAttribute('data-choice');
      if (choice !== 'yes' && choice !== 'no') return;
      try { localStorage.setItem(consentKey, choice); } catch (e) {}
      panel.remove(); if (choice === 'yes') loadIntegrations();
    });
    document.body.appendChild(panel);
  }

  function init() {
    addThemeButton();
    showConsent();
    loadIntegrations();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.addEventListener('easypdf-consent-accepted', loadIntegrations);
  var settings = document.getElementById('cookie-settings');
  if (settings) settings.addEventListener('click', function (event) {
    event.preventDefault();
    try { localStorage.removeItem(consentKey); } catch (e) {}
    showConsent();
  });
})();