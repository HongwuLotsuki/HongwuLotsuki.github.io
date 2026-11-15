/* =====================================================================
   INVENTORY — core.js (tech lead)
   Exposes window.SITE. Classic script, file:// safe, no modules/fetch.
   Boot: flags → i18n → build UI → WebGL + Lenis → fonts → splits &
   interactions → preloader | enter transition | none → ready.
   API reference: docs/API.md
   ===================================================================== */
(function (w, d) {
  'use strict';

  var gsap = w.gsap, ST = w.ScrollTrigger, THREE = w.THREE;
  var html = d.documentElement, body = d.body;
  var noop = function () {};
  var I18N = w.I18N = w.I18N || { en: {} };

  /* ------------------------------------------------------------------
     0. Utils
     ------------------------------------------------------------------ */
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function map(v, a, b, c, e) { return c + (e - c) * ((v - a) / (b - a)); }
  function smoothstep(a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function qs(s, r) { return (r || d).querySelector(s); }
  function qsa(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function debounce(fn, ms) { var id; return function () { var a = arguments, c = this; clearTimeout(id); id = setTimeout(function () { fn.apply(c, a); }, ms); }; }
  function throttle(fn, ms) { var last = 0, id; return function () { var a = arguments, c = this, now = Date.now(), rem = ms - (now - last); if (rem <= 0) { last = now; fn.apply(c, a); } else { clearTimeout(id); id = setTimeout(function () { last = Date.now(); fn.apply(c, a); }, rem); } }; }
  function rand(a, b) { if (b === undefined) { b = a === undefined ? 1 : a; a = 0; } return a + Math.random() * (b - a); }
  function hash(s) { s = String(s); var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function isInView(el, m) { if (!el) return false; var r = el.getBoundingClientRect(); m = m || 0; return r.bottom > -m && r.top < w.innerHeight + m && r.right > -m && r.left < w.innerWidth + m; }
  function attr(el, n) { return el.getAttribute(n); }
  function num(v, fb) { var n = parseFloat(v); return isNaN(n) ? fb : n; }
  function pad(n, l) { n = String(Math.max(0, Math.round(n))); while (n.length < l) n = '0' + n; return n; }
  function mk(tag, cls, parent) { var e = d.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; }
  function safe(fn, name) { try { return fn(); } catch (e) { if (w.console) console.warn('[SITE] ' + (name || '') + ' failed:', e); } }
  function toArr(t) { if (!t) return []; if (typeof t === 'string') return qsa(t); if (t.length !== undefined && !t.nodeType) return Array.prototype.slice.call(t); return [t]; }

  /* ------------------------------------------------------------------
     1. Storage (never throws). Falls back to window.name for session.
     ------------------------------------------------------------------ */
  function enc(v) { return typeof v === 'string' ? v : JSON.stringify(v); }
  function dec(v) { if (v == null) return null; try { return JSON.parse(v); } catch (e) { return v; } }
  function nameStore(obj) {
    try {
      if (obj) { w.name = JSON.stringify({ __nh: obj }); return obj; }
      var o = JSON.parse(w.name || '{}'); return (o && o.__nh) || {};
    } catch (e) { return {}; }
  }
  var store = {
    get: function (k) { try { return dec(w.localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) {
      try { if (v == null) w.localStorage.removeItem(k); else w.localStorage.setItem(k, enc(v)); return true; } catch (e) { return false; }
    },
    session: function (k, v) {
      if (v === undefined) {
        try { var s = w.sessionStorage.getItem(k); if (s != null) return dec(s); } catch (e) {}
        var ns = nameStore(); return ns[k] == null ? null : ns[k];
      }
      var ok = false;
      try { if (v === null) w.sessionStorage.removeItem(k); else w.sessionStorage.setItem(k, enc(v)); ok = true; } catch (e) {}
      var o = nameStore(); if (v === null) delete o[k]; else if (!ok) o[k] = v; nameStore(o);
      return ok;
    }
  };

  /* ------------------------------------------------------------------
     2. Flags & site constants
     ------------------------------------------------------------------ */
  var mm = function (q) { try { return w.matchMedia(q).matches; } catch (e) { return false; } };
  var cl = html.classList;
  cl.remove('no-js'); cl.add('js');
  var isTouch = cl.contains('is-touch') || mm('(hover: none), (pointer: coarse)');
  var reduced = cl.contains('is-reduced') || mm('(prefers-reduced-motion: reduce)');
  if (isTouch) cl.add('is-touch');
  if (reduced) cl.add('is-reduced');
  var finePointer = !isTouch && mm('(hover: hover) and (pointer: fine)');

  /* English-only template. Add another dictionary + lang logic here to localise. */
  var lang = 'en';
  html.lang = lang; cl.add('lang-' + lang);

  var PAGES = [
    { key: 'home', href: 'index.html', slot: '01', sku: 'INV-001', rarity: 'starter', accent: 'laser', title: 'nav.home' },
    { key: 'about', href: 'about.html', slot: '02', sku: 'INV-002', rarity: 'unique', accent: 'amber', title: 'nav.about' },
    { key: 'games', href: 'games.html', slot: '03', sku: 'INV-003', rarity: 'epic', accent: 'phosphor', title: 'nav.games' },
    { key: 'projects', href: 'projects.html', slot: '04', sku: 'INV-004', rarity: 'legendary', accent: 'cyan', title: 'nav.projects' },
    { key: 'contact', href: 'contact.html', slot: '05', sku: 'INV-005', rarity: 'quest', accent: 'laser', title: 'nav.contact' }
  ];
  var ACCENTS = { laser: '--c-laser', amber: '--c-amber', phosphor: '--c-phosphor', cyan: '--c-cyan', bone: '--c-bone', violet: '--c-violet', ink: '--c-ink', ink4: '--c-ink-4' };
  var FALLBACK = { '--c-laser': '#FF4A1C', '--c-amber': '#F2B544', '--c-phosphor': '#B6F23A', '--c-cyan': '#43E0C2', '--c-bone': '#ECE7DC', '--c-violet': '#8A7CFF', '--c-ink': '#0C0D0B', '--c-ink-4': '#26271F' };
  var pageKey = (body && body.getAttribute('data-page')) || 'home';
  var pageIndex = Math.max(0, PAGES.map(function (p) { return p.key; }).indexOf(pageKey));

  /* ------------------------------------------------------------------
     3. SITE object (contract §6.2)
     ------------------------------------------------------------------ */
  var listeners = {};
  var SITE = w.SITE = {
    version: '1.0',
    page: pageKey, pageIndex: pageIndex, pages: PAGES,
    isTouch: isTouch, reducedMotion: reduced,
    lang: lang, locale: 'en-US',
    lenis: null, gsap: gsap, ScrollTrigger: ST, THREE: THREE,
    scroller: w,
    isReady: false,
    scroll: { y: 0, progress: 0, velocity: 0, direction: 1, limit: 0 },
    utils: { lerp: lerp, clamp: clamp, map: map, smoothstep: smoothstep, qs: qs, qsa: qsa, debounce: debounce, throttle: throttle, rand: rand, hash: hash, isInView: isInView },
    store: store,
    on: function (e, fn) { (listeners[e] = listeners[e] || []).push(fn); return function () { SITE.off(e, fn); }; },
    off: function (e, fn) { var l = listeners[e]; if (!l) return; var i = l.indexOf(fn); if (i > -1) l.splice(i, 1); },
    emit: function (e, data) { (listeners[e] || []).slice().forEach(function (fn) { safe(function () { fn(data); }, 'listener ' + e); }); }
  };

  if (!gsap) {
    /* Without GSAP nothing animates: show everything, keep links working. */
    cl.add('reveal-off', 'is-ready', 'no-webgl'); cl.remove('is-loading', 'is-entering');
    SITE.onReady = function (fn) { setTimeout(fn, 0); };
    return;
  }
  if (ST) { gsap.registerPlugin(ST); ST.config({ ignoreMobileResize: true }); }

  /* ------------------------------------------------------------------
     4. Ticker, resize, ready
     ------------------------------------------------------------------ */
  var tickWrap = [];
  SITE.ticker = {
    add: function (fn) {
      var wr = function (time, delta) { if (!d.hidden) fn(time, delta); };
      tickWrap.push([fn, wr]); gsap.ticker.add(wr); return fn;
    },
    remove: function (fn) {
      for (var i = tickWrap.length - 1; i >= 0; i--) if (tickWrap[i][0] === fn) { gsap.ticker.remove(tickWrap[i][1]); tickWrap.splice(i, 1); }
    }
  };

  var vw = w.innerWidth, vh = w.innerHeight, resizeFns = [];
  SITE.onResize = function (fn) { resizeFns.push(fn); return function () { var i = resizeFns.indexOf(fn); if (i > -1) resizeFns.splice(i, 1); }; };
  w.addEventListener('resize', debounce(function () {
    var nw = w.innerWidth; vh = w.innerHeight;
    if (nw === vw) return;
    vw = nw;
    resizeFns.slice().forEach(function (fn) { safe(fn, 'resize'); });
    SITE.emit('resize', { width: vw, height: vh });
  }, 200));

  var refreshT;
  SITE.refresh = function () { if (!ST) return; clearTimeout(refreshT); refreshT = setTimeout(function () { ST.refresh(); }, 60); };

  var readyQ = [], ready = false;
  SITE.onReady = function (fn) {
    if (typeof fn !== 'function') return;
    if (ready) setTimeout(function () { safe(fn, 'onReady'); }, 0); else readyQ.push(fn);
  };
  function whenReady(fn) { if (ready) fn(); else readyQ.unshift(fn); }
  function fireReady() {
    if (ready) return;
    ready = SITE.isReady = true;
    cl.add('is-ready'); cl.remove('is-loading');
    var q = readyQ; readyQ = [];
    q.forEach(function (fn) { safe(fn, 'onReady'); });
    SITE.emit('ready');
    SITE.refresh();
  }

  /* ------------------------------------------------------------------
     5. i18n
     ------------------------------------------------------------------ */
  function lookup(key, l) { var dct = I18N[l || SITE.lang]; if (dct && dct[key] != null) return dct[key]; return null; }
  SITE.t = function (key, vars) {
    var s = lookup(key); if (s == null) s = key; s = String(s);
    if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
    return s;
  };
  var t = SITE.t;
  var ALLOWED = /^(em|strong|br|span|a|i|b|sup|sub)$/i;
  function sanitize(s) {
    return String(s).replace(/<\/?([a-z0-9-]+)([^>]*)>/gi, function (m, tag, a) {
      if (!ALLOWED.test(tag)) return '';
      return m.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '').replace(/javascript:/gi, '');
    });
  }
  function applyI18n(root, onlyForced) {
    root = root || d;
    var sel = '[data-i18n],[data-i18n-html],[data-i18n-attr]';
    var els = qsa(sel, root);
    if (root.nodeType === 1 && root.matches && root.matches(sel)) els.unshift(root);
    els.forEach(function (el) {
      if (onlyForced && !el.hasAttribute('data-i18n-force')) return;
      var k = attr(el, 'data-i18n'), v;
      if (k && (v = lookup(k)) != null && !el._split) el.textContent = v;
      k = attr(el, 'data-i18n-html');
      if (k && (v = lookup(k)) != null && !el._split) el.innerHTML = sanitize(v);
      k = attr(el, 'data-i18n-attr');
      if (k) k.split(';').forEach(function (pair) {
        var i = pair.indexOf(':'); if (i < 0) return;
        var a = pair.slice(0, i).trim(), key = pair.slice(i + 1).trim(), val = lookup(key);
        if (a && val != null) el.setAttribute(a, val);
      });
    });
    if (root === d || root === html) { var tt = qs('title[data-i18n]'); if (tt && !onlyForced) { var tv = lookup(attr(tt, 'data-i18n')); if (tv) d.title = tv; } }
    rewriteLinks(root);
  }
  SITE.applyI18n = function (root) { applyI18n(root || d, false); };

  /* Internal link helpers */
  function parseInternal(raw) {
    if (!raw) return null; raw = String(raw).trim();
    if (/^(#|mailto:|tel:|javascript:|data:|blob:)/i.test(raw) || /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(raw)) return null;
    var m = /^([^?#]*\.html?)(\?[^#]*)?(#.*)?$/i.exec(raw);
    return m ? { path: m[1], query: m[2] || '', hash: m[3] || '' } : null;
  }
  function withLang(raw, l) {
    var p = parseInternal(raw); if (!p) return raw;
    var q = p.query.replace(/^\?/, '').split('&').filter(function (s) { return s && !/^lang=/.test(s); });
    return p.path + (q.length ? '?' + q.join('&') : '') + p.hash;
  }
  function fileOf(path) { return (String(path).split(/[?#]/)[0].split('/').pop() || 'index.html').toLowerCase(); }
  var currentFile = fileOf(w.location.pathname) || 'index.html';
  function pageOf(raw) { var f = fileOf(raw); for (var i = 0; i < PAGES.length; i++) if (PAGES[i].href === f) return i; return -1; }
  function rewriteLinks(root) {
    qsa('a[href]', root && root.nodeType ? root : d).forEach(function (a) {
      var h = attr(a, 'href'); if (parseInternal(h)) { var n = withLang(h); if (n !== h) a.setAttribute('href', n); }
    });
  }

  /* ------------------------------------------------------------------
     6. Scroll (Lenis + ScrollTrigger)
     ------------------------------------------------------------------ */
  var lenis = null, S = SITE.scroll, lastY = 0, maxScroll = 0, downState = false, locks = {}, locked = false;
  function measureMax() { maxScroll = Math.max(0, (d.scrollingElement || html).scrollHeight - w.innerHeight); }
  function initScroll() {
    if ('scrollRestoration' in w.history) w.history.scrollRestoration = 'manual';
    if (!w.location.hash) w.scrollTo(0, 0);
    if (!reduced && w.Lenis) {
      safe(function () {
        lenis = new w.Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.2, syncTouch: false });
      }, 'lenis');
    }
    SITE.lenis = lenis;
    if (lenis) {
      if (ST) lenis.on('scroll', ST.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    }
    gsap.ticker.lagSmoothing(0);
    measureMax();
    if (ST) ST.addEventListener('refresh', measureMax);
    SITE.ticker.add(updateScroll);
  }
  var progEls = [];
  function updateScroll() {
    var y = lenis ? lenis.scroll : (w.pageYOffset || html.scrollTop || 0);
    var limit = lenis ? lenis.limit : maxScroll;
    var dy = y - lastY; lastY = y;
    var raw = lenis ? (lenis.velocity || 0) : dy;
    S.velocity += (clamp(raw / 50, -1, 1) - S.velocity) * 0.12;
    if (Math.abs(S.velocity) < 0.0005) S.velocity = 0;
    if (dy > 0.5) S.direction = 1; else if (dy < -0.5) S.direction = -1;
    var p = limit > 0 ? clamp(y / limit, 0, 1) : 0;
    var changed = p !== S.progress;
    S.y = y; S.limit = limit; S.progress = p;
    var down = S.direction === 1 && y > 200;
    if (down !== downState) { downState = down; cl.toggle('is-scrolling-down', down); }
    if (changed) for (var i = 0; i < progEls.length; i++) progEls[i].style.transform = 'scaleX(' + p.toFixed(4) + ')';
  }
  function applyLock() {
    var on = Object.keys(locks).length > 0;
    if (on === locked) return; locked = on;
    if (lenis) { if (on) lenis.stop(); else lenis.start(); }
    else cl.toggle('is-locked', on);
  }
  function lock(n) { locks[n] = 1; applyLock(); }
  function unlock(n) { delete locks[n]; applyLock(); }
  SITE.stop = function () { lock('user'); };
  SITE.start = function () { unlock('user'); };
  SITE.scrollTo = function (target, opts) {
    opts = opts || {};
    if (target === 'top') target = 0;
    if (typeof target === 'string') { target = qs(target); if (!target) return; }
    if (lenis) { lenis.scrollTo(target, Object.assign({ duration: 1.4 }, opts, reduced ? { immediate: true } : {})); return; }
    var y = typeof target === 'number' ? target : target.getBoundingClientRect().top + (w.pageYOffset || 0);
    y += opts.offset || 0;
    w.scrollTo({ top: y, behavior: reduced || opts.immediate ? 'auto' : 'smooth' });
  };

  /* ------------------------------------------------------------------
     7. Split text
     ------------------------------------------------------------------ */
  var lineSplits = [];
  function split(el, type) {
    if (!el) return null;
    type = String(type || attr(el, 'data-split') || 'words').replace(/\s/g, '');
    if (el._split) el._split.revert();
    var orig = el.innerHTML, hadAria = el.hasAttribute('aria-label');
    var label = el.textContent.replace(/\s+/g, ' ').trim();
    var wantLines = type.indexOf('lines') > -1, wantChars = type.indexOf('chars') > -1;
    var words = [], chars = [], lines = [], wraps = [], ci = 0, lastWord = null;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var txt = n.nodeValue; if (!txt) return;
          var frag = d.createDocumentFragment();
          txt.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(d.createTextNode(' ')); if (lastWord) lastWord._sp = true; return; }
            var wd = mk('span', 'split-word'); wd.setAttribute('aria-hidden', 'true');
            if (wantChars) Array.from(part).forEach(function (ch) { var c = mk('span', 'split-char', wd); c.style.setProperty('--i', ci++); c.textContent = ch; c._ch = ch; chars.push(c); });
            else wd.textContent = part;
            frag.appendChild(wd); words.push(wd); lastWord = wd;
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR' && n.namespaceURI === 'http://www.w3.org/1999/xhtml' && !n.classList.contains('split-ignore')) {
          walk(n);
        }
      });
    })(el);

    if (wantLines && words.length) {
      var chains = words.map(function (wd) { var c = [], p = wd.parentNode; while (p && p !== el) { c.unshift(p); p = p.parentNode; } return c; });
      var groups = [], cur = null, curTop = -1e9, curH = 0;
      words.forEach(function (wd, i) {
        var top = wd.offsetTop, h = wd.offsetHeight || 1;
        if (!cur || top - curTop > Math.max(curH, h) * 0.5) { cur = []; groups.push(cur); curTop = top; curH = h; }
        cur.push(i);
      });
      var frag = d.createDocumentFragment();
      groups.forEach(function (g) {
        var line = mk('span', 'split-line'), inner = mk('span', 'split-line__inner', line), stack = [];
        line.setAttribute('aria-hidden', 'true');
        g.forEach(function (wi, j) {
          var chain = chains[wi], k = 0;
          while (k < stack.length && k < chain.length && stack[k].o === chain[k]) k++;
          stack.length = k;
          for (var q = k; q < chain.length; q++) { var c = chain[q].cloneNode(false); (q === 0 ? inner : stack[q - 1].c).appendChild(c); stack.push({ o: chain[q], c: c }); }
          var parent = stack.length ? stack[stack.length - 1].c : inner;
          parent.appendChild(words[wi]);
          if (words[wi]._sp && j < g.length - 1) parent.appendChild(d.createTextNode(' '));
        });
        frag.appendChild(line); wraps.push(line); lines.push(inner);
      });
      el.innerHTML = ''; el.appendChild(frag);
      if (lineSplits.indexOf(el) < 0) lineSplits.push(el);
    }
    if (!hadAria && label) el.setAttribute('aria-label', label);
    el.classList.add('is-split');
    var res = {
      lines: lines, lineWrappers: wraps, words: words, chars: chars, type: type,
      revert: function () {
        el.innerHTML = orig; el.classList.remove('is-split');
        if (!hadAria) el.removeAttribute('aria-label');
        el._split = null;
      }
    };
    el._split = res; el._splitType = type;
    return res;
  }
  SITE.split = split;
  SITE.onResize(function () {
    var any = false;
    lineSplits = lineSplits.filter(function (el) { return el.isConnected; });
    lineSplits.forEach(function (el) {
      if (!el._split) return;
      split(el, el._splitType); any = true;
      if (el.hasAttribute('data-proximity')) proxRefresh();
      SITE.emit('split', el);
    });
    if (any) SITE.refresh();
  });

  /* ------------------------------------------------------------------
     8. Scramble / decode
     ------------------------------------------------------------------ */
  var GLYPHS = 'ABCDEFGHIJKLMNOPRSTUVYZ0123456789#%&*/<>';
  SITE.scramble = function (el, opts) {
    if (!el) return null;
    opts = opts || {};
    var dur = opts.duration != null ? opts.duration : 0.7, G = opts.chars || GLYPHS;
    var charEls = el._split && el._split.chars && el._split.chars.length ? el._split.chars : null;
    if (!charEls && el.children.length && !opts.force) return null;
    if (el._scr) { el._scr.progress(1).kill(); }
    var finalArr = opts.text != null ? Array.from(String(opts.text)) : charEls ? charEls.map(function (c) { return c._ch != null ? c._ch : c.textContent; }) : Array.from(el.textContent);
    var startLen = charEls ? charEls.length : Array.from(el.textContent).length;
    var len = charEls ? charEls.length : Math.max(finalArr.length, startLen);
    var write = function (arr) {
      if (charEls) for (var i = 0; i < charEls.length; i++) { if (charEls[i].textContent !== arr[i]) charEls[i].textContent = arr[i] || ''; }
      else el.textContent = arr.join('');
    };
    if (reduced || dur <= 0) { write(finalArr); return null; }
    var th = []; for (var i = 0; i < len; i++) th.push((i / len) * 0.6 + Math.random() * 0.4);
    var o = { p: 0 }, frame = 0;
    var tw = gsap.to(o, {
      p: 1, duration: dur, ease: 'none', delay: opts.delay || 0,
      onUpdate: function () {
        if ((frame++ & 1) && o.p < 1) return;
        var out = [];
        for (var i = 0; i < len; i++) {
          var ch = finalArr[i] == null ? '' : finalArr[i];
          if (o.p >= th[i] || ch === ' ' || ch === '') out.push(o.p >= th[i] ? ch : (ch === ' ' ? ' ' : G[(Math.random() * G.length) | 0]));
          else out.push(G[(Math.random() * G.length) | 0]);
        }
        write(out);
      },
      onComplete: function () { write(finalArr); el._scr = null; if (opts.onComplete) opts.onComplete(); }
    });
    el._scr = tw;
    return tw;
  };

  /* ------------------------------------------------------------------
     9. Reveal system
     ------------------------------------------------------------------ */
  function playReveal(el, o) {
    o = o || {};
    var type = o.type || attr(el, 'data-reveal') || 'up';
    var delay = o.delay != null ? o.delay : num(attr(el, 'data-reveal-delay'), 0);
    var stg = o.stagger != null ? o.stagger : num(attr(el, 'data-reveal-stagger'), null);
    var kids = o.children != null ? o.children : el.hasAttribute('data-reveal-children');
    var tl = gsap.timeline({ delay: delay });
    if (reduced) { el.classList.add('is-revealed'); return tl; }
    var X = 'expo.out';
    var targets = kids ? Array.prototype.slice.call(el.children) : [el];
    if (/^(lines|words|chars)$/.test(type) && !kids) {
      var s = el._split;
      if (!s || (type === 'lines' && !s.lines.length) || (type === 'chars' && !s.chars.length)) s = split(el, attr(el, 'data-split') && el._split ? el._split.type : type);
      var parts = type === 'lines' ? (s.lines.length ? s.lines : s.words) : type === 'words' ? s.words : (s.chars.length ? s.chars : s.words);
      var each = stg != null ? stg : type === 'lines' ? 0.1 : type === 'words' ? 0.06 : 0.025;
      var st = parts.length * each > 0.6 && stg == null ? { amount: 0.6 } : { each: each };
      /* y:0 pins out any stray px translate GSAP may have parsed from a previous run; clearProps leaves the text clean */
      if (type === 'lines') tl.fromTo(parts, { y: 0, yPercent: 110, rotate: 2 }, { y: 0, yPercent: 0, rotate: 0, duration: 1.1, ease: X, stagger: st, clearProps: 'transform' });
      else tl.fromTo(parts, { y: 0, yPercent: type === 'words' ? 100 : 110, opacity: 0 }, { y: 0, yPercent: 0, opacity: 1, duration: type === 'words' ? 0.9 : 0.8, ease: X, stagger: st, clearProps: 'transform' });
    } else if (type === 'scan' && !kids) {
      scanReveal(el, tl);
    } else if (type === 'scramble' && !kids) {
      tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
      tl.add(function () { SITE.scramble(el, { duration: 0.8 }); }, 0);
    } else {
      var ea = stg != null ? stg : 0.08;
      var stag = targets.length > 1 ? { each: ea } : 0;
      if (type === 'slot') {
        tl.fromTo(targets, { y: 40, scale: 0.94 }, { y: 0, scale: 1, duration: 0.65, ease: 'back.out(1.7)', stagger: stag }, 0);
        tl.fromTo(targets, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out', stagger: stag }, 0);
      } else if (type === 'clip') {
        tl.fromTo(targets, { clipPath: 'inset(100% 0% 0% 0%)', y: 30, opacity: 1 }, { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1.1, ease: X, stagger: stag, clearProps: 'clipPath' });
      } else if (type === 'scale') {
        tl.fromTo(targets, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.0, ease: X, stagger: stag });
      } else if (type === 'fade') {
        tl.fromTo(targets, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: stag });
      } else {
        tl.fromTo(targets, { y: 48, opacity: 0 }, { y: 0, opacity: 1, duration: 1.0, ease: X, stagger: stag });
      }
    }
    el.classList.add('is-revealed');
    return tl;
  }
  function scanReveal(el, tl) {
    var horiz = el.offsetHeight < 90;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    var laser = mk('span', 'scan-laser' + (horiz ? ' scan-laser--x' : ''), el);
    laser.setAttribute('aria-hidden', 'true');
    var o = { p: 0 };
    tl.fromTo(o, { p: 0 }, {
      p: 1, duration: horiz ? 0.6 : 0.8, ease: 'power2.inOut',
      onUpdate: function () {
        var p = o.p * 100;
        el.style.clipPath = horiz ? 'inset(0 ' + (100 - p) + '% 0 0)' : 'inset(0 0 ' + (100 - p) + '% 0)';
        laser.style.transform = horiz ? 'translateX(' + (el.offsetWidth * o.p - 1) + 'px)' : 'translateY(' + (el.offsetHeight * o.p - 1) + 'px)';
      },
      onComplete: function () { el.style.clipPath = ''; gsap.to(laser, { opacity: 0, duration: 0.25, onComplete: function () { laser.remove(); } }); }
    });
  }
  function onEnterOnce(el, start, fn) {
    if (!ST) { whenReady(fn); return; }
    var done = false, trig;
    var go = function () { if (done) return; done = true; whenReady(fn); if (trig) trig.kill(); };
    trig = ST.create({ trigger: el, start: start || 'top 85%', onEnter: go, onLeave: go, onEnterBack: go });
    if (done) trig.kill();
  }
  SITE.reveal = function (target, opts) {
    opts = opts || {};
    var els = toArr(target), master = gsap.timeline();
    els.forEach(function (el) {
      if (opts.scroll) onEnterOnce(el, opts.start || attr(el, 'data-reveal-start'), function () { playReveal(el, opts); });
      else master.add(playReveal(el, opts), 0);
    });
    return master;
  };
  function setupReveals() {
    qsa('[data-reveal]').forEach(function (el) {
      if (el._revealSetup) return; el._revealSetup = true;
      if (reduced) { el.classList.add('is-revealed'); return; }
      onEnterOnce(el, attr(el, 'data-reveal-start'), function () { playReveal(el); });
    });
  }

  /* ------------------------------------------------------------------
     10. Counters, scramble triggers, parallax, scenes, scan, marquee
     ------------------------------------------------------------------ */
  function setupCounters() {
    qsa('[data-counter]').forEach(function (el) {
      var raw = attr(el, 'data-counter'), target = parseFloat(raw);
      var dc = num(attr(el, 'data-counter-decimals'), 0), pre = attr(el, 'data-counter-prefix') || '', suf = attr(el, 'data-counter-suffix') || '';
      var fmt = function (v) { return pre + Number(v).toLocaleString(SITE.locale, { minimumFractionDigits: dc, maximumFractionDigits: dc }) + suf; };
      if (isNaN(target)) { onEnterOnce(el, 'top 85%', function () { SITE.scramble(el, { duration: 0.9, force: true }); }); return; }
      if (reduced) { el.textContent = fmt(target); return; }
      var o = { v: 0 }; el.textContent = fmt(0);
      var upd = function () { el.textContent = fmt(dc ? o.v : Math.round(o.v)); };
      if (el.hasAttribute('data-counter-scrub') && ST) {
        gsap.to(o, { v: target, ease: 'none', onUpdate: upd, scrollTrigger: { trigger: el, start: 'top 90%', end: 'top 35%', scrub: true } });
      } else {
        onEnterOnce(el, attr(el, 'data-reveal-start') || 'top 85%', function () {
          gsap.to(o, { v: target, duration: 1.6, ease: 'power2.out', delay: num(attr(el, 'data-reveal-delay'), 0), onUpdate: upd, onComplete: function () {
            el.textContent = fmt(target);
            gsap.fromTo(el, { scale: 1.08 }, { scale: 1, duration: 0.5, ease: 'back.out(1.7)' });
          } });
        });
      }
    });
  }
  function scrambleBind(el) {
    var mode = attr(el, 'data-scramble');
    if (el.closest('.brand')) return;
    if (mode === 'reveal') { if (!reduced) onEnterOnce(el, 'top 90%', function () { SITE.scramble(el, { duration: 0.8 }); }); return; }
    if (reduced || isTouch) return;
    var host = el.closest('a,button') || el, busy = false;
    host.addEventListener('pointerenter', function () {
      if (busy) return; busy = true;
      SITE.scramble(el, { duration: 0.5, onComplete: function () { busy = false; } }) || (busy = false);
    });
  }
  function setupParallax() {
    if (reduced || isTouch || !ST) return;
    qsa('[data-speed],[data-speed-x]').forEach(function (el) {
      var sy = num(attr(el, 'data-speed'), 0), sx = num(attr(el, 'data-speed-x'), 0);
      var apply = function (self) { var p = self.progress - 0.5; el.style.translate = (p * sx * vw).toFixed(1) + 'px ' + (p * sy * vh).toFixed(1) + 'px'; };
      ST.create({ trigger: el, start: 'top bottom', end: 'bottom top', onUpdate: apply, onRefresh: apply });
    });
  }
  var activeScene = null;
  function setupScenes() {
    if (!ST) return;
    qsa('[data-scene]').forEach(function (el) {
      var st = function () {
        var o = {};
        var v = attr(el, 'data-scene-intensity'); if (v != null) o.intensity = num(v, 0.6);
        v = attr(el, 'data-scene-cell'); if (v != null) o.cell = num(v, 14);
        v = attr(el, 'data-scene-lens'); if (v != null) o.lens = num(v, 220);
        v = attr(el, 'data-scene-page'); if (v != null) o.page = num(v, pageIndex);
        v = attr(el, 'data-scene-accent'); if (v) o.accent = v;
        return o;
      };
      var on = function () { activeScene = el; whenReady(function () { if (activeScene === el) { bg.setState(st(), 1); SITE.emit('scene', { el: el, active: true }); } }); };
      var off = function () { if (activeScene !== el) return; activeScene = null; bg.reset(1); SITE.emit('scene', { el: el, active: false }); };
      ST.create({ trigger: el, start: 'top center', end: 'bottom center', onEnter: on, onEnterBack: on, onLeave: off, onLeaveBack: off });
    });
    qsa('[data-scan]').forEach(function (el) { onEnterOnce(el, 'top 75%', function () { bg.scan(); }); });
  }
  function setupMarquees() {
    qsa('[data-marquee]').forEach(function (el) {
      var first = el.firstElementChild; if (!first || el._mq) return; el._mq = true;
      if (reduced) return;
      var speed = num(attr(el, 'data-marquee'), 60), dir = el.hasAttribute('data-marquee-reverse') ? 1 : -1;
      var skewOn = attr(el, 'data-marquee-skew') !== '0' && !isTouch;
      var track = mk('div', 'marquee__track');
      el.insertBefore(track, first); track.appendChild(first);
      var unit = 0, x = 0, visible = false;
      var fill = function () {
        while (track.children.length > 1) track.removeChild(track.lastChild);
        unit = first.offsetWidth; if (!unit) return;
        var n = Math.max(2, Math.ceil((el.offsetWidth || vw) / unit) + 1);
        for (var i = 1; i < n; i++) { var c = first.cloneNode(true); c.setAttribute('aria-hidden', 'true'); qsa('[id]', c).forEach(function (e) { e.removeAttribute('id'); }); track.appendChild(c); }
      };
      fill(); SITE.onResize(fill);
      if ('IntersectionObserver' in w) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(el); else visible = true;
      var setX = gsap.quickSetter(track, 'x', 'px'), setSk = gsap.quickSetter(track, 'skewX', 'deg');
      SITE.ticker.add(function (time, dt) {
        if (!visible || !unit) return;
        var v = S.velocity, sp = speed * (1 + Math.abs(v) * 4);
        x += dir * S.direction * sp * (Math.min(dt, 50) / 1000);
        x = ((x % unit) + unit) % unit - unit;
        setX(x); if (skewOn) setSk(clamp(-v * 4, -4, 4));
      });
    });
  }

  /* ------------------------------------------------------------------
     11. Magnetic, tilt, proximity
     ------------------------------------------------------------------ */
  SITE.magnetic = function (el, strength) {
    if (!el || !finePointer || reduced) return noop;
    strength = strength || num(attr(el, 'data-magnetic'), 0.35) || 0.35;
    var inner = el.querySelector('[data-magnetic-inner]'), r = null, fx, fy, ix, iy;
    var mkq = function () {
      fx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' }); fy = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
      if (inner) { ix = gsap.quickTo(inner, 'x', { duration: 0.6, ease: 'power3.out' }); iy = gsap.quickTo(inner, 'y', { duration: 0.6, ease: 'power3.out' }); }
    };
    var move = function (e) {
      if (!r) return;
      var dx = e.clientX - r.cx, dy = e.clientY - r.cy;
      if (Math.abs(dx) > r.hw || Math.abs(dy) > r.hh) return release();
      fx(dx * strength); fy(dy * strength);
      if (inner) { ix(dx * strength * 0.6); iy(dy * strength * 0.6); }
    };
    var enter = function () {
      if (r) return;
      var b = el.getBoundingClientRect(), gx = gsap.getProperty(el, 'x'), gy = gsap.getProperty(el, 'y');
      r = { cx: b.left + b.width / 2 - gx, cy: b.top + b.height / 2 - gy, hw: b.width / 2 + 40, hh: b.height / 2 + 40 };
      mkq(); w.addEventListener('pointermove', move, { passive: true });
    };
    var release = function () {
      r = null; w.removeEventListener('pointermove', move);
      gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)', overwrite: true });
      if (inner) gsap.to(inner, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)', overwrite: true });
    };
    el.addEventListener('pointerenter', enter);
    return function () { el.removeEventListener('pointerenter', enter); if (r) release(); };
  };
  SITE.tilt = function (el, max) {
    if (!el || !finePointer || reduced) return noop;
    max = max || num(attr(el, 'data-tilt'), 8) || 8;
    gsap.set(el, { transformPerspective: 1000 });
    var rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3.out' }), ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3.out' });
    var r = null;
    var enter = function () { r = el.getBoundingClientRect(); el.style.setProperty('--tilt-active', '1'); el.style.willChange = 'transform'; };
    var move = function (e) {
      if (!r) enter();
      var px = clamp((e.clientX - r.left) / r.width, 0, 1), py = clamp((e.clientY - r.top) / r.height, 0, 1);
      rx(-(py - 0.5) * 2 * max); ry((px - 0.5) * 2 * max);
      el.style.setProperty('--mx', (px * 100).toFixed(1) + '%'); el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
    };
    var leave = function () {
      r = null; el.style.setProperty('--tilt-active', '0'); el.style.willChange = '';
      gsap.to(el, { rotationX: 0, rotationY: 0, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
      rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3.out' }); ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3.out' });
    };
    el.addEventListener('pointerenter', enter); el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
    return function () { el.removeEventListener('pointerenter', enter); el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); leave(); };
  };

  var prox = [], pointer = { x: -9999, y: -9999, active: false, vx: 0, vy: 0, last: 0 };
  function proxRefresh() {
    prox.forEach(function (p) {
      var s = p.el._split; p.chars = s ? s.chars : [];
      var er = p.el.getBoundingClientRect();
      p.off = p.chars.map(function (c) { var r = c.getBoundingClientRect(); return [r.left - er.left + r.width / 2, r.top - er.top + r.height / 2 - (gsap.getProperty(c, 'y') || 0)]; });
      p.cur = p.chars.map(function () { return 0; });
    });
  }
  function setupProximity() {
    if (reduced) return;
    qsa('[data-proximity]').forEach(function (el) {
      if (!el._split || !el._split.chars.length) split(el, el._splitType || 'chars');
      var f = (attr(el, 'data-proximity-from') || '300,100').split(','), to = (attr(el, 'data-proximity-to') || '800,75').split(',');
      var p = { el: el, w0: num(f[0], 300), d0: num(f[1], 100), w1: num(to[0], 800), d1: num(to[1], 75), vis: true };
      if ('IntersectionObserver' in w) new IntersectionObserver(function (en) { p.vis = en[0].isIntersecting; }).observe(el);
      prox.push(p);
    });
    if (!prox.length) return;
    proxRefresh();
    SITE.on('ready', function () { setTimeout(proxRefresh, 1200); });
    if (ST) ST.addEventListener('refresh', proxRefresh);
    SITE.ticker.add(function (time) {
      for (var k = 0; k < prox.length; k++) {
        var p = prox[k]; if (!p.vis || !p.chars.length) continue;
        var er = null;
        for (var i = 0; i < p.chars.length; i++) {
          var tgt;
          if (isTouch || !pointer.active) tgt = 0.5 + 0.5 * Math.sin(time * 1.2 - i * 0.45);
          else {
            if (!er) er = p.el.getBoundingClientRect();
            var o = p.off[i]; if (!o) continue;
            var dx = pointer.x - (er.left + o[0]), dy = pointer.y - (er.top + o[1]);
            tgt = 1 - smoothstep(0, 260, Math.sqrt(dx * dx + dy * dy));
          }
          var c = p.cur[i] + (tgt - p.cur[i]) * 0.14;
          if (Math.abs(c - p.cur[i]) > 0.002 || (tgt === 0 && c !== 0 && c < 0.002)) {
            if (c < 0.002 && tgt === 0) c = 0;
            p.cur[i] = c;
            var ch = p.chars[i];
            ch.style.setProperty('--w', (p.w0 + (p.w1 - p.w0) * c).toFixed(0));
            ch.style.setProperty('--wd', (p.d0 + (p.d1 - p.d0) * c).toFixed(1));
          }
        }
      }
    });
  }

  /* ------------------------------------------------------------------
     12. Cursor — "the Scanner"
     ------------------------------------------------------------------ */
  var cursor = { el: qs('#cursor') || qs('.cursor'), state: 'default', forced: null, text: '' };
  SITE.cursor = {
    el: cursor.el,
    set: function (s, txt) { cursor.forced = s || 'default'; cursor.forcedText = txt; applyCursor(); },
    reset: function () { cursor.forced = null; cursor.forcedText = null; applyCursor(); },
    hide: function () { cursor.hidden = true; if (cursor.el) cursor.el.style.visibility = 'hidden'; },
    show: function () { cursor.hidden = false; if (cursor.el) cursor.el.style.visibility = ''; }
  };
  var CUR_SEL = '[data-cursor], input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=submit]):not([type=button]), textarea, [contenteditable="true"]';
  var hov = { el: null, rect: null, sy: 0, gx: 0, gy: 0 };
  function hoverState(el) {
    if (!el) return { s: 'default' };
    var s = attr(el, 'data-cursor') || 'text';
    return { s: s, text: attr(el, 'data-cursor-text') };
  }
  function measureHover() {
    if (!hov.el) return;
    var r = hov.el.getBoundingClientRect();
    hov.rect = { l: r.left, t: r.top, w: r.width, h: r.height }; hov.sy = S.y;
    hov.gx = gsap.getProperty(hov.el, 'x') || 0; hov.gy = gsap.getProperty(hov.el, 'y') || 0;
  }
  var applyCursor = noop;
  function initCursor() {
    var el = cursor.el;
    if (!el || !finePointer) { if (el) el.style.display = 'none'; return; }
    cl.add('has-cursor');
    var ret = qs('.cursor__reticle', el), corners = ret ? qsa('i', ret) : [], dot = qs('.cursor__dot', el), label = qs('.cursor__label', el), coords = qs('.cursor__coords', el);
    var beam = qs('.cursor__beam', el) || mk('div', 'cursor__beam', el);
    var setDot = [gsap.quickSetter(dot, 'x', 'px'), gsap.quickSetter(dot, 'y', 'px')];
    var setLab = label ? [gsap.quickSetter(label, 'x', 'px'), gsap.quickSetter(label, 'y', 'px'), gsap.quickSetter(label, 'scaleX')] : null;
    var setBeam = [gsap.quickSetter(beam, 'x', 'px'), gsap.quickSetter(beam, 'y', 'px')];
    var setCo = coords ? [gsap.quickSetter(coords, 'x', 'px'), gsap.quickSetter(coords, 'y', 'px')] : null;
    var box = { x: -100, y: -100, w: 36, h: 36 }, lab = { x: -100, y: -100 }, pressed = false, lastCo = '', svx = 0;
    var cur = 'default';
    applyCursor = function () {
      var hs = hoverState(hov.el);
      var s = cursor.forced || hs.s, txt = cursor.forced ? cursor.forcedText : hs.text;
      if (s === 'link' && !cursor.forced && hov.rect && hov.rect.w > 400) s = 'hover';
      if (s === 'link' && cursor.forced && !hov.el) s = 'hover';
      if (s === cur && txt === cursor.text) return;
      cur = s; cursor.state = s; cursor.text = txt;
      el.className = 'cursor is-visible is-' + s;
      var chip = s === 'view' || s === 'drag';
      if (label) {
        if (chip) label.textContent = s === 'drag' ? '← ' + (txt || t('cursor.drag')) + ' →' : (txt || t('cursor.view'));
        gsap.to(label, chip ? { scale: 1, duration: 0.5, ease: 'back.out(1.7)', overwrite: 'auto' } : { scale: 0, duration: 0.3, ease: 'power3.out', overwrite: 'auto' });
      }
      gsap.to(dot, { scale: s === 'default' ? 1 : s === 'hover' ? 0.6 : 0, duration: 0.3, ease: 'power3.out', overwrite: 'auto' });
      gsap.to(beam, { scale: s === 'text' ? 1 : 0, duration: 0.3, ease: 'power3.out', overwrite: 'auto' });
      gsap.to(ret, { opacity: chip || s === 'hide' || s === 'text' ? 0 : 1, duration: 0.25, overwrite: 'auto' });
      if (!cursor.hidden) gsap.to(el, { opacity: s === 'hide' ? 0 : 1, duration: 0.25, overwrite: 'auto' });
    };
    w.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      if (!pointer.active) { pointer.active = true; box.x = lab.x = e.clientX; box.y = lab.y = e.clientY; el.classList.add('is-visible'); }
      pointer.vx = e.clientX - pointer.x; pointer.vy = e.clientY - pointer.y;
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.last = performance.now();
    }, { passive: true });
    d.addEventListener('pointerover', function (e) {
      var tgt = e.target && e.target.closest ? e.target.closest(CUR_SEL) : null;
      if (tgt === hov.el) return;
      hov.el = tgt; hov.rect = null;
      if (tgt) measureHover();
      applyCursor();
    });
    d.documentElement.addEventListener('pointerleave', function () { pointer.active = false; el.classList.remove('is-visible'); });
    w.addEventListener('pointerdown', function () { pressed = true; });
    w.addEventListener('pointerup', function () { pressed = false; });
    w.addEventListener('blur', function () { pressed = false; });
    SITE.ticker.add(function (time, dt) {
      if (!pointer.active) return;
      var k = dt / 16.667, a = 1 - Math.pow(1 - 0.18, k), as = 1 - Math.pow(1 - 0.2, k);
      var x = pointer.x, y = pointer.y, tx = x, ty = y, tw = 36, th = 36;
      if (hov.el && !hov.el.isConnected) { hov.el = null; applyCursor(); }
      if (cur === 'link' && hov.el) {
        if (Math.abs(S.y - hov.sy) > 0.5) measureHover();
        var r = hov.rect, ox = (gsap.getProperty(hov.el, 'x') || 0) - hov.gx, oy = (gsap.getProperty(hov.el, 'y') || 0) - hov.gy;
        tx = r.l + r.w / 2 + ox; ty = r.t + r.h / 2 + oy; tw = r.w + 12; th = r.h + 12;
      } else if (cur === 'hover') { tw = th = 54; }
      else if (cur === 'default') { var br = reduced ? 0 : Math.sin(time * Math.PI * 2 / 1.6) * 2; tw = th = (pressed ? 24 : 36) + br * 2; }
      else { tw = th = 0; }
      if (pressed && cur === 'link') { tw *= 0.92; th *= 0.92; }
      box.x += (tx - box.x) * a; box.y += (ty - box.y) * a;
      box.w += (tw - box.w) * (pressed ? Math.min(1, as * 2) : as); box.h += (th - box.h) * (pressed ? Math.min(1, as * 2) : as);
      var hw = box.w / 2, hh = box.h / 2;
      if (corners.length === 4) {
        corners[0].style.transform = 'translate3d(' + (box.x - hw).toFixed(1) + 'px,' + (box.y - hh).toFixed(1) + 'px,0)';
        corners[1].style.transform = 'translate3d(' + (box.x + hw).toFixed(1) + 'px,' + (box.y - hh).toFixed(1) + 'px,0)';
        corners[2].style.transform = 'translate3d(' + (box.x - hw).toFixed(1) + 'px,' + (box.y + hh).toFixed(1) + 'px,0)';
        corners[3].style.transform = 'translate3d(' + (box.x + hw).toFixed(1) + 'px,' + (box.y + hh).toFixed(1) + 'px,0)';
      }
      setDot[0](x); setDot[1](y); setBeam[0](x); setBeam[1](y);
      if (setLab) {
        lab.x += (x - lab.x) * Math.min(1, a * 1.4); lab.y += (y - lab.y) * Math.min(1, a * 1.4);
        svx += (pointer.vx - svx) * 0.2; pointer.vx *= 0.8;
        setLab[0](lab.x); setLab[1](lab.y);
        if (cur === 'drag') setLab[2](1 + Math.min(Math.abs(svx) / 40, 0.6));
        else if (cur === 'view') setLab[2](1);
      }
      if (setCo) {
        setCo[0](x); setCo[1](y);
        var co = 'X ' + pad(x, 4) + ' · Y ' + pad(y + S.y, 4);
        if (co !== lastCo) { coords.textContent = co; lastCo = co; }
      }
    });
    SITE.on('menu:open', function () { hov.el = null; applyCursor(); });
    SITE.on('menu:close', function () { hov.el = null; applyCursor(); });
  }

  /* ------------------------------------------------------------------
     13. WebGL background — "The Quantized Field"
     ------------------------------------------------------------------ */
  function hexToRGB(s) {
    s = String(s || '').trim();
    var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
    if (m) { var h = m[1]; if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; var n = parseInt(h, 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
    m = /rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/i.exec(s);
    if (m) return [m[1] / 255, m[2] / 255, m[3] / 255];
    return null;
  }
  SITE.color = function (name) {
    try { var v = getComputedStyle(body).getPropertyValue(name).trim(); if (v) return v; } catch (e) {}
    return FALLBACK[name] || '';
  };
  function resolveColor(c) {
    if (Array.isArray(c)) return c;
    if (ACCENTS[c]) c = ACCENTS[c];
    if (typeof c === 'string' && c.indexOf('--') === 0) c = SITE.color(c) || FALLBACK[c];
    return hexToRGB(c) || [1, 0.29, 0.11];
  }

  var FRAG = [
    'uniform float uTime,uMouseVel,uScroll,uScrollY,uVelocity,uPage,uIntensity,uCell,uLensRadius,uScan,uScanDir,uReveal,uPulse,uDpr,uIdle;',
    'uniform vec2 uResolution,uMouse;',
    'uniform vec3 uColorBg,uColorA,uAccent;',
    'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);',
    ' return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}',
    'float b2(vec2 a){a=floor(a);return fract(dot(a,vec2(.5,a.y*.75)));}',
    'float bayer(vec2 a){return b2(.5*a)*.25+b2(a);}',
    'float glyph(vec2 lp,vec2 cs,float g){',
    ' vec2 a=abs(lp);float k=cs.y/cs.x;float s=cs.x;float h=floor(s*.32);',
    ' if(g<.5)return 0.;',
    ' if(g<1.5)return step(a.x,1.)*step(a.y,k);',
    ' if(g<2.5)return max(step(a.x,.6)*step(a.y,s*.3*k),step(a.y,.6*k)*step(a.x,s*.3));',
    ' float o=step(a.x,h)*step(a.y,h*k);',
    ' if(g<3.5)return o*(1.-step(a.x,h-1.)*step(a.y,(h-1.)*k));',
    ' return o;}',
    'void main(){',
    ' float D=uDpr;vec2 res=uResolution*D;',
    ' vec2 p=gl_FragCoord.xy;p.y=res.y-p.y;',
    ' vec2 mo=uMouse*D;float R=uLensRadius*D;',
    ' float md=length(p-mo);',
    ' float lens=R>0.?1.-step(R,md):0.;',
    ' float cell=max(3.,floor(uCell*D*(lens>.5?.5:1.)+.5));',
    ' float stretch=1.+abs(uVelocity)*5.;',
    ' vec2 cs=vec2(cell,floor(cell*stretch+.5));',
    ' float sy=uScrollY*.3*D;',
    ' vec2 q=p+vec2(0.,sy);',
    ' vec2 id=floor(q/cs);',
    ' vec2 lp=(fract(q/cs)-.5)*cs;',
    ' vec2 cc=(id+.5)*cs-vec2(0.,sy);',
    ' vec2 dir=cc-mo;float dl=length(dir)+.001;',
    ' float push=R>0.?(1.-smoothstep(0.,R*1.4,dl))*(14.+uMouseVel*50.)*D:0.;',
    ' vec2 wc=((id+.5)*cs+dir/dl*push)/(300.*D);',
    ' float t=uTime;',
    ' vec2 wq=wc+vec2(t*.012,-t*.008);',
    ' float v=fbm(wq+.9*vec2(noise(wq*1.3+t*.02),noise(wq*1.3+7.1-t*.015)));',
    ' float L=0.,acc=0.;',
    ' float w0=1.-clamp(abs(uPage),0.,1.),w1=1.-clamp(abs(uPage-1.),0.,1.),w2=1.-clamp(abs(uPage-2.),0.,1.),w3=1.-clamp(abs(uPage-3.),0.,1.),w4=1.-clamp(abs(uPage-4.),0.,1.);',
    ' if(w0>0.){float k=fract(v*7.);float iso=1.-smoothstep(0.,.09,min(k,1.-k));L+=w0*(iso*.85+v*.18);}',
    ' if(w1>0.){float s=fbm(vec2(wc.x*.35+t*.01,wc.y*3.2+uScroll*3.)+v*.3);float b=fract(s*5.);float band=smoothstep(.15,.5,b)*(1.-smoothstep(.55,.9,b));L+=w1*(band*.75+s*.15);}',
    ' if(w2>0.){float h=hash(id+3.1);float tw=step(.955,h)*(.55+.45*sin(t*(1.+h*4.)+h*50.));L+=w2*(tw+v*.12);acc+=w2*step(.993,h)*tw;}',
    ' if(w3>0.){vec2 bay=floor(id/vec2(4.,8.));vec2 bl=id-bay*vec2(4.,8.);float hb=hash(bay+.7);',
    '  float lv=.5+.42*sin(t*(.15+hb*.25)+hb*6.283);float fill=step(7.-bl.y+.5,lv*8.);',
    '  float edge=(bl.x<.5||bl.y<.5)?1.:0.;float crit=step(.965,hash(bay+floor(t*.25)));',
    '  L+=w3*(edge>.5?.22:fill*.62+.06);acc+=w3*crit*fill*(1.-edge)*(.6+.4*sin(t*6.));}',
    ' if(w4>0.){vec2 src=mix(mo,res*.5,uIdle);float dd=length(cc-src)/D;float wv=smoothstep(.72,1.,sin(dd*.045-t*2.2))*(1.-smoothstep(0.,900.,dd));',
    '  float d2=length(cc-res*.5)/D;float wv2=smoothstep(.85,1.,sin(d2*.03-t*1.4))*.45;L+=w4*(wv*.8+wv2+v*.15);}',
    ' float rare=step(.982,hash(id*1.7+11.))*smoothstep(.5,.7,v);',
    ' L=clamp(L*(.55+uIntensity*.75)+uPulse*.3+lens*.04,0.,1.);',
    ' float g=floor(clamp(L*4.2+(bayer(id)-.5)*.9,0.,4.));',
    ' g=max(g,step(hash(id+.37),uReveal)*4.);',
    ' float m=glyph(lp,cs,g);',
    ' float lb=lens*(1.-uIdle*.6);float bright=(.7+uIntensity*.6)*(1.+lb*.55)*(1.+uPulse*1.2);',
    ' vec3 mc=mix(uColorA,uAccent*.55,lb*.3)*bright;',
    ' vec3 col=mix(uColorBg,mc,m);',
    ' float am=clamp(acc+rare*.6,0.,1.);',
    ' if(am>0.){float sh=abs(uVelocity)*2.*D;float gg=max(g,3.);',
    '  vec3 ac=uAccent*vec3(glyph(lp+vec2(sh,0.),cs,gg),glyph(lp,cs,gg),glyph(lp-vec2(sh,0.),cs,gg));',
    '  col+=ac*am*(.28+.3*uIntensity)*(1.+uPulse);}',
    ' if(R>0.){col+=uAccent*(1.-smoothstep(0.,1.2,abs(md-R)))*.3;}',
    ' if(uScan>=0.){float ys=uScan*res.y;float dy=(p.y-ys)*uScanDir;',
    '  float ln=1.-smoothstep(0.,1.5*D,abs(p.y-ys));float tr=dy<0.?exp(dy/(22.*D)):0.;',
    '  col+=uAccent*(ln*.9+tr*.1)+uAccent*m*tr*.6;}',
    ' float sl=.5+.5*sin(p.y/D*2.0944);',
    ' col*=1.-w2*.2*sl-.03*sl;',
    ' vec2 uv=p/res-.5;float vig=1.-dot(uv,uv)*(.55+w2*.7);',
    ' col=mix(uColorBg,col,clamp(vig,0.,1.));',
    ' gl_FragColor=vec4(col,1.);',
    '}'
  ].join('\n');
  var VERT = 'void main(){gl_Position=vec4(position.xy,0.,1.);}';

  var bg = SITE.bg = { enabled: false, uniforms: {}, setState: noop, reset: noop, scan: noop, pulse: noop, render: noop };
  function initBG() {
    var canvas = qs('#bg-canvas');
    var fail = function () { cl.add('no-webgl'); cl.remove('has-webgl'); bg.enabled = false; glReady = true; };
    if (!canvas || !THREE) return fail();
    var renderer;
    try {
      var probe = d.createElement('canvas');
      if (!(probe.getContext('webgl2') || probe.getContext('webgl') || probe.getContext('experimental-webgl'))) return fail();
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' });
    } catch (e) { return fail(); }
    var small = isTouch || vw < 768;
    var defaults = function () {
      return { page: pageIndex, intensity: 0.6, cell: small ? 20 : 14, lens: (isTouch || reduced) ? 0 : 220, accent: PAGES[pageIndex].accent, reveal: 0 };
    };
    var V3 = function (c) { c = resolveColor(c); return new THREE.Vector3(c[0], c[1], c[2]); };
    var df = defaults();
    var U = {
      uTime: { value: rand(0, 100) }, uResolution: { value: new THREE.Vector2(vw, vh) }, uMouse: { value: new THREE.Vector2(vw / 2, vh / 2) },
      uMouseVel: { value: 0 }, uScroll: { value: 0 }, uScrollY: { value: 0 }, uVelocity: { value: 0 }, uPage: { value: df.page },
      uColorBg: { value: V3('--c-ink') }, uColorA: { value: V3('--c-ink-4') }, uAccent: { value: V3(df.accent) },
      uIntensity: { value: df.intensity }, uCell: { value: df.cell }, uLensRadius: { value: df.lens }, uScan: { value: -1 }, uScanDir: { value: 1 },
      uReveal: { value: cl.contains('is-entering') ? 1 : 0 }, uPulse: { value: 0 }, uDpr: { value: 1 }, uIdle: { value: isTouch ? 1 : 0 }
    };
    var mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false });
    var scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    var size = function () {
      var sc = (isTouch || w.innerWidth < 768) ? 0.5 : 0.75;
      var pr = Math.min(w.devicePixelRatio || 1, 1.5) * sc;
      renderer.setPixelRatio(pr); renderer.setSize(w.innerWidth, w.innerHeight, false);
      U.uDpr.value = renderer.getPixelRatio(); U.uResolution.value.set(w.innerWidth, w.innerHeight);
    };
    size();
    var lastH = w.innerHeight;
    w.addEventListener('resize', debounce(function () {
      if (isTouch && w.innerWidth === U.uResolution.value.x && Math.abs(w.innerHeight - lastH) < 160) return;
      lastH = w.innerHeight; size(); renderOnce();
    }, 120));
    var lost = false;
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); lost = true; fail(); }, false);
    var draw = function () { if (lost) return; try { renderer.render(scene, cam); } catch (e) { lost = true; fail(); } };
    var renderOnce = function () { if (reduced && bg.enabled) draw(); };
    try { draw(); } catch (e) { return fail(); }
    var info = renderer.info && renderer.info.programs;
    if (info && info[0] && info[0].diagnostics && info[0].diagnostics.runnable === false) return fail();
    bg.enabled = true; glReady = true; cl.add('has-webgl'); cl.remove('no-webgl');
    bg.uniforms = U; bg.render = draw;

    var tw = function (obj, prop, val, dur) { gsap.to(obj, { [prop]: val, duration: dur, ease: 'power3.inOut', overwrite: 'auto', onUpdate: reduced ? draw : null }); };
    bg.setState = function (s, dur) {
      if (!bg.enabled || !s) return;
      dur = reduced ? 0 : (dur == null ? 1 : dur);
      if (s.page != null) tw(U.uPage, 'value', clamp(+s.page, 0, 4), dur);
      if (s.intensity != null) tw(U.uIntensity, 'value', clamp(+s.intensity, 0, 1), dur);
      if (s.cell != null) tw(U.uCell, 'value', Math.max(isTouch ? 16 : 6, +s.cell), dur);
      if (s.lens != null) tw(U.uLensRadius, 'value', (isTouch || reduced) ? 0 : Math.max(0, +s.lens), dur);
      if (s.reveal != null) tw(U.uReveal, 'value', clamp(+s.reveal, 0, 1), dur);
      if (s.accent != null) { var c = resolveColor(s.accent); gsap.to(U.uAccent.value, { x: c[0], y: c[1], z: c[2], duration: dur, ease: 'power2.inOut', overwrite: 'auto' }); }
      if (reduced) setTimeout(draw, 0);
    };
    bg.reset = function (dur) { bg.setState(defaults(), dur == null ? 1 : dur); };
    bg.scan = function (o) {
      if (reduced) return;
      o = o || {}; var up = o.direction === 'up';
      U.uScanDir.value = up ? -1 : 1;
      gsap.fromTo(U.uScan, { value: up ? 1.02 : -0.02 }, { value: up ? -0.02 : 1.02, duration: o.duration || 1.2, ease: 'power2.inOut', overwrite: true, onComplete: function () { U.uScan.value = -1; } });
    };
    bg.pulse = function (str) {
      if (reduced) return;
      gsap.timeline({ overwrite: true }).to(U.uPulse, { value: str == null ? 1 : str, duration: 0.12, ease: 'power2.out' }).to(U.uPulse, { value: 0, duration: 0.4, ease: 'power2.in' });
    };

    var last = 0, mx = vw / 2, my = vh / 2, mvel = 0;
    SITE.ticker.add(function (time, dt) {
      if (lost) return;
      var now = time * 1000;
      if (reduced) return;
      if (now - last < (isTouch ? 32 : 15)) return;
      last = now;
      U.uTime.value += Math.min(dt, 64) / 1000;
      if (pointer.active) {
        mx += (pointer.x - mx) * 0.12; my += (pointer.y - my) * 0.12;
        var sp = Math.hypot(pointer.x - mx, pointer.y - my);
        mvel += (clamp(sp / 120, 0, 1) - mvel) * 0.08;
      } else mvel *= 0.95;
      U.uMouse.value.set(mx, my); U.uMouseVel.value = mvel;
      var idle = (!pointer.active || performance.now() - pointer.last > 3000) ? 1 : 0;
      U.uIdle.value += (idle - U.uIdle.value) * 0.03;
      U.uScroll.value = S.progress; U.uScrollY.value = S.y; U.uVelocity.value = isTouch ? 0 : S.velocity;
      draw();
    });
  }
  var glReady = false;

  /* ------------------------------------------------------------------
     14. Overlays: cells, grid overlay, sprite, toasts
     ------------------------------------------------------------------ */
  var grids = {};
  function gridDims() { return vw <= 768 ? [4, 6] : [8, 5]; }
  function buildCells(container, key) {
    if (!container) return null;
    var dm = gridDims();
    container.innerHTML = '';
    container.style.setProperty('--cols', dm[0]); container.style.setProperty('--rows', dm[1]);
    for (var i = 0; i < dm[0] * dm[1]; i++) mk('i', '', container);
    grids[key] = { el: container, cols: dm[0], rows: dm[1], cells: qsa('i', container) };
    return grids[key];
  }
  function cellIndexAt(g, x, y) {
    var c = clamp(Math.floor(x / vw * g.cols), 0, g.cols - 1), r = clamp(Math.floor(y / vh * g.rows), 0, g.rows - 1);
    return r * g.cols + c;
  }
  function buildGridOverlay() {
    var g = qs('.grid-overlay'); if (!g || g.children.length) return;
    for (var i = 0; i < 12; i++) mk('i', '', g);
  }
  var ICONS = {
    'i-arrow': '<path d="M4 12h15M13 6l6 6-6 6"/>',
    'i-arrow-ur': '<path d="M7 17L17 7M8 7h9v9"/>',
    'i-plus': '<path d="M12 4v16M4 12h16"/>',
    'i-close': '<path d="M6 6l12 12M18 6L6 18"/>',
    'i-copy': '<path d="M8 8h12v12H8z"/><path d="M16 8V4H4v12h4"/>',
    'i-check': '<path d="M4 12.5l5 5L20 6.5"/>',
    'i-barcode': '<path d="M3 5v14M6 5v14M8 5v14M11 5v14M14 5v14M15.5 5v14M18 5v14M21 5v14"/>',
    'i-box': '<path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5l9 4.5 9-4.5M12 12v9"/>',
    'i-alert': '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 17.5v1"/>',
    'i-gamepad': '<path d="M3 8h18v10H3z"/><path d="M7 11v4M5 13h4M15 12h1M18 14h1"/>',
    'i-github': '<path d="M9 19c-4 1.5-4-2-6-2.5M15 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6.2 0C6.6 2.8 5.6 3.1 5.6 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.2 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
    'i-linkedin': '<path d="M3 3h18v18H3z"/><path d="M8 10v7M8 7v.5M12 17v-7M12 13c0-2 1-3 2.5-3S17 11 17 13v4"/>',
    'i-itch': '<path d="M4 4h16l2 5c0 1.5-1.2 2.5-2.5 2.5S17 10.5 17 9c0 1.5-1.2 2.5-2.5 2.5S12 10.5 12 9c0 1.5-1.2 2.5-2.5 2.5S7 10.5 7 9c0 1.5-1.2 2.5-2.5 2.5S2 10.5 2 9z"/><path d="M4 11v9h16v-9M10 15l2 2 2-2"/>',
    'i-mail': '<path d="M3 5h18v14H3z"/><path d="M3 6l9 7 9-7"/>',
    'i-globe': '<path d="M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18z"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>'
  };
  function buildSprite() {
    var sp = qs('svg.sprite');
    if (!sp) { sp = d.createElementNS('http://www.w3.org/2000/svg', 'svg'); sp.setAttribute('class', 'sprite'); sp.setAttribute('aria-hidden', 'true'); sp.setAttribute('width', '0'); sp.setAttribute('height', '0'); sp.style.position = 'absolute'; body.insertBefore(sp, body.firstChild); }
    var markup = '';
    Object.keys(ICONS).forEach(function (id) { if (!d.getElementById(id)) markup += '<symbol id="' + id + '" viewBox="0 0 24 24">' + ICONS[id] + '</symbol>'; });
    if (!markup) return;
    var doc = new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">' + markup + '</svg>', 'image/svg+xml');
    Array.prototype.slice.call(doc.documentElement.childNodes).forEach(function (n) { sp.appendChild(d.importNode(n, true)); });
  }

  var toastRegion = null;
  SITE.toast = function (text, opts) {
    opts = opts || {};
    if (!toastRegion) { toastRegion = qs('#toasts') || mk('div', 'toasts', body); toastRegion.setAttribute('aria-live', 'polite'); }
    var type = /^(ok|warn|critical|info)$/.test(opts.type) ? opts.type : 'info';
    var el = mk('div', 'toast toast--' + type);
    el.setAttribute('role', 'status');
    mk('span', 'toast__label', el).textContent = opts.label || t('toast.label.' + type);
    mk('span', 'toast__text', el).textContent = text;
    toastRegion.appendChild(el);
    var all = toastRegion.querySelectorAll('.toast'); if (all.length > 3) all[0].remove();
    var kill = function () { if (!el.isConnected) return; gsap.to(el, { x: -30, opacity: 0, duration: 0.4, ease: 'power3.in', onComplete: function () { el.remove(); } }); };
    if (reduced) gsap.set(el, { opacity: 1 });
    else gsap.fromTo(el, { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.7)' });
    gsap.delayedCall((opts.duration || 2600) / 1000, kill);
    return { el: el, close: kill };
  };

  /* ------------------------------------------------------------------
     15. Page transitions — "Slot swap"
     ------------------------------------------------------------------ */
  var tEl = qs('#transition') || qs('.transition');
  var T = SITE.transition = { isActive: false, go: noop };
  function setLabel(info, overrideTitle, overrideSlot) {
    if (!tEl) return;
    var slot = qs('.transition__slot', tEl), title = qs('.transition__title', tEl), sku = qs('.transition__sku', tEl);
    var p = info >= 0 ? PAGES[info] : null;
    if (slot) slot.textContent = overrideSlot != null ? overrideSlot : p ? t('transition.slot') + ' ' + p.slot + '/05' : '';
    if (title) title.textContent = overrideTitle != null ? overrideTitle : p ? t(p.title) : '';
    if (sku) { sku.textContent = p && overrideTitle == null ? p.sku + ' · ' + t('rarity.' + p.rarity) : ''; sku.style.display = sku.textContent ? '' : 'none'; }
    if (p) tEl.style.setProperty('--t-accent', 'var(' + ACCENTS[p.accent] + ')');
    return title;
  }
  T.go = function (href, opts) {
    if (T.isActive || !href) return;
    opts = opts || {};
    var dest = opts.raw ? href : withLang(href);
    var idx = pageOf(dest);
    T.isActive = true;
    SITE.emit('transition:start', { href: dest, page: idx >= 0 ? PAGES[idx].key : null });
    lock('transition');
    cl.add('is-transitioning');
    store.session('inv-transition', { from: pageKey, to: idx >= 0 ? PAGES[idx].key : dest, t: Date.now() });
    var nav = function () { if (opts.replace) w.location.replace(dest); else w.location.href = dest; };
    if (!tEl) { nav(); return; }
    tEl.classList.add('is-active');
    var title = setLabel(idx, opts.label, opts.slotLabel);
    var lab = qs('.transition__label', tEl);
    if (reduced) { if (lab) gsap.set(lab, { opacity: 1 }); setTimeout(nav, 320); return; }
    var g = grids.transition || buildCells(qs('.transition__cells', tEl), 'transition');
    tEl.classList.add('has-cells');
    var from = opts.from || { x: vw / 2, y: vh / 2 };
    var tl = gsap.timeline({ onComplete: nav });
    tl.fromTo(g.cells, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.9, ease: 'power4.inOut', stagger: { grid: [g.rows, g.cols], from: cellIndexAt(g, from.x, from.y), amount: 0.45 } }, 0);
    if (lab) tl.fromTo(lab, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, 0.5);
    tl.add(function () { if (title) SITE.scramble(title, { duration: 0.5 }); }, 0.5);
    tl.to({}, { duration: 0.15 });
    if (bg.enabled) bg.setState({ page: idx >= 0 ? idx : pageIndex, reveal: 1, accent: idx >= 0 ? PAGES[idx].accent : PAGES[pageIndex].accent }, 0.9);
    setTimeout(function () { if (T.isActive && d.visibilityState === 'visible') nav(); }, 4000);
  };
  function resetTransition() {
    T.isActive = false; cl.remove('is-transitioning', 'is-entering');
    if (tEl) { tEl.classList.remove('is-active', 'is-leaving'); var g = grids.transition; if (g) gsap.set(g.cells, { scale: 0 }); var lab = qs('.transition__label', tEl); if (lab) gsap.set(lab, { opacity: 0 }); }
    unlock('transition'); bg.setState({ reveal: 0 }, 0); bg.reset(0);
  }
  function playEnter(done) {
    var data = store.session('inv-transition'); store.session('inv-transition', null);
    lock('transition');
    if (!tEl) { cl.remove('is-entering'); unlock('transition'); done(); return; }
    var lab = qs('.transition__label', tEl);
    var title = setLabel(pageIndex, null);
    var finish = function () { cl.remove('is-entering'); tEl.classList.remove('is-active', 'is-leaving'); unlock('transition'); };
    if (reduced) {
      tEl.classList.add('is-active'); cl.remove('is-entering');
      requestAnimationFrame(function () { tEl.classList.add('is-leaving'); });
      setTimeout(function () { finish(); }, 330); done(); return;
    }
    var g = grids.transition;
    tEl.classList.add('has-cells');
    gsap.set(g.cells, { scaleX: 1, scaleY: 1, transformOrigin: '50% 0%' });
    var go = qs('.grid-overlay');
    var tl = gsap.timeline({ onComplete: finish });
    if (go) tl.fromTo(go, { opacity: 0 }, { opacity: 0.6, duration: 0.3, yoyo: true, repeat: 1, ease: 'power1.inOut', clearProps: 'opacity' }, 0);
    if (lab) { tl.fromTo(lab, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' }, 0); tl.to(lab, { opacity: 0, y: -16, duration: 0.35, ease: 'power3.in' }, 0.55); }
    tl.add(function () { if (title) SITE.scramble(title, { duration: 0.45 }); }, 0);
    tl.to(g.cells, { scaleY: 0, duration: 0.9, ease: 'power4.inOut', stagger: { grid: [g.rows, g.cols], from: 'center', amount: 0.45 } }, 0.6);
    tl.add(function () { bg.setState({ reveal: 0 }, 0.9); bg.scan(); }, 0.6);
    tl.add(done, 0.6 + 0.65);
  }

  /* ------------------------------------------------------------------
     16. Preloader — barcode
     ------------------------------------------------------------------ */
  function barcodeBars(str, total) {
    var units = [], s = String(str).toUpperCase();
    units.push([1, 1], [1, 1]);
    for (var i = 0; i < s.length; i++) {
      var h = hash(s[i] + i * 7);
      for (var b = 0; b < 4; b++) units.push([(h >> (b * 2) & 1) ? 2.4 : 1, (h >> (b * 2 + 1) & 1) ? 2 : 1]);
    }
    units.push([1, 1], [1, 0]);
    var sum = units.reduce(function (a, u) { return a + u[0] + u[1]; }, 0), k = total / sum, x = 0;
    return units.map(function (u) { var r = { x: x, w: u[0] * k }; x += (u[0] + u[1]) * k; return r; });
  }
  SITE.barcode = barcodeBars;
  function runPreloader(fontsP, setupP, done) {
    var pre = qs('#preloader') || qs('.preloader');
    var finishFast = function () { if (pre) { gsap.to(pre, { opacity: 0, duration: 0.35, onComplete: function () { pre.classList.add('is-done'); } }); } unlock('preloader'); done(); };
    store.session('inv-visited', 1);
    if (!pre) { done(); return; }
    lock('preloader');
    var svg = qs('.preloader__barcode', pre), numEl = qs('.preloader__num', pre), items = qsa('.preloader__list li', pre);
    var top = qs('.preloader__top', pre), list = qs('.preloader__list', pre), count = qs('.preloader__count', pre);
    if (reduced) { if (numEl) numEl.textContent = '100'; setupP.then(function () { setTimeout(finishFast, 400); }); return; }
    var cols = mk('div', 'preloader__cols'); pre.insertBefore(cols, pre.firstChild);
    for (var c = 0; c < (vw < 768 ? 6 : 12); c++) mk('i', '', cols);
    var rects = [];
    if (svg) {
      barcodeBars('PLAYER-NAME', 300).forEach(function (b) {
        var r = d.createElementNS('http://www.w3.org/2000/svg', 'rect');
        r.setAttribute('x', b.x.toFixed(2)); r.setAttribute('y', '0'); r.setAttribute('width', b.w.toFixed(2)); r.setAttribute('height', '80');
        svg.appendChild(r); rects.push(r);
      });
      gsap.set(rects, { scaleY: 0, transformOrigin: '50% 100%' });
    }
    var tasks = { fonts: 0, load: d.readyState === 'complete' ? 1 : 0, gl: 0, setup: 0 };
    fontsP.then(function () { tasks.fonts = 1; });
    setupP.then(function () { tasks.setup = 1; });
    if (!tasks.load) w.addEventListener('load', function () { tasks.load = 1; });
    var t0 = performance.now(), shown = 0, nb = 0, ni = 0, finished = false;
    var TH = [0.12, 0.3, 0.5, 0.7, 0.88];
    var tick = function () {
      tasks.gl = glReady ? 1 : 0;
      var el = performance.now() - t0;
      var real = (tasks.fonts + tasks.load + tasks.gl + tasks.setup) / 4;
      var target = Math.min(real, el / 1800);
      if (el > 4000 && tasks.setup) target = 1;
      shown = Math.min(1, shown + Math.max(0, target - shown) * 0.1 + (target > shown ? 0.002 : 0));
      if (target >= 1 && shown > 0.995) shown = 1;
      if (numEl) numEl.textContent = pad(shown * 100, 3);
      var want = Math.floor(shown * rects.length);
      while (nb < want) { gsap.to(rects[nb], { scaleY: 1, duration: 0.35, ease: 'expo.out' }); nb++; }
      while (ni < items.length && shown >= TH[ni]) {
        (function (li) {
          li.classList.add('is-on');
          SITE.scramble(li, { duration: 0.5, onComplete: function () { var ok = mk('span', 'preloader__ok'); ok.textContent = '[' + t('preloader.ok') + ']'; li.appendChild(ok); gsap.from(ok, { opacity: 0, x: -6, duration: 0.3 }); } });
        })(items[ni]);
        ni++;
      }
      if (shown >= 1 && !finished) { finished = true; SITE.ticker.remove(tick); exit(); }
    };
    SITE.ticker.add(tick);
    var exit = function () {
      pre.classList.add('is-complete');
      var tl = gsap.timeline({ onComplete: function () { pre.classList.add('is-done'); unlock('preloader'); } });
      var center = qs('.preloader__center', pre);
      if (center && svg) {
        var laser = mk('span', 'scan-laser scan-laser--x', center);
        laser.style.height = svg.getBoundingClientRect().height + 'px';
        tl.fromTo(laser, { x: 0, opacity: 1 }, { x: svg.getBoundingClientRect().width, duration: 0.5, ease: 'power2.inOut' }).to(laser, { opacity: 0, duration: 0.15 });
      }
      tl.to([top, list, count].filter(Boolean), { opacity: 0, y: -10, duration: 0.4, ease: 'power3.in' }, '-=0.1');
      if (svg && rects.length) {
        var sr = svg.getBoundingClientRect(), cy = sr.top + sr.height / 2;
        var f = 2 * Math.max(cy, vh - cy) / Math.max(1, sr.height) * 1.04;
        tl.to(rects, { scaleY: f, transformOrigin: '50% 50%', duration: 1, ease: 'power4.inOut', stagger: { amount: 0.3, from: 'center' } }, '<0.1');
      }
      tl.add(function () { pre.classList.add('is-exiting'); });
      tl.to(qsa('i', cols), { scaleY: 0, duration: 0.9, ease: 'power4.inOut', stagger: { amount: 0.35, from: 'center' } });
      if (svg) tl.to(svg, { opacity: 0, duration: 0.45, ease: 'power2.out' }, '<');
      tl.add(function () { bg.scan(); }, '<0.2');
      tl.add(done, '<' + (0.6 * 1.25).toFixed(2));
    };
  }

  /* ------------------------------------------------------------------
     17. Menu — "Inventory screen"
     ------------------------------------------------------------------ */
  var menuEl = qs('#menu') || qs('nav.menu'), toggleEl = qs('#menu-toggle') || qs('.menu-toggle');
  var M = SITE.menu = { isOpen: false, open: noop, close: noop, toggle: noop };
  function initMenu() {
    if (!menuEl) return;
    var inner = qs('.menu__inner', menuEl), slots = qsa('.menu__slot', menuEl), titles = qsa('.menu__title', menuEl);
    var label = toggleEl ? qs('.menu-toggle__label', toggleEl) : null;
    if (inner) inner.setAttribute('data-lenis-prevent', '');
    buildCells(qs('.menu__cells', menuEl), 'menu');
    slots.forEach(function (s) {
      var i = num(attr(s, 'data-slot'), pageOf(attr(s, 'href')));
      if (i === pageIndex) {
        s.classList.add('is-current'); s.setAttribute('aria-current', 'page');
        if (!qs('.menu__here', s)) { var h = mk('span', 'menu__here'); h.textContent = t('menu.here'); s.appendChild(h); }
      }
      s.addEventListener('pointerenter', function () { if (M.isOpen) bg.setState({ page: i, accent: PAGES[i] ? PAGES[i].accent : 'laser' }, 0.6); });
    });
    var list = qs('.menu__slots', menuEl);
    if (list) list.addEventListener('pointerleave', function () { if (M.isOpen && !T.isActive) bg.reset(0.6); });
    var tl = null, lastFocus = null;
    var setLabel2 = function (k) { if (!label) return; label.textContent = t(k); };
    M.open = function () {
      if (M.isOpen || T.isActive) return;
      M.isOpen = true; lastFocus = d.activeElement;
      cl.add('is-menu-open'); menuEl.setAttribute('aria-hidden', 'false');
      if (toggleEl) { toggleEl.setAttribute('aria-expanded', 'true'); toggleEl.setAttribute('aria-label', t('nav.close')); }
      setLabel2('nav.close'); lock('menu'); SITE.emit('menu:open');
      menuEl.classList.add('is-animating');
      var g = grids.menu;
      if (tl) tl.kill();
      tl = gsap.timeline();
      if (reduced) { if (g) gsap.set(g.cells, { scale: 1 }); if (inner) gsap.set(inner, { opacity: 1 }); }
      else {
        if (g) tl.fromTo(g.cells, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.8, ease: 'power4.inOut', stagger: { grid: [g.rows, g.cols], from: g.cols - 1, amount: 0.4 } }, 0);
        if (inner) tl.fromTo(inner, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.4);
        tl.fromTo(slots, { y: 60, scale: 0.96, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.7)', stagger: 0.08, clearProps: 'transform' }, 0.45);
        titles.forEach(function (ti, i) { if (ti._split && ti._split.chars.length) tl.fromTo(ti._split.chars, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, ease: 'expo.out', stagger: 0.02 }, 0.5 + i * 0.08); });
      }
      tl.add(function () { var f = qs('.menu__slot.is-current', menuEl) || slots[0]; if (f && d.activeElement === toggleEl) {} else if (f) f.focus({ preventScroll: true }); });
    };
    M.close = function (instant) {
      if (!M.isOpen) return;
      M.isOpen = false;
      if (toggleEl) { toggleEl.setAttribute('aria-expanded', 'false'); toggleEl.removeAttribute('aria-label'); }
      setLabel2('nav.menu'); SITE.emit('menu:close');
      var g = grids.menu;
      var end = function () { cl.remove('is-menu-open'); menuEl.classList.remove('is-animating'); menuEl.setAttribute('aria-hidden', 'true'); unlock('menu'); };
      if (tl) tl.kill();
      if (!T.isActive) bg.reset(0.6);
      if (instant === true || reduced) { if (g) gsap.set(g.cells, { scale: 0 }); if (inner) gsap.set(inner, { opacity: 0 }); end(); }
      else {
        cl.remove('is-menu-open'); menuEl.classList.add('is-animating');
        tl = gsap.timeline({ onComplete: end });
        if (inner) tl.to(inner, { opacity: 0, duration: 0.25, ease: 'power2.in' }, 0);
        if (g) tl.to(g.cells, { scale: 0, duration: 0.6, ease: 'power4.inOut', stagger: { grid: [g.rows, g.cols], from: g.cols - 1, amount: 0.3 } }, 0.1);
      }
      if (toggleEl && (menuEl.contains(d.activeElement) || d.activeElement === body)) toggleEl.focus({ preventScroll: true });
      else if (lastFocus && lastFocus.focus && menuEl.contains(d.activeElement)) lastFocus.focus({ preventScroll: true });
    };
    M.toggle = function () { if (M.isOpen) M.close(); else M.open(); };
    if (toggleEl) toggleEl.addEventListener('click', function (e) { e.preventDefault(); M.toggle(); });
    d.addEventListener('keydown', function (e) {
      if (!M.isOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); M.close(); return; }
      if (e.key !== 'Tab') return;
      var f = [toggleEl].concat(qsa('a[href],button:not([disabled]),input,[tabindex]:not([tabindex="-1"])', menuEl)).filter(function (x) { return x && x.offsetParent !== null; });
      if (!f.length) return;
      var i = f.indexOf(d.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && (i === f.length - 1 || i === -1)) { e.preventDefault(); f[0].focus(); }
    });
  }

  /* ------------------------------------------------------------------
     19. Global delegation: links, copy, scroll-to, keys
     ------------------------------------------------------------------ */
  function copyText(txt, el) {
    var ok = function () { SITE.toast(t('toast.copied'), { type: 'ok' }); };
    var legacy = function () {
      var ta = mk('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      body.appendChild(ta); ta.select(); var res = false; try { res = d.execCommand('copy'); } catch (e) {} ta.remove();
      if (res) ok(); else {
        try { var rg = d.createRange(); rg.selectNodeContents(el); var sel = w.getSelection(); sel.removeAllRanges(); sel.addRange(rg); } catch (e) {}
        SITE.toast(t('toast.copyFail'), { type: 'warn' });
      }
    };
    try {
      if (navigator.clipboard && w.isSecureContext) navigator.clipboard.writeText(txt).then(ok, legacy);
      else legacy();
    } catch (e) { legacy(); }
  }
  SITE.copy = copyText;
  function initDelegation() {
    d.addEventListener('click', function (e) {
      if (e.defaultPrevented) return;
      var tg = e.target && e.target.closest ? e.target : null; if (!tg) return;
      var cp = tg.closest('[data-copy]');
      if (cp) { e.preventDefault(); copyText(attr(cp, 'data-copy') || cp.textContent.trim(), cp); if (!reduced) bg.pulse(0.4); return; }
      var sc = tg.closest('[data-scroll-to]');
      if (sc) { e.preventDefault(); var v = attr(sc, 'data-scroll-to'); if (M.isOpen) M.close(true); SITE.scrollTo(v === 'top' || !v ? 0 : v); return; }
      var a = tg.closest('a[href]');
      if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if ((a.target && a.target !== '_self') || a.hasAttribute('download') || attr(a, 'data-transition') === 'false') return;
      var raw = attr(a, 'href'), p = parseInternal(raw);
      if (!p) return;
      e.preventDefault();
      if (fileOf(p.path) === currentFile) {
        if (M.isOpen) M.close();
        if (p.hash && p.hash.length > 1) { var tgt = d.getElementById(decodeURIComponent(p.hash.slice(1))); if (tgt) SITE.scrollTo(tgt); }
        else if (!a.classList.contains('menu__slot')) SITE.scrollTo(0);
        return;
      }
      T.go(raw, { from: { x: e.clientX || vw / 2, y: e.clientY || vh / 2 } });
    });
    var KON = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'], kp = 0;
    d.addEventListener('keydown', function (e) {
      var k = (e.key || '').toLowerCase(), tag = (e.target && e.target.tagName) || '';
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(tag) || (e.target && e.target.isContentEditable);
      kp = k === KON[kp] ? kp + 1 : (k === KON[0] ? 1 : 0);
      if (kp === KON.length) { kp = 0; konami(); }
      if (k === 'g' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) cl.toggle('is-grid');
    });
    w.addEventListener('pageshow', function (e) { if (e.persisted) { resetTransition(); if (M.isOpen) M.close(true); } });
  }
  function konami() {
    SITE.toast(t('toast.secret'), { type: 'ok', label: '★' });
    SITE.emit('konami');
    if (!bg.enabled) return;
    var seq = ['laser', 'amber', 'phosphor', 'cyan', 'violet'], i = 0;
    bg.setState({ intensity: 1 }, 0.5); bg.pulse(1);
    var id = setInterval(function () { bg.setState({ accent: seq[i++ % seq.length] }, 0.4); }, 450);
    setTimeout(function () { clearInterval(id); if (activeScene) activeScene = null; bg.reset(1); }, 4000);
  }

  /* ------------------------------------------------------------------
     20. Header: brand decode, time, progress
     ------------------------------------------------------------------ */
  function initHeader() {
    var brand = qs('.brand'), name = brand ? qs('.brand__name', brand) : null;
    if (name && finePointer && !reduced) {
      var orig = name.textContent;
      brand.addEventListener('pointerenter', function () { SITE.scramble(name, { text: PAGES[pageIndex].sku, duration: 0.5 }); });
      brand.addEventListener('pointerleave', function () { SITE.scramble(name, { text: orig, duration: 0.6 }); });
    }
    progEls = qsa('[data-progress]');
    progEls.forEach(function (p) { p.style.transformOrigin = '0 50%'; p.style.transform = 'scaleX(0)'; });
    var times = qsa('[data-time]');
    if (times.length) {
      var fmt;
      try { fmt = new Intl.DateTimeFormat(SITE.locale, { hour: '2-digit', minute: '2-digit', hour12: false }); } catch (e) { fmt = null; }
      var upd = function () {
        var s;
        if (fmt) s = fmt.format(new Date());
        else { var dt = new Date(Date.now() + 3 * 3600000); s = pad(dt.getUTCHours(), 2) + ':' + pad(dt.getUTCMinutes(), 2); }
        times.forEach(function (el) { if (el.textContent !== s) el.textContent = s; });
      };
      upd(); setInterval(upd, 10000);
    }
  }

  /* ------------------------------------------------------------------
     21. Next-slot footer portal
     ------------------------------------------------------------------ */
  function initNext() {
    var a = qs('[data-next]'); if (!a || reduced || !ST) return;
    var foot = a.closest('footer') || a.parentNode, timer = null, fired = false, armed = false;
    var fire = function () {
      if (fired) return; fired = true;
      var r = a.getBoundingClientRect();
      T.go(attr(a, 'href'), { from: { x: r.left + r.width / 2, y: Math.min(vh - 1, r.top + r.height / 2) } });
    };
    ST.create({
      trigger: foot, start: 'bottom bottom', end: function () { return '+=' + Math.round(w.innerHeight * 0.6); },
      pin: true, pinSpacing: true, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: function (self) {
        var p = self.progress;
        a.style.setProperty('--next-p', p.toFixed(4));
        a.classList.toggle('is-armed', p > 0.02);
        if (p < 0.9 && self.direction === 1) armed = true;
        if (p > 0.995 && armed && !fired && !T.isActive) { if (!timer) timer = gsap.delayedCall(0.4, fire); }
        else if (timer && p < 0.98) { timer.kill(); timer = null; }
      }
    });
  }

  /* ------------------------------------------------------------------
     22. Boot
     ------------------------------------------------------------------ */
  function boot() {
    /* 2. i18n before anything measures or splits */
    safe(function () { applyI18n(d, false); }, 'i18n');
    cl.remove('is-loading');
    var first = cl.contains('is-first-visit') && !cl.contains('is-entering');
    var entering = cl.contains('is-entering');
    if (first && store.session('inv-visited')) first = 'fast';

    /* 3. build */
    safe(buildSprite, 'sprite');
    safe(buildGridOverlay, 'grid');
    safe(function () { buildCells(tEl && qs('.transition__cells', tEl), 'transition'); if (tEl) tEl.classList.add('has-cells'); if (entering && grids.transition) gsap.set(grids.transition.cells, { scale: 1 }); }, 'cells');
    safe(initCursor, 'cursor');
    safe(initMenu, 'menu');
    safe(initHeader, 'header');
    safe(initDelegation, 'delegation');
    SITE.onResize(function () {
      var dm = gridDims();
      if (grids.transition && grids.transition.cols !== dm[0]) buildCells(grids.transition.el, 'transition');
      if (grids.menu && grids.menu.cols !== dm[0] && !M.isOpen) buildCells(grids.menu.el, 'menu');
    });

    /* 4. WebGL + scroll */
    safe(initBG, 'webgl');
    if (!bg.enabled) glReady = true;
    safe(initScroll, 'scroll');
    if (locked && lenis) lenis.stop();

    /* 5. fonts → splits & interactions */
    var fontsP = new Promise(function (res) {
      var done = false, fin = function () { if (!done) { done = true; res(); } };
      setTimeout(fin, 2500);
      try { if (d.fonts && d.fonts.ready) d.fonts.ready.then(fin, fin); else fin(); } catch (e) { fin(); }
    });
    var setupP = fontsP.then(function () {
      safe(function () { qsa('[data-split]').forEach(function (el) { if (!el._split) split(el, attr(el, 'data-split')); }); }, 'split');
      safe(function () { qsa('.menu__title').forEach(function (el) { if (!el._split) split(el, 'chars'); }); }, 'menu split');
      safe(setupReveals, 'reveal');
      safe(function () { qsa('[data-scramble]').forEach(scrambleBind); }, 'scramble');
      safe(setupCounters, 'counters');
      safe(setupParallax, 'parallax');
      safe(setupScenes, 'scenes');
      safe(setupMarquees, 'marquee');
      safe(function () { qsa('[data-magnetic]').forEach(function (el) { SITE.magnetic(el); }); }, 'magnetic');
      safe(function () { qsa('[data-tilt]').forEach(function (el) { SITE.tilt(el); }); }, 'tilt');
      safe(setupProximity, 'proximity');
      safe(initNext, 'next');
      if (ST) ST.refresh();
    });

    /* 6. intro */
    var readyOnce = function () { fireReady(); };
    if (first === true) runPreloader(fontsP, setupP, readyOnce);
    else if (first === 'fast') {
      /* head script couldn't read storage, but the window.name fallback says we've been here: skip the choreography */
      setupP.then(function () {
        var pre = qs('#preloader') || qs('.preloader');
        if (pre) gsap.to(pre, { opacity: 0, duration: 0.35, onComplete: function () { pre.classList.add('is-done'); } });
        bg.scan(); readyOnce();
      });
    }
    else if (entering) setupP.then(function () { if (safe(function () { playEnter(readyOnce); return true; }, 'enter') !== true) { cl.remove('is-entering'); unlock('transition'); readyOnce(); } });
    else setupP.then(readyOnce);
    if (!first) store.session('inv-visited', 1);
    setTimeout(function () {
      if (!ready) { cl.remove('is-entering'); var pre = qs('#preloader'); if (pre) pre.classList.add('is-done'); locks = {}; applyLock(); fireReady(); }
    }, 9000);

    /* console hello */
    try {
      console.log('%c YZ %c ' + t('console.hello'), 'background:#FF4A1C;color:#0C0D0B;font:700 14px monospace;padding:4px 6px', 'color:#A39F95;font:12px monospace');
    } catch (e) {}
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', function () { safe(boot, 'boot'); });
  else safe(boot, 'boot');
})(window, document);
