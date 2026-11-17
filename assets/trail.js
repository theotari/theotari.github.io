// Page Snek : le serpent suit le défilement, mange le fruit de chaque carte,
// puis se cogne contre le bloc « Jeu honnête ».
// Seulement si le mouvement est autorisé (classe « motion » posée par lang.js).
(function () {
  var BODY = 150;       // longueur du corps en px
  var READ_LINE = 0.58; // la tête suit cette hauteur de l'écran

  document.addEventListener('DOMContentLoaded', function () {
    var trail = document.querySelector('.trail');
    if (!trail || !document.documentElement.classList.contains('motion')) return;
    var body = trail.querySelector('.trail-body');
    var svg = trail.querySelector('.trail-svg');
    var track = svg.querySelector('.trail-track');
    var outline = svg.querySelector('.snake-outline');
    var snake = svg.querySelector('.snake-body');
    var head = svg.querySelector('.snake-head');
    var stars = svg.querySelector('.stars');
    var steps = Array.prototype.slice.call(trail.querySelectorAll('.step'));
    var wall = document.querySelector('.fair-wall');

    var total = 0, samples = [], dotLen = [], bonked = false, queued = false;

    function build() {
      var b = body.getBoundingClientRect();
      var narrow = window.innerWidth <= 760;
      var sway = narrow ? 22 : 70;
      var pts = steps.map(function (st) {
        var r = st.querySelector('.dot').getBoundingClientRect();
        return [r.left + r.width / 2 - b.left, r.top + r.height / 2 - b.top];
      });
      var wallY = wall.getBoundingClientRect().top - b.top;
      var first = pts[0], last = pts[pts.length - 1];
      var all = [[first[0], first[1] - 90]].concat(pts, [[narrow ? last[0] : b.width / 2, wallY - 12]]);
      var d = 'M' + all[0][0] + ' ' + all[0][1];
      for (var i = 1; i < all.length; i++) {
        var a = all[i - 1], c = all[i], dy = c[1] - a[1], s = (i % 2 ? 1 : -1) * sway;
        d += ' C' + (a[0] + s) + ' ' + (a[1] + dy * 0.45) + ' ' + (c[0] - s) + ' ' + (c[1] - dy * 0.45) + ' ' + c[0] + ' ' + c[1];
      }
      svg.setAttribute('height', Math.ceil(wallY + 40));
      svg.setAttribute('viewBox', '0 0 ' + Math.round(b.width) + ' ' + Math.ceil(wallY + 40));
      [track, outline, snake].forEach(function (p) { p.setAttribute('d', d); });
      total = snake.getTotalLength();
      [outline, snake].forEach(function (p) { p.style.strokeDasharray = BODY + ' ' + (total * 2); });
      samples = [];
      for (var l = 0; l <= total; l += 4) { var q = snake.getPointAtLength(l); samples.push([l, q.x, q.y]); }
      // longueur du chemin au passage de chaque fruit
      dotLen = pts.map(function (pt) {
        var best = 0, bd = Infinity;
        samples.forEach(function (sm) { var dd = Math.abs(sm[1] - pt[0]) + Math.abs(sm[2] - pt[1]); if (dd < bd) { bd = dd; best = sm[0]; } });
        return best;
      });
      trail.classList.add('ready');
      update();
    }

    function lengthAtY(y) {
      if (!samples.length || y <= samples[0][2]) return 0;
      for (var i = 1; i < samples.length; i++) if (samples[i][2] >= y) return samples[i][0];
      return total;
    }

    function update() {
      queued = false;
      if (!total) return;
      var b = body.getBoundingClientRect();
      var h = Math.min(total, lengthAtY(window.innerHeight * READ_LINE - b.top));
      [outline, snake].forEach(function (p) { p.style.strokeDashoffset = String(-(h - BODY)); });
      var p1 = snake.getPointAtLength(h), p0 = snake.getPointAtLength(Math.max(0, h - 2));
      var ang = Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI;
      head.setAttribute('transform', 'translate(' + p1.x + ' ' + p1.y + ') rotate(' + ang + ')');
      head.style.opacity = h > 2 ? 1 : 0;
      stars.setAttribute('transform', 'translate(' + p1.x + ' ' + (p1.y - 30) + ')');
      steps.forEach(function (st, i) { st.classList.toggle('lit', h >= dotLen[i] - 2); });
      var hit = h >= total - 1;
      if (hit !== bonked) {
        bonked = hit;
        trail.classList.toggle('bonk', hit);
        if (hit) { wall.classList.remove('hit'); void wall.offsetWidth; wall.classList.add('hit'); }
      }
    }

    function onScroll() { if (!queued) { queued = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { requestAnimationFrame(build); });
    if (window.ResizeObserver) new ResizeObserver(function () { requestAnimationFrame(build); }).observe(body);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    window.addEventListener('load', build);
    build();
  });
})();
