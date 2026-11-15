/* =====================================================================
   INVENTORY — contact page (contact.html) · slot 05 · Laser
   C1 save-point hero (save crystal canvas, email object)
   C2 quest form → mailto · C3 channels · C4 "Continue?" countdown
   Classic script, IIFE, no globals. Defensive against a partial SITE API.
   ===================================================================== */
(function () {
  'use strict';
  if (!document.body || document.body.dataset.page !== 'contact') return;

  var doc = document;
  var root = doc.documentElement;
  var EMAIL = (window.SITE_CONTENT && window.SITE_CONTENT.profile && window.SITE_CONTENT.profile.email) || 'you@example.com';

  /* ------------------------------------------------------------------
     Defensive bridge to window.SITE
     ------------------------------------------------------------------ */
  function S() { return window.SITE || null; }
  function has(obj, fn) { return !!(obj && typeof obj[fn] === 'function'); }
  function qs(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function pad(n, l) { n = String(n); while (n.length < l) n = '0' + n; return n; }

  function isReduced() { var s = S(); return !!((s && s.reducedMotion) || root.classList.contains('is-reduced')); }
  function isTouch() { var s = S(); return !!((s && s.isTouch) || root.classList.contains('is-touch')); }
  function lang() { var s = S(); return (s && s.lang) || ('en'); }
  function locale() { var s = S(); return (s && s.locale) || ('en-US'); }

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
    function run() { if (fired) return; fired = true; try { fn(); } catch (e) { if (window.console) console.error('[contact]', e); } }
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
  function rgb(c, fallback) {
    // accepts #rgb, #rrggbb or rgb()/rgba() → "r,g,b"
    c = (c || '').trim();
    var m;
    if ((m = /^#([0-9a-f]{3})$/i.exec(c))) {
      return [0, 1, 2].map(function (i) { return parseInt(m[1].charAt(i) + m[1].charAt(i), 16); }).join(',');
    }
    if ((m = /^#([0-9a-f]{6})$/i.exec(c))) {
      return [0, 2, 4].map(function (i) { return parseInt(m[1].substr(i, 2), 16); }).join(',');
    }
    if ((m = /rgba?\(([^)]+)\)/i.exec(c))) return m[1].split(',').slice(0, 3).map(function (x) { return parseFloat(x); }).join(',');
    return fallback;
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
          out += (c === ' ' || c === '.' || c === '@') ? c : GLYPHS.charAt((Math.random() * GLYPHS.length) | 0);
        }
        el.textContent = out;
      },
      onComplete: function () { el.textContent = finalText; }
    });
  }

  function watch(el, cb) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { cb(e.isIntersecting); });
    }, { rootMargin: '60px 0px' });
    io.observe(el);
  }

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

  var mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, nx: 0, ny: 0 };
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    mouse.x = e.clientX; mouse.y = e.clientY;
    mouse.nx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ny = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  /* ==================================================================
     C1 · HERO — save crystal, email object, live timestamp
     ================================================================== */
  function initCrystal() {
    var canvas = qs('.c-hero__crystal');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var reduced = isReduced();
    var LASER = rgb(color('--c-laser', '#FF4A1C'), '255,74,28');
    var BONE = rgb(color('--c-bone', '#ECE7DC'), '236,231,220');
    var OK = rgb(color('--c-phosphor', '#B6F23A'), '182,242,58');
    var W = 0, H = 0, dpr = 1;

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, isTouch() ? 1 : 1.5);
      W = Math.min(canvas.clientWidth, 800); H = Math.min(canvas.clientHeight, 800);
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
    }
    size();
    onResize(function () { size(); if (reduced) render(0); });

    /* geometry: elongated octahedron (classic save crystal) + inner core */
    function octa(sx, sy) {
      return [[0, sy, 0], [sx, 0, 0], [0, 0, sx], [-sx, 0, 0], [0, 0, -sx], [0, -sy, 0]];
    }
    var OUT = octa(1, 1.7), IN = octa(0.42, 0.72);
    var EDGES = [[0, 1], [0, 2], [0, 3], [0, 4], [5, 1], [5, 2], [5, 3], [5, 4], [1, 2], [2, 3], [3, 4], [4, 1]];
    var RINGS = [
      { r: 2.3, tilt: 1.2, speed: 0.35, dots: 3 },
      { r: 2.9, tilt: 1.42, speed: -0.22, dots: 2 },
      { r: 3.5, tilt: 1.05, speed: 0.15, dots: 4 }
    ];

    var rotY = 0, tiltX = 0, tiltY = 0, pulse = 0, saved = 0;
    canvas._pulse = function (v) { pulse = Math.max(pulse, v); };
    canvas._saved = function () { saved = 1; pulse = 1; };

    function project(p, ry, rx, scale, cx, cy) {
      var x = p[0], y = p[1], z = p[2];
      var c = Math.cos(ry), s = Math.sin(ry);
      var x1 = x * c - z * s, z1 = x * s + z * c;
      var cx2 = Math.cos(rx), sx2 = Math.sin(rx);
      var y2 = y * cx2 - z1 * sx2, z2 = y * sx2 + z1 * cx2;
      var f = 6 / (6 + z2);
      return [cx + x1 * scale * f, cy - y2 * scale * f, z2];
    }

    function render(time) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var cx = W * 0.5, cy = H * 0.5 + Math.sin(time * 1.1) * 8, scale = Math.min(W, H) * 0.13 * (1 + pulse * 0.06);
      var ry = rotY, rx = 0.18 + tiltX;

      /* orbit rings with travelling signal dots */
      RINGS.forEach(function (ring, ri) {
        ctx.beginPath();
        var steps = 72, prev = null;
        for (var i = 0; i <= steps; i++) {
          var a = (i / steps) * Math.PI * 2;
          var p = [Math.cos(a) * ring.r, Math.sin(a) * ring.r * Math.cos(ring.tilt), Math.sin(a) * ring.r * Math.sin(ring.tilt)];
          var q = project(p, ry * 0.4 + ri, rx + tiltY * 0.5, scale, cx, cy);
          if (!prev) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]);
          prev = q;
        }
        ctx.strokeStyle = 'rgba(' + BONE + ',' + (0.09 + pulse * 0.1) + ')';
        ctx.lineWidth = 1;
        ctx.setLineDash(ri === 1 ? [2, 6] : []);
        ctx.stroke();
        ctx.setLineDash([]);
        for (var d = 0; d < ring.dots; d++) {
          var a2 = time * ring.speed + (d / ring.dots) * Math.PI * 2;
          var p2 = [Math.cos(a2) * ring.r, Math.sin(a2) * ring.r * Math.cos(ring.tilt), Math.sin(a2) * ring.r * Math.sin(ring.tilt)];
          var q2 = project(p2, ry * 0.4 + ri, rx + tiltY * 0.5, scale, cx, cy);
          var front = q2[2] < 0 ? 1 : 0.35;
          ctx.fillStyle = 'rgba(' + (saved > 0.01 ? OK : LASER) + ',' + (0.85 * front) + ')';
          ctx.fillRect(q2[0] - 2, q2[1] - 2, 4, 4);
        }
      });

      /* crystals */
      function drawSolid(verts, rY, alphaBase, col, width) {
        var pts = verts.map(function (v) { return project(v, rY, rx, scale, cx, cy); });
        EDGES.forEach(function (e) {
          var a = pts[e[0]], b = pts[e[1]];
          var depth = (a[2] + b[2]) / 2;
          var al = alphaBase * (depth < 0 ? 1 : 0.35);
          ctx.strokeStyle = 'rgba(' + col + ',' + al + ')';
          ctx.lineWidth = width;
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        });
        return pts;
      }
      var accent = saved > 0.01 ? OK : LASER;
      // glow = one wide faint pass (no canvas shadowBlur: very slow on software GL)
      drawSolid(OUT, ry, 0.12 + pulse * 0.15, accent, 6);
      var outer = drawSolid(OUT, ry, 0.75 + pulse * 0.25, accent, 1.5);
      drawSolid(IN, -ry * 1.6, 0.55, BONE, 1);

      /* vertical scan line through the crystal */
      var top = outer[0][1], bot = outer[5][1];
      var sy = lerp(top, bot, (time * 0.35) % 1);
      ctx.fillStyle = 'rgba(' + LASER + ',0.5)';
      ctx.fillRect(cx - scale * 1.3, sy, scale * 2.6, 1);

      /* base shadow ellipse */
      ctx.beginPath();
      ctx.ellipse(cx, H * 0.5 + scale * 2.4, scale * 1.1 * (1 - Math.sin(time * 1.1) * 0.05), scale * 0.16, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(' + BONE + ',0.12)';
      ctx.stroke();
    }

    if (reduced) { render(0); return; }

    var visible = true;
    watch(canvas, function (v) { visible = v; });
    var last = 0;
    addTick(function (time, dt) {
      if (!visible) return;
      // 30 fps on touch, 45 on desktop (slow rotation; saves a lot on weak GPUs)
      if (time - last < (isTouch() ? 1 / 30 : 1 / 45)) return;
      var d = Math.min(time - last, 0.1);
      last = time;
      var s = S(), vel = (s && s.scroll && s.scroll.velocity) || 0;
      rotY += (0.45 + Math.abs(vel) * 3) * d + (isTouch() ? 0 : mouse.nx * 0.6 * d);
      tiltX = lerp(tiltX, isTouch() ? Math.sin(time * 0.5) * 0.2 : mouse.ny * 0.45, 0.05);
      tiltY = lerp(tiltY, isTouch() ? 0 : mouse.nx * 0.4, 0.05);
      pulse = Math.max(0, pulse - d * 1.6);
      saved = Math.max(0, saved - d * 0.25);
      render(time);
    });
  }

  function initHeroMisc() {
    var hero = qs('.c-hero');
    if (!hero) return;
    var gsap = window.gsap, reduced = isReduced();

    /* live "last save" timestamp */
    var now = qs('.c-hero__now', hero);
    function stamp() {
      if (!now) return;
      var txt;
      try {
        txt = new Intl.DateTimeFormat(locale(), { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date());
      } catch (e) { txt = new Date().toLocaleString(); }
      now.textContent = txt;
    }
    stamp();
    setInterval(stamp, 30000);

    /* email: entrance, hover wave, copied flash */
    var email = qs('.c-email', hero);
    if (!email) return;
    var chars = (email._split && email._split.chars && email._split.chars.length) ? email._split.chars : qsa('.split-char', email);

    if (gsap && chars.length && !reduced) {
      gsap.from(chars, { yPercent: 120, opacity: 0, rotation: 8, duration: 1.1, ease: 'expo.out', stagger: { amount: 0.5 }, delay: 0.45 });
    }

    var waving = false;
    email.addEventListener('pointerenter', function () {
      if (!gsap || reduced || waving || !chars.length) return;
      waving = true;
      gsap.to(chars, {
        y: -8, duration: 0.22, ease: 'power2.out', stagger: 0.02, yoyo: true, repeat: 1,
        onComplete: function () { waving = false; }
      });
    });

    email.addEventListener('click', function () {
      var s = S();
      if (!s) {
        // core missing → copy ourselves
        try { navigator.clipboard.writeText(EMAIL); } catch (e) {}
      }
      email.classList.add('is-copied');
      bg('pulse', 0.5);
      var c = qs('.c-hero__crystal');
      if (c && c._pulse) c._pulse(1);
      if (gsap && chars.length && !reduced) {
        gsap.fromTo(chars, { scale: 1.25 }, { scale: 1, duration: 0.5, ease: 'back.out(3)', stagger: { amount: 0.25, from: 'center' } });
      }
      setTimeout(function () { email.classList.remove('is-copied'); }, 900);
    });

    /* hero scroll-out */
    if (gsap && window.ScrollTrigger && !reduced) {
      gsap.to(qs('.c-hero__inner', hero), {
        yPercent: -14, opacity: 0.25, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 }
      });
      gsap.to(qs('.c-hero__crystal', hero), {
        yPercent: -30, scale: 0.85, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 }
      });
    }
  }

  /* ==================================================================
     C2 · QUEST FORM — validate → save bar → mailto
     ================================================================== */
  function initForm() {
    var form = qs('#c-quest');
    if (!form) return;
    var gsap = window.gsap, reduced = isReduced();
    var fName = qs('#c-name', form), fEmail = qs('#c-email', form), fMsg = qs('#c-message', form);
    var radios = qsa('input[name="type"]', form);
    var btn = qs('.c-submit', form), bar = qs('.c-submit__bar', form);
    var label = qs('.c-submit__label', form), pct = qs('.c-submit__pct', form);
    var scan = qs('.c-quest__scan', form), live = qs('.c-quest__live', form);
    var log = qs('.c-log'), logSubject = qs('.c-log__subject'), logGiver = qs('.c-log__giver');
    var logLen = qs('.c-log__len'), logStatus = qs('.c-log__status'), logSku = qs('.c-log__sku');
    var busy = false;
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (logSku) logSku.textContent = 'Q-' + pad(Math.floor(Math.random() * 9000) + 1000, 4);

    function typeLabel() {
      var r = radios.filter(function (x) { return x.checked; })[0];
      return r ? t(r.getAttribute('data-key')) : '';
    }
    function subject() {
      var name = fName.value.trim();
      return '[' + (typeLabel() || t('contact.form.typeDefault')) + '] — ' + (name || t('contact.form.anon'));
    }

    function updateLog() {
      var name = fName.value.trim(), mail = fEmail.value.trim(), msg = fMsg.value.trim();
      if (logSubject) logSubject.textContent = subject();
      if (logGiver) logGiver.textContent = name ? name + (mail ? ' · ' + mail : '') : '—';
      if (logLen) logLen.textContent = t('contact.form.chars', { n: msg.length.toLocaleString(locale()) });
      var done = (name ? 1 : 0) + (EMAIL_RE.test(mail) ? 1 : 0) + (typeLabel() ? 1 : 0) + (msg ? 1 : 0);
      if (log) {
        log.style.setProperty('--done', (done / 4).toFixed(2));
        var ready = !!(name && EMAIL_RE.test(mail) && msg);
        log.classList.toggle('is-ready', ready);
        if (logStatus && !busy) logStatus.textContent = t(ready ? 'contact.form.statusReady' : 'contact.form.statusDraft');
      }
    }

    function autosize() {
      fMsg.style.height = 'auto';
      fMsg.style.height = fMsg.scrollHeight + 'px';
    }

    function setError(input, key) {
      var field = input.closest('.c-field');
      var err = field && qs('.c-field__error', field);
      if (key) {
        if (field) field.classList.add('is-invalid');
        input.setAttribute('aria-invalid', 'true');
        if (err) err.textContent = t(key);
        if (gsap && !reduced && field) gsap.fromTo(field, { x: -8 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)', clearProps: 'transform' });
      } else {
        if (field) field.classList.remove('is-invalid');
        input.removeAttribute('aria-invalid');
        if (err) err.textContent = '';
      }
    }

    [fName, fEmail, fMsg].forEach(function (inp) {
      inp.addEventListener('input', function () {
        if (inp.getAttribute('aria-invalid')) {
          var bad = inp === fEmail ? !EMAIL_RE.test(inp.value.trim()) : !inp.value.trim();
          if (!bad) setError(inp, null);
        }
        if (inp === fMsg) autosize();
        updateLog();
      });
    });

    radios.forEach(function (r) {
      r.addEventListener('change', function () {
        bg('pulse', 0.3);
        var box = r.nextElementSibling;
        if (gsap && !reduced && box) gsap.fromTo(box, { scale: 0.9 }, { scale: 1, duration: 0.5, ease: 'back.out(2.5)', clearProps: 'transform' });
        updateLog();
      });
    });

    function validate() {
      var first = null;
      var checks = [
        [fName, fName.value.trim() ? null : 'contact.form.errEmpty'],
        [fEmail, !fEmail.value.trim() ? 'contact.form.errEmpty' : (EMAIL_RE.test(fEmail.value.trim()) ? null : 'contact.form.errEmail')],
        [fMsg, fMsg.value.trim() ? null : 'contact.form.errEmpty']
      ];
      checks.forEach(function (c) {
        setError(c[0], c[1]);
        if (c[1] && !first) first = c[0];
      });
      return first;
    }

    function mailto() {
      var name = fName.value.trim(), mail = fEmail.value.trim(), msg = fMsg.value.trim();
      var body = msg + '\n\n— ' + name + '\n' + mail;
      return 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject()) + '&body=' + encodeURIComponent(body);
    }

    function reset() {
      busy = false;
      btn.classList.remove('is-saving', 'is-saved');
      btn.removeAttribute('aria-disabled');
      label.textContent = t('contact.form.submit');
      pct.textContent = '→';
      if (gsap) gsap.set(bar, { scaleX: 0 }); else bar.style.transform = 'scaleX(0)';
      updateLog();
    }

    function finish() {
      btn.classList.remove('is-saving');
      btn.classList.add('is-saved');
      label.textContent = t('contact.form.saved');
      pct.textContent = '100%';
      if (logStatus) logStatus.textContent = t('contact.form.statusSaved');
      if (live) live.textContent = t('contact.form.saved') + ' ' + t('contact.form.toastOpening');
      bg('scan', { duration: 1.2, direction: 'down' });
      bg('pulse', 0.6);
      var c = qs('.c-hero__crystal');
      if (c && c._saved) c._saved();
      toast(t('contact.form.toastOpening'), 'ok');
      var href = mailto();
      setTimeout(function () { window.location.href = href; }, 380);
      setTimeout(reset, 4200);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      var bad = validate();
      if (bad) {
        toast(t('contact.form.toastInvalid'), 'warn');
        try { bad.focus({ preventScroll: true }); } catch (err) { bad.focus(); }
        var s = S();
        if (has(s, 'scrollTo')) { try { s.scrollTo(bad.closest('.c-field'), { offset: -160 }); } catch (err) {} }
        return;
      }
      busy = true;
      btn.classList.add('is-saving');
      btn.setAttribute('aria-disabled', 'true');
      label.textContent = t('contact.form.saving');
      if (live) live.textContent = t('contact.form.saving');

      if (!gsap || reduced) {
        if (gsap) gsap.set(bar, { scaleX: 1 }); else bar.style.transform = 'scaleX(1)';
        finish();
        return;
      }
      var o = { p: 0 };
      gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power2.inOut' });
      gsap.to(o, {
        p: 100, duration: 0.9, ease: 'power2.inOut',
        onUpdate: function () { pct.textContent = pad(Math.round(o.p), 3) + '%'; },
        onComplete: function () {
          finish();
          gsap.fromTo(btn, { scale: 1.04 }, { scale: 1, duration: 0.6, ease: 'back.out(3)', clearProps: 'transform' });
        }
      });
      if (scan) {
        gsap.fromTo(scan, { y: 0, opacity: 1 }, {
          y: form.offsetHeight, duration: 0.9, ease: 'power2.inOut',
          onComplete: function () { gsap.to(scan, { opacity: 0, duration: 0.3 }); }
        });
      }
    });

    updateLog();
  }

  /* ==================================================================
     C3 · CHANNELS — directional fill + floating preview chip
     ================================================================== */
  function initChannels() {
    var rows = qsa('.c-channel');
    var gsap = window.gsap;
    if (!rows.length || !gsap || isReduced() || isTouch()) return;

    rows.forEach(function (row) {
      var fill = qs('.c-channel__fill', row), prev = qs('.c-channel__preview', row);
      var px = gsap.quickTo(prev, 'x', { duration: 0.45, ease: 'power3.out' });
      var py = gsap.quickTo(prev, 'y', { duration: 0.45, ease: 'power3.out' });
      function local(e) {
        var r = row.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top, h: r.height };
      }
      row.addEventListener('pointerenter', function (e) {
        var p = local(e), fromTop = p.y < p.h / 2;
        gsap.fromTo(fill, { scaleY: 0, transformOrigin: fromTop ? '50% 0%' : '50% 100%' }, { scaleY: 1, duration: 0.45, ease: 'power3.out', overwrite: true });
        gsap.set(prev, { x: p.x + 18, y: p.y - 36 });
        gsap.to(prev, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)', overwrite: 'auto' });
      });
      row.addEventListener('pointermove', function (e) {
        var p = local(e);
        px(p.x + 18); py(p.y - 36);
      });
      row.addEventListener('pointerleave', function (e) {
        var p = local(e), toTop = p.y < p.h / 2;
        gsap.to(fill, { scaleY: 0, transformOrigin: toTop ? '50% 0%' : '50% 100%', duration: 0.6, ease: 'power3.out', overwrite: true });
        gsap.to(prev, { opacity: 0, scale: 0.8, duration: 0.25, ease: 'power3.in', overwrite: 'auto' });
      });
    });
  }

  /* ==================================================================
     C4 · CONTINUE? — arcade countdown, echo depth
     ================================================================== */
  function initContinue() {
    var sec = qs('.c-continue');
    if (!sec) return;
    var gsap = window.gsap, ST = window.ScrollTrigger, reduced = isReduced();
    var digit = qs('.c-continue__digit', sec), ring = qs('.c-continue__ring-fg', sec);
    var sub = qs('.c-continue__sub', sec), over = qs('.c-continue__over', sec);
    var overText = qs('.c-continue__over-text', sec), mail = qs('.c-continue__mail', sec);
    var coin = qs('.c-continue__coin', sec);
    var noBtn = qs('.c-continue__no', sec);
    var title = qs('.c-continue__title', sec);
    var e1 = qs('.c-continue__echo--1', sec), e2 = qs('.c-continue__echo--2', sec);

    var n = 9, acc = 0, running = false, done = false, inView = false;

    function showOver() {
      done = true; running = false;
      sec.classList.add('is-over');
      if (ring) ring.style.strokeDashoffset = 1;
      if (sub) sub.hidden = true;
      if (coin) coin.hidden = true;
      if (over) over.hidden = false;
      scramble(overText, overText ? overText.textContent : '', 1.1);
      scramble(mail, EMAIL, 1.1, 0.3);
      bg('scan', { duration: 1.4, direction: 'down' });
      bg('pulse', 1);
    }

    function step() {
      n = Math.max(0, n - 1);
      if (digit) digit.textContent = n;
      if (gsap && digit) gsap.fromTo(digit, { yPercent: -45, opacity: 0, scale: 1.35 }, { yPercent: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2)' });
      bg('pulse', 0.15 + (9 - n) * 0.04);
      if (n <= 3) sec.classList.add('is-urgent');
      if (n === 0) showOver();
    }

    if (noBtn) {
      noBtn.addEventListener('click', function () {
        toast(t('contact.continue.stay'), 'info');
        if (done) return;
        running = false; done = true;
        sec.classList.add('is-paused');
        if (coin) coin.hidden = true;
        if (gsap && digit && !reduced) gsap.to(digit, { opacity: 0.3, duration: 0.4 });
      });
    }

    if (reduced) return; // static "DEVAM?" (countdown hidden by CSS)

    if (ring) ring.style.strokeDashoffset = 0;
    if (ST) {
      ST.create({
        trigger: sec, start: 'top 40%', end: 'bottom top',
        onEnter: function () { inView = true; if (!done) running = true; },
        onEnterBack: function () { inView = true; if (!done) running = true; },
        onLeave: function () { inView = false; running = false; },
        onLeaveBack: function () { inView = false; running = false; }
      });
    }
    addTick(function (time, dt) {
      if (!running) return;
      acc += Math.min((dt || 16) / 1000, 0.1);
      if (ring) ring.style.strokeDashoffset = Math.min(acc, 1).toFixed(3);
      if (acc >= 1) {
        acc = 0;
        if (ring) ring.style.strokeDashoffset = 0;
        step();
      }
    });

    /* echo layers: mouse-reactive depth (desktop) / slow drift (touch) */
    if (!gsap) return;
    var visible = false;
    watch(sec, function (v) { visible = v; });
    var q = [
      [gsap.quickTo(e1, 'x', { duration: 0.9, ease: 'power3.out' }), gsap.quickTo(e1, 'y', { duration: 0.9, ease: 'power3.out' }), 22, 14],
      [gsap.quickTo(e2, 'x', { duration: 1.2, ease: 'power3.out' }), gsap.quickTo(e2, 'y', { duration: 1.2, ease: 'power3.out' }), 44, 28],
      [gsap.quickTo(title, 'x', { duration: 0.9, ease: 'power3.out' }), gsap.quickTo(title, 'y', { duration: 0.9, ease: 'power3.out' }), -6, -4]
    ];
    addTick(function (time) {
      if (!visible) return;
      var s = S(), vel = (s && s.scroll && s.scroll.velocity) || 0;
      var nx = isTouch() ? Math.sin(time * 0.6) * 0.6 : mouse.nx;
      var ny = isTouch() ? Math.cos(time * 0.5) * 0.4 : mouse.ny + vel * 2;
      for (var i = 0; i < q.length; i++) { q[i][0](nx * q[i][2]); q[i][1](ny * q[i][3]); }
    });
  }

  /* ==================================================================
     Boot
     ================================================================== */
  onReady(function () {
    if (window.gsap && window.ScrollTrigger && window.gsap.registerPlugin) {
      try { window.gsap.registerPlugin(window.ScrollTrigger); } catch (e) {}
    }
    [initCrystal, initHeroMisc, initForm, initChannels, initContinue].forEach(function (fn) {
      try { fn(); } catch (e) { if (window.console) console.error('[contact]', fn.name, e); }
    });
    var s = S();
    if (s && has(s, 'on')) {
      try { s.on('transition:start', removeTicks); } catch (e) {}
    }
    if (has(s, 'refresh')) { try { s.refresh(); } catch (e) {} }
    else if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  });
})();
