/* Hide or restore the Projects page.
   node tools/toggle-projects.js hide   -> removes Projects from menu, home deck and the Games "next" link
   node tools/toggle-projects.js show   -> puts everything back
   projects.html itself is never deleted, so nothing is lost. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const mode = process.argv[2];
if (mode !== 'hide' && mode !== 'show') { console.log('usage: node tools/toggle-projects.js hide|show'); process.exit(1); }
const A = '<!--PROJECTS-HIDDEN', B = 'PROJECTS-HIDDEN-->';
const NEXT_CONTACT = '<!--PROJECTS-NEXT-->\n    <a class="next-slot" href="contact.html" data-next data-cursor="view" data-cursor-text="Go" data-i18n-attr="data-cursor-text:cursor.go">\n      <span class="next-slot__label t-micro t-mono"><span data-i18n="footer.next">Next slot</span> — 05/05</span>\n      <span class="next-slot__title t-display" data-split="chars" data-proximity data-i18n="nav.contact">Contact</span>\n      <span class="next-slot__hint t-micro t-mono" data-i18n="footer.hint">Keep scrolling — loading level</span>\n      <span class="next-slot__meter" aria-hidden="true"><i></i></span>\n    </a>\n<!--/PROJECTS-NEXT-->';
const rules = {
  'index.html':   [/<li><a class="menu__slot" href="projects\.html"[\s\S]*?<\/a><\/li>/, /<a class="h-card h-card--projects"[\s\S]*?<\/a>/],
  'about.html':   [/<li><a class="menu__slot" href="projects\.html"[\s\S]*?<\/a><\/li>/],
  'contact.html': [/<li><a class="menu__slot" href="projects\.html"[\s\S]*?<\/a><\/li>/],
  'games.html':   [/<li><a class="menu__slot" href="projects\.html"[\s\S]*?<\/a><\/li>/, /<a class="next-slot" href="projects\.html"[\s\S]*?<\/a>/]
};
for (const [file, res] of Object.entries(rules)) {
  const fp = path.join(root, file); let s = fs.readFileSync(fp, 'utf8');
  if (mode === 'hide') {
    if (s.includes(A)) continue;
    for (const re of res) {
      s = s.replace(re, m => {
        if (m.includes('<!--')) throw new Error('nested comment in ' + file);
        return A + m + B + (re.source.includes('next-slot') ? '\n    ' + NEXT_CONTACT : '');
      });
    }
  } else {
    s = s.replace(/\n    <!--PROJECTS-NEXT-->[\s\S]*?<!--\/PROJECTS-NEXT-->/g, '');
    s = s.split(A).join('').split(B).join('');
  }
  fs.writeFileSync(fp, s);
}
const cp = path.join(root, 'assets/data/content.js'), src = fs.readFileSync(cp, 'utf8');
const m = src.match(/^([\s\S]*?)window\.SITE_CONTENT\s*=\s*([\s\S]*?);\s*$/);
const c = vm.runInNewContext('(' + m[2] + ')'); c.text = c.text || {};
if (mode === 'hide') c.text['home.slots.title'] = 'Three slots. <em>One designer.</em>'; else delete c.text['home.slots.title'];
fs.writeFileSync(cp, m[1] + 'window.SITE_CONTENT = ' + JSON.stringify(c, null, 2) + ';\n');
console.log('Projects ' + (mode === 'hide' ? 'hidden' : 'restored'));
