/* =====================================================================
   INVENTORY — HOME (slot 01 · Laser)
   H1 hero: letters of the hero name fly into the inventory slots
   H2 manifesto: paper wipe + word-by-word lighting
   H3 slots: deal-the-deck pinned card fan + flip
   H4 status: velocity-skewed marquees
   H5 stats: slot frames draw their corners
   Defensive against a missing/partial window.SITE. Never throws.
   ===================================================================== */
(function () {
  'use strict';

  var D = document, W = window, HTML = D.documentElement;
  if (!D.body || D.body.getAttribute('data-page') !== 'home') return;

  var GLYPHS = 'ABCDEFGHIJKLMNOPRSTUVYZ0123456789#%&*/<>';
  var DESKTOP = '(min-width: 900px)';
  var MOBILE = '(max-width: 899px)';
  var booted = false;

  /* ------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------ */
  function site() { return W.SITE || null; }
  function isFn(o, k) { return !!(o && typeof o[k] === 'function'); }
  function qs(s, r) { return (r || D).querySelector(s); }
  function qsa(s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); }
  function mq(q) { try { return !!(W.matchMedia && W.matchMedia(q).matches); } catch (e) { return false; } }
  function reduced() {
    var s = site();
    if (s && s.reducedMotion === true) return true;
    return HTML.classList.contains('is-reduced') || mq('(prefers-reduced-motion: reduce)');
  }
  function finePointer() {
    var s = site();
    if (s && s.isTouch === true) return false;
    return !HTML.classList.contains('is-touch') && mq('(hover: hover) and (pointer: fine)');
  }
  function bg(method, a, b) {
    var s = site();
    if (!s || !s.bg || s.bg.enabled === false || !isFn(s.bg, method)) return;
    try { if (b === undefined) s.bg[method](a); else s.bg[method](a, b); } catch (e) { /* noop */ }
  }
  function refresh() {
    var s = site();
    try {
      if (isFn(s, 'refresh')) s.refresh();
      else if (W.ScrollTrigger) W.ScrollTrigger.refresh();
    } catch (e) { /* noop */ }
  }
  function addTick(fn) {
    var s = site();
    if (s && s.ticker && isFn(s.ticker, 'add')) {
      try { s.ticker.add(fn); return function () { try { s.ticker.remove(fn); } catch (e) {} }; } catch (e) { /* fall through */ }
    }
    if (W.gsap) { W.gsap.ticker.add(fn); return function () { W.gsap.ticker.remove(fn); }; }
    return function () {};
  }
  function velocity() {
    var s = site();
    var v = s && s.scroll && typeof s.scroll.velocity === 'number' ? s.scroll.velocity : 0;
    return v !== v ? 0 : Math.max(-1, Math.min(1, v));
  }
  function hash(n) {
    n = (n ^ 61) ^ (n >>> 16);
    n = n + (n << 3);
    n = n ^ (n >>> 4);
    n = Math.imul(n, 0x27d4eb2d);
    n = n ^ (n >>> 15);
    return n >>> 0;
  }
  function glyph() { return GLYPHS.charAt((Math.random() * GLYPHS.length) | 0); }

  /* Own decode, used when SITE.scramble is unavailable. */
  function ownScramble(el, text, dur) {
    var g = W.gsap;
    if (!g || reduced()) { el.textContent = text; return; }
    if (el._hScr) el._hScr.kill();
    var o = { p: 0 }, len = text.length, last = -1;
    el._hScr = g.to(o, {
      p: 1, duration: dur || 0.6, ease: 'none',
      onUpdate: function () {
        var f = Math.floor(o.p * 18);              // ~30 swaps/s max, cheap
        if (f === last) return;
        last = f;
        var n = Math.floor(o.p * len), out = text.slice(0, n);
        for (var i = n; i < len; i++) out += /\s/.test(text.charAt(i)) ? text.charAt(i) : glyph();
        el.textContent = out;
      },
      onComplete: function () { el.textContent = text; el._hScr = null; }
    });
  }
  function scramble(el, text, dur) {
    if (!el) return;
    var s = site();
    if (text == null) text = el.textContent;
    if (isFn(s, 'scramble') && !reduced()) {
      try { s.scramble(el, { text: text, duration: dur || 0.6 }); return; } catch (e) { /* fall through */ }
    }
    ownScramble(el, text, dur);
  }

  /* Offset of el relative to an ancestor — layout-only, ignores transforms. */
  function offsetIn(el, anc) {
    var x = 0, y = 0, n = el;
    while (n && n !== anc) {
      x += n.offsetLeft || 0;
      y += n.offsetTop || 0;
      n = n.offsetParent;
      if (n && n !== anc && !anc.contains(n)) { n = null; break; }
    }
    if (n === anc) return { x: x, y: y };
    var a = el.getBoundingClientRect(), b = anc.getBoundingClientRect();
    return { x: a.left - b.left, y: a.top - b.top };
  }

  /* Fallback splitter, used only if core has not split the element. */
  function ownSplit(el, mode) {
    var out = [];
    if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = mode === 'chars' ? Array.from(n.nodeValue) : n.nodeValue.split(/(\s+)/);
          var frag = D.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(D.createTextNode(p)); return; }
            var sp = D.createElement('span');
            sp.className = mode === 'chars' ? 'split-char' : 'split-word';
            sp.setAttribute('aria-hidden', 'true');
            sp.style.display = 'inline-block';
            sp.textContent = p;
            frag.appendChild(sp);
            out.push(sp);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          walk(n);
        }
      });
    })(el);
    return out;
  }
  function getParts(el, cls, mode) {
    if (!el) return [];
    var list = qsa('.' + cls, el).filter(function (n) {
      return /\S/.test(n.textContent) && !n.querySelector('.' + cls);
    });
    return list.length ? list : ownSplit(el, mode);
  }

  /* gsap.matchMedia with a graceful fallback (evaluated once). */
  function media(mm, conds, fn) {
    if (mm) { mm.add(conds, fn); return; }
    var c = {};
    Object.keys(conds).forEach(function (k) { c[k] = mq(conds[k]); });
    try { fn({ conditions: c }); } catch (e) { warn(e); }
  }
  function warn(e) { try { if (W.console && console.warn) console.warn('[home]', e); } catch (x) {} }

  /* ------------------------------------------------------------------
     Generative visuals (SVG) — run in every mode
     ------------------------------------------------------------------ */
  var NS = 'http://www.w3.org/2000/svg';

  function barcode(svg, str, h) {
    if (!svg) return;
    h = h || 40;
    var s = '*' + String(str).toUpperCase() + '*', x = 0, d = '';
    for (var i = 0; i < s.length; i++) {
      var hs = hash(s.charCodeAt(i) * 7919 + i * 104729), wides = 0;
      for (var k = 0; k < 9; k++) {
        var wide = ((hs >>> k) & 1) && wides < 3;
        if (wide) wides++;
        var w = wide ? 2.6 : 1;
        if (k % 2 === 0) d += 'M' + x.toFixed(2) + ' 0h' + w + 'v' + h + 'h-' + w + 'z';
        x += w;
      }
      x += 1.6;
    }
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('viewBox', '0 0 ' + x.toFixed(2) + ' ' + h);
    svg.setAttribute('preserveAspectRatio', 'none');
    var p = D.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('fill', 'currentColor');
    svg.appendChild(p);
  }

  function dial(svg) {
    if (!svg) return;
    var c = 200, d = '', acc = '';
    for (var i = 0; i < 120; i++) {
      var a = (i / 120) * Math.PI * 2, long = i % 10 === 0, mid = i % 5 === 0;
      var r1 = 188, r0 = long ? 166 : (mid ? 176 : 181);
      var seg = 'M' + (c + Math.cos(a) * r0).toFixed(1) + ' ' + (c + Math.sin(a) * r0).toFixed(1) +
                'L' + (c + Math.cos(a) * r1).toFixed(1) + ' ' + (c + Math.sin(a) * r1).toFixed(1);
      if (i === 0 || i === 30) acc += seg; else d += seg;
    }
    var html =
      '<g fill="none" stroke="currentColor" stroke-width="1">' +
        '<path d="' + d + '"/>' +
        '<circle cx="200" cy="200" r="196"/>' +
        '<circle cx="200" cy="200" r="132" stroke-dasharray="2 6"/>' +
        '<circle cx="200" cy="200" r="64"/>' +
        '<path d="M200 120v-30M200 280v30M120 200h-30M280 200h30"/>' +
        '<path d="M150 150h12M150 150v12M250 150h-12M250 150v12M150 250h12M150 250v-12M250 250h-12M250 250v-12"/>' +
      '</g>' +
      '<path class="h-dial__accent" fill="none" stroke-width="2" d="' + acc + '"/>' +
      '<path class="h-dial__accent" fill="none" stroke-width="1" d="M200 4a196 196 0 0 1 120 41"/>';
    svg.innerHTML = html;
  }

  function dpad(svg) {
    if (!svg) return;
    var P = [
      '...###...',
      '...#o#...',
      '...###...',
      '###...###',
      '#o#.#.#o#',
      '###...###',
      '...###...',
      '...#o#...',
      '...###...'
    ];
    var cell = 120 / 9, out = '';
    for (var r = 0; r < P.length; r++) {
      for (var c = 0; c < P[r].length; c++) {
        var ch = P[r].charAt(c);
        if (ch === '.') continue;
        out += '<rect x="' + (c * cell + 1).toFixed(1) + '" y="' + (r * cell + 1).toFixed(1) +
               '" width="' + (cell - 2).toFixed(1) + '" height="' + (cell - 2).toFixed(1) + '"' +
               (ch === 'o' ? ' class="is-dim"' : '') + '/>';
      }
    }
    svg.innerHTML = out;
  }

  function buildGenerative() {
    qsa('[data-h-barcode]').forEach(function (svg) {
      barcode(svg, svg.getAttribute('data-h-barcode'), 40);
    });
    dial(qs('.h-hero__dial-svg'));
    dpad(qs('[data-h-dpad]'));
  }

  /* ------------------------------------------------------------------
     H1 · HERO
     ------------------------------------------------------------------ */
  var hero = null, heroChars = [], heroStats = [], heroSlots = [];

  function heroPrepare() {
    hero = qs('.h-hero');
    if (!hero) return;
    heroChars = getParts(qs('.h-hero__name', hero), 'split-char', 'chars');
    heroSlots = qsa('.h-islot', hero);
    heroStats = heroSlots.map(function (s) {
      var el = qs('.h-islot__stat', s);
      return { el: el, text: el ? el.textContent : '' };
    });
  }

  function setCount(n) {
    var el = hero && qs('.h-hero__count', hero);
    if (!el) return;
    var total = heroSlots.length, t = (n < 10 ? '0' : '') + n + '/' + (total < 10 ? '0' : '') + total;
    if (el.textContent !== t) el.textContent = t;
  }

  function decodeChar(el, delay, dur) {
    var g = W.gsap, final = el.textContent, o = { p: 0 }, last = -1;
    if (!/\S/.test(final)) return;
    g.to(o, {
      p: 1, delay: delay, duration: dur, ease: 'none',
      onStart: function () { el.textContent = glyph(); },
      onUpdate: function () {
        var f = Math.floor(o.p * 9);
        if (f !== last) { last = f; el.textContent = glyph(); }
      },
      onComplete: function () { el.textContent = final; }
    });
  }

  function heroEnter() {
    if (!hero) return;
    var g = W.gsap;
    var items = qsa('[data-h-in]', hero);
    if (!g || reduced()) { hero.classList.add('is-in'); return; }

    g.set(heroChars, { yPercent: 110, rotate: 2 });
    g.set(items, { y: 28, opacity: 0 });
    hero.classList.add('is-in');

    var tl = g.timeline({ defaults: { ease: 'expo.out' } });
    tl.to(heroChars, { yPercent: 0, rotate: 0, duration: 1.4, stagger: 0.03 }, 0.05);
    heroChars.forEach(function (c, i) { decodeChar(c, 0.05 + i * 0.03, 0.55); });
    tl.to(items, { y: 0, opacity: 1, duration: 1.1, stagger: 0.07, clearProps: 'transform' }, 0.45);
    tl.call(function () { bg('scan', { duration: 1.2, direction: 'down' }); }, null, 0.6);
    tl.call(function () { scramble(qs('.h-hero__label-text', hero), null, 0.7); }, null, 0.5);
    tl.call(refresh, null, 1.6);   // re-measure FLIP geometry once glyphs have resolved
  }

  function heroDesktop() {
    var g = W.gsap;
    var stage = qs('.h-hero__stage', hero);
    var nameEl = qs('.h-hero__name', hero);
    var flyLayer = qs('.h-hero__fly', hero);
    var wrap = qs('.h-hero__slots', hero);
    if (!stage || !nameEl || !flyLayer || !wrap) return null;

    hero.classList.add('is-pin');

    var boxes = heroSlots.map(function (s) { return qs('.h-islot__box', s); });
    var letters = heroSlots.map(function (s) { var l = qs('.h-islot__letter', s); return l ? l.textContent : ''; });
    var n = Math.min(heroChars.length, boxes.length);
    var flyers = [];
    flyLayer.innerHTML = '';
    for (var i = 0; i < n; i++) {
      var f = D.createElement('span');
      f.className = 'h-fly__char';
      f.textContent = letters[i] || heroChars[i].textContent;
      flyLayer.appendChild(f);
      flyers.push(f);
    }

    var geo = null;
    /* Read the live variable-font state of each name char (core's proximity
       may have changed it) so the hand-off to the flyers is seamless. */
    function readAxes(el) {
      var cs = W.getComputedStyle(el);
      var w = parseFloat(cs.getPropertyValue('--w')), wd = parseFloat(cs.getPropertyValue('--wd'));
      return { w: w === w ? w : 800, wd: wd === wd ? wd : 75 };
    }
    function measure() {
      geo = [];
      var fs = parseFloat(W.getComputedStyle(flyers[0]).fontSize) || 100;
      for (var k = 0; k < n; k++) {
        var c = heroChars[k], b = boxes[k], fl = flyers[k];
        var ax = readAxes(c);
        fl.style.setProperty('--fw', 800); fl.style.setProperty('--fwd', 75);
        var fwEnd = fl.offsetWidth;
        fl.style.setProperty('--fw', ax.w); fl.style.setProperty('--fwd', ax.wd);
        var fw = fl.offsetWidth, fh = fl.offsetHeight;
        var co = offsetIn(c, stage), bo = offsetIn(b, stage);
        var bw = b.offsetWidth, bh = b.offsetHeight;
        geo.push({
          w0: ax.w, wd0: ax.wd,
          x0: co.x + (c.offsetWidth - fw) / 2,
          y0: co.y + (c.offsetHeight - fh) / 2,
          x1: bo.x + (bw - fw) / 2 + (fw - fwEnd) / 2,
          y1: bo.y + (bh - fh) / 2 + bh * 0.03,
          s: Math.max(0.05, (bh * 0.58) / (fs * 0.72))
        });
      }
    }
    function G(k) { if (!geo) measure(); return geo[k]; }

    var landT = [], landed = [], ROT = [-14, 9, -6, 12, -10, 8, -12, 6, -8, 11];
    var outEls = qsa('[data-h-out]', hero);
    var headEl = qs('.h-hero__slots-head', hero);
    var invEl = qs('.h-hero__inv', hero);
    var decor = qs('.h-hero__decor', hero);

    var tl = g.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: '+=220%',
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefreshInit: function () { geo = null; },
        onToggle: function (self) {
          if (self.isActive && self.direction > 0 && tl.progress() < 0.04) { geo = null; tl.invalidate(); }
          if (self.isActive) bg('setState', { cell: 18, intensity: 0.7 }, 0.8);
          else bg('reset', 0.8);
          flyers.forEach(function (fl) { fl.style.willChange = self.isActive ? 'transform' : ''; });
        }
      },
      onUpdate: function () {
        var t = tl.time(), count = 0;
        for (var k = 0; k < n; k++) {
          var l = t >= landT[k];
          if (l) count++;
          if (l !== landed[k]) {
            landed[k] = l;
            heroSlots[k].classList.toggle('is-filled', l);
            if (l && heroStats[k].el) scramble(heroStats[k].el, heroStats[k].text, 0.5);
          }
        }
        setCount(count);
      }
    });

    // 0 → 0.1 · hero copy steps aside, name hands off to the flyers
    tl.fromTo(outEls, { opacity: 1, y: 0 }, { opacity: 0, y: -48, duration: 0.1, stagger: 0.012, immediateRender: false }, 0);
    tl.fromTo(decor, { opacity: 1 }, { opacity: 0.35, duration: 0.2, immediateRender: false }, 0);
    tl.fromTo(nameEl, { opacity: 1 }, { opacity: 0, duration: 0.025, immediateRender: false }, 0.04);
    tl.fromTo(flyers, { opacity: 0 }, { opacity: 1, duration: 0.02 }, 0.04);

    // 0.03 → 0.17 · empty slots materialise from the centre
    tl.fromTo(headEl, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.08 }, 0.05);
    tl.fromTo(heroSlots, { opacity: 0, scale: 0.6, y: 20 }, {
      opacity: 1, scale: 1, y: 0, duration: 0.1, ease: 'power2.out',
      stagger: { amount: 0.07, grid: [2, 8], from: 'center' }
    }, 0.03);

    // 0.1 → 0.77 · letters fly in sequence 0 → 9, landing with a snap
    flyers.forEach(function (fl, k) {
      var at = 0.1 + k * 0.052, d = 0.2;
      landT[k] = at + d;
      landed[k] = false;
      tl.fromTo(fl,
        { x: function () { return G(k).x0; }, y: function () { return G(k).y0; }, scale: 1 },
        { x: function () { return G(k).x1; }, y: function () { return G(k).y1; }, scale: function () { return G(k).s; },
          duration: d, ease: 'power3.inOut' }, at);
      tl.fromTo(fl,
        { '--fw': function () { return G(k).w0; }, '--fwd': function () { return G(k).wd0; } },
        { '--fw': 800, '--fwd': 75, duration: d * 0.6, ease: 'power2.inOut' }, at);
      tl.fromTo(fl, { rotation: 0 }, { rotation: ROT[k % ROT.length], duration: d * 0.5, ease: 'sine.out', immediateRender: false }, at);
      tl.to(fl, { rotation: 0, duration: d * 0.5, ease: 'back.out(3)' }, at + d * 0.5);
      if (boxes[k]) {
        tl.fromTo(boxes[k], { scale: 1 }, { scale: 1.1, duration: 0.012, ease: 'power1.out', immediateRender: false }, at + d - 0.006);
        tl.to(boxes[k], { scale: 1, duration: 0.045, ease: 'back.out(3)' }, at + d + 0.006);
      }
    });

    // 0.7 → 0.82 · "This is my inventory."
    tl.fromTo(invEl,
      { opacity: 0, y: 40, clipPath: 'inset(0% 0% 100% 0%)' },
      { opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.12, ease: 'power2.out' }, 0.7);

    // 0.9 → 1 · grid recedes as the next section rises
    tl.to([wrap, flyLayer], { scale: 0.9, opacity: 0, duration: 0.1, ease: 'power2.in' }, 0.9);

    return function () {
      hero.classList.remove('is-pin');
      heroSlots.forEach(function (s) { s.classList.remove('is-filled'); });
      flyLayer.innerHTML = '';
      setCount(0);
    };
  }

  function heroMobile() {
    var g = W.gsap, grid = qs('.h-inv', hero), inv = qs('.h-hero__inv', hero);
    if (!grid) return null;
    g.fromTo(heroSlots, { opacity: 0, y: 24, scale: 0.85 }, {
      opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'back.out(1.7)',
      stagger: {
        each: 0.07,
        onComplete: function () {
          var t = this.targets && this.targets()[0];
          if (!t) return;
          t.classList.add('is-filled');
          var i = heroSlots.indexOf(t);
          if (i > -1 && heroStats[i].el) scramble(heroStats[i].el, heroStats[i].text, 0.5);
          setCount(qsa('.h-islot.is-filled', hero).length);
        }
      },
      scrollTrigger: { trigger: grid, start: 'top 85%', once: true }
    });
    if (inv) {
      g.fromTo(inv, { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 1, ease: 'expo.out',
        scrollTrigger: { trigger: inv, start: 'top 90%', once: true }
      });
    }
    return function () { heroSlots.forEach(function (s) { s.classList.remove('is-filled'); }); };
  }

  /* Pointer parallax on decorative depth layers (desktop, fine pointer). */
  function setupParallax() {
    var g = W.gsap;
    if (!finePointer() || !g) return;
    var layers = qsa('[data-h-depth]').map(function (el) {
      var d = parseFloat(el.getAttribute('data-h-depth')) || 0;
      if (isFn(g, 'quickTo')) {
        return { d: d, x: g.quickTo(el, 'x', { duration: 1, ease: 'power3.out' }), y: g.quickTo(el, 'y', { duration: 1, ease: 'power3.out' }) };
      }
      return { d: d, x: function (v) { g.to(el, { x: v, duration: 1, ease: 'power3.out', overwrite: 'auto' }); }, y: function (v) { g.to(el, { y: v, duration: 1, ease: 'power3.out', overwrite: 'auto' }); } };
    });
    if (!layers.length) return;
    var pending = null;
    W.addEventListener('pointermove', function (e) {
      if (pending) return;
      pending = e;
      W.requestAnimationFrame(function () {
        var ev = pending; pending = null;
        if (!ev) return;
        var w = W.innerWidth, h = W.innerHeight;
        var nx = ev.clientX / w - 0.5, ny = ev.clientY / h - 0.5;
        for (var i = 0; i < layers.length; i++) {
          layers[i].x(-nx * layers[i].d * w);
          layers[i].y(-ny * layers[i].d * h);
        }
      });
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     H2 · MANIFESTO
     ------------------------------------------------------------------ */
  function setupManifesto(mm) {
    var g = W.gsap;
    var sec = qs('.h-manifesto');
    if (!sec) return;
    var text = qs('.h-manifesto__text', sec);
    var words = getParts(text, 'split-word', 'words');
    var emWords = words.filter(function (w) { return !!(w.closest && w.closest('em')); });
    var print = qs('.h-manifesto__print', sec);
    var scan = qs('.h-manifesto__scan', sec);
    var sign = qs('.h-manifesto__sign', sec);
    if (!words.length) return;

    media(mm, { desk: DESKTOP, mob: MOBILE }, function (ctx) {
      var desk = !!ctx.conditions.desk;

      // Paper wipe — a label being printed (scrubbed)
      var wipe = g.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: sec, start: desk ? 'top 75%' : 'top 90%', end: desk ? 'top top' : 'top 35%', scrub: 0.6 }
      });
      if (desk) {
        wipe.fromTo(sec, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1 }, 0);
        if (print) {
          wipe.fromTo(print, { yPercent: 0, opacity: 1 }, { yPercent: 100, duration: 1 }, 0)
              .to(print, { opacity: 0, duration: 0.06 }, 0.94);
        }
      } else {
        wipe.fromTo(sec, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1 }, 0);
      }

      // Words light up one by one
      g.set(words, { opacity: 0.12 });
      g.set(emWords, { '--u': 0 });
      var lit = g.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: desk
          ? { trigger: sec, start: 'top top', end: '+=150%', pin: true, scrub: 0.6, anticipatePin: 1 }
          : { trigger: text, start: 'top 75%', end: 'bottom 45%', scrub: 0.6 }
      });
      var span = 0.78, each = span / words.length;
      words.forEach(function (w, i) {
        lit.to(w, { opacity: 1, duration: each * 2.2 }, 0.02 + i * each);
        if (emWords.indexOf(w) > -1) lit.to(w, { '--u': 1, duration: each * 3, ease: 'power2.out' }, 0.02 + i * each + each);
      });
      if (sign) lit.fromTo(sign, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.08 }, 0.8);
      if (scan) {
        lit.fromTo(scan, { xPercent: 0, opacity: 0 }, { xPercent: 100, opacity: 1, duration: 0.12, ease: 'power2.inOut' }, 0.84)
           .to(scan, { opacity: 0, duration: 0.03 }, 0.96)
           .call(function () { bg('pulse', 0.6); }, null, 0.9);
      }
      lit.to({}, { duration: 0.02 }, 0.98);
    });
  }

  /* ------------------------------------------------------------------
     H3 · SLOTS — deal the deck
     ------------------------------------------------------------------ */
  function setupDeck(mm) {
    var g = W.gsap;
    var sec = qs('.h-slots');
    var deck = sec && qs('.h-slots__deck', sec);
    if (!deck) return;
    var cards = qsa('.h-card', deck);
    var flips = cards.map(function (c) { return qs('.h-card__flip', c); });
    var bar = qs('.h-slots__bar i', sec);

    media(mm, { desk: DESKTOP, mob: MOBILE }, function (ctx) {
      if (!ctx.conditions.desk) {
        cards.forEach(function (c, i) {
          g.fromTo(c, { opacity: 0, y: 60, scale: 0.94, rotation: i % 2 ? 2 : -2 }, {
            opacity: 1, y: 0, scale: 1, rotation: 0, duration: 0.7, ease: 'back.out(1.7)',
            delay: (i % 2) * 0.08,
            scrollTrigger: { trigger: c, start: 'top 90%', once: true }
          });
        });
        return;
      }

      var ROT = [-6, 4, -2.5, 5.5];
      var geo = null;
      function measure() {
        var dw = deck.offsetWidth;
        geo = cards.map(function (c) { return { dx: dw / 2 - (c.offsetLeft + c.offsetWidth / 2) }; });
      }
      function G(i) { if (!geo) measure(); return geo[i]; }

      cards.forEach(function (c, i) { c.style.zIndex = String(cards.length - i); });
      g.set(flips, { rotateY: 180 });

      var tl = g.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: sec,
          start: 'top top',
          end: '+=250%',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefreshInit: function () { geo = null; }
        }
      });

      // Deal: stacked deck → row
      cards.forEach(function (c, i) {
        tl.fromTo(c,
          { x: function () { return G(i).dx + i * 4; }, y: -i * 4, rotation: ROT[i % ROT.length], scale: 0.92 },
          { x: 0, y: 0, rotation: 0, scale: 1, duration: 0.42, ease: 'power3.inOut' }, 0.04 + i * 0.05);
      });
      // Flip: backs → fronts
      flips.forEach(function (f, i) {
        if (f) tl.to(f, { rotateY: 0, duration: 0.2, ease: 'power2.inOut' }, 0.58 + i * 0.07);
      });
      if (bar) tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);
      tl.to({}, { duration: 0.1 }, 1);

      return function () { cards.forEach(function (c) { c.style.zIndex = ''; }); };
    });

    // Hover: dim siblings + preview destination's WebGL field
    cards.forEach(function (c) {
      function on() {
        deck.classList.add('has-hover');
        c.classList.add('is-hover');
        var pi = parseInt(c.getAttribute('data-h-page'), 10);
        if (finePointer() && pi === pi) bg('setState', { page: pi, accent: c.getAttribute('data-h-accent') || undefined }, 0.6);
      }
      function off() {
        deck.classList.remove('has-hover');
        c.classList.remove('is-hover');
        if (finePointer()) bg('reset', 0.6);
      }
      c.addEventListener('mouseenter', on);
      c.addEventListener('mouseleave', off);
      c.addEventListener('focus', function () { deck.classList.add('has-hover'); c.classList.add('is-hover'); });
      c.addEventListener('blur', function () { deck.classList.remove('has-hover'); c.classList.remove('is-hover'); });
    });
  }

  /* ------------------------------------------------------------------
     H4 · STATUS — velocity skew on marquee rows
     ------------------------------------------------------------------ */
  function setupStatus() {
    var g = W.gsap, ST = W.ScrollTrigger;
    var sec = qs('.h-status');
    if (!sec || !finePointer() || !g) return;
    var rows = qsa('.h-status__row', sec);
    if (!rows.length) return;
    var setters = rows.map(function (r) { return g.quickSetter(r, 'skewX', 'deg'); });
    var active = false, cur = 0, lastOut = 0;
    if (ST) ST.create({ trigger: sec, start: 'top bottom', end: 'bottom top', onToggle: function (s) { active = s.isActive; } });
    addTick(function () {
      if (!active && cur === 0) return;
      var target = active ? velocity() * 4 : 0;
      cur += (target - cur) * 0.12;
      if (Math.abs(cur) < 0.01) cur = 0;
      if (cur === lastOut) return;
      lastOut = cur;
      for (var i = 0; i < setters.length; i++) setters[i](i % 2 ? cur : -cur);
    });
  }

  /* ------------------------------------------------------------------
     H5 · STATS — slot frames draw their corners
     ------------------------------------------------------------------ */
  function setupStats() {
    var g = W.gsap, ST = W.ScrollTrigger;
    qsa('.h-stat').forEach(function (el, i) {
      var corners = qsa('.h-stat__c', el);
      var bar = qs('.h-stat__bar i', el);
      var fill = parseFloat(el.getAttribute('data-h-fill')) || 1;
      g.set(corners, { scale: 0 });
      if (bar) g.set(bar, { scaleX: 0 });
      ST.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: function () {
          g.to(corners, { scale: 1, duration: 0.6, ease: 'back.out(1.7)', stagger: 0.07, delay: i * 0.08 });
          if (bar) g.to(bar, { scaleX: fill, duration: 1.6, ease: 'power2.out', delay: 0.2 + i * 0.08 });
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     Static mode (reduced motion / no GSAP): complete, readable, still
     ------------------------------------------------------------------ */
  function staticMode() {
    if (hero) {
      hero.classList.add('is-in');
      heroSlots.forEach(function (s) { s.classList.add('is-filled'); });
      setCount(heroSlots.length);
    }
  }

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  function init() {
    var g = W.gsap, ST = W.ScrollTrigger;
    if (g && ST && isFn(g, 'registerPlugin')) { try { g.registerPlugin(ST); } catch (e) {} }

    try { buildGenerative(); } catch (e) { warn(e); }
    heroPrepare();

    if (!g || !ST || reduced()) { staticMode(); return; }

    var mm = isFn(g, 'matchMedia') ? g.matchMedia() : null;

    try { heroEnter(); } catch (e) { warn(e); if (hero) hero.classList.add('is-in'); }

    if (hero) {
      media(mm, { desk: DESKTOP, mob: MOBILE }, function (ctx) {
        try { return ctx.conditions.desk ? heroDesktop() : heroMobile(); } catch (e) { warn(e); staticMode(); }
      });
    }
    try { setupManifesto(mm); } catch (e) { warn(e); }
    try { setupDeck(mm); } catch (e) { warn(e); }
    // H4 velocity skew is applied by core's data-marquee (track skewX); no extra row skew here.
    try { setupStats(); } catch (e) { warn(e); }
    try { setupParallax(); } catch (e) { warn(e); }

    try { ST.sort(); } catch (e) { /* older ST */ }
    refresh();

    var s = site();
    if (isFn(s, 'on')) {
      try {
        s.on('transition:start', function () { bg('reset', 0.3); });
      } catch (e) { /* noop */ }
    }
  }

  function boot() {
    if (booted) return;
    booted = true;
    try { init(); } catch (e) { warn(e); staticMode(); }
  }

  var S0 = site();
  if (S0 && isFn(S0, 'onReady')) {
    try { S0.onReady(boot); } catch (e) { boot(); }
  } else {
    var go = function () {
      var fr = D.fonts && D.fonts.ready, done = false;
      var run = function () { if (!done) { done = true; boot(); } };
      if (fr && fr.then) { fr.then(run, run); W.setTimeout(run, 2500); } else run();
    };
    if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', go); else go();
  }

  // Failsafe: never leave the hero hidden if the lifecycle stalls.
  W.setTimeout(function () {
    var h = qs('.h-hero');
    if (h && !h.classList.contains('is-in')) { h.classList.add('is-in'); if (!booted) boot(); }
  }, 7000);
})();
