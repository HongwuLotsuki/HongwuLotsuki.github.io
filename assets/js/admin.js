/* =====================================================================
   INVENTORY — admin panel (admin.html)
   Edits window.SITE_CONTENT. Two modes:
   - server: opened via admin-server.js (http://localhost) → "Save"
     writes assets/data/content.js directly (password protected).
   - file:   opened from disk / static host → "Save" downloads a new
     content.js to replace assets/data/content.js by hand.
   Drafts autosave to localStorage; "Preview" shows the draft on the site.
   ===================================================================== */
(function (W, D) {
  'use strict';

  var PUBLISHED;
  var DRAFT_KEY = 'inv-content-draft', PREVIEW_KEY = 'inv-content-preview', TOKEN_KEY = 'inv-admin-token';
  var data, server = false, token = '', tab = 'general', dirty = false;
  var I = (W.I18N && W.I18N.en) || {};

  /* ---------------- helpers ---------------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function $(s, r) { return (r || D).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); }
  function h(tag, attrs, kids) {
    var el = D.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'text') el.textContent = v;
      else if (k === 'class') el.className = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c != null) el.appendChild(typeof c === 'string' ? D.createTextNode(c) : c); });
    return el;
  }
  function store(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function toast(msg, bad) {
    var t = $('#ad-toast'); t.textContent = msg; t.className = 'ad-toast is-on' + (bad ? ' is-bad' : '');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.className = 'ad-toast'; }, 2800);
  }
  /* Older content files may hold {en, ...} objects; flatten them to plain strings / arrays */
  function str(v) { return v && typeof v === 'object' && !Array.isArray(v) ? (v.en || '') : (v == null ? '' : v); }
  function strList(v) { return Array.isArray(v) ? v.slice() : (v && Array.isArray(v.en) ? v.en.slice() : []); }
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item-' + Date.now(); }

  function normalise(c) {
    c = c || {};
    c.profile = c.profile || {};
    ['channels', 'projects', 'games', 'gameStats', 'loadout', 'timeline', 'bars', 'equipped', 'homeStats', 'marquee'].forEach(function (k) { if (!Array.isArray(c[k])) c[k] = []; });
    c.skillLevels = c.skillLevels || {};
    if (!c.text || typeof c.text !== 'object' || c.text.en) c.text = (c.text && c.text.en) || {};
    return c;
  }

  function markDirty() {
    var now = JSON.stringify(cleanData());
    dirty = now !== JSON.stringify(PUBLISHED);
    $('#ad-dirty').hidden = !dirty;
    store(DRAFT_KEY, dirty ? now : null);
    if (!dirty) store(PREVIEW_KEY, null);
  }

  /* ---------------- field builders ---------------- */
  // Every builder reads/writes obj[key] and calls markDirty on input.
  function fText(obj, key, label, o) {
    o = o || {};
    var cur = str(obj[key]);
    var inp = h(o.area ? 'textarea' : 'input', { type: o.type || 'text', rows: o.area ? (o.rows || 3) : null, placeholder: o.ph || '', value: o.area ? null : cur });
    if (o.area) inp.value = cur;
    inp.addEventListener('input', function () { obj[key] = o.type === 'number' ? (inp.value === '' ? '' : +inp.value) : inp.value; if (o.onInput) o.onInput(); markDirty(); });
    return h('label', { class: 'ad-field' + (o.wide ? ' ad-field--wide' : '') }, [h('span', { text: label }), inp, o.help ? h('small', { text: o.help }) : null]);
  }
  function fList(obj, key, label) {
    var ta = h('textarea', { rows: 5 }); ta.value = strList(obj[key]).join('\n');
    ta.addEventListener('input', function () { obj[key] = ta.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean); markDirty(); });
    return h('label', { class: 'ad-field ad-field--wide' }, [h('span', { text: label }), ta, h('small', { text: 'One item per line.' })]);
  }
  function fTags(obj, key, label, help) {
    var inp = h('input', { type: 'text', value: (obj[key] || []).join(', ') });
    inp.addEventListener('input', function () { obj[key] = inp.value.split(',').map(function (x) { return x.trim(); }).filter(Boolean); markDirty(); });
    return h('label', { class: 'ad-field ad-field--wide' }, [h('span', { text: label }), inp, h('small', { text: help || 'Comma separated.' })]);
  }
  function fBool(obj, key, label, help) {
    var inp = h('input', { type: 'checkbox' }); inp.checked = !!obj[key];
    inp.addEventListener('change', function () { obj[key] = inp.checked; markDirty(); });
    return h('label', { class: 'ad-check' }, [inp, h('span', { text: label }), help ? h('small', { text: help }) : null]);
  }
  function fSelect(obj, key, label, opts) {
    var sel = h('select');
    opts.forEach(function (op) { var o = h('option', { value: op[0], text: op[1] }); if (obj[key] === op[0]) o.selected = true; sel.appendChild(o); });
    if (!obj[key]) obj[key] = opts[0][0];
    sel.addEventListener('change', function () { obj[key] = sel.value; markDirty(); });
    return h('label', { class: 'ad-field' }, [h('span', { text: label }), sel]);
  }
  function grid(kids) { return h('div', { class: 'ad-grid' }, kids); }
  function section(title, desc, kids) {
    return h('section', { class: 'ad-sec' }, [h('header', { class: 'ad-sec__head' }, [h('h2', { text: title }), desc ? h('p', { class: 'ad-dim', text: desc }) : null])].concat(kids));
  }

  /* A reorderable list of cards. build(item) returns the card body. */
  function listEditor(arr, opts) {
    var wrap = h('div', { class: 'ad-list' });
    function render() {
      wrap.innerHTML = '';
      arr.forEach(function (item, i) {
        var title = opts.title(item, i);
        var body = h('div', { class: 'ad-card__body' }, [opts.build(item, function () { $('.ad-card__title', card).textContent = opts.title(item, i); })]);
        var card = h('details', { class: 'ad-card', open: opts.open === true || (opts.openNew && item.__new) ? true : null }, [
          h('summary', { class: 'ad-card__sum' }, [
            h('span', { class: 'ad-card__idx ad-mono', text: String(i + 1).padStart(2, '0') }),
            h('span', { class: 'ad-card__title', text: title }),
            h('span', { class: 'ad-card__tools' }, [
              h('button', { type: 'button', class: 'ad-icon', title: 'Move up', disabled: i === 0 ? true : null, onclick: function (e) { e.preventDefault(); move(i, -1); } }, ['↑']),
              h('button', { type: 'button', class: 'ad-icon', title: 'Move down', disabled: i === arr.length - 1 ? true : null, onclick: function (e) { e.preventDefault(); move(i, 1); } }, ['↓']),
              opts.duplicate !== false ? h('button', { type: 'button', class: 'ad-icon', title: 'Duplicate', onclick: function (e) { e.preventDefault(); if (opts.max && arr.length >= opts.max) return toast('You can add at most ' + opts.max + ' items.', true); var c = clone(item); if (c.id) c.id = c.id + '-copy'; arr.splice(i + 1, 0, c); markDirty(); render(); } }, ['⧉']) : null,
              h('button', { type: 'button', class: 'ad-icon ad-danger', title: 'Delete', onclick: function (e) { e.preventDefault(); if (confirm('Delete "' + opts.title(item, i) + '"?')) { arr.splice(i, 1); markDirty(); render(); } } }, ['✕'])
            ])
          ]),
          body
        ]);
        delete item.__new;
        wrap.appendChild(card);
      });
      var add = h('button', { type: 'button', class: 'ad-btn ad-add', onclick: function () {
        if (opts.max && arr.length >= opts.max) return toast('You can add at most ' + opts.max + ' items.', true);
        var it = opts.create(); it.__new = true; arr.push(it); markDirty(); render();
        var last = wrap.querySelectorAll('.ad-card'); last = last[last.length - 1]; if (last) { last.open = true; last.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      } }, ['+ ' + opts.addLabel]);
      wrap.appendChild(h('div', { class: 'ad-list__foot' }, [add, opts.max ? h('span', { class: 'ad-dim ad-small', text: arr.length + '/' + opts.max }) : null]));
    }
    function move(i, d) { var j = i + d; if (j < 0 || j >= arr.length) return; var t = arr[i]; arr[i] = arr[j]; arr[j] = t; markDirty(); render(); }
    render();
    return wrap;
  }

  /* ---------------- tabs ---------------- */
  var TABS = {};

  TABS.general = function () {
    var p = data.profile;
    return [
      section('Profile', 'The e-mail is updated on every page (menu, footer, contact form).', [grid([
        fText(p, 'name', 'Full name'),
        fText(p, 'email', 'E-mail', { type: 'email' }),
        fText(p, 'school', 'School'),
        fText(p, 'program', 'Program')
      ])]),
      section('Contact channels', 'The list on the contact page and the social links in the menu. Channels without a link are hidden.', [
        listEditor(data.channels, {
          addLabel: 'Add channel', title: function (c) { return (c.name || 'New channel') + (c.url ? '' : '  (hidden — no link)'); },
          create: function () { return { name: '', handle: '', url: '', menu: true }; },
          build: function (c, retitle) { return grid([
            fText(c, 'name', 'Name (e.g. LinkedIn)', { onInput: retitle }),
            fText(c, 'handle', 'Displayed handle', { ph: '@username' }),
            fText(c, 'url', 'Link', { type: 'url', ph: 'https://…', wide: true, onInput: retitle }),
            fBool(c, 'menu', 'Also show in the menu')
          ]); }
        })
      ])
    ];
  };

  TABS.projects = function () {
    return [section('Projects', 'The cards on the projects page. Reorder them with the arrow buttons.', [
      listEditor(data.projects, {
        addLabel: 'Add project', title: function (p) { return str(p.title) || 'New project'; },
        create: function () { return { id: '', title: '', category: '', status: 'Active', year: String(new Date().getFullYear()), summary: '', features: [], stack: [], repo: '', demo: '', private: false }; },
        build: function (p, retitle) { return h('div', {}, [
          fText(p, 'title', 'Title', { wide: true, onInput: function () { if (!p.id || p.__autoId) { p.id = slug(p.title); p.__autoId = true; } retitle(); } }),
          grid([fText(p, 'category', 'Category', { ph: 'e.g. Web app · CLI tool' }), fText(p, 'status', 'Status', { ph: 'Active / Completed' }), fText(p, 'year', 'Year')]),
          fText(p, 'summary', 'Summary', { area: true, wide: true }),
          fList(p, 'features', 'Highlights'),
          fTags(p, 'stack', 'Technologies'),
          grid([fText(p, 'repo', 'GitHub link', { type: 'url' }), fText(p, 'demo', 'Live demo link', { type: 'url' })]),
          fBool(p, 'private', 'Private repo', 'When checked, a "Private repo — on request" badge replaces the GitHub button.')
        ]); }
      })
    ])];
  };

  var COVERS = [['city', 'Neon city'], ['shelf', 'Pixel shelves'], ['tetris', 'Block puzzle'], ['fog', 'Foggy corridor'], ['locked', 'Static / locked']];
  TABS.games = function () {
    return [
      section('Games', 'The level cards on the games page. A "Next level" card is added to the end automatically.', [
        listEditor(data.games, {
          addLabel: 'Add game', title: function (g) { return str(g.title) || 'New game'; },
          create: function () { return { id: '', cover: 'city', status: '', title: '', genre: '', role: '', engine: '', year: '', desc: '', tags: [], link: '', linkLabel: '', notes: [] }; },
          build: function (g, retitle) { return h('div', {}, [
            fText(g, 'title', 'Game title', { wide: true, onInput: function () { g.id = slug(g.title); retitle(); } }),
            grid([fText(g, 'status', 'Status', { ph: 'In development' }), fText(g, 'genre', 'Genre'), fText(g, 'role', 'My role')]),
            grid([fText(g, 'engine', 'Engine / platform', { ph: 'Godot · GDScript' }), fText(g, 'year', 'Year'), fSelect(g, 'cover', 'Cover animation', COVERS)]),
            fText(g, 'github', 'GitHub repository', { ph: 'https://github.com/user/repo', wide: true }),
            fText(g, 'coverImage', 'Local cover image', { ph: 'assets/media/project/cover.png', wide: true }),
            grid([fText(g, 'coverAlt', 'Image description'), fText(g, 'coverCaption', 'Cover label')]),
            fText(g, 'desc', 'Description', { area: true, wide: true }),
            fTags(g, 'tags', 'Tags'),
            grid([fText(g, 'link', 'Link (Steam, itch.io…)', { type: 'url', help: 'Empty hides the button; with a button label (e.g. Coming soon) it shows as inactive.' }), fText(g, 'linkLabel', 'Button label')]),
            fText(g, 'caseStudy', 'Case-study page', { ph: 'case-roadtrip.html', wide: true, help: 'Optional. A page in the site folder named case-….html adds a "Read more" link.' }),
            fList(g, 'notes', 'Developer notes (back of the card)')
          ]); }
        })
      ]),
      section('Player info counters', 'The 3 small counters on the games page. Non-numeric values (e.g. ∞) are shown as animated text.', [
        listEditor(data.gameStats, {
          addLabel: 'Add counter', max: 4, duplicate: false, title: function (s) { return s.value + ' — ' + str(s.label); },
          create: function () { return { value: '1', label: '', bar: 0.5 }; },
          build: function (s, retitle) { return grid([fText(s, 'value', 'Value', { onInput: retitle }), fText(s, 'label', 'Label', { onInput: retitle }), fText(s, 'bar', 'Bar fill (0–1)', { type: 'number' })]); }
        })
      ]),
      section('Tools (loadout)', 'The tools equipped on the robot on the games page. Up to 6.', [
        listEditor(data.loadout, {
          addLabel: 'Add tool', max: 6, duplicate: false, title: function (t) { return t.name || 'New tool'; },
          create: function () { return { name: '', glyph: '', role: '' }; },
          build: function (t, retitle) { return grid([fText(t, 'name', 'Name', { onInput: retitle }), fText(t, 'glyph', 'Short code (2–3 letters)'), fText(t, 'role', 'Role')]); }
        })
      ])
    ];
  };

  var GLYPHS = [['code', 'Code </>'], ['terminal', 'Terminal'], ['window', 'Window / app'], ['cube', 'Cube / 3D'], ['bot', 'Bot'], ['branch', 'Git branch'], ['box', 'Package / box'], ['db', 'Database'], ['gamepad', 'Gamepad'], ['globe', 'Web / globe'], ['bolt', 'Bolt'], ['star', 'Star']];
  var RARITY = [['common', 'Common (grey)'], ['rare', 'Rare (cyan)'], ['epic', 'Epic (green)'], ['legendary', 'Legendary (gold)']];
  var SKILLS = ['unity', 'csharp', 'gameplay', 'physics', 'shader', 'git', 'problem', 'team', 'lang', 'db', 'apps', 'barcode', 'reports'];
  TABS.about = function () {
    var ov = data.text;
    var skillRows = SKILLS.map(function (id) {
      var key = 'about.skill.' + id;
      var name = ov[key] || I[key] || id;
      var lv = { v: data.skillLevels[id] || 3 };
      var range = h('input', { type: 'range', min: 1, max: 5, step: 1, value: lv.v });
      var out = h('output', { class: 'ad-mono', text: lv.v + '/5' });
      range.addEventListener('input', function () { data.skillLevels[id] = +range.value; out.textContent = range.value + '/5'; markDirty(); });
      return h('div', { class: 'ad-skill' }, [h('span', { text: name }), range, out]);
    });
    return [
      section('Profile bars', 'The 3 percentage bars on the profile card.', [
        listEditor(data.bars, {
          addLabel: 'Add bar', max: 3, duplicate: false, title: function (b) { return str(b.label) + ' — ' + b.value; },
          create: function () { return { label: '', value: 50 }; },
          build: function (b, retitle) { return grid([fText(b, 'label', 'Label', { onInput: retitle }), fText(b, 'value', 'Value (0–100)', { type: 'number', onInput: retitle })]); }
        })
      ]),
      section('Journey (timeline)', 'The steps on the about page. A "Next step" card is added to the end automatically.', [
        listEditor(data.timeline, {
          addLabel: 'Add step', title: function (s) { return (str(s.year) ? str(s.year) + ' · ' : '') + (str(s.title) || 'New step'); },
          create: function () { return { year: '', title: '', text: '' }; },
          build: function (s, retitle) { return h('div', {}, [grid([fText(s, 'year', 'Year / period', { onInput: retitle, ph: '2026 — Today' })]), fText(s, 'title', 'Title', { wide: true, onInput: retitle }), fText(s, 'text', 'Description', { area: true, wide: true })]); }
        })
      ]),
      section('Skill levels', 'The level of each node in the skill tree. Edit their names and descriptions in "All texts" by searching for "about.skill".', [h('div', { class: 'ad-skills' }, skillRows)]),
      section('Tech stack', 'The 12-slot inventory on the about page. Empty slots are filled in automatically.', [
        listEditor(data.equipped, {
          addLabel: 'Add technology', max: 12, title: function (e) { return str(e.name) || 'New technology'; },
          create: function () { return { glyph: 'code', rarity: 'common', name: '', type: '', flavor: '' }; },
          build: function (e, retitle) { return h('div', {}, [grid([fText(e, 'name', 'Name', { onInput: retitle }), fSelect(e, 'glyph', 'Icon', GLYPHS), fSelect(e, 'rarity', 'Colour / rarity', RARITY)]), grid([fText(e, 'type', 'Type'), fText(e, 'flavor', 'Short description')])]); }
        })
      ]),
      section('About texts', null, [h('p', { class: 'ad-dim' }, ['For the title, intro paragraph, story chapters and profile card rows use ', h('button', { type: 'button', class: 'ad-link', onclick: function () { go('texts', 'about.'); } }, ['All texts → about.']), '.'])])
    ];
  };

  TABS.home = function () {
    return [
      section('Marquee', 'The large scrolling list of technologies on the home page.', [fTags(data, 'marquee', 'Words')]),
      section('Counters', 'The "Inventory summary" boxes on the home page.', [
        listEditor(data.homeStats, {
          addLabel: 'Add counter', max: 4, duplicate: false, title: function (s) { return s.value + ' — ' + str(s.label); },
          create: function () { return { value: '1', label: '', fill: 0.5 }; },
          build: function (s, retitle) { return grid([fText(s, 'value', 'Value', { onInput: retitle }), fText(s, 'label', 'Label', { onInput: retitle }), fText(s, 'fill', 'Bar fill (0–1)', { type: 'number' })]); }
        })
      ]),
      section('Home page texts', null, [h('p', { class: 'ad-dim' }, ['For the headline, subtitle, manifesto and card texts use ', h('button', { type: 'button', class: 'ad-link', onclick: function () { go('texts', 'home.'); } }, ['All texts → home.']), '.'])])
    ];
  };

  var GROUPS = [['', 'All'], ['home.', 'Home'], ['about.', 'About'], ['games.', 'Games'], ['projects.', 'Projects'], ['contact.', 'Contact'], ['nav.', 'Menu'], ['footer.', 'Footer'], ['common.', 'Common'], ['preloader.', 'Loading screen']];
  var textFilter = { q: '', group: '', changed: false };
  TABS.texts = function () {
    var keys = Object.keys(I);
    var listBox = h('div', { class: 'ad-texts' });
    var q = h('input', { type: 'search', placeholder: 'Search: key or text…', value: textFilter.q });
    var g = h('select'); GROUPS.forEach(function (x) { var o = h('option', { value: x[0], text: x[1] }); if (x[0] === textFilter.group) o.selected = true; g.appendChild(o); });
    var ch = h('input', { type: 'checkbox' }); ch.checked = textFilter.changed;
    function draw() {
      textFilter.q = q.value; textFilter.group = g.value; textFilter.changed = ch.checked;
      var needle = q.value.toLowerCase();
      var rows = keys.filter(function (k) {
        if (g.value && k.indexOf(g.value) !== 0) return false;
        if (ch.checked && !(k in data.text)) return false;
        if (!needle) return true;
        return (k + ' ' + (I[k] || '') + ' ' + (data.text[k] || '')).toLowerCase().indexOf(needle) > -1;
      });
      listBox.innerHTML = '';
      var shown = rows.slice(0, 150);
      shown.forEach(function (k) {
        var row = h('div', { class: 'ad-text' + (k in data.text ? ' is-changed' : '') }, [h('code', { class: 'ad-text__key', text: k })]);
        var def = I[k] != null ? I[k] : '';
        var long = String(def).length > 60;
        var inp = h(long ? 'textarea' : 'input', { rows: long ? 3 : null, placeholder: def });
        inp.value = data.text[k] != null ? data.text[k] : def;
        inp.addEventListener('input', function () {
          if (inp.value === def) delete data.text[k]; else data.text[k] = inp.value;
          row.classList.toggle('is-changed', k in data.text);
          markDirty();
        });
        var reset = h('button', { type: 'button', class: 'ad-icon', title: 'Reset to default', onclick: function () { inp.value = def; delete data.text[k]; row.classList.toggle('is-changed', false); markDirty(); } }, ['↺']);
        row.appendChild(h('label', { class: 'ad-field' }, [h('span', {}, ['Text', reset]), inp]));
        listBox.appendChild(row);
      });
      if (rows.length > shown.length) listBox.appendChild(h('p', { class: 'ad-dim', text: (rows.length - shown.length) + ' more texts — narrow the search.' }));
      if (!rows.length) listBox.appendChild(h('p', { class: 'ad-dim', text: 'No matching texts.' }));
    }
    q.addEventListener('input', draw); g.addEventListener('change', draw); ch.addEventListener('change', draw);
    draw();
    return [section('All texts', 'Every heading, paragraph and label on the site. A changed text replaces the default; ↺ reverts it. Use <em> for an emphasised (italic) word.', [
      h('div', { class: 'ad-filter' }, [q, g, h('label', { class: 'ad-check' }, [ch, h('span', { text: 'Only my changes' })])]),
      listBox
    ])];
  };

  function go(name, q) {
    tab = name;
    if (q != null) { textFilter.q = ''; textFilter.group = q; }
    $$('#ad-tabs [data-tab]').forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-tab') === name); });
    var main = $('#ad-main'); main.innerHTML = '';
    TABS[name]().forEach(function (n) { main.appendChild(n); });
    main.scrollTop = 0; W.scrollTo(0, 0);
  }

  /* ---------------- save / export ---------------- */
  function cleanData() {
    var c = clone(data);
    (function strip(o) { if (o && typeof o === 'object') Object.keys(o).forEach(function (k) { if (k.slice(0, 2) === '__') delete o[k]; else strip(o[k]); }); })(c);
    c.projects.forEach(function (p, i) { if (!p.id) p.id = slug(str(p.title)) || 'project-' + (i + 1); });
    c.games.forEach(function (g, i) { if (!g.id) g.id = slug(str(g.title)) || 'game-' + (i + 1); });
    return c;
  }
  function fileText(c) {
    return '/* INVENTORY — site content. Edited by admin.html; safe to edit by hand too.\n   "text" overrides any i18n key (see admin → All texts). */\n' +
      'window.SITE_CONTENT = ' + JSON.stringify(c, null, 2).replace(/<\/script/gi, '<\\/script') + ';\n';
  }
  function download(name, text, type) {
    var a = h('a', { href: URL.createObjectURL(new Blob([text], { type: type })), download: name });
    D.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function api(path, body) {
    return fetch(path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token }, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j.__status = r.status; return j; }); });
  }

  function save() {
    var c = cleanData();
    c.updated = new Date().toLocaleDateString('sv-SE');
    if (!server) {
      download('content.js', fileText(c), 'text/javascript');
      notice('<strong>content.js downloaded.</strong> Replace <code>assets/data/content.js</code> in the project folder with the downloaded file and the site is updated. To save directly, run the panel with <code>npm run admin</code>.', 'info');
      return;
    }
    var btn = $('#ad-save'); btn.disabled = true; btn.textContent = 'Saving…';
    api('/api/save', { content: c }).then(function (j) {
      btn.disabled = false; btn.textContent = 'Save';
      if (j.__status === 401) { toast('Session expired, please log in again.', true); showLogin(); return; }
      if (!j.ok) { toast('Could not save: ' + (j.error || 'error'), true); return; }
      c.updated = j.updated; PUBLISHED = normalise(clone(c)); data = normalise(clone(c));
      store(PREVIEW_KEY, null); markDirty(); hideNotice();
      toast('Saved — site updated ✓');
    }).catch(function () { btn.disabled = false; btn.textContent = 'Save'; toast('Server unreachable. Is admin-server.js running?', true); });
  }

  function notice(html, kind) { var n = $('#ad-notice'); n.innerHTML = html; n.className = 'ad-notice ad-notice--' + (kind || 'info'); n.hidden = false; }
  function hideNotice() { $('#ad-notice').hidden = true; }

  /* ---------------- boot ---------------- */
  PUBLISHED = normalise(clone(W.SITE_CONTENT || {}));
  function start() {
    data = normalise(clone(PUBLISHED));
    var draft = read(DRAFT_KEY);
    if (draft) {
      try {
        var d = normalise(JSON.parse(draft));
        if (JSON.stringify(d) !== JSON.stringify(PUBLISHED)) {
          data = d;
          notice('An unpublished draft was found and loaded. Unless you save it, it only lives in this browser. <button type="button" class="ad-link" id="ad-discard">Discard draft</button>', 'warn');
          $('#ad-discard').addEventListener('click', discard);
        }
      } catch (e) {}
    }
    $('#ad-app').hidden = false; $('#ad-login').hidden = true;
    $('#ad-mode').textContent = server ? 'Server mode · changes are saved straight to the site' : 'File mode · Save downloads content.js';
    $('#ad-save').textContent = server ? 'Save' : 'Save (download)';
    $('#ad-logout').hidden = !server;
    markDirty();
    go(tab);
  }
  function discard() {
    if (!confirm('Discard all unsaved changes?')) return;
    store(DRAFT_KEY, null); store(PREVIEW_KEY, null);
    data = normalise(clone(PUBLISHED)); markDirty(); hideNotice(); go(tab); toast('Draft discarded.');
  }
  function showLogin() {
    $('#ad-app').hidden = true; $('#ad-login').hidden = false; $('#ad-password').focus();
  }

  $('#ad-tabs').addEventListener('click', function (e) { var b = e.target.closest('[data-tab]'); if (b) go(b.getAttribute('data-tab')); });
  $('#ad-save').addEventListener('click', save);
  $('#ad-download').addEventListener('click', function () { download('content.js', fileText(cleanData()), 'text/javascript'); });
  $('#ad-export').addEventListener('click', function () { download('site-content-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(cleanData(), null, 2), 'application/json'); });
  $('#ad-import').addEventListener('change', function (e) {
    var f = e.target.files[0]; if (!f) return;
    f.text().then(function (t) {
      var j = JSON.parse(t.replace(/^[\s\S]*?window\.SITE_CONTENT\s*=\s*/, '').replace(/;\s*$/, ''));
      if (!j || !j.profile) throw new Error();
      data = normalise(j); markDirty(); go(tab); toast('Imported — don\'t forget to save.');
    }).catch(function () { toast('Could not read the file.', true); });
    e.target.value = '';
  });
  $('#ad-reset').addEventListener('click', discard);
  $('#ad-preview').addEventListener('click', function () {
    store(DRAFT_KEY, JSON.stringify(cleanData())); store(PREVIEW_KEY, '1');
    W.open('index.html', '_blank', 'noopener');
    toast('Preview opened. Close it from the yellow bar at the bottom of the site.');
  });
  $('#ad-logout').addEventListener('click', function () { api('/api/logout', {}); token = ''; store(TOKEN_KEY, null); showLogin(); });
  $('#ad-login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('#ad-login-err'); err.textContent = '';
    api('/api/login', { password: $('#ad-password').value }).then(function (j) {
      if (j.token) { token = j.token; try { sessionStorage.setItem(TOKEN_KEY, token); } catch (x) {} $('#ad-password').value = ''; start(); }
      else err.textContent = j.error === 'locked' ? 'Too many failed attempts. Try again in ' + j.retry + ' s.' : 'Wrong password.';
    }).catch(function () { err.textContent = 'Server unreachable.'; });
  });
  W.addEventListener('beforeunload', function (e) { if (dirty && server) { e.preventDefault(); e.returnValue = ''; } });

  // Mode detection: served by admin-server.js → server mode with login
  if (/^https?:$/.test(location.protocol)) {
    try { token = sessionStorage.getItem(TOKEN_KEY) || ''; } catch (e) {}
    fetch('/api/status', { headers: { 'X-Admin-Token': token } }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (j && j.server) { server = true; if (j.authed) start(); else showLogin(); } else start();
    }).catch(start);
  } else start();
})(window, document);
