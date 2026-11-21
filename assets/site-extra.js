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

  function applyContent() { if (window.__nuanceApply) window.__nuanceApply(document); }
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
