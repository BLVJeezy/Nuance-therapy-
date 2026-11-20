/* Nuance: fotobescherming, geen zoom, en (op andere pagina's dan de homepage) de wijzigingen uit het beheer. */
(function () {
  'use strict';
  var edit = /[?&]edit=1/.test(location.search);

  /* Foto's en video niet kopiëren of slepen */
  if (!edit) {
    document.addEventListener('contextmenu', function (e) { if (e.target.closest && e.target.closest('img, video, picture, canvas, [role="img"], .g-tile')) e.preventDefault(); }, true);
  }
  document.addEventListener('dragstart', function (e) { if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') e.preventDefault(); }, true);

  /* Niet inzoomen (knijpen of dubbeltikken) */
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (ev) { document.addEventListener(ev, function (e) { e.preventDefault(); }, { passive: false }); });
  document.addEventListener('touchmove', function (e) { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });
  var lastTouch = 0;
  document.addEventListener('touchend', function (e) {
    var now = Date.now();
    if (now - lastTouch < 300 && !(e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]'))) e.preventDefault();
    lastTouch = now;
  }, { passive: false });
  document.addEventListener('wheel', function (e) { if (e.ctrlKey) e.preventDefault(); }, { passive: false });

  if (window.__nuanceRender) return; /* de homepage heeft dit al in zijn eigen code */

  function NC() { return window.NUANCE_CONTENT || {}; }
  function clean(h) { return String(h).replace(/<\/?(script|style|iframe|object|embed)[^>]*>/gi, '').replace(/\son\w+="[^"]*"/gi, '').replace(/javascript:/gi, ''); }
  var FONTS = { serif: "'Playfair Display', Georgia, serif", sans: "Inter, 'Helvetica Neue', Arial, sans-serif" };
  function applyContent() {
    var c = NC(), t = c.text || {}, im = c.img || {}, st = c.style || {}, ip = c.imgpos || {};
    Array.prototype.forEach.call(document.querySelectorAll('[data-ek]'), function (el) {
      var k = el.getAttribute('data-ek'), v = t[k], s = st[k];
      if (v != null && el.innerHTML !== clean(v)) el.innerHTML = clean(v);
      if (s) {
        if (!el.hasAttribute('data-fs0')) el.setAttribute('data-fs0', parseFloat(getComputedStyle(el).fontSize));
        if (s.s) el.style.setProperty('font-size', (parseFloat(el.getAttribute('data-fs0')) * s.s).toFixed(1) + 'px', 'important');
        if (s.f && FONTS[s.f]) el.style.setProperty('font-family', FONTS[s.f], 'important');
        if (s.a) el.style.setProperty('text-align', s.a, 'important');
      }
    });
    Array.prototype.forEach.call(document.querySelectorAll('img[data-ei]'), function (el) {
      var k = el.getAttribute('data-ei'), v = im[k];
      if (v && el.getAttribute('src') !== v) { el.setAttribute('src', v); el.removeAttribute('srcset'); }
      if (ip[k]) el.style.objectPosition = ip[k];
    });
    if (window.__afterRender) try { window.__afterRender(); } catch (e) {}
  }
  window.__nuanceBase = window.__nuanceBase || {};
  window.__nuanceRender = applyContent;
  applyContent();

  /* Menu op telefoon en de kopbalk bij scrollen */
  var menu = document.getElementById('mobile-menu'), nav = document.querySelector('header.nav');
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-menu]'); if (!t || !menu) return;
    var open = t.getAttribute('data-menu') === 'toggle' ? menu.hidden : false;
    menu.hidden = !open;
    Array.prototype.forEach.call(document.querySelectorAll('[data-menu="toggle"]'), function (b) { b.setAttribute('aria-expanded', String(open)); });
  });
  function onScroll() { if (nav) nav.classList.toggle('scrolled', window.scrollY > 10); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
})();
