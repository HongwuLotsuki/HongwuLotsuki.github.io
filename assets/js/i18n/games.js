/* =====================================================================
   INVENTORY — i18n · games (games.html)
   Keys: games.*  ·  The same copy is also the static content of the HTML.
   ===================================================================== */
(function (I) {
  if (!I) { return; }
  I.en = I.en || {};

  Object.assign(I.en, {
    'games.meta.title': 'Games — Yangshun Zhu',

    'games.hud.hp': 'HP',
    'games.hud.score': 'Score',
    'games.hud.fps': 'FPS',
    'games.hud.map': 'Map',

    'games.hero.label': 'Game development',
    'games.hero.line1': 'Level',
    'games.hero.line2': 'Select.',
    'games.hero.titleLabel': 'Level select.',
    'games.hero.prompt': '▶ Scroll to start',
    'games.hero.lead': 'A short intro to your game development work: the games you have shipped or are building, the engines you use and the jams you have joined.',
    'games.hero.world': 'World 1',
    'games.hero.worldHint': 'Pick a level',
    'games.hero.player': 'Player 1',
    'games.hero.class': 'Class: Game developer',
    'games.hero.goto': 'Go to level {n}',

    'games.intro.label': 'Player info',
    'games.intro.title': 'From idea <em>to release.</em>',
    'games.intro.body': 'Describe how you approach game development: what you care about in a game, the kind of projects you enjoy and what you are working on right now.',
    'games.intro.stat1': 'projects',
    'games.intro.stat2': 'jams',
    'games.intro.stat3': 'playtests',

    'games.levels.label': 'Levels',
    'games.levels.title': 'Game projects',
    'games.levels.counter': 'Level',
    'games.levels.hint': 'Drag or scroll',
    'games.level.play': 'Play ▶',
    'games.level.notes': 'Dev note',
    'games.level.did': 'What I did',
    'games.level.close': 'Close',
    'games.level.flipLabel': 'Show developer notes',
    'games.field.genre': 'Genre',
    'games.field.role': 'Role',
    'games.field.engine': 'Engine',
    'games.field.year': 'Year',

    'games.l5.title': 'Next level',
    'games.l5.desc': 'The next project is on its way.',
    'games.l5.status': 'Locked',

    'games.loadout.label': 'Loadout',
    'games.loadout.title': 'The <em>tools</em> I use.',
    'games.loadout.log': 'Equipment log',
    'games.loadout.ready': 'Loadout complete — fully powered',
    'games.loadout.equipped': '{name} equipped',

    'games.arcade.label': 'Secret level',
    'games.arcade.title': 'Fancy <em>a quick run?</em>',
    'games.arcade.canvas': 'Stock Hunter mini-game',
    'games.arcade.instructions': 'Stock Hunter: catch the falling inventory items with your crate. Move with the mouse, your finger or the left/right arrow keys. Press Space or Enter to start and Esc to quit. Avoid the red damaged items; you have 30 seconds and 3 lives.',
    'games.arcade.start': 'Start game',
    'games.arcade.move': 'Move',
    'games.arcade.startKey': 'Start',
    'games.arcade.quit': 'Quit',
    'games.arcade.small': 'This little game was written from scratch for this page. ~300 lines of vanilla JS.',
    'games.arcade.insert': 'No coins required',

    'games.game.title': 'Stock Hunter',
    'games.game.press': 'Click or press space',
    'games.game.hi': 'High score',
    'games.game.score': 'Score',
    'games.game.time': 'Time',
    'games.game.combo': 'Combo',
    'games.game.level': 'Level {n}',
    'games.game.faster': 'Speeding up!',
    'games.game.over': 'Inventory full!',
    'games.game.timeUp': 'Time\'s up',
    'games.game.broken': 'Too many damaged goods',
    'games.game.again': 'Again — click / space',
    'games.game.newHi': 'New high score!',
    'games.game.paused': 'Paused',
    'games.game.resume': 'Click to resume',
    'games.game.ready': 'Ready',
    'games.game.go': 'Go!',
    'games.game.caught': 'Caught',
    'games.game.bestCombo': 'Best combo',
    'games.game.gold': 'Gold mode',
    'games.game.damage': 'Damaged!',
    'games.item.box': 'Box',
    'games.item.coin': 'Coin',
    'games.item.label': 'Label',
    'games.item.gem': 'Gem',
    'games.item.bad': 'Damaged',

    'games.toast.record': 'New high score: {n}',
    'games.toast.gold': 'Gold mode unlocked — every item ×2'
  });
})(window.I18N);
