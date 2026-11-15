/* =====================================================================
   INVENTORY — projects page (projects.html)
   Terminal log ticker in the hero + pointer glow on project cards.
   Cards themselves are rendered by assets/js/content.js.
   ===================================================================== */
(function (W, D) {
  'use strict';
  var SITE = W.SITE;
  if (!SITE) return;

  function initTerm() {
    var log = D.querySelector('.p-term__log');
    if (!log) return;
    var lines = [1, 2, 3, 4, 5, 6].map(function (i) { return SITE.t('projects.term.' + i); });
    var i = 0, timer = null;
    function stamp() { var d = new Date(); return [d.getHours(), d.getMinutes(), d.getSeconds()].map(function (n) { return (n < 10 ? '0' : '') + n; }).join(':'); }
    function push() {
      var li = D.createElement('li');
      li.innerHTML = '<span class="p-term__ts"></span><span class="p-term__ok">OK</span><span class="p-term__msg"></span>';
      li.children[0].textContent = stamp();
      li.children[2].textContent = lines[i++ % lines.length];
      log.appendChild(li);
      while (log.children.length > 5) log.removeChild(log.firstChild);
    }
    for (var k = 0; k < 4; k++) push();
    if (SITE.reducedMotion) return;
    timer = setInterval(function () { if (!D.hidden) push(); }, 1800);
    SITE.on('transition:start', function () { clearInterval(timer); });
  }

  function initCards() {
    if (SITE.isTouch) return;
    Array.prototype.forEach.call(D.querySelectorAll('.p-card'), function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--px', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        card.style.setProperty('--py', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerenter', function () { if (SITE.bg) SITE.bg.pulse(0.25); });
    });
  }

  initTerm();
  initCards();
})(window, document);
