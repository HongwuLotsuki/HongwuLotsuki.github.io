/* =====================================================================
   INVENTORY — content runtime
   Loads after the i18n dictionaries and before core.js. Renders the
   admin-managed data (assets/data/content.js) into [data-content]
   containers and merges text overrides into I18N, so core's reveals,
   splits and page scripts see the final markup.
   ===================================================================== */
(function (w, d) {
  var html = d.documentElement;
  var C = w.SITE_CONTENT || {};

  /* Admin preview: a draft saved by admin.html replaces the published data */
  var preview = false;
  try {
    if (localStorage.getItem('inv-content-preview') === '1') {
      var draft = JSON.parse(localStorage.getItem('inv-content-draft') || 'null');
      if (draft) { C = draft; preview = true; }
    }
  } catch (e) {}
  w.SITE_CONTENT = C;

  /* Plain strings; {en} objects from older content files still work */
  function tx(v) {
    if (v == null) return '';
    if (typeof v === 'object' && !Array.isArray(v)) return v.en != null ? v.en : '';
    return String(v);
  }
  function list(v) { var x = v && !Array.isArray(v) ? v.en : v; return Array.isArray(x) ? x : []; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function safeUrl(u) { u = String(u || '').trim(); return /^(https?:|mailto:)/i.test(u) ? u : ''; }
  function qsa(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function each(name, fn) { qsa('[data-content="' + name + '"]').forEach(fn); }

  /* ---------- 1. text overrides → I18N ---------- */
  var I = w.I18N = w.I18N || { en: {} };
  var T = C.text || {};
  if (T.en && typeof T.en === 'object') T = T.en;
  Object.keys(T).forEach(function (k) { if (typeof T[k] === 'string' && T[k] !== '') I.en[k] = T[k]; });

  /* ---------- 2. profile: name + e-mail everywhere ---------- */
  var P = C.profile || {};
  var OLD = 'zhuzhuyangshun@126.com';
  if (P.name) qsa('[data-profile="name"]').forEach(function (el) { el.textContent = P.name; });
  if (P.email && P.email !== OLD) {
    qsa('[data-copy]').forEach(function (el) {
      if (el.getAttribute('data-copy').indexOf('@') < 0) return;
      el.setAttribute('data-copy', P.email);
      if (el.textContent.trim() === OLD) el.textContent = P.email;
      var al = el.getAttribute('aria-label'); if (al) el.setAttribute('aria-label', al.replace(OLD, P.email));
    });
    qsa('a[href^="mailto:"]').forEach(function (a) {
      a.setAttribute('href', 'mailto:' + P.email);
      qsa('*', a).concat([a]).forEach(function (n) { if (n.children.length === 0 && n.textContent.trim() === OLD) n.textContent = P.email; });
    });
    qsa('.c-quest__to').forEach(function (el) { el.textContent = '→ ' + P.email; });
  }

  /* ---------- 3. channels (menu socials + contact list) ---------- */
  var CH = (C.channels || []).filter(function (c) { return safeUrl(c.url); });
  each('social', function (ul) {
    ul.innerHTML = CH.filter(function (c) { return c.menu; }).map(function (c) {
      return '<li><a class="link" href="' + esc(safeUrl(c.url)) + '" target="_blank" rel="noopener">' + esc(c.name) + '</a></li>';
    }).join('');
  });
  each('channels', function (ul) {
    var mail = P.email || OLD;
    var rows = [{ name: 'E-mail', handle: mail, url: 'mailto:' + mail, preview: mail, mail: true }].concat(CH.map(function (c) {
      return { name: c.name, handle: c.handle || c.url.replace(/^https?:\/\/(www\.)?/, ''), url: c.url, preview: c.url.replace(/^https?:\/\/(www\.)?/, '') };
    }));
    ul.innerHTML = rows.map(function (r, i) {
      return '<li><a class="c-channel" href="' + esc(safeUrl(r.url)) + '"' + (r.mail ? '' : ' target="_blank" rel="noopener"') + ' data-cursor="view" data-cursor-text="' + 'Open' + '">' +
        '<span class="c-channel__fill" aria-hidden="true"></span>' +
        '<span class="c-channel__idx t-mono">' + pad(i + 1) + '</span>' +
        '<span class="c-channel__name">' + esc(r.name) + '</span>' +
        '<span class="c-channel__handle t-mono">' + esc(r.handle) + '</span>' +
        '<span class="c-channel__arrow" aria-hidden="true">↗</span>' +
        '<span class="c-channel__preview t-mono" aria-hidden="true">' + esc(r.preview) + '</span></a></li>';
    }).join('');
  });

  /* ---------- 4. home ---------- */
  each('marquee', function (track) {
    track.innerHTML = (C.marquee || []).map(function (wd) {
      return '<span class="h-status__word">' + esc(tx(wd)) + '</span><i class="h-status__dot" aria-hidden="true"></i> ';
    }).join('');
  });
  each('homeStats', function (ul) {
    ul.innerHTML = (C.homeStats || []).map(function (s, i) {
      var v = String(s.value), num = /^\d+([.,]\d+)?$/.test(v);
      return '<li class="h-stat' + (num ? '' : ' h-stat--inf') + '" data-h-fill="' + esc(s.fill != null ? s.fill : 0.5) + '">' +
        '<i class="h-stat__c h-stat__c--tl"></i><i class="h-stat__c h-stat__c--tr"></i><i class="h-stat__c h-stat__c--bl"></i><i class="h-stat__c h-stat__c--br"></i>' +
        '<span class="h-stat__idx t-micro t-mono" aria-hidden="true">SKU-' + (num ? pad(i + 1) : esc(v)) + '</span>' +
        '<span class="h-stat__num t-mono" ' + (num ? 'data-counter="' + esc(v) + '"' : 'data-scramble="reveal"') + '>' + esc(v) + '</span>' +
        '<span class="h-stat__label">' + esc(tx(s.label)) + '</span>' +
        '<span class="h-stat__bar" aria-hidden="true"><i></i></span></li>';
    }).join('');
  });

  /* ---------- 5. about ---------- */
  var GLYPH = {
    code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
    window: '<rect x="2" y="4" width="20" height="16"/><path d="M2 8h20M5 6h1M8 6h1"/>',
    cube: '<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 12l9-5M12 12L3 7M12 12v10"/>',
    bot: '<rect x="4" y="8" width="16" height="12"/><path d="M12 3v5M9 13h.01M15 13h.01M9 17h6M2 13v3M22 13v3"/>',
    branch: '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="9" r="2"/><path d="M6 7v10M18 11c0 4-6 3-12 6"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
    terminal: '<rect x="2" y="4" width="20" height="16"/><path d="M6 9l3 3-3 3M12 15h6"/>',
    db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    gamepad: '<path d="M6 8h12a4 4 0 0 1 4 4v1a4 4 0 0 1-7 3H9a4 4 0 0 1-7-3v-1a4 4 0 0 1 4-4z"/><path d="M7 11v3M5.5 12.5h3M15 12h1M18 12h1"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    star: '<path d="M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3.5 3.5M15.5 15.5L19 19M19 5l-3.5 3.5M8.5 15.5L5 19"/><rect x="10" y="10" width="4" height="4"/>'
  };
  w.SITE_GLYPHS = GLYPH;

  each('bars', function (box) {
    var cls = ['hp', 'mp', 'st'];
    box.innerHTML = (C.bars || []).slice(0, 3).map(function (b, i) {
      var v = Math.max(0, Math.min(100, parseInt(b.value, 10) || 0));
      return '<div class="a-bar a-bar--' + cls[i] + '" data-value="' + v + '"><span class="a-bar__k">' + esc(tx(b.label)) + '</span><span class="a-bar__track"><i></i></span><span class="a-bar__n">' + v + '</span></div>';
    }).join('');
  });

  each('timeline', function (ol) {
    var items = (C.timeline || []).map(function (s, i) {
      return '<li class="a-save" data-reveal="slot" data-reveal-start="top 75%"><span class="a-save__node" aria-hidden="true"></span>' +
        '<div class="a-save__card" data-tilt="4"><div class="a-save__meta t-mono t-micro"><span>' + 'Save' + ' ' + pad(i + 1) + '</span><span>' + esc(tx(s.year) || '—') + '</span></div>' +
        '<h3 class="a-save__title t-h3">' + esc(tx(s.title)) + '</h3><p class="a-save__text">' + esc(tx(s.text)) + '</p></div></li>';
    });
    var n = items.length + 1;
    items.push('<li class="a-save a-save--next" data-reveal="slot" data-reveal-start="top 75%"><span class="a-save__node" aria-hidden="true"></span>' +
      '<div class="a-save__card"><div class="a-save__meta t-mono t-micro"><span>' + 'Save' + ' ' + pad(n) + '</span><span>???</span></div>' +
      '<h3 class="a-save__title t-h3" data-i18n="about.saves.s6.title">' + esc(I.en['about.saves.s6.title'] || '') + '</h3>' +
      '<p class="a-save__text" data-i18n="about.saves.s6.text">' + esc(I.en['about.saves.s6.text'] || '') + '</p>' +
      '<a class="a-save__cta t-mono t-micro" href="contact.html" data-cursor="link" data-magnetic="0.3"><span data-magnetic-inner><span data-i18n="about.saves.s6.cta">' + esc(I.en['about.saves.s6.cta'] || '') + '</span> →</span></a></div></li>');
    ol.innerHTML = items.join('');
  });

  if (C.skillLevels) qsa('li[data-skill]').forEach(function (li) {
    var lv = C.skillLevels[li.getAttribute('data-skill')];
    if (lv) { li.setAttribute('data-level', lv); var p = li.querySelector('.a-pips'); if (p) p.setAttribute('data-level', lv); }
  });

  each('equipped', function (ul) {
    var items = (C.equipped || []).slice(0, 12);
    var total = Math.max(12, items.length), out = [];
    for (var i = 0; i < total; i++) {
      var it = items[i], num = pad(i + 1);
      if (!it) { out.push('<li><button type="button" class="a-slot a-slot--empty" data-cursor="link" aria-describedby="a-tip-empty"><span class="a-slot__num t-mono">' + num + '</span><span class="a-slot__name t-mono" data-i18n="about.eq.empty">' + esc(I.en['about.eq.empty'] || '') + '</span></button></li>'); continue; }
      var r = it.rarity || 'common', id = 'a-tip-' + i;
      out.push('<li><button type="button" class="a-slot' + (r === 'legendary' ? ' a-slot--legendary' : '') + '" data-rarity="' + esc(r) + '"' + (r === 'legendary' ? ' data-tilt="10"' : '') + ' data-cursor="link" aria-describedby="' + id + '">' +
        '<span class="a-slot__num t-mono">' + num + '</span>' +
        '<svg class="a-slot__glyph" viewBox="0 0 24 24" aria-hidden="true">' + (GLYPH[it.glyph] || GLYPH.code) + '</svg>' +
        '<span class="a-slot__name t-mono">' + esc(tx(it.name)) + '</span>' +
        '<span class="a-slot__tip" id="' + id + '" hidden><span class="a-tip__type">' + esc(tx(it.type)) + '</span><span class="a-tip__flavor">' + esc(tx(it.flavor)) + '</span></span></button></li>');
    }
    ul.innerHTML = out.join('');
    qsa('[data-content="equippedCount"]').forEach(function (el) { el.textContent = items.length + '/' + total + ' slots filled'; });
  });

  /* ---------- 6. games ---------- */
  var GAMES = C.games || [];
  each('gameStats', function (ul) {
    ul.innerHTML = (C.gameStats || []).map(function (s) {
      var v = String(s.value), num = /^\d+$/.test(v);
      return '<li><div class="g-chip" data-tilt="6"><span class="g-chip__num t-mono' + (num ? '' : ' g-chip__num--inf') + '" ' + (num ? 'data-counter="' + esc(v) + '"' : 'data-scramble="reveal"') + '>' + esc(v) + '</span>' +
        '<span class="g-chip__label t-mono t-micro">' + esc(tx(s.label)) + '</span><span class="g-chip__bar" aria-hidden="true"><i style="--v:' + (+s.bar || 0.5) + '"></i></span></div></li>';
    }).join('');
  });
  each('games', function (track) {
    var F = { genre: 'Genre', role: 'Role', engine: 'Engine', year: 'Year', status: 'Status' };
    var out = GAMES.map(function (g, i) {
      var st = '1-' + (i + 1), sku = 'INV-G' + pad(i + 1), link = safeUrl(g.link), notes = list(g.notes), title = esc(tx(g.title));
      var imagePath = tx(g.coverImage).trim();
      var hasImage = /^assets\/media\/(?:[a-z0-9_-]+\/)*[a-z0-9_.-]+\.(?:png|jpe?g|webp)$/i.test(imagePath);
      var coverMedia = hasImage
        ? '<img class="g-level__image" src="' + esc(imagePath) + '" alt="' + esc(tx(g.coverAlt)) + '" decoding="async" loading="lazy">'
        : '<canvas class="g-level__canvas" aria-hidden="true"></canvas>';
      var caption = hasImage && tx(g.coverCaption)
        ? '<span class="g-level__caption t-mono t-micro">' + esc(tx(g.coverCaption)) + '</span>' : '';
      var meta = [['status', tx(g.status)], ['genre', tx(g.genre)], ['role', tx(g.role)], ['engine', tx(g.engine)], ['year', tx(g.year)]]
        .filter(function (m) { return m[1]; }).map(function (m) { return '<div><dt>' + F[m[0]] + '</dt><dd' + (m[0] === 'engine' ? ' lang="en"' : '') + '>' + esc(m[1]) + '</dd></div>'; }).join('');
      var action = link
        ? '<a class="g-level__play t-mono" href="' + esc(link) + '" target="_blank" rel="noopener" data-cursor="link">' + esc(tx(g.linkLabel) || 'Play ▶') + '</a>'
        : (tx(g.linkLabel) ? '<span class="g-level__play g-level__play--soon t-mono">' + esc(tx(g.linkLabel)) + '</span>' : '');
      var study = /^case-[a-z0-9-]+\.html$/i.test(tx(g.caseStudy).trim())
        ? '<a class="g-level__play g-level__play--study t-mono" href="' + esc(tx(g.caseStudy).trim()) + '" data-cursor="link">Read more →</a>' : '';
      var gh = safeUrl(g.github)
        ? '<a class="g-level__play g-level__play--study g-level__play--gh t-mono" href="' + esc(safeUrl(g.github)) + '" target="_blank" rel="noopener" data-cursor="link">View on GitHub ↗</a>' : '';
      action = '<div class="g-level__links">' + study + action + gh + '</div>';
      var flip = notes.length ? '<button type="button" class="g-level__flip t-mono t-micro" data-cursor="link" aria-label="' + 'Show developer notes' + '"><span>' + 'Dev note' + '</span> ↻</button>' : '';
      var back = notes.length ? '<div class="g-level__face g-level__back" aria-hidden="true"><p class="g-level__num t-mono t-micro">LV ' + st + ' · ' + 'Design notes' + '</p><h3 class="g-level__title t-h3">' + title + '</h3>' +
        '<ol class="g-level__did">' + notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ol>' +
        '<button type="button" class="g-level__close t-mono t-micro" data-cursor="link"><span>' + 'Close' + '</span> ✕</button></div>' : '';
      return '<article class="g-level" data-level="' + i + '" data-cover="' + esc(g.cover || 'shelf') + '"><div class="g-level__inner"><div class="g-level__face g-level__front">' +
        '<div class="g-level__cover" data-cursor="view" data-cursor-text="VIEW">' + coverMedia + '<span class="g-level__stage t-mono">' + st + '</span>' + caption + '</div>' +
        '<div class="g-level__info"><p class="g-level__num t-mono t-micro">LV ' + st + ' · ' + sku + '</p><h3 class="g-level__title t-h3">' + title + '</h3>' +
        '<dl class="g-level__meta t-mono t-micro">' + meta + '</dl><p class="g-level__desc t-small">' + esc(tx(g.desc)) + '</p>' +
        '<ul class="g-level__tags t-mono t-micro" lang="en">' + (g.tags || []).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
        '<div class="g-level__actions">' + action + flip + '</div></div></div>' + back + '</div></article>';
    });
    out.push('<article class="g-level g-level--locked" data-level="' + GAMES.length + '" data-cover="locked"><div class="g-level__inner"><div class="g-level__face g-level__front">' +
      '<div class="g-level__cover"><canvas class="g-level__canvas" aria-hidden="true"></canvas><span class="g-level__stage t-mono">+</span></div>' +
      '<div class="g-level__info"><p class="g-level__num t-mono t-micro">LV ? · <span data-i18n="games.l5.status">' + esc(I.en['games.l5.status'] || '') + '</span></p>' +
      '<h3 class="g-level__title t-h3" data-i18n="games.l5.title">' + esc(I.en['games.l5.title'] || '') + '</h3><p class="g-level__desc t-small" data-i18n="games.l5.desc">' + esc(I.en['games.l5.desc'] || '') + '</p></div></div></div></article>');
    track.innerHTML = out.join('');
  });
  each('gameNodes', function (ol) {
    ol.innerHTML = GAMES.map(function (g, i) {
      return '<li><button type="button" class="g-world__node t-mono" data-goto-level="' + i + '" data-cursor="link" aria-label="' + esc(tx(g.title)) + '">1-' + (i + 1) + '</button></li>';
    }).join('') + '<li><button type="button" class="g-world__node g-world__node--locked t-mono" data-goto-level="' + GAMES.length + '" data-cursor="link" aria-label="' + esc(I.en['games.l5.title'] || '') + '">+</button></li>';
  });
  each('gameRoll', function (col) {
    col.innerHTML = GAMES.map(function (g, i) { return '<span>' + (i + 1) + '</span>'; }).join('') + '<span>+</span>';
  });
  each('gameTotal', function (el) { el.textContent = '/' + GAMES.length; });
  each('loadout', function (ul) {
    ul.innerHTML = (C.loadout || []).slice(0, 6).map(function (it, i) {
      return '<li class="g-tile" data-gear="' + i + '" data-name="' + esc(it.name) + '"><span class="g-tile__glyph t-mono">' + esc(it.glyph || it.name.slice(0, 2)) + '</span>' +
        '<span class="g-tile__meta"><span class="g-tile__name t-mono" lang="en">' + esc(it.name) + '</span><span class="g-tile__role t-mono">' + esc(tx(it.role)) + '</span></span><span class="g-tile__key t-mono">' + (i + 1) + '</span></li>';
    }).join('');
  });

  /* ---------- 7. projects ---------- */
  each('projects', function (box) {
    var PR = C.projects || [];
    box.innerHTML = PR.map(function (p, i) {
      var repo = safeUrl(p.repo), demo = safeUrl(p.demo), feats = list(p.features);
      var links = [];
      if (demo) links.push('<a class="btn btn--solid p-card__btn" href="' + esc(demo) + '" target="_blank" rel="noopener" data-cursor="link">' + 'Live demo' + ' ↗</a>');
      if (repo && !p.private) links.push('<a class="btn p-card__btn" href="' + esc(repo) + '" target="_blank" rel="noopener" data-cursor="link"><svg class="icon"><use href="#i-github"/></svg> GitHub ↗</a>');
      if (p.private) links.push('<span class="p-card__lock t-mono t-micro" title="' + 'Source is private; available on request.' + '">● ' + 'Private repo — on request' + '</span>');
      return '<article class="p-card" id="p-' + esc(p.id || i) + '" data-reveal="up">' +
        '<div class="p-card__rail t-mono t-micro" aria-hidden="true"><span class="p-card__idx">' + pad(i + 1) + '</span><span class="p-card__line"></span><span>INV-P' + pad(i + 1) + '</span></div>' +
        '<div class="p-card__body">' +
          '<header class="p-card__head"><p class="p-card__cat t-mono t-micro">' + esc(tx(p.category)) + '</p>' +
          '<p class="p-card__state t-mono t-micro"><i class="p-dot" aria-hidden="true"></i>' + esc(tx(p.status)) + (p.year ? ' · ' + esc(p.year) : '') + '</p></header>' +
          '<h2 class="p-card__title t-h2">' + esc(tx(p.title)) + '</h2>' +
          '<p class="p-card__summary t-lead">' + esc(tx(p.summary)) + '</p>' +
          (feats.length ? '<ul class="p-card__feats">' + feats.map(function (f, k) { return '<li><span class="t-mono t-micro">' + pad(k + 1) + '</span><span>' + esc(f) + '</span></li>'; }).join('') + '</ul>' : '') +
          '<footer class="p-card__foot"><ul class="p-card__stack t-mono t-micro" lang="en">' + (p.stack || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' +
          '<div class="p-card__links">' + links.join('') + '</div></footer>' +
        '</div></article>';
    }).join('');
  });
  each('projectCount', function (el) { el.textContent = pad((C.projects || []).length); });
  each('projectStack', function (el) {
    var seen = {}, out = [];
    (C.projects || []).forEach(function (p) { (p.stack || []).forEach(function (s) { if (!seen[s]) { seen[s] = 1; out.push(s); } }); });
    el.textContent = pad(out.length);
  });

  /* ---------- 8. preview badge ---------- */
  if (preview) {
    var b = d.createElement('button');
    b.type = 'button';
    b.textContent = 'PREVIEW — unpublished draft · close ✕';
    b.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:200;font:600 11px/1 "JetBrains Mono",monospace;letter-spacing:.08em;padding:10px 14px;background:#F2B544;color:#0C0D0B;border:0;cursor:pointer';
    b.addEventListener('click', function () { try { localStorage.removeItem('inv-content-preview'); } catch (e) {} location.reload(); });
    (d.body || html).appendChild(b);
  }
})(window, document);
