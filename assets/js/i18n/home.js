/* =====================================================================
   INVENTORY — i18n · HOME (slot 01)
   Keys: home.*  ·  The same copy is also the static content of index.html.
   Lists (status marquee, counters) live in assets/data/content.js.
   Any key can be overridden from admin.html → All texts.
   ===================================================================== */
(function (I) {
  if (!I) return;
  I.en = I.en || {};

  Object.assign(I.en, {
    'home.meta.title': 'Yangshun Zhu — Game Designer Portfolio',

    'home.hero.label': 'Opening inventory',
    'home.hero.role': 'I design levels <em>and the stories inside them.</em>',
    'home.hero.sub': 'Game design student focused on level design and narrative. Currently building Project 403, a pixel art narrative game in Unity.',
    'home.hero.chip1': 'Level Design',
    'home.hero.chip2': 'Narrative Design',
    'home.hero.chip3': 'Student',
    'home.hero.scroll': 'Scroll — scan the inventory',
    'home.hero.hud1': 'Scan active',
    'home.hero.hud2': 'Rack A-01 · Bay 001',
    'home.hero.gridLabel': 'Inventory',
    'home.hero.slotsAria': 'Inventory slots: Y, A, N, G, S, H, U, N, Z, H, U',
    'home.hero.inv': 'This is my <em>inventory.</em>',

    'home.slot.s1': 'LV 01',
    'home.slot.s2': 'Unity',
    'home.slot.s3': 'Rare',
    'home.slot.s4': 'UE',
    'home.slot.s5': 'Level Flow',
    'home.slot.s6': 'Epic',
    'home.slot.s7': 'Narrative',
    'home.slot.s8': 'Systems',
    'home.slot.s9': 'Git',
    'home.slot.s10': 'Legendary',
    'home.slot.s11': 'Quest',


    'home.slots.label': 'Slots',
    'home.slots.title': 'Four slots. <em>One designer.</em>',
    'home.slots.intro': 'Every slot is a page. Pick a card, open the door.',
    'home.slots.hud': 'Dealing cards',
    'home.card.open': 'Open',
    'home.card.back': 'Scroll — flip the card',
    'home.card.about.flavor': '“Who I am and how I think about levels and stories.”',
    'home.card.about.k': 'Role',
    'home.card.about.v': 'Designer',
    'home.card.games.flavor': '“Game projects and design concepts, from narrative worlds to decision systems.”',
    'home.card.games.k': 'Type',
    'home.card.games.v': 'Game Design',
    'home.card.projects.flavor': '“The software projects you are proud of.”',
    'home.card.projects.k': 'Type',
    'home.card.projects.v': 'Software',
    'home.card.contact.flavor': '“Get in touch about a project, a job or a collaboration.”',
    'home.card.contact.k': 'Status',
    'home.card.contact.v': 'Open',

    'home.status.label': 'Status bar',
    'home.status.nowK': 'Now',
    'home.status.nowV': 'Project 403 in Unity',
    'home.status.learnK': 'Education',
    'home.status.learnV': 'University of Pittsburgh at Johnstown — Computer Science',
    'home.status.stateK': 'Status',
    'home.status.stateV': 'applying to graduate programs',

    'home.stats.label': 'Counters',
    'home.stats.title': 'Inventory <em>summary.</em>'
  });
})(window.I18N);
