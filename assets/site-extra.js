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
    if (now - lastTouch < 300 && !(e.target.closest && e.target.closest('a, button, label, summary, input, textarea, select, [contenteditable="true"], [data-h], [data-menu]'))) e.preventDefault();
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

/* Dienstenkaarten op gsm: bolletjes tonen welke kaart in beeld is; tik op een bolletje springt naar die kaart. */
(function () {
  function sync() {
    var track = document.querySelector('#diensten .svc-cards'), dots = document.querySelector('#diensten .svc-dots');
    if (!track || !dots) return;
    var cards = track.querySelectorAll('.svc-card');
    if (dots.children.length !== cards.length) dots.innerHTML = Array.prototype.map.call(cards, function () { return '<i></i>'; }).join('');
    var mid = track.scrollLeft + track.clientWidth / 2, best = 0, bd = 1e9;
    Array.prototype.forEach.call(cards, function (c, i) { var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } });
    Array.prototype.forEach.call(dots.children, function (d, i) { d.classList.toggle('on', i === best); });
  }
  var raf = 0;
  document.addEventListener('scroll', function (e) {
    if (!e.target || !e.target.classList || !e.target.classList.contains('svc-cards')) return;
    cancelAnimationFrame(raf); raf = requestAnimationFrame(sync);
  }, true);
  window.addEventListener('resize', sync);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(sync, 300); }); else setTimeout(sync, 300);
  setTimeout(sync, 1200);
})();
