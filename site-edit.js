/*
 * Solyn Global · site-edit.js
 * Past de wijzigingen uit de beheerpagina (beheer.html) toe op de website.
 * - Normaal: leest window.SITE_CONTENT (uit site-content.js) en vervangt teksten en foto's.
 * - Beheermodus (?edit=1, in de beheerpagina): teksten worden klikbaar en bewerkbaar.
 * Werkt op gewone HTML-pagina's en op React-sites (houdt wijzigingen vast na elke render).
 * Teksten zijn gekoppeld aan hun oorspronkelijke tekst; foto's aan hun oorspronkelijke bestand.
 */
(function () {
  'use strict';
  if (window.__siteEdit) return;
  var inBeheer = false; try { inBeheer = window.parent !== window && !!window.parent.__isBeheer; } catch (e) {}
  var EDIT = window.parent !== window && (/[?&]edit=1(&|$)/.test(location.search) || inBeheer);
  var MODE = 'edit'; // 'edit' = teksten aanpassen, 'browse' = gewoon klikken (taal, menu, andere pagina)
  var DRAFT_KEY = 'site-beheer-draft';
  var SKIP = 'script,style,noscript,template,svg,textarea,input,select,option,code,pre,[data-se-skip]';
  var BLOCK_TAGS = /^(H[1-6]|P|LI|A|BUTTON|SPAN|LABEL|BLOCKQUOTE|FIGCAPTION|TD|TH|DT|DD|SMALL|STRONG|EM|B|I|DIV|SUMMARY|CITE|Q|TIME|ADDRESS|LEGEND|CAPTION)$/;

  function norm(d) { d = d && typeof d === 'object' ? d : {}; d.text = d.text || {}; /* oude FAQ-teksten (vraag+antwoord in één titel) vervangen door de opgesplitste versie, nov 2026 */ var RETIRED = ["Kan ik ook bellen?", "Wat kost een gesprek?", "Hoe maak ik een afspraak?", "Kan ik 's avonds terecht?", "Welke technieken gebruik je?", "Hoe verloopt relatietherapie?", "Waar vinden de gesprekken plaats?", "Wat gebeurt er met wat ik vertel?", "Wat is het Edelstenen Zielenkompas?", "Is coaching hetzelfde als een behandeling?", "Vanaf welke leeftijd kunnen kinderen terecht?", "Krijg ik iets terugbetaald via mijn mutualiteit?", "Moet ik al weten welke begeleiding ik nodig heb?", "Wat als ik mijn afspraak moet annuleren of verplaatsen?"]; RETIRED.forEach(function (k) { delete d.text[k]; }); var LK = '__nuance_indeling__', parts = []; Object.keys(d.text).forEach(function (k) { if (k.indexOf(LK) === 0) { parts[+k.slice(LK.length + 1) || 0] = d.text[k]; delete d.text[k]; } }); if (parts.length) { try { var L = JSON.parse(parts.join('')); if (L && typeof L === 'object') { if (L.lists && !d.lists) d.lists = L.lists; if (L.hidden && !d.hidden) d.hidden = L.hidden; if (L.imgfx && !d.imgfx) d.imgfx = L.imgfx; } } catch (e) {} }  d.img = d.img || {}; d.contact = d.contact && typeof d.contact === 'object' && !Array.isArray(d.contact) ? d.contact : {}; d.style = d.style && typeof d.style === 'object' ? d.style : {}; d.style.el = d.style.el && typeof d.style.el === 'object' ? d.style.el : {}; return d; }
  var draft = norm(window.SITE_CONTENT);

  /* ---------- contactgegevens: één keer aanpassen, overal op de site vervangen (tekst én links) ---------- */
  var REPL = [], REPL_SIG = '';
  function esc(x) { return x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function core(num) { var d = String(num).replace(/\D/g, ''); if (d.indexOf('0032') === 0) d = d.slice(4); else if (d.indexOf('32') === 0 && d.length > 9) d = d.slice(2); else if (d.charAt(0) === '0') d = d.slice(1); return d; }
  function buildRepl() {
    var sig = JSON.stringify(draft.contact); if (sig === REPL_SIG) return; REPL_SIG = sig; REPL = [];
    Object.keys(draft.contact).forEach(function (k) {
      var c = draft.contact[k]; if (!c || !c.f || !c.v || c.f === c.v) return;
      if (c.t === 'phone') {
        var oc = core(c.f), nc = core(c.v); if (oc.length < 6 || nc.length < 6) return;
        var digits = oc.split('').map(esc).join('[\\s./-]?');
        REPL.push({ phone: true, re: new RegExp('(\\+\\s?32\\s?(?:\\(0\\)\\s?)?|0032\\s?|\\b32|\\b0)' + digits + '(?!\\d)', 'g'), v: c.v, nc: nc });
      } else if (c.t === 'url') {
        REPL.push({ url: true, f: String(c.f).replace(/\/+$/, ''), v: c.v });
      } else {
        var parts = String(c.f).trim().split(/[\s,]+/).filter(Boolean).map(esc);
        if (!parts.length) return;
        REPL.push({ re: new RegExp('(?<![0-9A-Za-z])' + parts.join('[\\s,]*') + '(?![0-9A-Za-z])', c.t === 'email' ? 'gi' : 'g'), v: c.v, enc: new RegExp(parts.map(function (x) { return x; }).join('(?:\\+|%20|%2C|,|\\s)+'), 'gi'), venc: encodeURIComponent(c.v) });
      }
    });
  }
  function contactText(t) {
    if (!REPL.length || !t) return t;
    REPL.forEach(function (r) {
      if (r.url) return;
      t = t.replace(r.re, r.phone ? function (m, pre) { return /^(\+|00|32)/.test(pre.replace(/\s/g, '')) ? '+32 ' + r.v.replace(/^\s*(\+32|0032|0)\s?/, '') : r.v; } : function () { return r.v; });
    });
    return t;
  }
  function contactHref(h) {
    if (!REPL.length || !h) return h;
    REPL.forEach(function (r) {
      if (r.url) { if (h.replace(/\/+$/, '') === r.f) h = r.v; return; }
      if (r.phone) h = h.replace(r.re, function (m, pre) { var p = pre.replace(/\s/g, ''); return (/^\+/.test(p) ? '+32' : /^(00|32)/.test(p) ? '32' : '0') + r.nc; });
      else { h = h.replace(r.re, r.v); h = h.replace(r.enc, r.venc); }
    });
    return h;
  }
  var A = new WeakMap(); // a -> { orig, applied } voor href
  /* Lege plekken voor contactgegevens (data-contact="phone" enz.): verborgen tot de klant iets invult in het beheer. */
  function slotNode(el) {
    var c = draft.contact[el.getAttribute('data-contact')], v = c && c.v ? String(c.v) : '';
    if (el.hidden !== !v) el.hidden = !v;
    if (!v) return;
    var txt = el.querySelector('[data-contact-text]') || el;
    if (txt.textContent !== v) txt.textContent = v;
    if (el.tagName === 'A') {
      var t = c.t, href = t === 'phone' ? 'tel:+32' + core(v) : t === 'email' ? 'mailto:' + v : t === 'url' ? v : null;
      if (href && el.getAttribute('href') !== href) el.setAttribute('href', href);
    }
  }
  /* ---------- lettertypes: voor de hele site (titels / tekst) en per tekst (lettertype + grootte) ---------- */
  var FONTDIR = '/beheer-fonts/', fontsLoading = false, facesDone = {};
  var FALLBACK = { serif: 'Georgia, serif', sans: 'system-ui, sans-serif', script: 'cursive' };
  function fontInfo(n) { var L = window.BEHEER_FONTS || []; for (var i = 0; i < L.length; i++) if (L[i].n === n) return L[i]; return null; }
  function needFonts() { var st = draft.style; return !!(st.head || st.body || Object.keys(st.el).length); }
  function fam(n) { var f = fontInfo(n); return '"' + n + '", ' + (f ? FALLBACK[f.c] : 'sans-serif'); }
  function face(n) {
    if (facesDone[n]) return; var f = fontInfo(n); if (!f) return; facesDone[n] = true;
    var css = f.f.map(function (x) { return '@font-face{font-family:"' + n + '";src:url(' + FONTDIR + x[0] + ') format("woff2");font-weight:' + x[1] + ';font-style:normal;font-display:swap}'; }).join('');
    var tag = document.getElementById('se-fonts'); if (!tag) { tag = document.createElement('style'); tag.id = 'se-fonts'; document.head.appendChild(tag); }
    tag.textContent += css;
  }
  function loadFonts(cb) {
    if (window.BEHEER_FONTS) return cb();
    if (fontsLoading) return; fontsLoading = true;
    var sc = document.createElement('script'); sc.src = FONTDIR + 'beheer-fonts.js'; sc.onload = function () { fontsLoading = false; cb(); }; sc.onerror = function () { fontsLoading = false; };
    document.head.appendChild(sc);
  }
  var HEADS = 'h1,h2,h3,h4,h5,h6';
  function siteFonts() {
    var st = draft.style, css = '', tag = document.getElementById('se-style');
    if (st.body && fontInfo(st.body)) { face(st.body); css += 'body,body :not(' + HEADS + '):not(:is(' + HEADS + ') *):not([class*="icon"]):not([class*="fa-"]):not([class*="material"]){font-family:' + fam(st.body) + ' !important}'; }
    if (st.head && fontInfo(st.head)) { face(st.head); css += HEADS + ',:is(' + HEADS + ') *{font-family:' + fam(st.head) + ' !important}'; }
    if (!css && !tag) return;
    if (!tag) { tag = document.createElement('style'); tag.id = 'se-style'; document.head.appendChild(tag); }
    if (tag.textContent !== css) tag.textContent = css;
  }
  function keyOf(el) {
    var out = '', w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) { var r = T.get(n); out += r ? r.orig : n.nodeValue; if (out.length > 600) break; }
    return out.replace(/\s+/g, ' ').trim().slice(0, 300);
  }
  var STY_SEL = 'h1,h2,h3,h4,h5,h6,p,li,a,button,span,label,blockquote,figcaption,td,th,dt,dd,small,strong,em,summary,cite,address';
  /* Opmaak per tekst geldt enkel voor dat ene stuk tekst: staat dezelfde tekst nog elders (menu, footer),
     dan krijgt elke volgende plek een eigen sleutel ("tekst §2", "tekst §3"). Een element dat enkel een
     ander element met dezelfde tekst omhult, telt niet apart (anders zou de grootte dubbel tellen). */
  function styleMap() {
    var out = new Map(), counts = {};
    Array.prototype.forEach.call(document.body.querySelectorAll(STY_SEL), function (el) {
      if (el.closest(SKIP)) return;
      var txt = el.textContent; if (!txt || txt.length > 700) return;
      var k = keyOf(el); if (!k) return;
      var up = el.parentElement && el.parentElement.closest(STY_SEL);
      if (up && out.has(up) && out.get(up).base === k) return;
      var n = counts[k] = (counts[k] || 0) + 1;
      out.set(el, { base: k, key: n > 1 ? k + ' §' + n : k });
    });
    return out;
  }
  function styleKey(el) {
    if (!el) return '';
    var m = styleMap(), r = m.get(el);
    if (!r) { var up = el.parentElement && el.parentElement.closest(STY_SEL); if (up && m.has(up) && m.get(up).base === keyOf(el)) r = m.get(up); }
    if (!r && el.querySelector) { var c = el.querySelector(STY_SEL); if (c) r = m.get(c); }
    return r ? r.key : keyOf(el);
  }
  function elFonts() {
    var map = draft.style.el, keys = Object.keys(map), had = document.querySelectorAll('[data-se-st]');
    if (!keys.length && !had.length) return;
    var m = keys.length ? styleMap() : new Map(), seen = new Set();
    m.forEach(function (info, el) {
      var r = map[info.key];
      if (r && (r.f || r.s)) {
        seen.add(el);
        if (r.f && fontInfo(r.f)) { face(r.f); el.style.setProperty('font-family', fam(r.f), 'important'); } else el.style.removeProperty('font-family');
        if (r.s && r.s !== 100) {
          if (!el.hasAttribute('data-se-fs0')) { el.style.removeProperty('font-size'); el.setAttribute('data-se-fs0', parseFloat(getComputedStyle(el).fontSize) || 16); }
          el.style.setProperty('font-size', Math.round(+el.getAttribute('data-se-fs0') * r.s) / 100 + 'px', 'important');
        } else el.style.removeProperty('font-size');
        el.setAttribute('data-se-st', '');
      }
    });
    Array.prototype.forEach.call(had, function (el) {
      if (seen.has(el)) return;
      el.style.removeProperty('font-family'); el.style.removeProperty('font-size'); el.removeAttribute('data-se-st'); el.removeAttribute('data-se-fs0');
    });
  }
  function styles(root) {
    if (!needFonts() && !document.getElementById('se-style') && !document.querySelector('[data-se-st]')) return;
    if (needFonts() && !window.BEHEER_FONTS) { loadFonts(function () { apply(document.body); }); return; }
    if (root === document.body) siteFonts();
    elFonts();
  }
  var M = new WeakMap(); // gestructureerde gegevens (Google) en meta-omschrijvingen
  function headData() {
    Array.prototype.forEach.call(document.querySelectorAll('script[type="application/ld+json"], meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]'), function (el) {
      var isMeta = el.tagName === 'META', cur = isMeta ? el.getAttribute('content') || '' : el.textContent, rec = M.get(el);
      var orig = rec && cur === rec.applied ? rec.orig : cur;
      var want = isMeta ? contactText(orig) : contactHref(orig);
      if (cur !== want) { if (isMeta) el.setAttribute('content', want); else el.textContent = want; }
      M.set(el, { orig: orig, applied: want });
    });
  }
  function linkNode(el) {
    var cur = el.getAttribute('href') || '', rec = A.get(el);
    var orig = rec && cur === rec.applied ? rec.orig : cur;
    if (!/^(tel:|mailto:|sms:|https?:\/\/(wa\.me|api\.whatsapp|(www\.)?google\.[a-z.]+\/maps|maps\.|(www\.)?(facebook|instagram|linkedin|tiktok|youtube|twitter|x)\.com))/i.test(orig) && !(rec && rec.orig !== rec.applied)) return;
    var want = contactHref(orig);
    if (cur !== want) el.setAttribute('href', want);
    A.set(el, { orig: orig, applied: want });
  }
  if (EDIT) { try { var s = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); if (s) draft = norm(s); } catch (e) {} }

  var snapHTML = '';
  var T = new WeakMap(); // tekstknoop -> { orig, applied }
  var I = new WeakMap(); // img -> { orig, applied }
  var key = function (s) { return String(s || '').replace(/\s+/g, ' ').trim(); };
  function srcKey(src) {
    if (!src) return '';
    if (/^data:/.test(src)) return '';
    try { var u = new URL(src, location.href); if (u.origin === location.origin) return u.pathname; return u.origin + u.pathname; } catch (e) { return src; }
  }
  function wrap(orig, txt) { var m = /^(\s*)[\s\S]*?(\s*)$/.exec(orig); return m[1] + txt + m[2]; }
  function skipped(n) { var el = n.nodeType === 1 ? n : n.parentElement; return !el || !!el.closest(SKIP); }

  /* Staat dezelfde tekst meerdere keren op de pagina, dan krijgt elke plek een eigen sleutel ("tekst §2").
     Een aanpassing geldt dan enkel voor de plek die je aanpaste. Oude aanpassingen zonder § blijven overal gelden. */
  var OCC = null, SLOTS = {};
  function occMap() {
    if (OCC) return OCC;
    OCC = new Map(); OCC.totals = {};
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: function (n) { return skipped(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } }), n;
    while ((n = w.nextNode())) {
      var r = T.get(n), o = r && n.nodeValue === r.applied ? r.orig : n.nodeValue, k = key(o); if (!k) continue;
      var c = OCC.totals[k] = (OCC.totals[k] || 0) + 1; OCC.set(n, { k: k, n: c });
    }
    return OCC;
  }
  function slots() { SLOTS = {}; Object.keys(draft.text).forEach(function (k) { var i = k.lastIndexOf(' §'); if (i > 0 && /^\d+$/.test(k.slice(i + 2))) SLOTS[k.slice(0, i)] = 1; }); }
  function textNode(n) {
    var cur = n.nodeValue, rec = T.get(n);
    var orig = rec && cur === rec.applied ? rec.orig : cur;
    var k = key(orig); if (!k) return;
    var has = Object.prototype.hasOwnProperty, val = has.call(draft.text, k) ? draft.text[k] : null;
    if (SLOTS[k]) { var o = occMap().get(n), sk = o && o.k === k ? k + ' §' + o.n : null; if (sk && has.call(draft.text, sk)) val = draft.text[sk]; }
    var want = contactText(val !== null ? wrap(orig, val) : orig);
    if (cur !== want) n.nodeValue = want;
    T.set(n, { orig: orig, applied: want });
  }
  function imgNode(el) {
    var cur = el.getAttribute('src') || '', rec = I.get(el);
    var orig = rec && cur === rec.applied ? rec.orig : cur;
    var k = srcKey(orig); if (!k) { if (!rec) return; }
    var want = k && draft.img[k] ? draft.img[k] : orig;
    if (cur !== want) {
      el.setAttribute('src', want);
      if (want !== orig) {
        if (el.hasAttribute('srcset')) { el.setAttribute('data-se-srcset', el.getAttribute('srcset')); el.removeAttribute('srcset'); }
        var pic = el.parentElement && el.parentElement.tagName === 'PICTURE' ? el.parentElement : null;
        if (pic) Array.prototype.forEach.call(pic.querySelectorAll('source'), function (s) { if (s.hasAttribute('srcset')) { s.setAttribute('data-se-srcset', s.getAttribute('srcset')); s.removeAttribute('srcset'); } });
      } else if (el.hasAttribute('data-se-srcset')) { el.setAttribute('srcset', el.getAttribute('data-se-srcset')); el.removeAttribute('data-se-srcset'); }
    }
    I.set(el, { orig: orig, applied: want });
    imgFx(el, k);
  }
  /* Vorm en grootte per foto (gekozen in het beheer). Het kader rond de foto krijgt de vorm, zodat de foto zelf mooi gevuld blijft. */
  var CLIP = { square: 'inset(0)', round: 'inset(0 round 24px)', oval: 'ellipse(50% 50% at 50% 50%)', circle: 'circle(closest-side at 50% 50%)', arch: 'inset(0 round 50% 50% 0 0 / 34% 34% 0 0)', triangle: 'polygon(50% 0, 100% 100%, 0 100%)', hexagon: 'polygon(25% 2%, 75% 2%, 100% 50%, 75% 98%, 25% 98%, 0 50%)' };
  function fxFrame(img) {
    var f = img.closest('[role="img"], .tech-img, .g-tile, .svc-card-img, .about-oval, .hero-pop-card, picture');
    if (f && f.contains(img)) return f;
    return img;
  }
  function imgFx(el, k) {
    var fx = k && draft.imgfx && draft.imgfx[k], f = fxFrame(el), P = ['clip-path', 'transform', 'transform-origin', 'border-radius', 'aspect-ratio'];
    function restore() { P.forEach(function (q) { var o = f.getAttribute('data-se-o-' + q); f.style.removeProperty(q); if (o) f.style.setProperty(q, o); }); }
    if (!fx) { if (f.hasAttribute('data-se-fx')) { restore(); f.removeAttribute('data-se-fx'); } return; }
    if (!f.hasAttribute('data-se-fx')) { P.forEach(function (q) { var v = f.style.getPropertyValue(q); if (v) f.setAttribute('data-se-o-' + q, v); }); f.setAttribute('data-se-fx', ''); }
    restore();
    if (fx.shape && CLIP[fx.shape]) { f.style.setProperty('clip-path', CLIP[fx.shape], 'important'); f.style.setProperty('border-radius', '0', 'important'); }
    if (fx.shape === 'circle') f.style.setProperty('aspect-ratio', '1 / 1', 'important');
    if (fx.size && fx.size !== 100) { f.style.setProperty('transform', 'scale(' + fx.size / 100 + ')', 'important'); f.style.setProperty('transform-origin', 'center'); }
  }


  var busy = false;
  /* Lijsten (bv. FAQ) en secties tonen/verbergen: de site zelf bouwt ze op (window.__nuanceApply). */
  function structure() {
    window.__beheerContent = draft;
    if (typeof window.__nuanceApply === 'function') try { window.__nuanceApply(document); } catch (e) {}
  }
  function apply(root) {
    root = root || document.body; if (!root || busy) return;
    if (root === document.body) structure();
    OCC = null; slots();
    busy = true;
    try {
      buildRepl();
      var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: function (n) { return skipped(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } });
      var n; while ((n = w.nextNode())) { if (n.parentElement && n.parentElement.isContentEditable && n.parentElement.closest('[data-se-active]')) continue; textNode(n); }
      var imgs = root.querySelectorAll ? root.querySelectorAll('img') : [];
      Array.prototype.forEach.call(imgs, imgNode);
      if (root.tagName === 'IMG') imgNode(root);
      Array.prototype.forEach.call(root.querySelectorAll ? root.querySelectorAll('a[href]') : [], linkNode);
      if (root.tagName === 'A') linkNode(root);
      if (root === document.body) headData();
      Array.prototype.forEach.call(root.querySelectorAll ? root.querySelectorAll('[data-contact]') : [], slotNode);
      if (root.hasAttribute && root.hasAttribute('data-contact')) slotNode(root);
      styles(root);
      if (EDIT) mark(root);
    } finally { busy = false; }
    if (EDIT && typeof api.onRender === 'function') { try { api.onRender(); } catch (e) {} }
  }

  var queued = false, roots = [];
  function schedule(r) { roots.push(r); if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; var list = roots; roots = []; if (list.length > 40) apply(document.body); else list.forEach(function (x) { if (x.isConnected) apply(x); }); }); }
  function observe() {
    new MutationObserver(function (ms) {
      if (busy) return;
      ms.forEach(function (m) {
        if (m.type === 'characterData') { var p = m.target.parentElement; if (p && !(p.isContentEditable && p.closest('[data-se-active]'))) schedule(p); }
        else if (m.type === 'attributes') schedule(m.target);
        else m.addedNodes.forEach(function (a) { if (a.nodeType === 1) schedule(a); else if (a.nodeType === 3 && a.parentElement) schedule(a.parentElement); });
      });
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['src'] });
  }

  /* ---------------- beheermodus ---------------- */
  function hasText(el) { for (var c = el.firstChild; c; c = c.nextSibling) if (c.nodeType === 3 && key(c.nodeValue)) return true; return false; }
  function inBanner(el) {
    // cookiebanners en andere vaste meldingen blijven gewoon klikbaar in het beheer
    for (var a = el && el.nodeType === 1 ? el : el && el.parentElement; a && a !== document.body; a = a.parentElement) {
      var pos = getComputedStyle(a).position;
      if ((pos === 'fixed' || pos === 'sticky') && /cookie|privacy|consent|toestemming/i.test(a.textContent || '') && (a.textContent || '').length < 1500) return true;
    }
    return false;
  }
  function block(el) {
    if (inBanner(el)) return null;
    while (el && el !== document.body) {
      if (el.nodeType === 1 && !el.closest(SKIP) && hasText(el) && BLOCK_TAGS.test(el.tagName)) return el;
      el = el.parentElement;
    }
    return null;
  }
  function mark(root) {
    var els = root.querySelectorAll ? root.querySelectorAll('*') : [];
    Array.prototype.forEach.call(els, function (el) { if (!el.hasAttribute('data-se-t') && BLOCK_TAGS.test(el.tagName) && hasText(el) && !el.closest(SKIP)) el.setAttribute('data-se-t', ''); });
  }
  var active = null, snap = [];
  function texts(el) { var out = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n; while ((n = w.nextNode())) if (!skipped(n)) out.push(n); return out; }
  function activate(el) {
    if (active === el) return;
    deactivate();
    active = el;
    snapHTML = el.innerHTML;
    snap = texts(el).map(function (n) { var r = T.get(n); return { node: n, orig: r && n.nodeValue === r.applied ? r.orig : n.nodeValue }; });
    OCC = null; var om = occMap();
    snap.forEach(function (s) { var o = om.get(s.node); s.slot = o && om.totals[o.k] > 1 ? o.k + ' §' + o.n : null; });
    el.setAttribute('data-se-active', '');
    try { el.contentEditable = 'plaintext-only'; } catch (e) {}
    if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true';
    el.spellcheck = true;
    if (typeof api.onActive === 'function') { try { api.onActive(info()); } catch (e) {} }
  }
  function info() { return active ? { tag: active.tagName, orig: snap.map(function (s) { return s.orig; }).join(''), now: active.textContent || '', key: styleKey(active), size: parseFloat(getComputedStyle(active).fontSize) || 0 } : null; }
  function deactivate() {
    if (!active) return;
    active.removeAttribute('contenteditable'); active.removeAttribute('data-se-active');
    snap.forEach(function (s) { if (s.node.isConnected) T.set(s.node, { orig: s.orig, applied: s.node.nodeValue }); });
    active = null; snap = [];
    if (typeof api.onActive === 'function') { try { api.onActive(null); } catch (e) {} }
  }
  function record() {
    if (!active) return;
    var nodes = texts(active);
    if (snap.length === 1 && (nodes.length !== 1 || nodes[0] !== snap[0].node)) {
      // browser heeft de tekstknoop vervangen: hele blok = die ene tekst
      var all = (active.textContent || '');
      setText(snap[0].orig, all, snap[0].slot);
      if (!nodes.length) { var t = document.createTextNode(''); active.appendChild(t); nodes = [t]; }
      snap[0].node = nodes[0];
    } else {
      snap.forEach(function (s) { if (s.node.isConnected) setText(s.orig, s.node.nodeValue, s.slot); });
    }
    if (typeof api.onChange === 'function') api.onChange(info());
  }
  function setText(orig, val, slot) {
    var k = key(orig), v = key(val); if (!k) return;
    if (slot) {
      if (v === k && !Object.prototype.hasOwnProperty.call(draft.text, k)) delete draft.text[slot]; else draft.text[slot] = v;
      SLOTS[k] = 1; return;
    }
    if (v === k) delete draft.text[k]; else draft.text[k] = v;
  }
  function imgAt(t) {
    if (!t || !t.closest) return null;
    if (t.tagName === 'IMG') return t;
    var box = t.closest('[role="img"], figure, picture');
    return box ? box.querySelector('img') : null;
  }
  function origSrc(img) { var r = I.get(img); return r && img.getAttribute('src') === r.applied ? r.orig : img.getAttribute('src'); }
  function imgLabel(el) {
    var alt = (el.getAttribute('alt') || '').trim(); if (alt) return alt;
    var btn = el.closest('button, a'); var bt = btn && btn.textContent.replace(/\s+/g, ' ').trim(); if (bt) return bt;
    var box = el.closest('[aria-label]'); if (box && box.getAttribute('aria-label')) return box.getAttribute('aria-label');
    var sec = el.closest('section'), h = sec && sec.querySelector('h1, h2, h3');
    return h ? 'Foto bij “' + h.textContent.trim().slice(0, 40) + '”' : 'Foto';
  }
  function editMode() {
    var st = document.createElement('style');
    st.textContent = 'html.se-edit img,html.se-edit [role="img"]{cursor:pointer !important}html.se-edit img:hover{outline:2px solid #D6C3B2;outline-offset:-2px}html.se-edit [data-se-t]{outline:1px dashed rgba(127,127,127,.55);outline-offset:2px;cursor:text !important}html.se-edit [data-se-t]:hover{outline:1px dashed currentColor}[data-se-active]{outline:2px solid #2f80ed !important;outline-offset:3px;border-radius:2px}*{-webkit-user-select:auto}';
    document.head.appendChild(st);
    document.documentElement.classList.add('se-edit');
    window.addEventListener('pointerdown', function (e) {
      if (MODE !== 'edit') return;
      var el = block(e.target);
      if (el) activate(el); else if (active && !active.contains(e.target)) deactivate();
    }, true);
    window.addEventListener('click', function (e) {
      if (MODE !== 'edit' || inBanner(e.target) || block(e.target)) return;
      var img = imgAt(e.target); if (!img) return;
      var k = srcKey(origSrc(img)); if (!k) return;
      e.preventDefault(); e.stopPropagation();
      if (typeof api.onImage === 'function') api.onImage({ key: k, src: img.currentSrc || img.getAttribute('src'), alt: imgLabel(img) });
    }, true);
    ['click', 'auxclick', 'dblclick'].forEach(function (t) {
      window.addEventListener(t, function (e) {
        if (MODE !== 'edit' || inBanner(e.target)) return;
        var a = e.target.closest && e.target.closest('a[href],button,[role="button"],summary,label');
        if (a || block(e.target)) { e.preventDefault(); e.stopPropagation(); }
        var el = block(e.target); if (el && el === active && document.activeElement !== el) el.focus();
      }, true);
    });
    document.addEventListener('submit', function (e) { if (inBanner(e.target)) return; e.preventDefault(); e.stopPropagation(); }, true);
    document.addEventListener('input', function (e) { if (active && active.contains(e.target)) record(); }, true);
    document.addEventListener('keydown', function (e) { if (active && e.key === 'Enter') { e.preventDefault(); active.blur(); deactivate(); } if (active && e.key === 'Escape') { active.blur(); deactivate(); } }, true);
    document.addEventListener('paste', function (e) {
      if (!active || !active.contains(e.target)) return;
      e.preventDefault(); var t = (e.clipboardData || window.clipboardData).getData('text/plain').replace(/\s+/g, ' ');
      document.execCommand('insertText', false, t);
    }, true);
    document.addEventListener('focusout', function () { setTimeout(function () { if (active && !active.contains(document.activeElement)) deactivate(); }, 0); }, true);
  }

  var api = window.__siteEdit = {
    edit: EDIT,
    get draft() { return draft; },
    attach: function (d) { draft = norm(d); apply(document.body); },
    keyOf: function (el) { return styleKey(el); },
    revertActive: function () {
      if (!active) return;
      var old = snap.slice();
      active.innerHTML = snapHTML;
      old.forEach(function (s) { setText(s.orig, s.orig, s.slot); });
      snap = texts(active).map(function (n, i) { return { node: n, orig: n.nodeValue, slot: (old[i] || {}).slot || null }; });
      if (typeof api.onChange === 'function') api.onChange(info());
    },
    apply: function () { apply(document.body); },
    images: function () {
      var seen = {}, out = [];
      Array.prototype.forEach.call(document.querySelectorAll('img'), function (el) {
        if (el.closest(SKIP)) return;
        var rec = I.get(el), orig = rec ? rec.orig : el.getAttribute('src'), k = srcKey(orig);
        if (!k || seen[k]) return; seen[k] = 1;
        var r = el.getBoundingClientRect();
        var sec = el.closest('section, header, footer'), sh = sec && (sec.getAttribute('aria-label') || ((sec.querySelector('h1, h2') || {}).textContent || '').trim());
        if (sec && sec.tagName === 'HEADER') sh = 'Bovenaan (logo)';
        if (sec && sec.tagName === 'FOOTER') sh = 'Onderaan';
        if (sec && sec.classList.contains('hero')) sh = 'Bovenaan de pagina';
        out.push({ key: k, src: draft.img[k] || el.currentSrc || orig, orig: orig, alt: imgLabel(el), sec: (sh || 'Foto’s').replace(/\s+/g, ' ').slice(0, 48), tiny: r.width > 0 && r.width < 24 });
      });
      return out;
    },
    get mode() { return MODE; },
    setMode: function (m) { MODE = m === 'browse' ? 'browse' : 'edit'; if (MODE === 'browse') deactivate(); document.documentElement.classList.toggle('se-edit', MODE === 'edit'); },
    onChange: null, onRender: null, onImage: null
  };

  // Door de server opgebouwde React-pagina's (TanStack Start, Next.js): eerst React laten opstarten, dan pas aanpassen.
  function ssr() { return !!(window.$_TSR || window.__TSR_ROUTER__ || window.__NEXT_DATA__ || document.getElementById('__NEXT_DATA__') || /\$_TSR/.test((document.scripts[0] || {}).textContent || '')); }
  function start() {
    if (EDIT) editMode();
    var go = function () { apply(document.body); observe(); };
    if (!ssr()) return go();
    var run = function () { setTimeout(go, 300); };
    if (document.readyState === 'complete') run(); else window.addEventListener('load', run);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
