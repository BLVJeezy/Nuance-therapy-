/* Nuance: past de wijzigingen uit het beheer toe op de pagina (teksten, opmaak, foto's, lijsten en verborgen secties).
   Gedeeld door index.html, faq.html en admin.html. */
(function () {
  'use strict';
  var FONTS = { serif: "'Playfair Display', Georgia, serif", sans: "Inter, 'Helvetica Neue', Arial, sans-serif" };
  /* Teksten/foto's: oude beheer (NUANCE_CONTENT). Lijsten en secties: het gedeelde beheer (SITE_CONTENT, of het concept in het beheer). */
  function NC() {
    var a = window.NUANCE_CONTENT || {}, b = window.__beheerContent || window.SITE_CONTENT || {}, o = {};
    for (var k in a) o[k] = a[k];
    if (b.lists) o.lists = b.lists;
    if (b.hidden) o.hidden = b.hidden;
    return o;
  }
  function clean(h) { return String(h == null ? '' : h).replace(/<\/?(script|style|iframe|object|embed|link|meta)[^>]*>/gi, '').replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '').replace(/javascript:/gi, ''); }
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }

  /* Elke tekst krijgt een eigen sleutel: de tekst-sleutel plus het volgnummer op de pagina.
     Zo verandert een aanpassing alleen dat ene stuk tekst, ook als dezelfde tekst elders nog eens staat. */
  function textEls(doc) {
    var counts = {}, out = [];
    each(doc.querySelectorAll('[data-ek]'), function (el) {
      if (el.closest('[data-item]')) return;
      var k = el.getAttribute('data-ek'), n = counts[k] = (counts[k] || 0);
      counts[k]++;
      out.push({ el: el, k: k, kn: k + '.' + n });
    });
    return out;
  }
  function keyOf(el) {
    var doc = el.ownerDocument, hit = null;
    textEls(doc).some(function (x) { if (x.el === el) { hit = x; return true; } return false; });
    return hit;
  }

  /* ---------- lijsten (technieken, praktische info, FAQ) ---------- */
  function readItem(it) {
    var o = {};
    each(it.querySelectorAll('[data-f]'), function (f) { o[f.getAttribute('data-f')] = f.innerHTML.trim(); });
    if (it.hasAttribute('data-g')) o.g = it.getAttribute('data-g');
    return o;
  }
  function listsFrom(doc) {
    var out = {};
    each(doc.querySelectorAll('[data-list]'), function (box) {
      var name = box.getAttribute('data-list'), items = box.querySelectorAll('[data-item]');
      if (!items.length) return;
      out[name] = { items: Array.prototype.map.call(items, readItem), tpl: items[0].outerHTML, kind: box.getAttribute('data-kind') || 'flat',
                    gtpl: box.getAttribute('data-kind') === 'faq' ? (box.querySelector('[data-group]') || {}).outerHTML : null };
    });
    return out;
  }
  function fill(tpl, o) {
    var t = document.createElement('template'); t.innerHTML = tpl.trim();
    var el = t.content.firstElementChild;
    each(el.querySelectorAll('[data-f]'), function (f) { var k = f.getAttribute('data-f'); f.innerHTML = clean(o[k] != null ? o[k] : ''); });
    if (o.g != null) el.setAttribute('data-g', o.g);
    el.removeAttribute('open');
    return el.outerHTML;
  }
  var BASE = window.__nuanceBase = window.__nuanceBase || {};
  function applyLists(doc) {
    var data = NC().lists || {};
    var found = listsFrom(doc);
    BASE.lists = BASE.lists || {};
    Object.keys(found).forEach(function (n) { if (!BASE.lists[n]) BASE.lists[n] = found[n]; });
    each(doc.querySelectorAll('[data-list]'), function (box) {
      var name = box.getAttribute('data-list'), want = data[name], base = BASE.lists[name];
      if (!base) return;
      if (!want) { if (box.hasAttribute('data-applied')) { want = base.items; } else return; }
      var sig = JSON.stringify(want);
      if (box.getAttribute('data-applied') === sig && box.querySelector('[data-item]')) return;
      if (base.kind === 'faq') {
        var groups = [], by = {};
        want.forEach(function (o) { var g = o.g || 'Algemeen'; if (!by[g]) { by[g] = []; groups.push(g); } by[g].push(o); });
        box.innerHTML = groups.map(function (g) {
          var t = document.createElement('template'); t.innerHTML = base.gtpl.trim();
          var gEl = t.content.firstElementChild;
          var h = gEl.querySelector('[data-gtitle]'); if (h) h.textContent = g;
          gEl.setAttribute('aria-label', g);
          var holder = gEl.querySelector('[data-items]');
          holder.innerHTML = by[g].map(function (o) { return fill(base.tpl, o); }).join('');
          return gEl.outerHTML;
        }).join('\n');
      } else {
        box.innerHTML = want.map(function (o) { return fill(base.tpl, o); }).join('');
      }
      box.setAttribute('data-applied', sig);
    });
  }

  /* ---------- secties tonen of verbergen ---------- */
  function sectionKey(s) { return s.id || (s.getAttribute('aria-label') || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'); }
  function sections(doc) {
    return Array.prototype.filter.call(doc.querySelectorAll('main section, body > section'), function (s) {
      return sectionKey(s) && !s.parentElement.closest('section');
    }).map(function (s) { var h = s.querySelector('h2'); return { el: s, key: sectionKey(s), label: s.getAttribute('aria-label') || (h && h.textContent.trim().slice(0, 50)) || s.id }; });
  }
  function applyHidden(doc) {
    var hid = NC().hidden || [];
    sections(doc).forEach(function (x) {
      if (hid.indexOf(x.key) >= 0) x.el.style.setProperty('display', 'none', 'important');
      else if (x.el.style.getPropertyValue('display') === 'none') x.el.style.removeProperty('display');
    });
  }

  /* ---------- teksten, opmaak, foto's ---------- */
  function styleEl(el, s) {
    var props = [['font-size', 'data-o-fs'], ['font-family', 'data-o-ff'], ['text-align', 'data-o-ta']];
    if (!el.hasAttribute('data-o-fs')) props.forEach(function (p) { el.setAttribute(p[1], el.style.getPropertyValue(p[0]) + '|' + el.style.getPropertyPriority(p[0])); });
    if (!el.hasAttribute('data-fs0')) el.setAttribute('data-fs0', parseFloat(el.ownerDocument.defaultView.getComputedStyle(el).fontSize));
    function restore(p) { var o = (el.getAttribute(p[1]) || '|').split('|'); if (o[0]) el.style.setProperty(p[0], o[0], o[1]); else el.style.removeProperty(p[0]); }
    if (s && s.s) el.style.setProperty('font-size', (parseFloat(el.getAttribute('data-fs0')) * s.s).toFixed(1) + 'px', 'important'); else restore(props[0]);
    if (s && s.f && FONTS[s.f]) el.style.setProperty('font-family', FONTS[s.f], 'important'); else restore(props[1]);
    if (s && s.a) el.style.setProperty('text-align', s.a, 'important'); else restore(props[2]);
  }
  function applyTexts(doc) {
    var c = NC(), t = c.text || {}, st = c.style || {};
    textEls(doc).forEach(function (x) {
      var v = x.kn in t ? t[x.kn] : t[x.k];
      if (v != null && x.el.innerHTML !== clean(v)) x.el.innerHTML = clean(v);
      var s = st[x.kn] || st[x.k];
      if (s || x.el.hasAttribute('data-fs0')) styleEl(x.el, s);
    });
  }
  function applyImgs(doc) {
    var c = NC(), im = c.img || {}, ip = c.imgpos || {};
    each(doc.querySelectorAll('img[data-ei]'), function (el) {
      var k = el.getAttribute('data-ei'), v = im[k];
      if (v && el.getAttribute('src') !== v) { el.setAttribute('src', v); el.removeAttribute('srcset'); }
      if (ip[k]) el.style.objectPosition = ip[k];
    });
  }

  window.__nuanceApply = function (doc) {
    doc = doc || document;
    try { applyLists(doc); } catch (e) {}
    applyTexts(doc); applyImgs(doc);
    try { applyHidden(doc); } catch (e) {}
    if (window.__afterRender) try { window.__afterRender(); } catch (e) {}
  };
  window.__nuanceKit = { textEls: textEls, keyOf: keyOf, listsFrom: listsFrom, sections: sections, styleEl: styleEl, clean: clean, FONTS: FONTS };
})();
