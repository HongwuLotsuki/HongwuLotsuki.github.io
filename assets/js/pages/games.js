/* =====================================================================
   INVENTORY — pages/games.js  (games.html · slot 03 · Phosphor)
   HUD frame · level-select hero · horizontal level gallery with
   generative covers · loadout · "Stock Hunter" arcade.
   Classic script, no globals. Defensive against a partial SITE API.
   ===================================================================== */
(function () {
  'use strict';
  if (!document.body || document.body.getAttribute('data-page') !== 'games') { return; }

  var W = window, D = document, H = D.documentElement;
  var S = W.SITE || null;
  var gsap = W.gsap || null;
  var ST = W.ScrollTrigger || null;
  if (gsap && ST && gsap.registerPlugin) { try { gsap.registerPlugin(ST); } catch (e) {} }

  /* ------------------------------------------------------------------
     Safe helpers (feature-detect every SITE method)
     ------------------------------------------------------------------ */
  function fn(o, k) { return !!(o && typeof o[k] === 'function'); }
  function qs(s, r) { return (r || D).querySelector(s); }
  function qsa(s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function now() { return (W.performance && performance.now) ? performance.now() : Date.now(); }
  function pad(n, l) { n = String(Math.max(0, Math.floor(n))); while (n.length < l) { n = '0' + n; } return n; }

  function isReduced() { return (S && typeof S.reducedMotion === 'boolean') ? S.reducedMotion : H.classList.contains('is-reduced'); }
  function isTouch() { return (S && typeof S.isTouch === 'boolean') ? S.isTouch : H.classList.contains('is-touch'); }
  function lang() { return (S && S.lang) || ('en'); }
  function locale() { return (S && S.locale) || ('en-US'); }
  function upper(s) { try { return String(s).toLocaleUpperCase('en-US'); } catch (e) { return String(s).toUpperCase(); } }
  function fmt(n) { try { return Number(n).toLocaleString(locale()); } catch (e) { return String(n); } }

  function t(key, vars) {
    var s = null, k;
    if (fn(S, 't')) { try { s = S.t(key, vars); } catch (e) { s = null; } }
    if (!s || s === key) {
      var I = W.I18N || {}, L = I[lang()] || {}, T = I.en || {};
      s = L[key] || T[key] || key;
      if (vars) { for (k in vars) { if (vars.hasOwnProperty(k)) { s = s.split('{' + k + '}').join(vars[k]); } } }
    }
    return s;
  }

  function color(name, fb) {
    var v = '';
    if (fn(S, 'color')) { try { v = S.color(name); } catch (e) { v = ''; } }
    if (!v) { try { v = getComputedStyle(D.body).getPropertyValue(name).trim(); } catch (e) { v = ''; } }
    return v || fb;
  }

  var store = {
    get: function (k) {
      if (S && S.store && fn(S.store, 'get')) { try { return S.store.get(k); } catch (e) { return null; } }
      try { return W.localStorage.getItem(k); } catch (e) { return null; }
    },
    set: function (k, v) {
      if (S && S.store && fn(S.store, 'set')) { try { S.store.set(k, v); } catch (e) {} return; }
      try { W.localStorage.setItem(k, String(v)); } catch (e) {}
    }
  };

  /* Ticker: SITE.ticker → gsap.ticker → rAF. Callbacks get dt in seconds. */
  var tickers = [];
  function addTick(cb) {
    if (cb._on) { return; }
    var last = now();
    cb._w = function () { var n = now(), dt = Math.min(0.1, Math.max(0, (n - last) / 1000)); last = n; cb(dt); };
    cb._on = true;
    if (S && S.ticker && fn(S.ticker, 'add')) { S.ticker.add(cb._w); cb._via = 's'; }
    else if (gsap && gsap.ticker) { gsap.ticker.add(cb._w); cb._via = 'g'; }
    else {
      cb._via = 'r';
      (function loop() { if (!cb._on) { return; } cb._w(); cb._raf = W.requestAnimationFrame(loop); })();
    }
    tickers.push(cb);
  }
  function removeTick(cb) {
    if (!cb._on) { return; }
    cb._on = false;
    if (cb._via === 's') { try { S.ticker.remove(cb._w); } catch (e) {} }
    else if (cb._via === 'g') { gsap.ticker.remove(cb._w); }
    else if (cb._raf) { W.cancelAnimationFrame(cb._raf); }
    var i = tickers.indexOf(cb); if (i > -1) { tickers.splice(i, 1); }
  }

  function scrollY() { return (S && S.scroll && typeof S.scroll.y === 'number') ? S.scroll.y : (W.pageYOffset || H.scrollTop || 0); }
  function scrollToY(y, immediate) {
    if (S && S.lenis && fn(S.lenis, 'scrollTo')) { try { S.lenis.scrollTo(y, immediate ? { immediate: true, force: true } : { duration: 1.1, force: true }); return; } catch (e) {} }
    if (!immediate && fn(S, 'scrollTo')) { try { S.scrollTo(y); return; } catch (e) {} }
    try { W.scrollTo({ top: y, behavior: immediate || isReduced() ? 'auto' : 'smooth' }); } catch (e) { W.scrollTo(0, y); }
  }
  function scrollToEl(el) {
    if (!el) { return; }
    if (fn(S, 'scrollTo')) { try { S.scrollTo(el); return; } catch (e) {} }
    scrollToY(el.getBoundingClientRect().top + scrollY(), false);
  }
  function lockScroll(on) {
    if (on) {
      if (fn(S, 'stop')) { try { S.stop(); return; } catch (e) {} }
      if (S && S.lenis && fn(S.lenis, 'stop')) { S.lenis.stop(); }
    } else {
      if (fn(S, 'start')) { try { S.start(); return; } catch (e) {} }
      if (S && S.lenis && fn(S.lenis, 'start')) { S.lenis.start(); }
    }
  }
  function bg(method, a, b) { if (S && S.bg && fn(S.bg, method) && S.bg.enabled !== false) { try { S.bg[method](a, b); } catch (e) {} } }
  function toast(text, opts) { if (fn(S, 'toast')) { try { S.toast(text, opts); } catch (e) {} } }
  function on(evt, cb) { if (fn(S, 'on')) { try { S.on(evt, cb); } catch (e) {} } }
  function refresh() {
    if (fn(S, 'refresh')) { try { S.refresh(); return; } catch (e) {} }
    if (ST) { ST.refresh(); }
  }
  function onResize(cb) {
    if (fn(S, 'onResize')) { try { S.onResize(cb); return; } catch (e) {} }
    var lw = W.innerWidth, tm;
    W.addEventListener('resize', function () { clearTimeout(tm); tm = setTimeout(function () { if (W.innerWidth !== lw) { lw = W.innerWidth; cb(); } }, 200); });
  }
  function onReady(cb) {
    if (fn(S, 'onReady')) { S.onReady(cb); return; }
    var go = function () { H.classList.remove('is-loading'); H.classList.add('is-ready'); setTimeout(cb, 0); };
    if (D.readyState === 'loading') { D.addEventListener('DOMContentLoaded', go); } else { go(); }
  }
  function io(el, cb, opts) {
    if (!el) { return null; }
    if (!('IntersectionObserver' in W)) { cb(true, 1); return null; }
    var o = new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting, e.intersectionRatio, e.target); }); }, opts || {});
    o.observe(el);
    return o;
  }

  var REDUCED = isReduced();
  var TOUCH = isTouch();
  var CAN_PIN = !!(gsap && ST) && !REDUCED && !TOUCH;
  var mq = W.matchMedia ? W.matchMedia('(min-width: 768px)') : { matches: true };

  /* Shared pointer + velocity (cheap, event-driven) */
  var ptr = { x: W.innerWidth / 2, y: W.innerHeight / 2, moved: false };
  if (!TOUCH) {
    W.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse' || e.pointerType === 'pen') { ptr.x = e.clientX; ptr.y = e.clientY; ptr.moved = true; } }, { passive: true });
  }
  var vel = { v: 0, lastY: 0 };
  function velocity() { return (S && S.scroll && typeof S.scroll.velocity === 'number') ? S.scroll.velocity : vel.v; }

  var P = {};
  function readPalette() {
    P.ink = color('--c-ink', '#0C0D0B'); P.ink2 = color('--c-ink-2', '#131411'); P.ink3 = color('--c-ink-3', '#1C1D19');
    P.ink4 = color('--c-ink-4', '#26271F'); P.bone = color('--c-bone', '#ECE7DC'); P.dim = color('--c-bone-dim', '#A39F95');
    P.mute = color('--c-mute', '#6B685F'); P.acc = color('--c-phosphor', '#B6F23A'); P.laser = color('--c-laser', '#FF4A1C');
    P.amber = color('--c-amber', '#F2B544'); P.cyan = color('--c-cyan', '#43E0C2'); P.violet = color('--c-violet', '#8A7CFF');
  }

  /* ==================================================================
     1 · HUD FRAME
     ================================================================== */
  function initHUD() {
    var hud = qs('.g-hud'); if (!hud) { return; }
    var hpBox = qs('.g-hud__hp', hud), fill = qs('.g-hud__fill', hud), hpNum = qs('.g-hud__hpnum', hud);
    var scoreNum = qs('.g-hud__scorenum', hud), fpsNum = qs('.g-hud__fpsnum', hud);
    var dot = qs('.g-hud__dot', hud), ticksWrap = qs('.g-hud__ticks', hud), mapBox = qs('.g-hud__mapbox', hud);
    var maxY = 1, marks = [], mapH = 120, dist = 0, lastY = scrollY(), lastHp = -1, lastScore = -1, lastSec = -1;
    var frames = 0, fpsT = 0;

    function measure() {
      maxY = Math.max(1, Math.max(D.body.scrollHeight, H.scrollHeight) - W.innerHeight);
      mapH = mapBox ? mapBox.clientHeight || 120 : 120;
      if (!ticksWrap) { return; }
      ticksWrap.innerHTML = '';
      var y0 = scrollY();
      marks = qsa('main > section').map(function (sec) {
        var top = sec.getBoundingClientRect().top + y0, i = D.createElement('i');
        i.style.top = (clamp(top / maxY, 0, 1) * 100) + '%';
        ticksWrap.appendChild(i);
        return { top: top, el: i };
      });
    }
    measure();
    if (ST) { ST.addEventListener('refresh', measure); }
    onResize(measure);
    W.addEventListener('load', measure);

    addTick(function (dt) {
      var y = scrollY();
      /* fallback velocity if SITE has none */
      if (dt > 0) { vel.v = lerp(vel.v, clamp((y - vel.lastY) / dt / 3500, -1, 1), 0.15); vel.lastY = y; }
      frames++; fpsT += dt;
      if (fpsT >= 0.5) {
        if (fpsNum && hud.classList.contains('is-on') && W.innerWidth >= 768) { var f = pad(Math.min(99, Math.round(frames / fpsT)), 2); if (fpsNum.textContent !== f) { fpsNum.textContent = f; } }
        frames = 0; fpsT = 0;
      }
      if (y === lastY && lastHp > -1) { return; }
      var p = clamp(y / maxY, 0, 1), hp = 1 - p;
      dist += Math.abs(y - lastY); lastY = y;
      var hpI = Math.round(hp * 100);
      if (hpI !== lastHp) {
        lastHp = hpI;
        if (fill) { fill.style.transform = 'scaleX(' + hp.toFixed(3) + ')'; }
        if (hpNum) { hpNum.textContent = pad(hpI, 3); }
        if (hpBox) { hpBox.classList.toggle('is-low', hp < 0.2); }
        if (dot) { dot.style.transform = 'translate3d(0,' + (3 + p * (mapH - 6)).toFixed(1) + 'px,0)'; }
        var cur = -1, probe = y + W.innerHeight * 0.5;
        for (var i = 0; i < marks.length; i++) { if (marks[i].top <= probe) { cur = i; } }
        if (cur !== lastSec) { marks.forEach(function (m, j) { m.el.classList.toggle('is-active', j === cur); }); lastSec = cur; }
      }
      var sc = Math.floor(dist * 7);
      if (sc !== lastScore && scoreNum) { lastScore = sc; scoreNum.textContent = pad(Math.min(sc, 999999), 6); }
    });

    var footer = qs('.site-footer');
    io(footer, function (vis) { hud.classList.toggle('is-away', vis); }, { rootMargin: '0px 0px -30% 0px' });
    return function show() { hud.classList.add('is-on'); };
  }

  /* ==================================================================
     2 · HERO — level select, 8-bit drop, RGB split
     ================================================================== */
  function initHero(showHud) {
    var hero = qs('.g-hero'), title = qs('.g-hero__title');
    if (!hero || !title) { if (showHud) { showHud(); } return; }
    var main = qs('.g-hero__layer--main', title);

    /* own tiny char split (core's split is reserved for proximity elements) */
    qsa('.g-hero__line', main).forEach(function (line) {
      var txt = line.textContent.replace(/\s+/g, ' ').trim();
      line.textContent = '';
      Array.from(txt).forEach(function (ch) {
        var s = D.createElement('span'); s.className = 'g-ch';
        s.textContent = ch === ' ' ? ' ' : ch;
        line.appendChild(s);
      });
    });
    main.setAttribute('aria-hidden', 'true');

    var ghosts = ['a', 'b', 'c'].map(function (k) {
      var g = main.cloneNode(true);
      g.className = 'g-hero__layer g-hero__ghost g-hero__ghost--' + k;
      title.appendChild(g);
      return { el: g, x: 0, y: 0, vx: 0, vy: 0 };
    });
    var chars = qsa('.g-ch', main);
    title.classList.add('is-in');

    function finish() {
      title.classList.add('is-split-on');
      if (!REDUCED) { ghosts.forEach(function (g, i) { g.vx = (i === 1 ? -1 : 1) * rand(14, 22); g.vy = rand(-8, 8); }); }
      bg('scan', { duration: 1.2, direction: 'down' });
      if (showHud) { showHud(); }
    }

    if (REDUCED || !gsap) { finish(); }
    else {
      gsap.fromTo(chars, { yPercent: -150, opacity: 0 }, {
        yPercent: 0, opacity: 1, duration: 0.6, ease: 'steps(6)',
        stagger: { each: 0.05, from: 'start' }, onComplete: finish
      });
    }

    /* RGB split spring — only ticks while the hero is in view */
    var inView = true, time = 0;
    var tick = function (dt) {
      time += dt;
      var k = Math.min(1, dt * 60);
      var dx, dy;
      if (TOUCH) { dx = Math.sin(time * 0.9) * 0.5; dy = Math.cos(time * 0.7) * 0.4; }
      else { dx = clamp((ptr.x - W.innerWidth / 2) / (W.innerWidth / 2), -1, 1); dy = clamp((ptr.y - W.innerHeight / 2) / (W.innerHeight / 2), -1, 1); }
      var v = velocity() * 14;
      var targets = [[dx * 10, dy * 6 + v], [-dx * 10, -dy * 6 - v], [dx * 3, -dy * 3]];
      var moving = false;
      for (var j = 0; j < 3 && !moving; j++) {
        var q = ghosts[j];
        if (Math.abs(q.vx) + Math.abs(q.vy) > 0.02 || Math.abs(targets[j][0] - q.x) + Math.abs(targets[j][1] - q.y) > 0.05) { moving = true; }
      }
      if (!moving) { return; }
      for (var i = 0; i < 3; i++) {
        var g = ghosts[i];
        g.vx += (targets[i][0] - g.x) * 0.09 * k; g.vy += (targets[i][1] - g.y) * 0.09 * k;
        g.vx *= Math.pow(0.8, k); g.vy *= Math.pow(0.8, k);
        g.x += g.vx * k; g.y += g.vy * k;
        g.el.style.transform = 'translate3d(' + g.x.toFixed(2) + 'px,' + g.y.toFixed(2) + 'px,0)';
      }
    };
    if (!REDUCED) {
      io(hero, function (vis) { inView = vis; if (vis) { addTick(tick); } else { removeTick(tick); } });
      addTick(tick);
    }

    /* scroll exit: title lifts + dims (scrubbed, linear) */
    if (gsap && ST && !REDUCED) {
      gsap.to(title, { y: function () { return -W.innerHeight * 0.18; }, opacity: 0.25, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true } });
    }

    /* World map nodes → jump to a level */
    var avatar = qs('.g-world__avatar');
    var nodes = qsa('.g-world__node');
    function moveAvatar(n) {
      if (!avatar || !n) { return; }
      var li = n.parentNode;
      avatar.style.transform = 'translate(' + (li.offsetLeft + n.offsetWidth / 2 - 6) + 'px, -4px)';
    }
    nodes.forEach(function (n) {
      var idx = parseInt(n.getAttribute('data-goto-level'), 10) || 0;
      n.setAttribute('title', t('games.hero.goto', { n: n.textContent }));
      n.addEventListener('pointerenter', function () { moveAvatar(n); });
      n.addEventListener('focus', function () { moveAvatar(n); });
      n.addEventListener('click', function () { moveAvatar(n); if (levelsApi) { levelsApi.goTo(idx); } });
    });
    if (nodes[0]) { setTimeout(function () { moveAvatar(nodes[0]); }, 50); }
  }

  /* ==================================================================
     3 · GENERATIVE COVERS
     ================================================================== */
  var COVERS = {};

  /* 1-1 Lost Shelf — parallax pixel shelves + tiny worker */
  COVERS.shelf = { px: 4, make: function () {
    var stars = [];
    function racks(ctx, w, h, off, spacing, rackW, top, bot, gap, cFrame, cBox, seed) {
      var start = Math.floor(-off / spacing) - 1, end = start + Math.ceil(w / spacing) + 3;
      ctx.fillStyle = cFrame;
      for (var r = start; r < end; r++) {
        var x = Math.round(r * spacing + off);
        ctx.fillRect(x, top, 1, bot - top); ctx.fillRect(x + rackW, top, 1, bot - top);
        for (var y = top; y < bot; y += gap) { ctx.fillRect(x, y, rackW + 1, 1); }
      }
      for (r = start; r < end; r++) {
        var x0 = Math.round(r * spacing + off), s = 0;
        for (var yy = top + gap; yy <= bot; yy += gap) {
          s++;
          var hs = hash(r * 31.7 + s * 7.3 + seed);
          if (hs < 0.25) { continue; }
          var bw = 3 + Math.floor(hs * (rackW - 5)), bh = 2 + Math.floor(hash(hs * 91) * (gap - 3));
          ctx.fillStyle = cBox; ctx.fillRect(x0 + 2, yy - bh, bw, bh);
        }
      }
    }
    return {
      init: function (w, h) { stars = []; for (var i = 0; i < 26; i++) { stars.push([Math.floor(hash(i * 3.1) * w), Math.floor(hash(i * 7.7) * h * 0.4), hash(i * 1.3) * 6]); } },
      draw: function (ctx, w, h, t, m) {
        ctx.fillStyle = P.ink; ctx.fillRect(0, 0, w, h);
        for (var i = 0; i < stars.length; i++) { var s = stars[i]; if (Math.sin(t * 2 + s[2]) > -0.2) { ctx.fillStyle = s[2] > 4 ? P.acc : P.mute; ctx.fillRect(s[0], s[1], 1, 1); } }
        var floor = h - 14, mx = (m.x - 0.5);
        racks(ctx, w, h, -t * 2 - mx * 6, 26, 20, floor - Math.round(h * 0.62), floor, 9, P.ink3, P.ink3, 1);
        racks(ctx, w, h, -t * 5 - mx * 14, 38, 30, floor - Math.round(h * 0.48), floor, 12, P.ink4, P.mute, 2);
        /* the lost (glowing) box on the mid layer */
        var lx = Math.round(((w * 0.62 - t * 5 - mx * 14) % (w + 40) + w + 40) % (w + 40) - 20);
        if (Math.sin(t * 5) > -0.4) { ctx.fillStyle = P.acc; ctx.fillRect(lx, floor - 25, 7, 5); ctx.fillStyle = P.ink; ctx.fillRect(lx + 3, floor - 25, 1, 5); }
        ctx.fillStyle = P.ink2; ctx.fillRect(0, floor, w, h - floor);
        ctx.fillStyle = P.ink4; ctx.fillRect(0, floor, w, 1);
        for (i = 0; i < w; i += 6) { ctx.fillRect(Math.round(i - (t * 12) % 6), floor + 4, 3, 1); }
        /* worker: walks across carrying a phosphor box */
        var span = w + 24, wx = Math.round((t * 13) % span - 12), step = Math.floor(t * 8) % 2, by = floor - 9 - (step ? 0 : 1);
        ctx.fillStyle = P.acc; ctx.fillRect(wx + 3, by - 4, 5, 4);
        ctx.fillStyle = P.bone; ctx.fillRect(wx + 1, by - 3, 2, 2); ctx.fillRect(wx, by - 1, 4, 5);
        ctx.fillRect(step ? wx : wx + 1, by + 4, 1, 4); ctx.fillRect(step ? wx + 3 : wx + 2, by + 4, 1, 4);
        /* foreground posts */
        racks(ctx, w, h, -t * 10 - mx * 30, 70, 6, floor - Math.round(h * 0.8), h, 200, P.ink2, P.ink2, 3);
        ctx.fillStyle = P.ink2;
        var fo = ((-t * 10 - mx * 30) % 70 + 70) % 70;
        for (var x = fo - 70; x < w; x += 70) { ctx.fillRect(Math.round(x), 0, 4, h); }
      }
    };
  } };

  /* 1-2 Neon Kurye — isometric city + A*-style delivery routes */
  COVERS.city = { px: 2, make: function () {
    var N = 11, tw, th, ox, oy, heights = [], off = null, route = [], seg = 0, segT = 0, trail = [], cur = [0, 0], dest = [0, 0], burst = 0;
    function iso(i, j) { return [ox + (i - j) * tw / 2, oy + (i + j) * th / 2]; }
    function isRoad(i, j) { return i % 3 === 0 || j % 3 === 0; }
    function poly(c, pts, f) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (var k = 2; k < pts.length; k += 2) { c.lineTo(pts[k], pts[k + 1]); } c.closePath(); c.fillStyle = f; c.fill(); }
    function plan() {
      var nodes = [0, 3, 6, 9];
      var to;
      do { to = [nodes[Math.floor(Math.random() * 4)], nodes[Math.floor(Math.random() * 4)]]; } while (to[0] === cur[0] && to[1] === cur[1]);
      route = [cur.slice()];
      var a = cur.slice(), first = Math.random() < 0.5 ? 0 : 1;
      while (a[first] !== to[first]) { a[first] += a[first] < to[first] ? 1 : -1; route.push(a.slice()); }
      var sec = 1 - first;
      while (a[sec] !== to[sec]) { a[sec] += a[sec] < to[sec] ? 1 : -1; route.push(a.slice()); }
      dest = to; seg = 0; segT = 0;
    }
    return {
      init: function (w, h) {
        tw = Math.max(8, Math.floor(w / (N + 1)) & ~1); th = tw / 2;
        ox = w / 2; oy = h / 2 - (N * th) / 2 + th;
        heights = [];
        for (var i = 0; i < N; i++) { for (var j = 0; j < N; j++) { heights.push(isRoad(i, j) ? 0 : Math.round((0.3 + hash(i * 13 + j * 7) * 1.4) * th * (1 + hash(i + j * 3) * 1.6))); } }
        off = D.createElement('canvas'); off.width = w; off.height = h;
        var c = off.getContext('2d');
        for (var s = 0; s < N * 2; s++) {
          for (i = 0; i < N; i++) {
            j = s - i; if (j < 0 || j >= N) { continue; }
            var p = iso(i, j), x = p[0], y = p[1], hh = heights[i * N + j];
            if (!hh) {
              poly(c, [x, y, x + tw / 2, y + th / 2, x, y + th, x - tw / 2, y + th / 2], P.ink2);
              c.fillStyle = P.ink3; c.fillRect(Math.round(x), Math.round(y + th / 2), 1, 1);
              continue;
            }
            poly(c, [x - tw / 2, y + th / 2 - hh, x, y + th - hh, x, y + th, x - tw / 2, y + th / 2], P.ink3);
            poly(c, [x, y + th - hh, x + tw / 2, y + th / 2 - hh, x + tw / 2, y + th / 2, x, y + th], P.ink2);
            poly(c, [x, y - hh, x + tw / 2, y + th / 2 - hh, x, y + th - hh, x - tw / 2, y + th / 2 - hh], P.ink4);
            for (var wy = 4; wy < hh - 2; wy += 4) {
              for (var wx = 2; wx < tw / 2 - 2; wx += 3) {
                if (hash(i * 97 + j * 31 + wy * 3 + wx) > 0.72) {
                  c.fillStyle = hash(wx * 5 + wy + i) > 0.85 ? P.acc : P.mute;
                  c.fillRect(Math.round(x + wx), Math.round(y + th - hh + wy + wx * 0.5), 1, 1);
                }
              }
            }
          }
        }
        cur = [0, 0]; trail = []; plan();
      },
      draw: function (ctx, w, h, t, m, dt) {
        ctx.fillStyle = P.ink; ctx.fillRect(0, 0, w, h);
        var sx = Math.round((m.x - 0.5) * -10), sy = Math.round((m.y - 0.5) * -6);
        ctx.save(); ctx.translate(sx, sy);
        if (off) { ctx.drawImage(off, 0, 0); }
        /* planned route (dim dashes) */
        var k, p, q;
        ctx.fillStyle = P.mute;
        for (k = seg; k < route.length - 1; k++) {
          p = iso(route[k][0], route[k][1]); q = iso(route[k + 1][0], route[k + 1][1]);
          for (var f = 0; f < 1; f += 0.25) { ctx.fillRect(Math.round(lerp(p[0], q[0], f)), Math.round(lerp(p[1], q[1], f) + th / 2), 1, 1); }
        }
        /* move courier */
        segT += dt * 5;
        while (segT >= 1 && seg < route.length - 1) { segT -= 1; seg++; }
        if (seg >= route.length - 1) { cur = dest.slice(); burst = 1; plan(); }
        var a = route[seg], b = route[Math.min(seg + 1, route.length - 1)];
        p = iso(a[0], a[1]); q = iso(b[0], b[1]);
        var px = lerp(p[0], q[0], segT), py = lerp(p[1], q[1], segT) + th / 2;
        trail.push([px, py]); if (trail.length > 46) { trail.shift(); }
        ctx.strokeStyle = P.acc; ctx.lineWidth = 1;
        for (k = 1; k < trail.length; k++) {
          ctx.globalAlpha = k / trail.length;
          ctx.beginPath(); ctx.moveTo(trail[k - 1][0], trail[k - 1][1]); ctx.lineTo(trail[k][0], trail[k][1]); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        var d = iso(dest[0], dest[1]), pulse = (Math.sin(t * 8) + 1) / 2;
        ctx.fillStyle = P.laser; ctx.fillRect(Math.round(d[0]) - 2, Math.round(d[1] + th / 2) - 2, 4, 4);
        ctx.strokeStyle = P.laser; ctx.globalAlpha = 1 - pulse;
        ctx.strokeRect(Math.round(d[0]) - 2 - pulse * 6, Math.round(d[1] + th / 2) - 2 - pulse * 3, 4 + pulse * 12, 4 + pulse * 6);
        ctx.globalAlpha = 1;
        if (burst > 0) { burst -= dt * 2; ctx.strokeStyle = P.acc; ctx.globalAlpha = Math.max(0, burst); var r = (1 - burst) * 24; ctx.strokeRect(px - r, py - r / 2, r * 2, r); ctx.globalAlpha = 1; }
        ctx.fillStyle = P.bone; ctx.fillRect(Math.round(px) - 1, Math.round(py) - 1, 3, 3);
        ctx.restore();
      }
    };
  } };

  /* 1-3 Son Vardiya — flow-field fog + flickering cone following the mouse */
  COVERS.fog = { px: 3, make: function () {
    var parts = [], flick = 1, ang = Math.PI / 2;
    return {
      init: function (w, h) {
        parts = []; for (var i = 0; i < 320; i++) { parts.push([Math.random() * w, Math.random() * h]); }
      },
      draw: function (ctx, w, h, t, m, dt) {
        ctx.globalAlpha = 0.14; ctx.fillStyle = P.ink; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1;
        var lx = w * 0.5, ly = 4;
        var tx = m.in ? m.x * w : w * 0.5 + Math.sin(t * 0.5) * w * 0.3, ty = m.in ? m.y * h : h * 0.8;
        var target = Math.atan2(ty - ly, tx - lx);
        ang = lerp(ang, target, Math.min(1, dt * 4));
        flick = Math.random() < 0.04 ? rand(0.15, 0.5) : lerp(flick, 1, 0.2);
        var half = 0.32, len = h * 1.3;
        ctx.globalAlpha = 0.05 * flick; ctx.fillStyle = P.bone;
        ctx.beginPath(); ctx.moveTo(lx, ly);
        ctx.lineTo(lx + Math.cos(ang - half) * len, ly + Math.sin(ang - half) * len);
        ctx.lineTo(lx + Math.cos(ang + half) * len, ly + Math.sin(ang + half) * len);
        ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
        var ca = Math.cos(ang), sa = Math.sin(ang), cosH = Math.cos(half);
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          var a = Math.sin(p[0] * 0.035 + t * 0.3) * 1.6 + Math.cos(p[1] * 0.04 - t * 0.25) * 1.6;
          p[0] += Math.cos(a) * 9 * dt; p[1] += Math.sin(a) * 5 * dt - 1.5 * dt;
          if (p[0] < 0) { p[0] += w; } else if (p[0] >= w) { p[0] -= w; }
          if (p[1] < 0) { p[1] += h; } else if (p[1] >= h) { p[1] -= h; }
          var dx = p[0] - lx, dy = p[1] - ly, dl = Math.sqrt(dx * dx + dy * dy) || 1;
          var lit = (dx * ca + dy * sa) / dl > cosH;
          ctx.globalAlpha = lit ? 0.9 * flick : 0.35;
          ctx.fillStyle = lit ? (i % 9 === 0 ? P.acc : P.bone) : P.ink4;
          ctx.fillRect(p[0] | 0, p[1] | 0, 1, 1);
        }
        ctx.globalAlpha = 1;
        /* lamp + figure */
        ctx.fillStyle = P.ink; ctx.fillRect(0, h - 8, w, 8);
        ctx.fillStyle = flick > 0.6 ? P.acc : P.mute; ctx.fillRect(lx - 2, 0, 5, 3);
        var fx = Math.round(w * 0.32);
        ctx.fillStyle = P.ink3; ctx.fillRect(fx, h - 20, 3, 3); ctx.fillRect(fx - 1, h - 17, 5, 6); ctx.fillRect(fx, h - 11, 1, 3); ctx.fillRect(fx + 2, h - 11, 1, 3);
      }
    };
  } };

  /* 1-4 Inventory Tetris — items auto-pack into a grid, rows clear, loop */
  COVERS.tetris = { px: 4, make: function () {
    var SH = [[[0, 0], [1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [2, 0]], [[0, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [2, 0], [1, 1]],
      [[0, 0], [0, 1], [0, 2], [1, 2]], [[0, 0]], [[0, 0], [1, 0]], [[0, 0], [1, 0], [2, 0], [3, 0]], [[1, 0], [0, 1], [1, 1], [2, 1]]];
    var C = 8, R = 10, cs, gx, gy, board, piece = null, clearing = null, clearT = 0, wipe = 0, dropT = 0, cols;
    function rot(cells, r) { var c = cells; for (var k = 0; k < r; k++) { c = c.map(function (p) { return [p[1], -p[0]]; }); } var mx = Math.min.apply(null, c.map(function (p) { return p[0]; })), my = Math.min.apply(null, c.map(function (p) { return p[1]; })); return c.map(function (p) { return [p[0] - mx, p[1] - my]; }); }
    function fits(cells, x, y) { for (var k = 0; k < cells.length; k++) { var cx = cells[k][0] + x, cy = cells[k][1] + y; if (cx < 0 || cx >= C || cy >= R) { return false; } if (cy >= 0 && board[cy][cx] >= 0) { return false; } } return true; }
    function spawn() {
      var base = SH[Math.floor(Math.random() * SH.length)], best = null;
      for (var r = 0; r < 4; r++) {
        var cells = rot(base, r), wdt = Math.max.apply(null, cells.map(function (p) { return p[0]; })) + 1;
        for (var x = 0; x <= C - wdt; x++) {
          if (!fits(cells, x, 0)) { continue; }
          var y = 0; while (fits(cells, x, y + 1)) { y++; }
          var sc = y * 10 + Math.random() * 6;
          for (var k = 0; k < cells.length; k++) { var cy = cells[k][1] + y + 1, cx = cells[k][0] + x; if (cy < R && board[cy][cx] < 0 && !cells.some(function (q) { return q[0] + x === cx && q[1] + y === cy; })) { sc -= 7; } }
          if (!best || sc > best.sc) { best = { cells: cells, x: x, y: y, sc: sc }; }
        }
      }
      if (!best) { wipe = 1; piece = null; return; }
      piece = { cells: best.cells, x: best.x, ty: best.y, y: -3, c: Math.floor(Math.random() * 4) };
    }
    function cell(ctx, x, y, c) {
      ctx.fillStyle = c; ctx.fillRect(x, y, cs - 1, cs - 1);
      ctx.fillStyle = P.ink; ctx.globalAlpha = 0.35; ctx.fillRect(x, y + cs - 2, cs - 1, 1); ctx.fillRect(x + cs - 2, y, 1, cs - 1);
      ctx.globalAlpha = 1; ctx.fillStyle = P.bone; ctx.fillRect(x + 1, y + 1, 1, 1);
    }
    return {
      init: function (w, h) {
        cs = Math.max(4, Math.floor(Math.min(w * 0.82 / C, h * 0.86 / R)));
        gx = Math.floor((w - C * cs) / 2); gy = Math.floor((h - R * cs) / 2);
        board = []; for (var r = 0; r < R; r++) { board.push([-1, -1, -1, -1, -1, -1, -1, -1]); }
        cols = [P.dim, P.cyan, P.acc, P.amber];
        piece = null; clearing = null; wipe = 0;
      },
      draw: function (ctx, w, h, t, m, dt) {
        ctx.fillStyle = P.ink; ctx.fillRect(0, 0, w, h);
        var hov = m.in ? Math.floor((m.x * w - gx) / cs) : -1;
        for (var r = 0; r < R; r++) { for (var c = 0; c < C; c++) {
          ctx.fillStyle = c === hov ? P.ink3 : P.ink2; ctx.fillRect(gx + c * cs, gy + r * cs, cs - 1, cs - 1);
        } }
        ctx.fillStyle = P.ink4; ctx.fillRect(gx - 2, gy - 2, C * cs + 3, 1); ctx.fillRect(gx - 2, gy + R * cs + 1, C * cs + 3, 1);
        ctx.fillRect(gx - 2, gy - 2, 1, R * cs + 4); ctx.fillRect(gx + C * cs + 1, gy - 2, 1, R * cs + 4);
        if (wipe > 0) {
          wipe -= dt * 1.6;
          var cut = Math.floor((1 - Math.max(0, wipe)) * R);
          for (r = 0; r < cut; r++) { for (c = 0; c < C; c++) { board[R - 1 - r][c] = -1; } }
          if (wipe <= 0) { this.init(w, h); }
        } else if (clearing) {
          clearT -= dt;
          if (clearT <= 0) {
            clearing.sort(function (a, b) { return a - b; }).forEach(function (row) { board.splice(row, 1); board.unshift([-1, -1, -1, -1, -1, -1, -1, -1]); });
            clearing = null;
          }
        } else {
          if (!piece) { spawn(); }
          if (piece) {
            dropT += dt;
            while (dropT > 0.055 && piece) {
              dropT -= 0.055; piece.y++;
              if (piece.y >= piece.ty) {
                piece.y = piece.ty;
                for (var k = 0; k < piece.cells.length; k++) { var cy = piece.cells[k][1] + piece.y; if (cy >= 0) { board[cy][piece.cells[k][0] + piece.x] = piece.c; } }
                piece = null;
                var full = [];
                for (r = 0; r < R; r++) { if (board[r].every(function (v) { return v >= 0; })) { full.push(r); } }
                if (full.length) { clearing = full; clearT = 0.35; }
              }
            }
          }
        }
        for (r = 0; r < R; r++) { for (c = 0; c < C; c++) {
          var v = board[r][c]; if (v < 0) { continue; }
          var fl = clearing && clearing.indexOf(r) > -1;
          cell(ctx, gx + c * cs, gy + r * cs, fl ? (Math.floor(t * 20) % 2 ? P.bone : P.acc) : cols[v]);
        } }
        if (piece) { for (k = 0; k < piece.cells.length; k++) { var py = piece.cells[k][1] + piece.y; if (py >= 0) { cell(ctx, gx + (piece.cells[k][0] + piece.x) * cs, gy + py * cs, cols[piece.c]); } } }
      }
    };
  } };

  /* + Locked — static noise + padlock */
  COVERS.locked = { px: 3, make: function () {
    var img = null, acc = 0, band = 0;
    var LOCK = ['..XXXX..', '.X....X.', '.X....X.', 'XXXXXXXX', 'XXXXXXXX', 'XXX..XXX', 'XXX..XXX', 'XXXX.XXX', 'XXXXXXXX'];
    return {
      init: function (w, h, ctx) { img = ctx.createImageData(w, h); acc = 1; },
      draw: function (ctx, w, h, t, m, dt) {
        acc += dt; band = (band + dt * 30) % (h + 20);
        if (acc < 0.07) { return; }
        acc = 0;
        var d = img.data;
        for (var y = 0; y < h; y++) {
          var bb = Math.abs(y - band) < 6 ? 16 : 0;
          for (var x = 0; x < w; x++) { var v = 10 + bb + ((Math.random() * 34) | 0), i = (y * w + x) * 4; d[i] = v; d[i + 1] = v + 2; d[i + 2] = v - 2; d[i + 3] = 255; }
        }
        ctx.putImageData(img, 0, 0);
        var s = Math.max(2, Math.floor(Math.min(w, h) / 30)), lx = Math.floor(w / 2 - 4 * s), ly = Math.floor(h / 2 - 4.5 * s);
        ctx.fillStyle = P.dim;
        for (var r = 0; r < LOCK.length; r++) { for (var c = 0; c < 8; c++) { if (LOCK[r][c] === 'X') { ctx.fillRect(lx + c * s, ly + r * s, s, s); } } }
      }
    };
  } };

  function Cover(canvas, kind) {
    var def = COVERS[kind] || COVERS.locked;
    this.c = canvas; this.ctx = canvas.getContext('2d'); this.px = def.px;
    this.impl = def.make(); this.w = 0; this.h = 0; this.t = Math.random() * 20;
    this.m = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, in: false };
    this.visible = false; this.active = true;
  }
  Cover.prototype.resize = function () {
    var cw = this.c.clientWidth, ch = this.c.clientHeight;
    if (!cw || !ch) { return; }
    var w = Math.max(24, Math.round(cw / this.px)), h = Math.max(24, Math.round(ch / this.px));
    if (w === this.w && h === this.h) { return; }
    this.w = w; this.h = h; this.c.width = w; this.c.height = h;
    this.ctx.imageSmoothingEnabled = false;
    this.impl.init(w, h, this.ctx);
    if (REDUCED) { for (var i = 0; i < 90; i++) { this.frame(1 / 30); } } else { this.frame(0); }
  };
  Cover.prototype.frame = function (dt) {
    if (!this.w) { return; }
    this.t += dt;
    var k = Math.min(1, dt * 6);
    this.m.x = lerp(this.m.x, this.m.tx, k); this.m.y = lerp(this.m.y, this.m.ty, k);
    this.impl.draw(this.ctx, this.w, this.h, this.t, this.m, dt);
  };

  /* ==================================================================
     4 · LEVELS — pinned horizontal gallery (desktop) / native swipe
     ================================================================== */
  var levelsApi = null;
  function initLevels() {
    var sec = qs('.g-levels'); if (!sec) { return; }
    var view = qs('.g-levels__viewport', sec), track = qs('.g-levels__track', sec);
    var cards = qsa('.g-level', sec), col = qs('.g-roll__col', sec);
    var canvases = cards.map(function (card) { return qs('.g-level__canvas', card); });
    var covers = [], st = null, pinned = false, distance = 0, centers = [], widths = [], active = -1, skew = 0, killed = false;
    track.style.position = 'relative';

    cards.forEach(function (card, i) {
      var cv = canvases[i], cover = qs('.g-level__cover', card);
      if (cv && cv.getContext) {
        var c = new Cover(cv, card.getAttribute('data-cover'));
        c.card = card; c.index = i; covers.push(c);
        io(cv, function (vis) { c.visible = vis; if (vis) { c.resize(); } });
        if (cover && !TOUCH) {
          cover.addEventListener('pointermove', function (e) { var r = cover.getBoundingClientRect(); c.m.tx = clamp((e.clientX - r.left) / r.width, 0, 1); c.m.ty = clamp((e.clientY - r.top) / r.height, 0, 1); c.m.in = true; });
          cover.addEventListener('pointerleave', function () { c.m.in = false; c.m.tx = 0.5; c.m.ty = 0.5; });
        }
      }
      /* flip to the back face */
      var front = qs('.g-level__front', card), back = qs('.g-level__back', card), close = qs('.g-level__close', card), flipBtn = qs('.g-level__flip', card);
      if (!back) { return; }
      if ('inert' in back) { back.inert = true; }
      function setFlip(onf, focus) {
        card.classList.toggle('is-flipped', onf);
        back.setAttribute('aria-hidden', onf ? 'false' : 'true');
        front.setAttribute('aria-hidden', onf ? 'true' : 'false');
        if ('inert' in back) { back.inert = !onf; front.inert = onf; }
        if (focus) { var f = onf ? close : flipBtn; if (f) { setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (e) {} }, 60); } }
        if (onf) { bg('pulse', 0.3); }
      }
      card.addEventListener('click', function (e) {
        if (sec._justDragged) { return; }
        if (e.target.closest('a')) { return; }
        if (e.target.closest('.g-level__close')) { setFlip(false, true); return; }
        setFlip(!card.classList.contains('is-flipped'), !!e.target.closest('button'));
      });
    });

    function tickCovers(dt) {
      if (killed) { return; }
      for (var i = 0; i < covers.length; i++) {
        var c = covers[i];
        if (c.visible && (pinned || c.card.classList.contains('is-active') || !TOUCH)) { c.frame(dt); }
      }
      if (pinned && st && gsap) {
        var target = st.isActive ? clamp(-velocity() * 3, -3, 3) : 0;
        skew = lerp(skew, target, Math.min(1, dt * 8));
        if (Math.abs(skew) > 0.01 || target !== 0) { gsap.set(track, { skewX: skew }); }
      }
    }
    if (!REDUCED) {
      io(sec, function (vis) { if (vis) { addTick(tickCovers); } else { removeTick(tickCovers); } });
    }
    on('transition:start', function () { killed = true; removeTick(tickCovers); });

    function setActive(i) {
      if (i === active) { return; }
      active = i;
      cards.forEach(function (c, j) { c.classList.toggle('is-active', j === i); });
      if (col) { col.style.transform = 'translateY(' + (-i * 1.1) + 'em)'; }
      if (i > -1 && !REDUCED) { bg('pulse', 0.2); }
    }

    function measure() {
      distance = Math.max(0, track.scrollWidth - W.innerWidth);
      centers = cards.map(function (c) { return c.offsetLeft + c.offsetWidth / 2; });
      widths = cards.map(function (c) { return c.offsetWidth; });
      covers.forEach(function (c) { c.resize(); });
    }
    function update(self) {
      var x = -self.progress * distance, vw = W.innerWidth, best = 0, bd = 1e9;
      for (var i = 0; i < cards.length; i++) {
        var cx = centers[i] + x, d = Math.abs(cx - vw / 2);
        if (d < bd) { bd = d; best = i; }
        var cv = canvases[i];
        if (cv) { var s = 1 + 0.15 * clamp((cx - vw / 2) / (vw / 2 + widths[i] / 2), 0, 1); cv.style.transform = 'scale(' + s.toFixed(4) + ')'; }
      }
      setActive(best);
    }

    function enablePin() {
      pinned = true;
      sec.classList.add('is-pinned');
      measure();
      var tw = gsap.to(track, {
        x: function () { return -distance; }, ease: 'none',
        scrollTrigger: {
          trigger: sec, start: 'top top', end: function () { return '+=' + distance; },
          pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
          onRefreshInit: measure, onRefresh: function (self) { measure(); update(self); }, onUpdate: update
        }
      });
      st = tw.scrollTrigger;
      initDrag();
      return function () {
        pinned = false; st = null;
        sec.classList.remove('is-pinned');
        if (gsap) { gsap.set(track, { clearProps: 'transform' }); }
        covers.forEach(function (c) { c.c.style.transform = ''; });
        setTimeout(measure, 0);
      };
    }

    /* drag → scroll (desktop pinned only) */
    var dragBound = false;
    function initDrag() {
      if (dragBound) { return; }
      dragBound = true;
      var down = null, vx = 0, lastX = 0, lastT = 0, target = 0;
      view.addEventListener('dragstart', function (e) { if (pinned) { e.preventDefault(); } });
      view.addEventListener('pointerdown', function (e) {
        if (!pinned || !st || e.button !== 0 || e.pointerType === 'touch') { return; }
        down = { x: e.clientX, y: scrollY(), drag: false }; vx = 0; lastX = e.clientX; lastT = now(); target = down.y;
      });
      W.addEventListener('pointermove', function (e) {
        if (!down) { return; }
        var dx = e.clientX - down.x;
        if (!down.drag && Math.abs(dx) > 6) { down.drag = true; view.classList.add('is-dragging'); sec.classList.add('is-dragging-any'); }
        if (!down.drag || !st) { return; }
        var n = now(), dtm = Math.max(1, n - lastT);
        vx = lerp(vx, (e.clientX - lastX) / dtm, 0.35); lastX = e.clientX; lastT = n;
        var ratio = distance ? (st.end - st.start) / distance : 1;
        target = clamp(down.y - dx * ratio * 1.1, st.start, st.end);
        scrollToY(target, true);
      });
      W.addEventListener('pointerup', function () {
        if (!down) { return; }
        var was = down.drag; down = null;
        view.classList.remove('is-dragging'); sec.classList.remove('is-dragging-any');
        if (was && st) {
          sec._justDragged = true; setTimeout(function () { sec._justDragged = false; }, 60);
          scrollToY(clamp(target - vx * 260, st.start, st.end), false);
        }
      });
    }

    /* native mode (touch / reduced / small): active card from IO */
    function nativeActive() {
      if (!('IntersectionObserver' in W)) { setActive(0); return; }
      var o = new IntersectionObserver(function (es) {
        if (pinned) { return; }
        es.forEach(function (e) { if (e.isIntersecting && e.intersectionRatio >= 0.6) { setActive(cards.indexOf(e.target)); } });
      }, { root: view, threshold: [0.6] });
      cards.forEach(function (c) { o.observe(c); });
    }
    nativeActive();
    setActive(0);

    if (CAN_PIN) {
      if (gsap.matchMedia) { gsap.matchMedia().add('(min-width: 768px)', enablePin); }
      else if (mq.matches) { enablePin(); }
    }
    onResize(function () { if (!pinned) { measure(); } });
    W.addEventListener('load', function () { covers.forEach(function (c) { c.resize(); }); });

    levelsApi = {
      goTo: function (i) {
        i = clamp(i, 0, cards.length - 1);
        if (pinned && st) {
          var p = distance ? clamp((centers[i] - W.innerWidth / 2) / distance, 0, 1) : 0;
          scrollToY(st.start + p * (st.end - st.start) + 2, false);
        } else {
          scrollToEl(sec);
          var c = cards[i];
          try { view.scrollTo({ left: c.offsetLeft - (view.clientWidth - c.offsetWidth) / 2, behavior: REDUCED ? 'auto' : 'smooth' }); } catch (e) { view.scrollLeft = c.offsetLeft; }
        }
      }
    };
  }

  /* ==================================================================
     5 · LOADOUT — hotbar items fly into the mech's slots
     ================================================================== */
  function initLoadout() {
    var sec = qs('.g-loadout'); if (!sec) { return; }
    var tiles = qsa('.g-tile', sec), slots = qsa('.g-mech__slot', sec), list = qs('.g-loadout__lines', sec);
    var glyphs = tiles.map(function (tl) { return qs('.g-tile__glyph', tl); });
    var lines = tiles.map(function (tl) {
      var li = D.createElement('li');
      li.textContent = '+ ' + t('games.loadout.equipped', { name: upper(tl.getAttribute('data-name') || '') });
      if (list) { list.appendChild(li); }
      return li;
    });
    var powered = false;
    function setState(n, full) {
      for (var i = 0; i < tiles.length; i++) {
        var onl = i < n;
        if (slots[i]) { slots[i].classList.toggle('is-filled', onl); }
        tiles[i].classList.toggle('is-landed', onl);
        lines[i].classList.toggle('is-on', onl);
      }
      if (full !== powered) {
        powered = full;
        sec.classList.toggle('is-powered', full);
        if (full) { bg('pulse', 1); }
      }
    }

    function staticMode() {
      var done = false;
      io(sec, function (vis) {
        if (!vis || done) { return; }
        done = true;
        if (REDUCED || !gsap) { setState(tiles.length, true); return; }
        gsap.from(tiles, { y: 30, opacity: 0, scale: 0.9, duration: 0.6, ease: 'back.out(1.7)', stagger: 0.08 });
        tiles.forEach(function (x, i) { setTimeout(function () { setState(i + 1, i === tiles.length - 1); }, 300 + i * 160); });
      }, { threshold: 0.25 });
    }

    if (!CAN_PIN) { staticMode(); return; }

    function delta(i) {
      var g = glyphs[i], s = slots[i];
      if (!g || !s) { return { x: 0, y: 0, s: 1 }; }
      var gr = g.getBoundingClientRect(), sr = s.getBoundingClientRect();
      var gx = gsap.getProperty(g, 'x') || 0, gy = gsap.getProperty(g, 'y') || 0, gs = gsap.getProperty(g, 'scale') || 1;
      var cx = gr.left + gr.width / 2 - gx, cy = gr.top + gr.height / 2 - gy, base = gr.width / gs;
      return { x: sr.left + sr.width / 2 - cx, y: sr.top + sr.height / 2 - cy, s: (sr.width * 0.78) / (base || 1) };
    }

    function enable() {
      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: sec, start: 'top top', end: function () { return '+=' + Math.round(W.innerHeight * 1.5); },
          pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: function () {
            var tm = tl.time(), n = 0;
            for (var i = 0; i < glyphs.length; i++) { if (tm >= i * 0.8 + 0.7) { n = i + 1; } }
            setState(n, n === glyphs.length && tl.progress() > 0.97);
          }
        }
      });
      glyphs.forEach(function (g, i) {
        if (!g) { return; }
        var at = i * 0.8, dir = i % 2 ? 1 : -1;
        tl.to(g, { x: function () { return delta(i).x; }, y: function () { return delta(i).y; }, scale: function () { return delta(i).s * 1.3; }, rotation: dir * 8, duration: 0.7, ease: 'power3.inOut' }, at)
          .to(g, { scale: function () { return delta(i).s; }, rotation: 0, duration: 0.3, ease: 'back.out(1.7)' }, at + 0.7)
          .to(qs('.g-tile__meta', tiles[i]), { opacity: 0.45, duration: 0.3, ease: 'none' }, at + 0.5);
      });
      tl.to({}, { duration: 0.8 });
      return function () { setState(0, false); gsap.set(glyphs, { clearProps: 'transform' }); };
    }
    if (gsap.matchMedia) {
      var mm = gsap.matchMedia();
      mm.add('(min-width: 768px)', enable);
      mm.add('(max-width: 767px)', function () { setState(tiles.length, true); });
    } else if (mq.matches) { enable(); } else { staticMode(); }
  }

  /* ==================================================================
     6 · ARCADE — "Stock Hunter"
     ================================================================== */
  function initGame() {
    var canvas = qs('#g-game'); if (!canvas || !canvas.getContext) { return; }
    var ctx = canvas.getContext('2d'), cab = qs('.g-cabinet'), sec = qs('.g-arcade'), startBtn = qs('.g-arcade__start');
    var LW = 320, LH = 200, SC = 1, HI = 'inv-stockhunter-hi', ROUND = 30;
    var hi = parseInt(String(store.get(HI) || '0'), 10) || 0;
    var state = 'attract', T = 0, stT = 0, visible = false, hovering = false, focused = false, locked = false, killed = false, gold = false;
    var score = 0, shown = 0, lives = 3, time = ROUND, combo = 0, mult = 1, best = 0, caught = 0, level = 1, newHi = false, reason = '';
    var items = [], parts = [], texts = [], spawnT = 0, shake = 0, flash = 0, flashC = '', hitStop = 0, banner = null;
    var tray = { x: 160, vx: 0, w: 30, sq: 0 }, keys = { l: 0, r: 0 }, aim = null, demoX = 160;
    var SPR = {}, FONT = '"JetBrains Mono", ui-monospace, monospace';

    var DEFS = {
      box: { pts: 10, rows: ['DDDDmmDDDD', 'DDDDmmDDDD', 'mmmmmmmmmm', 'DDDDDDDDDD', 'DDDbbbbDDD', 'DDDbkkbDDD', 'DDDDDDDDDD', 'mmmmmmmmmm'] },
      coin: { pts: 5, rows: ['..YYYY..', '.YYYYYY.', 'YYbkkYYY', 'YYkYYYYY', 'YYkYYYYY', 'YYYkkYYY', '.YYYYYY.', '..YYYY..'] },
      label: { pts: 15, rows: ['bbbbbbbbbb', 'bkbkkbkbkb', 'bkbkkbkbkb', 'bkbkkbkbkb', 'bkbkkbkbkb', 'bbbbbbbbbb', 'bccbbbbccb'] },
      gem: { pts: 25, rows: ['..GGGGG..', '.GbbGGGG.', 'GGbGGGGGG', 'GGGGGGGGG', '.GGGGGGG.', '..GGGGG..', '...GGG...', '....G....'] },
      bad: { pts: -20, rows: ['RRRRkkRRRR', 'RRRkRRRRRR', 'RRkRRRRkRR', 'RRRRRRkRRR', 'RRRRkRRRRR', 'RkRRRkRRRR', 'RRRRRRRRkR', 'RRRRRRRRRR'] }
    };
    function sprite(rows, map) {
      var h = rows.length, w = rows[0].length, c = D.createElement('canvas');
      c.width = w * SC; c.height = h * SC;
      var x = c.getContext('2d');
      for (var r = 0; r < h; r++) { for (var k = 0; k < w; k++) { var ch = rows[r][k]; if (map[ch]) { x.fillStyle = map[ch]; x.fillRect(k * SC, r * SC, SC, SC); } } }
      return { c: c, w: w, h: h };
    }
    function buildSprites() {
      var base = { D: P.dim, m: P.mute, b: P.bone, k: P.ink, Y: P.amber, c: P.cyan, G: P.acc, R: P.laser };
      var goldM = { D: P.amber, m: P.ink4, b: P.bone, k: P.ink, Y: P.amber, c: P.amber, G: P.amber, R: P.laser };
      Object.keys(DEFS).forEach(function (k) { SPR[k] = sprite(DEFS[k].rows, base); SPR[k + '_g'] = sprite(DEFS[k].rows, goldM); });
    }

    function resize() {
      var cw = canvas.clientWidth, ch = canvas.clientHeight;
      if (!cw || !ch) { return; }
      var dpr = Math.min(W.devicePixelRatio || 1, 2);
      LH = Math.round(LW * ch / cw);
      SC = Math.max(1, Math.round(cw * dpr / LW));
      canvas.width = LW * SC; canvas.height = LH * SC;
      buildSprites();
      tray.x = clamp(tray.x, tray.w / 2, LW - tray.w / 2);
      render();
    }

    /* ---------- text & drawing helpers ---------- */
    function txt(s, x, y, size, col, align, weight) {
      ctx.font = (weight || 700) + ' ' + size + 'px ' + FONT;
      ctx.textAlign = align || 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = col;
      ctx.fillText(s, x, y);
    }
    function burst(x, y, col, n, spd) {
      for (var i = 0; i < n && parts.length < 260; i++) {
        var a = Math.random() * Math.PI * 2, v = rand(20, spd || 90);
        parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: rand(0.35, 0.8), max: 0.8, c: col, s: Math.random() < 0.3 ? 2 : 1 });
      }
    }
    function floatText(s, x, y, col) { texts.push({ s: s, x: x, y: y, c: col, life: 0.9 }); }
    function pop(s, sub, col) { banner = { s: s, sub: sub || '', c: col || P.acc, life: 1.2 }; }

    function drawBg(px) {
      ctx.fillStyle = P.ink; ctx.fillRect(0, 0, LW, LH);
      var off = -px * 0.06, i, x;
      ctx.fillStyle = P.ink2;
      for (i = -1; i < 10; i++) {
        x = Math.round(i * 40 + (off % 40));
        ctx.fillRect(x, 16, 1, LH - 26); ctx.fillRect(x + 34, 16, 1, LH - 26);
        for (var y = 40; y < LH - 12; y += 34) {
          ctx.fillRect(x, y, 35, 1);
          var hs = hash(i * 17.1 + y + Math.floor((off) / 40) * 3.3);
          if (hs > 0.35) { ctx.fillRect(x + 4, y - 6 - Math.floor(hs * 6), 8 + Math.floor(hs * 14), 6 + Math.floor(hs * 6)); }
        }
      }
      ctx.fillStyle = P.ink4; ctx.fillRect(0, LH - 10, LW, 1);
      ctx.fillStyle = P.ink2;
      for (x = 0; x < LW; x += 8) { ctx.fillRect(x + ((T * 20) | 0) % 8, LH - 6, 4, 1); }
    }
    function drawItem(it) {
      var s = SPR[it.k + (gold && it.k !== 'bad' ? '_g' : '')]; if (!s) { return; }
      var w = s.w, h = s.h, x = it.x - w / 2, y = it.y;
      ctx.fillStyle = P.ink4; ctx.globalAlpha = clamp(it.y / LH, 0.1, 0.6);
      ctx.fillRect(Math.round(it.x - 2), LH - 10, 4, 1); ctx.globalAlpha = 1;
      if (it.k === 'coin') { var sx = Math.abs(Math.cos(it.spin)); var dw = Math.max(2, Math.round(w * sx)); ctx.drawImage(s.c, Math.round(it.x - dw / 2), Math.round(y), dw, h); return; }
      if (it.k === 'bad') { x += Math.round(Math.sin(T * 40 + it.seed) * 0.6); }
      ctx.drawImage(s.c, Math.round(x), Math.round(y), w, h);
      if (it.k === 'gem' || gold) {
        var ph = Math.floor(T * 10 + it.seed) % 4;
        ctx.fillStyle = ph % 2 ? P.bone : P.violet;
        ctx.fillRect(Math.round(x + (ph * 3) % w), Math.round(y - 2), 1, 1);
        ctx.fillRect(Math.round(x + w + 1), Math.round(y + (ph * 2) % h), 1, 1);
      }
    }
    function drawTray(x) {
      var sq = tray.sq, w = Math.round(tray.w * (1 + 0.18 * sq)), h = Math.round(9 * (1 - 0.25 * sq)), y = LH - 10 - h, l = Math.round(x - w / 2);
      ctx.fillStyle = P.acc;
      ctx.fillRect(l, y, 2, h); ctx.fillRect(l + w - 2, y, 2, h); ctx.fillRect(l, y + h - 3, w, 3); ctx.fillRect(l, y + 2, w, 1);
      ctx.fillStyle = P.ink4; ctx.fillRect(l + 2, y + 3, w - 4, h - 6);
      ctx.fillStyle = P.ink; for (var i = l + 5; i < l + w - 4; i += 5) { ctx.fillRect(i, y + 3, 1, Math.max(1, h - 6)); }
      ctx.fillStyle = P.dim; ctx.fillRect(l + 3, LH - 10, 2, 1); ctx.fillRect(l + w - 5, LH - 10, 2, 1);
      if (mult > 1 && state === 'play') { ctx.fillStyle = P.acc; ctx.globalAlpha = 0.25 + 0.2 * Math.sin(T * 12); ctx.fillRect(l - 1, y - 1, w + 2, h + 2); ctx.globalAlpha = 1; }
    }
    function drawFx(dt) {
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i]; p.life -= dt;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        p.vy += 220 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.98;
        if (p.y > LH - 11) { p.y = LH - 11; p.vy *= -0.4; }
        ctx.globalAlpha = clamp(p.life / p.max * 1.4, 0, 1); ctx.fillStyle = p.c;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
      }
      ctx.globalAlpha = 1;
      for (i = texts.length - 1; i >= 0; i--) {
        var tx = texts[i]; tx.life -= dt; tx.y -= 22 * dt;
        if (tx.life <= 0) { texts.splice(i, 1); continue; }
        ctx.globalAlpha = clamp(tx.life * 2, 0, 1);
        txt(tx.s, Math.round(tx.x), Math.round(tx.y), 8, tx.c, 'center');
      }
      ctx.globalAlpha = 1;
    }
    function drawBanner(dt) {
      if (!banner) { return; }
      banner.life -= dt;
      if (banner.life <= 0) { banner = null; return; }
      var a = 1.2 - banner.life, sc = a < 0.15 ? 0.6 + a / 0.15 * 0.6 : (a < 0.3 ? 1.2 - (a - 0.15) / 0.15 * 0.2 : 1);
      ctx.save(); ctx.translate(LW / 2, LH * 0.42); ctx.scale(sc, sc);
      ctx.globalAlpha = clamp(banner.life * 3, 0, 1);
      txt(banner.s, 0, -10, 16, banner.c, 'center', 800);
      if (banner.sub) { txt(banner.sub, 0, 9, 7, P.bone, 'center', 500); }
      ctx.restore(); ctx.globalAlpha = 1;
    }
    function drawHud() {
      ctx.fillStyle = P.ink; ctx.globalAlpha = 0.7; ctx.fillRect(0, 0, LW, 15); ctx.globalAlpha = 1;
      ctx.fillStyle = P.ink4; ctx.fillRect(0, 15, LW, 1);
      txt(upper(t('games.game.score')), 5, 4, 6, P.mute, 'left', 500);
      txt(pad(score, 6), 32, 3, 8, P.bone);
      for (var i = 0; i < 3; i++) { ctx.fillStyle = i < lives ? P.acc : P.ink4; ctx.fillRect(74 + i * 7, 5, 5, 5); if (i < lives) { ctx.fillStyle = P.ink; ctx.fillRect(76 + i * 7, 5, 1, 2); } }
      if (combo > 0) { txt(upper(t('games.game.combo')) + ' ' + combo + (mult > 1 ? '  ×' + mult : ''), LW / 2, 4, 7, mult > 1 ? P.acc : P.dim, 'center'); }
      var tw = 54, frac = clamp(time / ROUND, 0, 1), warn = time < 5;
      ctx.fillStyle = P.ink4; ctx.fillRect(LW - tw - 22, 6, tw, 3);
      ctx.fillStyle = warn ? (Math.floor(T * 6) % 2 ? P.laser : P.bone) : P.acc; ctx.fillRect(LW - tw - 22, 6, Math.round(tw * frac), 3);
      txt(pad(Math.ceil(time), 2), LW - 5, 3, 8, warn ? P.laser : P.bone, 'right');
      if (gold) { txt(upper(t('games.game.gold')), 5, 19, 6, P.amber, 'left', 500); }
    }

    /* ---------- game flow ---------- */
    function spawn() {
      var r = Math.random(), badP = 0.12 + level * 0.03, k;
      if (r < badP) { k = 'bad'; } else if (r < badP + 0.06) { k = 'gem'; } else if (r < badP + 0.22) { k = 'label'; } else if (r < badP + 0.47) { k = 'coin'; } else { k = 'box'; }
      var s = SPR[k], w = s ? s.w : 8;
      items.push({ k: k, x: rand(w / 2 + 4, LW - w / 2 - 4), y: -10, vy: (38 + level * 16) * rand(0.85, 1.2) * (k === 'gem' ? 1.25 : 1) * (REDUCED ? 0.75 : 1),
        sway: k === 'label' ? 14 : 0, spin: 0, seed: Math.random() * 10, w: w, h: s ? s.h : 8 });
    }
    function start(isGold) {
      if (typeof isGold === 'boolean') { gold = isGold; }
      score = 0; shown = 0; lives = 3; time = ROUND; combo = 0; mult = 1; best = 0; caught = 0; level = 1; newHi = false;
      items = []; parts = []; texts = []; spawnT = 0.6; banner = null; shake = 0; flash = 0;
      tray.x = LW / 2; tray.vx = 0; aim = null;
      setState('ready');
      if (gold) { pop(upper(t('games.game.gold')), '×2', P.amber); }
    }
    function setState(s) {
      state = s; stT = 0;
      canvas.classList.toggle('is-playing', s === 'play' || s === 'ready');
      updateLock();
    }
    function over(why) {
      reason = why === 'broken' ? t('games.game.broken') : t('games.game.timeUp');
      if (score > hi) {
        newHi = true; hi = score; store.set(HI, String(hi));
        toast(t('games.toast.record', { n: fmt(score) }), { type: 'ok' });
        bg('pulse', 1);
      }
      setState('over');
      burst(LW / 2, LH / 2, P.acc, REDUCED ? 10 : 40, 140);
    }
    function catchItem(it) {
      var def = DEFS[it.k];
      if (it.k === 'bad') {
        score = Math.max(0, score + def.pts); lives--; combo = 0; mult = 1;
        if (!REDUCED) { shake = 4; } flash = 1; flashC = P.laser; tray.sq = -1;
        burst(it.x, it.y, P.laser, 16, 110); floatText(String(def.pts), it.x, it.y - 6, P.laser);
        pop(upper(t('games.game.damage')), '', P.laser);
        if (lives <= 0) { hitStop = 0.25; setTimeout(function () { if (state === 'play') { over('broken'); } }, 260); }
        return;
      }
      combo++; caught++; best = Math.max(best, combo);
      var prev = mult; mult = combo >= 15 ? 3 : (combo >= 5 ? 2 : 1);
      if (mult > prev) { pop(upper(t('games.game.combo')) + ' ×' + mult, '', P.acc); bg('pulse', 0.4); }
      var pts = def.pts * mult * (gold ? 2 : 1);
      score += pts; tray.sq = 1;
      var col = gold ? P.amber : (it.k === 'gem' ? P.acc : it.k === 'coin' ? P.amber : it.k === 'label' ? P.cyan : P.dim);
      burst(it.x, LH - 20, col, it.k === 'gem' ? 28 : 12, it.k === 'gem' ? 130 : 80);
      floatText('+' + pts, it.x, LH - 32, col);
      if (it.k === 'gem') { hitStop = 0.06; flash = 0.5; flashC = P.acc; if (!REDUCED) { shake = Math.max(shake, 1.5); } }
    }

    function update(dt) {
      T += dt; stT += dt;
      if (tray.sq) { tray.sq *= Math.pow(0.0008, dt); if (Math.abs(tray.sq) < 0.01) { tray.sq = 0; } }
      shake = Math.max(0, shake - dt * 16); flash = Math.max(0, flash - dt * 3);
      if (state === 'ready') {
        moveTray(dt);
        if (stT > 1.3) { setState('play'); }
        return;
      }
      if (state === 'attract') {
        if (Math.random() < dt * 1.6) { spawn(); }
        var tgt = null;
        for (var a = 0; a < items.length; a++) { if (items[a].k !== 'bad' && (!tgt || items[a].y > tgt.y)) { tgt = items[a]; } }
        demoX = lerp(demoX, tgt ? tgt.x : LW / 2 + Math.sin(T) * 60, Math.min(1, dt * 3));
        tray.x = demoX;
        for (a = items.length - 1; a >= 0; a--) {
          var d = items[a]; d.y += d.vy * 0.6 * dt; d.spin += dt * 6; d.x += Math.sin(T * 2 + d.seed) * d.sway * dt;
          if (d.y > LH - 26 && Math.abs(d.x - tray.x) < 18 && d.k !== 'bad') { burst(d.x, LH - 20, P.acc, 6, 60); items.splice(a, 1); }
          else if (d.y > LH) { items.splice(a, 1); }
        }
        return;
      }
      if (state !== 'play') { return; }
      time -= dt;
      if (time <= 0) { time = 0; over('time'); return; }
      var lv = 1 + Math.floor((ROUND - time) / 10);
      if (lv !== level) { level = lv; pop(t('games.game.level', { n: level }), t('games.game.faster'), P.acc); bg('pulse', 0.5); }
      spawnT -= dt;
      if (spawnT <= 0) { spawn(); if (level > 2 && Math.random() < 0.25) { spawn(); } spawnT = (0.78 - 0.16 * (level - 1)) * rand(0.7, 1.2) * (REDUCED ? 1.2 : 1); }
      moveTray(dt);
      var ty = LH - 19, half = tray.w / 2;
      for (var i = items.length - 1; i >= 0; i--) {
        var it = items[i];
        var py = it.y + it.h;
        it.y += it.vy * dt; it.spin += dt * 7;
        if (it.sway) { it.x = clamp(it.x + Math.cos(T * 3 + it.seed) * it.sway * dt, 6, LW - 6); }
        var by = it.y + it.h;
        if (py <= ty + 3 && by >= ty && Math.abs(it.x - tray.x) < half + it.w / 2 - 2) { items.splice(i, 1); catchItem(it); continue; }
        if (it.y > LH - 10) {
          items.splice(i, 1);
          if (it.k !== 'bad') { if (combo > 0) { floatText('×', it.x, LH - 18, P.mute); } combo = 0; mult = 1; burst(it.x, LH - 11, P.ink4, 5, 40); }
        }
      }
    }
    function moveTray(dt) {
      var dir = keys.r - keys.l;
      if (dir) { aim = null; tray.vx = lerp(tray.vx, dir * 230, Math.min(1, dt * 14)); tray.x += tray.vx * dt; }
      else if (aim !== null) { var nx = lerp(tray.x, aim, 1 - Math.exp(-dt * 20)); tray.vx = (nx - tray.x) / Math.max(dt, 0.001); tray.x = nx; }
      else { tray.vx *= 0.8; tray.x += tray.vx * dt; }
      tray.x = clamp(tray.x, tray.w / 2 + 1, LW - tray.w / 2 - 1);
    }

    function render(dt) {
      dt = dt || 0;
      ctx.setTransform(SC, 0, 0, SC, 0, 0);
      ctx.imageSmoothingEnabled = false;
      var sx = shake ? Math.round(rand(-shake, shake)) : 0, sy = shake ? Math.round(rand(-shake, shake)) : 0;
      ctx.save(); ctx.translate(sx, sy);
      drawBg(tray.x);
      for (var i = 0; i < items.length; i++) { drawItem(items[i]); }
      drawTray(tray.x);
      drawFx(dt);
      ctx.restore();
      if (flash > 0) { ctx.globalAlpha = flash * 0.22; ctx.fillStyle = flashC; ctx.fillRect(0, 0, LW, LH); ctx.globalAlpha = 1; }
      var blink = Math.floor(T * 2.2) % 2 === 0, cy = LH / 2;
      if (state === 'attract') {
        ctx.fillStyle = P.ink; ctx.globalAlpha = 0.55; ctx.fillRect(0, 0, LW, LH); ctx.globalAlpha = 1;
        var title = upper(t('games.game.title')), size = Math.min(30, Math.floor(LW / (title.length * 0.62)));
        ctx.font = '800 ' + size + 'px ' + FONT;
        var tw = ctx.measureText(title).width, x0 = LW / 2 - tw / 2, chs = Array.from(title), cx = x0;
        for (var c = 0; c < chs.length; c++) {
          var bob = Math.round(Math.sin(Math.floor(T * 6) / 6 * Math.PI * 2 + c * 0.7) * 2);
          txt(chs[c], Math.round(cx) + 1, Math.round(cy - 46 + bob) + 1, size, P.laser, 'left', 800);
          txt(chs[c], Math.round(cx), Math.round(cy - 46 + bob), size, P.acc, 'left', 800);
          cx += ctx.measureText(chs[c]).width;
        }
        if (blink) { txt(upper(t('games.game.press')), LW / 2, cy - 6, 8, P.bone, 'center'); }
        txt(upper(t('games.game.hi')) + '  ' + pad(hi, 6), LW / 2, cy + 8, 7, P.dim, 'center', 500);
        var keysL = ['box', 'coin', 'label', 'gem', 'bad'], names = ['box', 'coin', 'label', 'gem', 'bad'], gap = LW / 5.4;
        for (var k = 0; k < keysL.length; k++) {
          var s = SPR[keysL[k]]; if (!s) { continue; }
          var lx = Math.round(LW / 2 + (k - 2) * gap);
          ctx.drawImage(s.c, lx - Math.round(s.w / 2), Math.round(cy + 26), s.w, s.h);
          var pv = DEFS[keysL[k]].pts;
          txt((pv > 0 ? '+' : '') + pv, lx, Math.round(cy + 37), 7, pv > 0 ? P.acc : P.laser, 'center');
          txt(upper(t('games.item.' + names[k])), lx, Math.round(cy + 46), 5, P.mute, 'center', 500);
        }
      } else if (state === 'ready') {
        drawHud();
        txt(upper(stT < 0.85 ? t('games.game.ready') : t('games.game.go')), LW / 2, cy - 12, stT < 0.85 ? 16 : 22, stT < 0.85 ? P.bone : P.acc, 'center', 800);
        drawBanner(dt);
      } else if (state === 'play') {
        drawHud(); drawBanner(dt);
      } else if (state === 'paused') {
        drawHud();
        ctx.fillStyle = P.ink; ctx.globalAlpha = 0.65; ctx.fillRect(0, 0, LW, LH); ctx.globalAlpha = 1;
        txt(upper(t('games.game.paused')), LW / 2, cy - 14, 16, P.bone, 'center', 800);
        if (blink) { txt(upper(t('games.game.resume')), LW / 2, cy + 8, 7, P.acc, 'center'); }
      } else if (state === 'over') {
        ctx.fillStyle = P.ink; ctx.globalAlpha = 0.72; ctx.fillRect(0, 0, LW, LH); ctx.globalAlpha = 1;
        shown = Math.min(score, shown + Math.max(1, Math.ceil((score - shown) * Math.min(1, dt * 6))));
        txt(upper(t('games.game.over')), LW / 2, cy - 52, 20, P.acc, 'center', 800);
        txt(upper(reason), LW / 2, cy - 28, 7, P.dim, 'center', 500);
        txt(pad(shown, 6), LW / 2, cy - 16, 22, P.bone, 'center', 800);
        txt(upper(t('games.game.caught')) + ' ' + caught + '   ·   ' + upper(t('games.game.bestCombo')) + ' ' + best, LW / 2, cy + 12, 6, P.dim, 'center', 500);
        txt(upper(t('games.game.hi')) + '  ' + pad(hi, 6), LW / 2, cy + 22, 7, newHi ? P.amber : P.mute, 'center', 500);
        if (newHi && blink) { txt(upper(t('games.game.newHi')), LW / 2, cy + 33, 9, P.amber, 'center', 800); }
        if (stT > 0.9 && !blink) { txt(upper(t('games.game.again')), LW / 2, cy + 48, 7, P.bone, 'center'); }
      }
    }

    function loop(dt) {
      if (killed) { return; }
      if (hitStop > 0) { hitStop -= dt; render(0); return; }
      update(dt);
      render(dt);
    }

    /* ---------- run / pause bookkeeping ---------- */
    function run(onr) { if (onr && !killed) { addTick(loop); } else { removeTick(loop); } }
    function pause() { if (state === 'play' || state === 'ready') { setState('paused'); keys.l = keys.r = 0; render(0); } }
    function updateLock() {
      var want = (state === 'play' || state === 'ready') && hovering && !killed;
      if (want !== locked) { locked = want; lockScroll(want); }
    }
    function primary() {
      if (state === 'attract') { start(); }
      else if (state === 'over' && stT > 0.6) { start(); }
      else if (state === 'paused') { setState('play'); }
    }

    io(canvas, function (vis) {
      visible = vis;
      if (!vis) { pause(); }
      run(vis);
    }, { threshold: 0.2 });
    D.addEventListener('visibilitychange', function () { if (D.hidden) { pause(); } });
    on('transition:start', function () { killed = true; run(false); if (locked) { locked = false; lockScroll(false); } });

    canvas.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') { hovering = true; updateLock(); } });
    canvas.addEventListener('pointerleave', function () { hovering = false; updateLock(); });
    canvas.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect(); if (!r.width) { return; }
      aim = clamp((e.clientX - r.left) / r.width * LW, 0, LW);
    });
    canvas.addEventListener('pointerdown', function (e) {
      var r = canvas.getBoundingClientRect(); if (r.width) { aim = clamp((e.clientX - r.left) / r.width * LW, 0, LW); }
      try { canvas.focus({ preventScroll: true }); } catch (er) {}
      primary();
    });
    canvas.addEventListener('wheel', function (e) { if ((state === 'play' || state === 'ready') && hovering) { e.preventDefault(); } }, { passive: false });
    canvas.addEventListener('focus', function () { focused = true; if (cab) { cab.classList.add('is-focused'); } });
    canvas.addEventListener('blur', function () { focused = false; keys.l = keys.r = 0; if (cab) { cab.classList.remove('is-focused'); } if (state === 'play') { pause(); } });
    canvas.addEventListener('keydown', function (e) {
      var k = e.key, active = state === 'play' || state === 'ready';
      if (k === ' ' || k === 'Spacebar' || k === 'Enter') { e.preventDefault(); primary(); return; }
      if (k === 'Escape') { if (active || state === 'paused') { e.preventDefault(); items = []; setState('attract'); } return; }
      if (k === 'p' || k === 'P') { if (active) { pause(); } else if (state === 'paused') { setState('play'); } return; }
      if (!active) { return; }
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') { keys.l = 1; e.preventDefault(); }
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') { keys.r = 1; e.preventDefault(); }
      else if (k === 'ArrowUp' || k === 'ArrowDown') { e.preventDefault(); }
    });
    canvas.addEventListener('keyup', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { keys.l = 0; }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { keys.r = 0; }
    });
    if (startBtn) {
      startBtn.addEventListener('click', function () {
        try { canvas.focus({ preventScroll: true }); } catch (e) {}
        if (!visible) { scrollToEl(sec); }
        start();
      });
    }

    /* Konami → scroll here, gold mode */
    var KON = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'], kp = 0;
    function goGold() {
      if (state === 'play' || killed) { return; }
      scrollToEl(sec);
      toast(t('games.toast.gold'), { type: 'ok' });
      setTimeout(function () { try { canvas.focus({ preventScroll: true }); } catch (er) {} start(true); }, REDUCED ? 100 : 1200);
    }
    if (fn(S, 'on')) { on('konami', goGold); }
    else {
      D.addEventListener('keydown', function (e) {
        var k = String(e.key || '').toLowerCase();
        kp = (k === KON[kp]) ? kp + 1 : (k === KON[0] ? 1 : 0);
        if (kp === KON.length) { kp = 0; goGold(); }
      });
    }

    if ('ResizeObserver' in W) { new ResizeObserver(function () { resize(); }).observe(canvas); }
    else { onResize(resize); }
    resize();
  }

  /* ==================================================================
     BOOT
     ================================================================== */
  onReady(function () {
    S = W.SITE || S;
    REDUCED = isReduced(); TOUCH = isTouch(); CAN_PIN = !!(gsap && ST) && !REDUCED && !TOUCH;
    readPalette();
    var showHud = null;
    try { showHud = initHUD(); } catch (e) { if (W.console) { console.warn('[games] hud', e); } }
    try { initHero(showHud); } catch (e) { if (W.console) { console.warn('[games] hero', e); } if (showHud) { showHud(); } }
    try { initLevels(); } catch (e) { if (W.console) { console.warn('[games] levels', e); } }
    try { initLoadout(); } catch (e) { if (W.console) { console.warn('[games] loadout', e); } }
    try { initGame(); } catch (e) { if (W.console) { console.warn('[games] game', e); } }
    /* The footer "next slot" pin is created in core.js before this page's pins.
       Order triggers by document position so it is measured after their pin spacers. */
    if (ST && fn(ST, 'sort')) {
      try {
        ST.sort(function (a, b) {
          var ta = a.trigger, tb = b.trigger;
          if (!ta || !tb || ta === tb || ta.contains(tb) || tb.contains(ta)) { return 0; }
          return (ta.compareDocumentPosition(tb) & 4) ? -1 : 1;
        });
      } catch (e) {}
    }
    refresh();
    if (D.fonts && D.fonts.ready) { D.fonts.ready.then(function () { refresh(); }); }
  });
})();
