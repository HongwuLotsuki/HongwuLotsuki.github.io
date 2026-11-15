/* =====================================================================
   INVENTORY — about page (about.html) · slot 02 · Amber
   A1 character sheet · A2 sticky story · A3 save-file timeline
   A4 pinned skill tree · A5 currently equipped
   Classic script, IIFE, no globals. Defensive against a partial SITE API.
   ===================================================================== */
(function () {
  'use strict';
  if (!document.body || document.body.dataset.page !== 'about') return;

  var doc = document;
  var root = doc.documentElement;

  /* ------------------------------------------------------------------
     Defensive bridge to window.SITE
     ------------------------------------------------------------------ */
  function S() { return window.SITE || null; }
  function has(obj, fn) { return !!(obj && typeof obj[fn] === 'function'); }
  function qs(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function pad(n, l) { n = String(n); while (n.length < l) n = '0' + n; return n; }

  function isReduced() {
    var s = S();
    return !!((s && s.reducedMotion) || root.classList.contains('is-reduced'));
  }
  function isTouch() {
    var s = S();
    return !!((s && s.isTouch) || root.classList.contains('is-touch'));
  }
  function lang() {
    var s = S();
    return (s && s.lang) || ('en');
  }
  function locale() {
    var s = S();
    return (s && s.locale) || ('en-US');
  }

  function t(key, vars) {
    var s = S(), out;
    if (has(s, 't')) { try { out = s.t(key, vars); } catch (e) { out = null; } }
    if (!out || out === key) {
      var I = window.I18N || {};
      out = (I[lang()] && I[lang()][key]) || key;
      if (vars) out = out.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
    }
    return out;
  }

  function onReady(fn) {
    var fired = false;
    function run() { if (fired) return; fired = true; try { fn(); } catch (e) { if (window.console) console.error('[about]', e); } }
    var s = S();
    if (has(s, 'onReady')) { s.onReady(run); return; }
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { setTimeout(run, 0); });
    else setTimeout(run, 0);
  }

  function color(token, fallback) {
    var s = S(), v = '';
    if (has(s, 'color')) { try { v = s.color(token); } catch (e) { v = ''; } }
    if (!v) { try { v = getComputedStyle(doc.body).getPropertyValue(token).trim(); } catch (e) { v = ''; } }
    return v || fallback;
  }

  function toast(text, type) {
    var s = S();
    if (has(s, 'toast')) { try { s.toast(text, { type: type || 'info', duration: 2600 }); } catch (e) {} }
  }
  function bg(method, a, b) {
    var s = S();
    if (s && s.bg && s.bg.enabled !== false && typeof s.bg[method] === 'function') {
      try { s.bg[method](a, b); } catch (e) {}
    }
  }

  var tickers = [];
  function addTick(fn) {
    var s = S();
    if (s && s.ticker && typeof s.ticker.add === 'function') s.ticker.add(fn);
    else if (window.gsap) window.gsap.ticker.add(fn);
    tickers.push(fn);
  }
  function removeTicks() {
    var s = S();
    tickers.forEach(function (fn) {
      try {
        if (s && s.ticker && typeof s.ticker.remove === 'function') s.ticker.remove(fn);
        if (window.gsap) window.gsap.ticker.remove(fn);
      } catch (e) {}
    });
    tickers.length = 0;
  }

  var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*/<>';
  function scramble(el, text, duration, delay) {
    if (!el) return;
    var finalText = text != null ? text : el.textContent;
    var s = S();
    if (isReduced() || !window.gsap) { el.textContent = finalText; return; }
    if (has(s, 'scramble')) {
      try { return s.scramble(el, { text: finalText, duration: duration || 0.7, delay: delay || 0 }); } catch (e) {}
    }
    var o = { p: 0 };
    return window.gsap.to(o, {
      p: 1, duration: duration || 0.7, delay: delay || 0, ease: 'none',
      onUpdate: function () {
        var n = Math.floor(finalText.length * o.p), out = finalText.slice(0, n);
        for (var i = n; i < finalText.length; i++) {
          var c = finalText.charAt(i);
          out += (c === ' ' || c === '/' || c === '—') ? c : GLYPHS.charAt((Math.random() * GLYPHS.length) | 0);
        }
        el.textContent = out;
      },
      onComplete: function () { el.textContent = finalText; }
    });
  }

  /* Visibility helper: run work only while an element is on screen */
  function watch(el, cb) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { cb(e.isIntersecting); });
    }, { rootMargin: '80px 0px' });
    io.observe(el);
  }

  /* Shared pointer state (one listener for the whole page) */
  var mouse = { x: -9999, y: -9999, nx: 0, ny: 0, moved: false };
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    mouse.x = e.clientX; mouse.y = e.clientY;
    mouse.nx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ny = (e.clientY / window.innerHeight) * 2 - 1;
    mouse.moved = true;
  }, { passive: true });

  function onResize(fn) {
    var s = S();
    if (has(s, 'onResize')) { s.onResize(fn); return; }
    var lastW = window.innerWidth, timer;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (window.innerWidth === lastW) return;
        lastW = window.innerWidth; fn();
      }, 200);
    });
  }

  /* ==================================================================
     A1 · HERO — rings, sprite, stats, bars
     ================================================================== */
  function initHero() {
    var hero = qs('.a-hero');
    if (!hero) return;
    var gsap = window.gsap, reduced = isReduced();

    /* ---- Generative rings (about emblem: concentric rings) ---- */
    var svg = qs('.a-hero__rings', hero);
    var rings = [];
    if (svg) {
      var NS = 'http://www.w3.org/2000/svg';
      var spec = [
        { r: 290, dash: '1 9', speed: 2, depth: 26 },
        { r: 250, dash: '', speed: -4, depth: 18, ticks: 72 },
        { r: 205, dash: '60 14 4 14', speed: 7, depth: 12, accent: true },
        { r: 168, dash: '', speed: -10, depth: 8, label: true },
        { r: 120, dash: '2 4', speed: 14, depth: 4 }
      ];
      spec.forEach(function (sp, i) {
        var g = doc.createElementNS(NS, 'g');
        var c = doc.createElementNS(NS, 'circle');
        c.setAttribute('cx', 300); c.setAttribute('cy', 300); c.setAttribute('r', sp.r);
        if (sp.dash) c.setAttribute('stroke-dasharray', sp.dash);
        if (sp.accent) c.setAttribute('class', 'is-accent');
        g.appendChild(c);
        if (sp.ticks) {
          var p = '';
          for (var k = 0; k < sp.ticks; k++) {
            var a = (k / sp.ticks) * Math.PI * 2, len = k % 6 === 0 ? 12 : 5;
            var x1 = 300 + Math.cos(a) * sp.r, y1 = 300 + Math.sin(a) * sp.r;
            var x2 = 300 + Math.cos(a) * (sp.r - len), y2 = 300 + Math.sin(a) * (sp.r - len);
            p += 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'L' + x2.toFixed(1) + ' ' + y2.toFixed(1);
          }
          var path = doc.createElementNS(NS, 'path');
          path.setAttribute('d', p);
          path.setAttribute('stroke', 'currentColor');
          path.setAttribute('style', 'stroke: var(--c-line-strong)');
          g.appendChild(path);
        }
        if (sp.label) {
          var defs = doc.createElementNS(NS, 'path');
          var id = 'a-ring-path';
          defs.setAttribute('id', id);
          defs.setAttribute('fill', 'none');
          defs.setAttribute('d', 'M300 ' + (300 - sp.r + 14) + 'a' + (sp.r - 14) + ' ' + (sp.r - 14) + ' 0 1 1 -0.1 0');
          g.appendChild(defs);
          var tx = doc.createElementNS(NS, 'text');
          var tp = doc.createElementNS(NS, 'textPath');
          tp.setAttribute('href', '#' + id);
          tp.textContent = 'INV-002 · ' + t('rarity.unique').toLocaleUpperCase(locale()) + ' · LV ?? · CURIOSITY 100 · INV-002 · ' + t('about.stat.class.v').toLocaleUpperCase(locale()) + ' · ';
          tx.appendChild(tp);
          g.appendChild(tx);
        }
        svg.appendChild(g);
        rings.push({ g: g, speed: sp.speed, depth: sp.depth, rot: i * 30, x: 0, y: 0 });
      });
    }

    /* ---- Ring + depth loop (only while hero visible) ---- */
    var heroVisible = true;
    watch(hero, function (v) { heroVisible = v; });
    if (rings.length && !reduced) {
      var ringLast = 0;
      addTick(function (time) {
        if (!heroVisible || time - ringLast < 1 / 30) return; // 30fps is plenty for slow rings
        var d = Math.min(time - ringLast, 0.1);
        ringLast = time;
        var s = S(), vel = (s && s.scroll && s.scroll.velocity) || 0;
        var tx = isTouch() ? 0 : mouse.nx, ty = isTouch() ? 0 : mouse.ny;
        for (var i = 0; i < rings.length; i++) {
          var r = rings[i];
          r.rot += (r.speed + vel * 120 * (i % 2 ? -1 : 1)) * d;
          r.x = lerp(r.x, tx * r.depth, 0.06);
          r.y = lerp(r.y, ty * r.depth, 0.06);
          r.g.setAttribute('transform', 'translate(' + r.x.toFixed(2) + ' ' + r.y.toFixed(2) + ') rotate(' + r.rot.toFixed(2) + ' 300 300)');
        }
      });
    }

    /* ---- Hero scroll-out: content drifts apart (scrubbed) ---- */
    if (gsap && window.ScrollTrigger && !reduced) {
      gsap.timeline({
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 }
      })
        .to(qs('.a-hero__main', hero), { yPercent: -18, opacity: 0.2, ease: 'none' }, 0)
        .to(qs('.a-hero__side', hero), { yPercent: -8, ease: 'none' }, 0)
        .to(svg, { scale: 1.25, opacity: 0, ease: 'none' }, 0);
    }

    initSprite();
    initSheetStats();
  }

  /* ---- 16×16 pixel sprite ---- */
  function initSprite() {
    var btn = qs('.a-sprite');
    var canvas = btn && qs('canvas', btn);
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var reduced = isReduced();

    var PAL = {
      h: color('--c-ink', '#0C0D0B'),
      s: color('--c-bone', '#ECE7DC'),
      w: color('--c-bone-2', '#D9D3C5'),
      p: color('--c-ink', '#0C0D0B'),
      m: color('--c-ink', '#0C0D0B'),
      a: color('--c-ink-2', '#131411'),
      d: color('--c-bone', '#ECE7DC')
    };
    var HEAD = [
      '................',
      '....hhhhhhhh....',
      '...hhhhhhhhhh...',
      '..hhhhhhhhhhhh..',
      '..hhhsssssshhh..',
      '..hhsssssssshh..',
      '..hsswwsswwssh..',
      '..hsswwsswwssh..',
      '..hssssssssssh..',
      '...ssssmmssss...',
      '....ssssssss....',
      '......ssss......'
    ];
    var BODY = [
      '...aaaaaaaaaa...',
      '..aaaaaddaaaaa..',
      '..aaaaaaaaaaaa..',
      '..aaaaaaaaaaaa..'
    ];
    var WAVE = [
      [[13, 12, 'a'], [14, 11, 'a'], [14, 10, 's'], [15, 10, 's']],
      [[13, 12, 'a'], [14, 11, 'a'], [14, 10, 'a'], [14, 9, 's'], [14, 8, 's'], [15, 8, 's']],
      [[13, 12, 'a'], [14, 11, 'a'], [15, 10, 'a'], [15, 9, 's'], [15, 8, 's']]
    ];
    var WAVE_SEQ = [0, 1, 2, 1, 2, 1, 0];

    var state = { breath: 0, blink: false, px: 0, py: 0, wave: -1 };
    var lastKey = '';

    function draw() {
      var key = state.breath + '|' + state.blink + '|' + state.px + '|' + state.py + '|' + state.wave;
      if (key === lastKey) return;
      lastKey = key;
      ctx.clearRect(0, 0, 16, 16);
      var x, y, c, row;
      for (y = 0; y < BODY.length; y++) {
        row = BODY[y];
        for (x = 0; x < 16; x++) {
          c = row.charAt(x);
          if (c === '.') continue;
          ctx.fillStyle = PAL[c]; ctx.fillRect(x, 12 + y, 1, 1);
        }
      }
      var off = state.breath;
      for (y = 0; y < HEAD.length; y++) {
        row = HEAD[y];
        for (x = 0; x < 16; x++) {
          c = row.charAt(x);
          if (c === '.') continue;
          if (c === 'w' && state.blink) c = 's';
          ctx.fillStyle = PAL[c]; ctx.fillRect(x, y + off, 1, 1);
        }
      }
      if (!state.blink) {
        // pupils: -1 left / 0 inner / +1 right ; rows 6 (up) or 7 (down)
        var lx = state.px < 0 ? 5 : 6, rx = state.px > 0 ? 10 : 9;
        if (state.px === 0) { lx = 6; rx = 9; }
        var py = (state.py < 0 ? 6 : 7) + off;
        ctx.fillStyle = PAL.p;
        ctx.fillRect(lx, py, 1, 1); ctx.fillRect(rx, py, 1, 1);
      }
      if (state.wave >= 0) {
        WAVE[state.wave].forEach(function (p) { ctx.fillStyle = PAL[p[2]]; ctx.fillRect(p[0], p[1], 1, 1); });
      }
    }
    draw();

    var visible = true, rect = null;
    watch(btn, function (v) { visible = v; rect = null; });
    function measure() { rect = canvas.getBoundingClientRect(); }

    var acc = 0, nextBlink = 2.5, blinkT = 0, waving = false;
    if (!reduced) {
      addTick(function (time, dt) {
        if (!visible || waving) return;
        var d = Math.min((dt || 16) / 1000, 0.1);
        acc += d;
        if (acc >= 0.8) { acc = 0; state.breath = state.breath ? 0 : 1; }
        nextBlink -= d;
        if (nextBlink <= 0 && !state.blink) { state.blink = true; blinkT = 0.12; nextBlink = 2.5 + Math.random() * 3; }
        if (state.blink) { blinkT -= d; if (blinkT <= 0) state.blink = false; }
        if (mouse.moved && !isTouch()) {
          mouse.moved = false;
          measure();
          var cx = rect.left + rect.width / 2, cy = rect.top + rect.height * 0.42;
          var dx = mouse.x - cx, dy = mouse.y - cy;
          state.px = dx > 60 ? 1 : dx < -60 ? -1 : 0;
          state.py = dy < -50 ? -1 : 1;
        }
        draw();
      });
    }

    function plusOne(text) {
      if (!window.gsap || reduced) return;
      var span = doc.createElement('span');
      span.className = 'a-sprite__plus';
      span.textContent = text;
      btn.appendChild(span);
      window.gsap.fromTo(span, { xPercent: -50, y: 0, opacity: 0, scale: 0.6 }, {
        y: -46, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)',
        onComplete: function () {
          window.gsap.to(span, { y: -70, opacity: 0, duration: 0.5, delay: 0.3, ease: 'power3.in', onComplete: function () { span.remove(); } });
        }
      });
    }

    btn.addEventListener('click', function () {
      toast(t('about.toast.wave'), 'ok');
      bg('pulse', 0.4);
      plusOne('+1');
      if (waving) return;
      waving = true;
      var i = 0;
      state.blink = false; state.py = 1; state.px = 0;
      (function step() {
        state.wave = WAVE_SEQ[i];
        draw();
        i++;
        if (i < WAVE_SEQ.length) setTimeout(step, 110);
        else setTimeout(function () { state.wave = -1; waving = false; draw(); }, 140);
      })();
    });
  }

  /* ---- Stats decode + bars fill ---- */
  function initSheetStats() {
    var sheet = qs('.a-sheet');
    if (!sheet) return;
    var gsap = window.gsap, reduced = isReduced();
    var bars = qsa('.a-bar', sheet);
    var dds = qsa('.a-stat dd', sheet);
    var xpBar = qs('.a-sheet__xpbar i', sheet), xpNum = qs('.a-sheet__xpv', sheet);

    bars.forEach(function (b) { b.style.setProperty('--v', reduced || !gsap ? b.getAttribute('data-value') : 0); });
    if (reduced || !gsap) return;

    gsap.set(xpBar, { scaleX: 0 });
    var delay = 0.55;
    dds.forEach(function (dd, i) { scramble(dd, dd.textContent, 0.6, delay + i * 0.08); });

    bars.forEach(function (b, i) {
      var v = parseFloat(b.getAttribute('data-value')) || 0;
      var n = qs('.a-bar__n', b), o = { v: 0 };
      gsap.to(b, { '--v': v, duration: 1.4, delay: delay + 0.3 + i * 0.12, ease: 'expo.out' });
      gsap.to(o, {
        v: v, duration: 1.4, delay: delay + 0.3 + i * 0.12, ease: 'expo.out',
        onUpdate: function () { if (n) n.textContent = Math.round(o.v); }
      });
    });
    if (xpBar) gsap.to(xpBar, { scaleX: 0.73, duration: 1.6, delay: delay + 0.2, ease: 'expo.out' });
    if (xpNum) {
      var xo = { v: 0 };
      gsap.to(xo, {
        v: 7340, duration: 1.6, delay: delay + 0.2, ease: 'expo.out',
        onUpdate: function () { xpNum.textContent = Math.round(xo.v).toLocaleString(locale()); }
      });
    }
  }

  /* ==================================================================
     A2 · STORY — odometer, dimming, depth meter
     ================================================================== */
  function initStory() {
    var sec = qs('.a-story');
    if (!sec || !window.gsap || !window.ScrollTrigger) return;
    var gsap = window.gsap, ST = window.ScrollTrigger, reduced = isReduced();
    var paras = qsa('.a-story__para', sec);
    var reel = qs('.a-story__reel', sec), names = qs('.a-story__names-reel', sec);
    var depthV = qs('.a-story__depthv', sec), core = qs('.a-story__core', sec);
    var current = -1;

    function setChapter(i) {
      if (i === current) return;
      current = i;
      var dur = reduced ? 0 : 0.9;
      if (reel) gsap.to(reel, { yPercent: -(100 / 3) * i, duration: dur, ease: 'back.out(1.4)', overwrite: true });
      if (names) gsap.to(names, { yPercent: -(100 / 3) * i, duration: dur, ease: 'expo.out', overwrite: true });
      paras.forEach(function (p, k) { p.classList.toggle('is-active', k === i); });
    }
    setChapter(0);

    paras.forEach(function (p, i) {
      ST.create({
        trigger: p, start: 'top center', end: 'bottom center',
        onToggle: function (self) { if (self.isActive) setChapter(i); }
      });
      if (!reduced) {
        gsap.timeline({ scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: 0.6 } })
          .fromTo(p, { opacity: 0.3 }, { opacity: 1, duration: 0.35, ease: 'none' })
          .to(p, { opacity: 1, duration: 0.3, ease: 'none' })
          .to(p, { opacity: 0.3, duration: 0.35, ease: 'none' });
      }
    });

    ST.create({
      trigger: sec, start: 'top center', end: 'bottom center',
      onUpdate: function (self) {
        var p = self.progress;
        if (depthV) depthV.textContent = '−' + pad(Math.round(p * 1240), 4) + ' m';
        if (core) core.style.setProperty('--depth', p.toFixed(4));
      }
    });
  }

  /* ==================================================================
     A3 · SAVE FILES — circuit trace that draws with scroll
     ================================================================== */
  function initSaves() {
    var track = qs('.a-saves__track');
    if (!track) return;
    var svg = qs('.a-saves__svg', track);
    var ghost = qs('.a-saves__ghost', track), line = qs('.a-saves__line', track), tip = qs('.a-saves__tip', track);
    var items = qsa('.a-save', track);
    var gsap = window.gsap, ST = window.ScrollTrigger, reduced = isReduced();
    var len = 0, progress = reduced ? 1 : 0;

    var building = false, lastSig = '';
    function build() {
      if (building) return;
      var W = track.clientWidth, H = track.clientHeight;
      if (!W || !H) return;
      var sig = W + 'x' + H + ':' + items.map(function (li) { return li.offsetTop; }).join(',');
      if (sig === lastSig) return; // nothing moved → no work (also breaks any refresh↔build feedback)
      lastSig = sig;
      building = true;
      try { buildPath(W, H); } finally { building = false; }
    }
    function buildPath(W, H) {
      var mobile = window.matchMedia('(max-width: 768px)').matches;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('width', W); svg.setAttribute('height', H);
      var cx = W / 2;
      var ys = items.map(function (li) {
        var node = qs('.a-save__node', li);
        if (mobile && node) cx = li.offsetLeft + node.offsetLeft + node.offsetWidth / 2;
        return li.offsetTop + (node ? node.offsetTop + node.offsetHeight / 2 : 0);
      });
      var jog = mobile ? 6 : 18;
      var d = 'M' + cx + ' 0';
      var prev = 0;
      ys.forEach(function (y, i) {
        if (i > 0 && y - prev > 90) {
          var m = (prev + y) / 2, s = (i % 2 ? 1 : -1) * jog;
          d += ' L' + cx + ' ' + (m - 20) +
               ' L' + (cx + s) + ' ' + (m - 20 + jog) +
               ' L' + (cx + s) + ' ' + (m + 20 - jog) +
               ' L' + cx + ' ' + (m + 20);
        }
        d += ' L' + cx + ' ' + y;
        prev = y;
      });
      d += ' L' + cx + ' ' + H;
      ghost.setAttribute('d', d);
      line.setAttribute('d', d);
      try { len = line.getTotalLength(); } catch (e) { len = H; }
      line.style.strokeDasharray = len + ' ' + len;
      draw(progress);
    }

    function draw(p) {
      progress = p;
      if (!len) return;
      line.style.strokeDashoffset = (len * (1 - p)).toFixed(1);
      try {
        var pt = line.getPointAtLength(len * p);
        tip.setAttribute('cx', pt.x.toFixed(1));
        tip.setAttribute('cy', pt.y.toFixed(1));
        tip.style.opacity = p > 0.001 && p < 0.999 ? 1 : 0;
      } catch (e) {}
    }

    build();
    onResize(function () { build(); });
    if (window.ScrollTrigger) ST.addEventListener('refresh', build);

    if (reduced || !gsap || !ST) {
      items.forEach(function (li) { li.classList.add('is-reached'); });
      draw(1);
      return;
    }

    ST.create({
      trigger: track, start: 'top 60%', end: 'bottom 60%',
      onUpdate: function (self) { draw(self.progress); }
    });

    items.forEach(function (li) {
      var node = qs('.a-save__node', li);
      ST.create({
        trigger: node || li, start: 'top 60%',
        onEnter: function () {
          li.classList.add('is-reached');
          if (node) gsap.fromTo(node, { scale: 0, rotation: 45 }, { scale: 1, rotation: 45, duration: 0.6, ease: 'back.out(3)' });
          bg('pulse', 0.2);
        },
        onLeaveBack: function () {
          li.classList.remove('is-reached');
          if (node) gsap.to(node, { scale: 0.6, rotation: 45, duration: 0.3, ease: 'power3.out' });
        }
      });
      ST.create({
        trigger: li, start: 'top 55%', end: 'bottom 45%',
        toggleClass: { targets: li, className: 'is-active' }
      });
    });

    // "∞" playtime on the current save keeps ticking like a live clock
    var live = qs('.a-save__live', track);
    if (live) {
      var on = false;
      watch(live, function (v) { on = v; });
      var sec = 0;
      addTick(function (time) {
        if (!on) return;
        var s = Math.floor(time);
        if (s === sec) return;
        sec = s;
        live.textContent = '∞:' + pad(s % 60, 2);
      });
    }
  }

  /* ==================================================================
     A4 · SKILL TREE — built from the accessible lists
     ================================================================== */
  var TREE_POS = {
    root: [600, 690],
    unity: [400, 560], csharp: [260, 440], gameplay: [150, 310], physics: [390, 300], shader: [220, 170],
    git: [600, 560], problem: [600, 430], team: [600, 300], lang: [600, 170],
    db: [800, 560], apps: [940, 440], barcode: [1050, 310], reports: [810, 300]
  };
  var BRANCH_LABEL = { game: [250, 100], core: [600, 100], systems: [950, 100] };

  var tooltip = null;
  function getTooltip() {
    if (tooltip) return tooltip;
    tooltip = qs('.a-tooltip');
    if (tooltip && tooltip.parentNode !== doc.body) doc.body.appendChild(tooltip);
    return tooltip;
  }
  var tipX = null, tipY = null, tipFollow = false;
  function showTip(o) {
    var tip = getTooltip();
    if (!tip) return;
    qs('.a-tooltip__type', tip).textContent = o.type || '';
    qs('.a-tooltip__lvl', tip).textContent = o.level || '';
    qs('.a-tooltip__name', tip).textContent = o.name || '';
    qs('.a-tooltip__flavor', tip).textContent = o.flavor || '';
    tip.style.setProperty('--tip', o.color || 'var(--accent)');
    tipFollow = !!o.follow;
    var x = o.x, y = o.y;
    if (!tipFollow) placeTip(x, y, true);
    else placeTip(mouse.x, mouse.y, true);
    if (window.gsap && !isReduced()) {
      window.gsap.to(tip, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(1.7)', overwrite: 'auto' });
    } else { tip.style.opacity = 1; tip.style.visibility = 'visible'; }
  }
  function hideTip() {
    var tip = getTooltip();
    if (!tip) return;
    tipFollow = false;
    if (window.gsap && !isReduced()) window.gsap.to(tip, { autoAlpha: 0, scale: 0.96, duration: 0.2, ease: 'power3.in', overwrite: 'auto' });
    else { tip.style.opacity = 0; tip.style.visibility = 'hidden'; }
  }
  function placeTip(x, y, instant) {
    var tip = getTooltip();
    if (!tip) return;
    var w = tip.offsetWidth || 240, h = tip.offsetHeight || 100;
    var tx = x + 18, ty = y + 18;
    if (tx + w > window.innerWidth - 12) tx = x - w - 18;
    if (ty + h > window.innerHeight - 12) ty = y - h - 18;
    tx = Math.max(12, tx); ty = Math.max(12, ty);
    if (instant || tipX === null) { tipX = tx; tipY = ty; }
    tip.dataset.tx = tx; tip.dataset.ty = ty;
    tip.style.transform = 'translate(' + tipX.toFixed(1) + 'px,' + tipY.toFixed(1) + 'px)';
  }
  function tickTip() {
    var tip = tooltip;
    if (!tip || !tipFollow) return;
    var tx = mouse.x + 18, ty = mouse.y + 18;
    var w = tip.offsetWidth, h = tip.offsetHeight;
    if (tx + w > window.innerWidth - 12) tx = mouse.x - w - 18;
    if (ty + h > window.innerHeight - 12) ty = mouse.y - h - 18;
    tipX = lerp(tipX === null ? tx : tipX, tx, 0.25);
    tipY = lerp(tipY === null ? ty : tipY, ty, 0.25);
    tip.style.transform = 'translate(' + tipX.toFixed(1) + 'px,' + tipY.toFixed(1) + 'px)';
  }

  function initSkills() {
    var sec = qs('.a-skills');
    if (!sec) return;
    var svg = qs('.a-tree__svg', sec);
    var gsap = window.gsap, ST = window.ScrollTrigger, reduced = isReduced();
    var NS = 'http://www.w3.org/2000/svg';
    var spentEl = qs('.a-skills__spent', sec), totalEl = qs('.a-skills__total', sec);

    /* Read data from the lists (HTML is the single source of truth) */
    var skills = {};
    var order = [];
    var total = 0;
    qsa('.a-branch', sec).forEach(function (br) {
      var branch = br.classList.contains('a-branch--game') ? 'game' : br.classList.contains('a-branch--systems') ? 'systems' : 'core';
      qsa('li[data-skill]', br).forEach(function (li) {
        var id = li.getAttribute('data-skill');
        var level = clamp(parseInt(li.getAttribute('data-level'), 10) || 1, 1, 5);
        var nameEl = qs('.a-branch__name', li), flEl = qs('.a-branch__flavor', li);
        skills[id] = {
          id: id, branch: branch, level: level,
          parent: li.getAttribute('data-parent') || 'root',
          name: nameEl ? nameEl.textContent.trim() : id,
          flavor: flEl ? flEl.textContent.trim() : ''
        };
        order.push(id);
        total += level;
        // pips in the lists
        var pips = qs('.a-pips', li);
        if (pips && !pips.children.length) {
          for (var k = 0; k < 5; k++) {
            var i = doc.createElement('i');
            if (k < level) i.className = 'is-on';
            pips.appendChild(i);
          }
          pips.setAttribute('role', 'img');
          pips.setAttribute('aria-label', t('about.skills.level', { n: level }));
        }
      });
    });
    if (totalEl) totalEl.textContent = pad(total, 2);
    if (spentEl) spentEl.textContent = reduced ? pad(total, 2) : '00';
    function depth(id) { var d = 0, s = skills[id]; while (s && d < 10) { d++; s = skills[s.parent]; } return d; }
    order.forEach(function (id) { skills[id].depth = depth(id); });

    if (!svg || !gsap) return;

    function el(tag, attrs, parent) {
      var n = doc.createElementNS(NS, tag);
      for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(n);
      return n;
    }
    function bevelBox(cx, cy, half, cut) {
      var x0 = cx - half, y0 = cy - half, x1 = cx + half, y1 = cy + half;
      return x0 + ',' + y0 + ' ' + (x1 - cut) + ',' + y0 + ' ' + x1 + ',' + (y0 + cut) + ' ' + x1 + ',' + y1 + ' ' + x0 + ',' + y1;
    }

    /* dot grid backdrop */
    var defs = el('defs', {}, svg);
    var pat = el('pattern', { id: 'a-tree-dots', width: 40, height: 40, patternUnits: 'userSpaceOnUse', x: 20, y: 20 }, defs);
    el('circle', { cx: 20, cy: 20, r: 1 }, pat);
    el('rect', { 'class': 'a-tree__grid', x: 0, y: 40, width: 1200, height: 720, fill: 'url(#a-tree-dots)' }, svg);

    var edgeLayer = el('g', {}, svg);
    var nodeLayer = el('g', {}, svg);
    var edges = {}, nodes = {};

    /* branch labels */
    Object.keys(BRANCH_LABEL).forEach(function (b) {
      var p = BRANCH_LABEL[b];
      var tx = el('text', { x: p[0], y: p[1], 'text-anchor': 'middle', 'class': 'a-tree__branch-label', 'data-branch': b }, svg);
      tx.textContent = t('about.skills.branch.' + b).toLocaleUpperCase(locale());
    });

    /* edges */
    order.forEach(function (id) {
      var s = skills[id], a = TREE_POS[s.parent], b = TREE_POS[id];
      if (!a || !b) return;
      var halfP = s.parent === 'root' ? 28 : 15;
      var y0 = a[1] - halfP, y1 = b[1] + 56, my = Math.round((y0 + y1) / 2);
      var d = 'M' + a[0] + ' ' + y0 + ' V' + my + ' H' + b[0] + ' V' + y1;
      el('path', { d: d, 'class': 'a-tree__edge-ghost' }, edgeLayer);
      edges[id] = el('path', { d: d, 'class': 'a-tree__edge', 'data-branch': s.branch, pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': reduced ? 0 : 1 }, edgeLayer);
    });

    /* root */
    var rp = TREE_POS.root;
    var rootG = el('g', { 'class': 'a-tree__node a-tree__root', 'data-branch': 'core' }, nodeLayer);
    el('polygon', { points: bevelBox(rp[0], rp[1], 28, 9), 'class': 'a-tree__box' }, rootG);
    var rt = el('text', { x: rp[0], y: rp[1] + 6, 'text-anchor': 'middle' }, rootG);
    rt.textContent = 'YZ';

    /* nodes */
    order.forEach(function (id) {
      var s = skills[id], p = TREE_POS[id];
      if (!p) return;
      var g = el('g', { 'class': 'a-tree__node', 'data-branch': s.branch, 'data-id': id }, nodeLayer);
      el('polygon', { points: bevelBox(p[0], p[1], 15, 5), 'class': 'a-tree__box' }, g);
      var core = el('rect', { x: p[0] - 5, y: p[1] - 5, width: 10, height: 10, 'class': 'a-tree__core' }, g);
      var label = el('text', { x: p[0], y: p[1] + 36, 'text-anchor': 'middle' }, g);
      label.textContent = s.name.toLocaleUpperCase(locale());
      var pipsOn = [];
      for (var k = 0; k < 5; k++) {
        var px = p[0] - 28 + k * 12;
        el('rect', { x: px, y: p[1] + 44, width: 8, height: 8, 'class': 'a-tree__pip' }, g);
        if (k < s.level) pipsOn.push(el('rect', { x: px, y: p[1] + 44, width: 8, height: 8, 'class': 'a-tree__pip is-on' }, g));
      }
      // generous hit area
      el('rect', { x: p[0] - 90, y: p[1] - 20, width: 180, height: 78, fill: 'transparent' }, g);
      nodes[id] = { g: g, core: core, label: label, pips: pipsOn };
      if (reduced) g.classList.add('is-unlocked');
    });

    /* hover: tooltip + highlight path to root */
    function chain(id) { var out = []; var s = skills[id]; while (s) { out.push(s.id); s = skills[s.parent]; } return out; }
    var tints = { game: color('--c-phosphor', '#B6F23A'), systems: color('--c-cyan', '#43E0C2'), core: color('--c-amber', '#F2B544') };
    order.forEach(function (id) {
      var n = nodes[id];
      if (!n) return;
      n.g.addEventListener('pointerenter', function () {
        var s = skills[id];
        chain(id).forEach(function (cid) {
          if (edges[cid]) edges[cid].classList.add('is-hot');
          if (nodes[cid]) nodes[cid].g.classList.add('is-hot');
        });
        showTip({
          type: t('about.skills.branch.' + s.branch),
          level: t('about.skills.level', { n: s.level }),
          name: s.name, flavor: s.flavor, color: tints[s.branch], follow: true
        });
        var c = S();
        if (c && c.cursor && typeof c.cursor.set === 'function') { try { c.cursor.set('link'); } catch (e) {} }
      });
      n.g.addEventListener('pointerleave', function () {
        qsa('.is-hot', svg).forEach(function (h) { h.classList.remove('is-hot'); });
        hideTip();
        var c = S();
        if (c && c.cursor && typeof c.cursor.reset === 'function') { try { c.cursor.reset(); } catch (e) {} }
      });
    });

    if (reduced || !ST) {
      if (spentEl) spentEl.textContent = pad(total, 2);
      return;
    }

    /* initial locked state */
    order.forEach(function (id) {
      var n = nodes[id];
      if (!n) return;
      gsap.set(n.g, { opacity: 0.3 });
      gsap.set(n.core, { scale: 0, transformOrigin: '50% 50%' });
      gsap.set(n.pips, { opacity: 0 });
    });

    /* Mouse depth on the whole tree (desktop) */
    var treeVisible = false;
    watch(sec, function (v) { treeVisible = v; });
    if (!isTouch()) {
      gsap.set(svg, { transformPerspective: 1400 });
      var rx = gsap.quickTo(svg, 'rotationX', { duration: 0.8, ease: 'power3.out' });
      var ry = gsap.quickTo(svg, 'rotationY', { duration: 0.8, ease: 'power3.out' });
      var lnx = 9, lny = 9;
      addTick(function () {
        if (!treeVisible) return;
        if (Math.abs(mouse.nx - lnx) < 0.01 && Math.abs(mouse.ny - lny) < 0.01) return;
        lnx = mouse.nx; lny = mouse.ny;
        rx(-lny * 3);
        ry(lnx * 4);
      });
    }

    var mm = gsap.matchMedia ? gsap.matchMedia() : null;
    function buildPin() {
      var maxD = 0;
      order.forEach(function (id) { maxD = Math.max(maxD, skills[id].depth); });
      var spent = { v: 0 };
      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: sec, start: 'top top', end: '+=200%', pin: qs('.a-skills__pin', sec),
          scrub: 1, anticipatePin: 1, invalidateOnRefresh: true
        }
      });
      tl.from(rootG, { scale: 0.4, opacity: 0, transformOrigin: '50% 50%', duration: 0.4, ease: 'back.out(2)' }, 0);
      var running = 0;
      for (var d = 1; d <= maxD; d++) {
        var at = 0.3 + (d - 1) * 1;
        var tier = order.filter(function (id) { return skills[id].depth === d; });
        tier.forEach(function (id, k) {
          var n = nodes[id];
          if (edges[id]) tl.to(edges[id], { attr: { 'stroke-dashoffset': 0 }, duration: 0.5 }, at + k * 0.05);
          if (!n) return;
          var u = at + 0.45 + k * 0.05;
          tl.to(n.g, { opacity: 1, duration: 0.15 }, u);
          tl.call(function (g) { return function () { g.classList.add('is-unlocked'); }; }(n.g), null, u);
          tl.to(n.core, { scale: 1, duration: 0.2, ease: 'back.out(3)' }, u);
          tl.to(n.pips, { opacity: 1, duration: 0.08, stagger: 0.06 }, u + 0.1);
          running += skills[id].level;
        });
        tl.to(spent, {
          v: running, duration: 0.6,
          onUpdate: function () { if (spentEl) spentEl.textContent = pad(Math.round(spent.v), 2); }
        }, at + 0.3);
        tl.call(function () { bg('pulse', 0.3); }, null, at + 0.45);
      }
      tl.to({}, { duration: 0.6 });
      // keep "is-unlocked" class in sync when scrubbing back
      tl.eventCallback('onUpdate', function () {
        var p = tl.time();
        order.forEach(function (id) {
          var n = nodes[id];
          if (n) n.g.classList.toggle('is-unlocked', p >= 0.3 + (skills[id].depth - 1) + 0.45);
        });
      });
      return function () {
        order.forEach(function (id) { if (nodes[id]) nodes[id].g.classList.remove('is-unlocked'); });
      };
    }

    if (mm) {
      mm.add('(min-width: 769px)', buildPin);
      mm.add('(max-width: 768px)', function () {
        if (spentEl) spentEl.textContent = pad(total, 2);
      });
    } else if (window.innerWidth > 768) {
      buildPin();
    }
  }

  /* ==================================================================
     A5 · EQUIPPED — slot snap-in + item tooltips
     ================================================================== */
  function initEquipped() {
    var sec = qs('.a-equipped');
    if (!sec) return;
    var gsap = window.gsap, ST = window.ScrollTrigger, reduced = isReduced();
    var grid = qs('.a-inv__grid', sec);
    var slots = qsa('.a-slot', sec);

    if (gsap && ST && !reduced && grid) {
      gsap.from(slots, {
        scale: 0.4, opacity: 0, rotation: -6,
        duration: 0.6, ease: 'back.out(1.7)',
        stagger: { each: 0.06, grid: 'auto', from: 'start' },
        scrollTrigger: { trigger: grid, start: 'top 80%', once: true },
        onComplete: function () { gsap.set(slots, { clearProps: 'transform,opacity' }); }
      });
    }

    function info(slot) {
      var id = (slot.getAttribute('aria-describedby') || '').split(' ')[0];
      var src = id ? doc.getElementById(id) : null;
      var nameEl = qs('.a-slot__name', slot);
      var r = '';
      try { r = getComputedStyle(slot).getPropertyValue('--r').trim(); } catch (e) {}
      return {
        type: src ? (qs('.a-tip__type', src) || {}).textContent : '',
        flavor: src ? (qs('.a-tip__flavor', src) || {}).textContent : '',
        name: slot.classList.contains('a-slot--empty') ? '' : (nameEl ? nameEl.textContent : ''),
        level: (qs('.a-slot__num', slot) || {}).textContent ? '#' + qs('.a-slot__num', slot).textContent : '',
        color: r && r.indexOf('rgba') !== 0 ? r : ''
      };
    }

    slots.forEach(function (slot) {
      slot.addEventListener('pointerenter', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        var o = info(slot); o.follow = true;
        showTip(o);
      });
      slot.addEventListener('pointerleave', hideTip);
      slot.addEventListener('focus', function () {
        var r = slot.getBoundingClientRect();
        var o = info(slot); o.follow = false; o.x = r.right - 10; o.y = r.top;
        showTip(o);
      });
      slot.addEventListener('blur', hideTip);
      slot.addEventListener('click', function () {
        if (!gsap || reduced) return;
        var glyph = qs('.a-slot__glyph', slot) || qs('.a-slot__name', slot);
        gsap.fromTo(glyph, { rotation: -12, scale: 0.8 }, { rotation: 0, scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)', clearProps: 'transform' });
        bg('pulse', slot.classList.contains('a-slot--legendary') ? 0.6 : 0.2);
      });
    });
  }

  /* ==================================================================
     Boot
     ================================================================== */
  onReady(function () {
    if (window.gsap && window.ScrollTrigger && window.gsap.registerPlugin) {
      try { window.gsap.registerPlugin(window.ScrollTrigger); } catch (e) {}
    }
    getTooltip();
    addTick(tickTip);

    [initHero, initStory, initSaves, initSkills, initEquipped].forEach(function (fn) {
      try { fn(); } catch (e) { if (window.console) console.error('[about]', fn.name, e); }
    });

    var s = S();
    if (s && has(s, 'on')) {
      try { s.on('transition:start', function () { removeTicks(); hideTip(); }); } catch (e) {}
    }
    if (has(s, 'refresh')) { try { s.refresh(); } catch (e) {} }
    else if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  });
})();
