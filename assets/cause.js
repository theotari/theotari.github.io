// Page La cause : récit au défilement, comme l'accueil.
// La scène reste collée, les chapitres se relaient, le lac coule vers le bas
// et le chat du chapitre 1 saute de carte en carte.
// Seulement si le mouvement est autorisé (classe « motion » posée par lang.js).
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var story = document.querySelector('.cstory');
    if (!story || !document.documentElement.classList.contains('motion')) return;
    var stage = story.querySelector('.cstage');
    var chaps = Array.prototype.slice.call(stage.querySelectorAll('.chap')); // intro + 6 chapitres
    var flow = stage.querySelector('.flow-rect');
    var spread = stage.querySelector('.spread');
    var cue = stage.querySelector('.scroll-cue');
    var jumper = stage.querySelector('.jumper');
    var inner = jumper.querySelector('.jumper-in');
    var current = -1, pos = null, anim = null, queued = false;

    function clamp(v) { return Math.min(1, Math.max(0, v)); }

    // Où le chat se pose sur la carte du chapitre i (coordonnées de la scène).
    function spot(i) {
      var w = jumper.offsetWidth, h = jumper.offsetHeight, k = w / 200;
      if (i === 0) return { x: stage.clientWidth / 2 - w / 2, y: stage.clientHeight * 0.78, face: 1 };
      var c = chaps[i], wrap = c.offsetParent;
      var left = wrap.offsetLeft + c.offsetLeft, top = wrap.offsetTop + c.offsetTop;
      var right = c.getAttribute('data-cat') === 'right';
      return {
        x: right ? left + c.offsetWidth - w + 14 * k : left - 14 * k,
        y: top - h * 0.955,
        face: right ? -1 : 1
      };
    }

    function place(t) {
      jumper.style.transform = 'translate(' + t.x + 'px,' + t.y + 'px)';
      inner.classList.toggle('flip', t.face < 0);
      pos = t;
    }

    function jump(to, hideAfter) {
      var from = pos;
      if (anim) {
        // repartir de là où il est vraiment
        var m = new DOMMatrix(getComputedStyle(jumper).transform);
        from = { x: m.m41, y: m.m42, face: pos ? pos.face : 1 };
        anim.cancel();
      }
      if (!from) { place(to); return; }
      var dx = to.x - from.x, lift = 120 + Math.abs(dx) * 0.12, frames = [];
      for (var s = 0; s <= 8; s++) {
        var t = s / 8;
        frames.push({ transform: 'translate(' + (from.x + dx * t) + 'px,' + (from.y + (to.y - from.y) * t - lift * 4 * t * (1 - t)) + 'px)' });
      }
      jumper.classList.add('leap');
      inner.classList.toggle('flip', dx < 0);
      anim = jumper.animate(frames, { duration: 720, easing: 'cubic-bezier(.3,.1,.4,1)' });
      anim.onfinish = function () {
        anim = null;
        jumper.classList.remove('leap');
        place(to);
        if (hideAfter) jumper.classList.remove('on');
      };
      place(to); // position finale (l'animation passe par-dessus)
      inner.classList.toggle('flip', dx < 0);
    }

    function go(i) {
      if (i === current) return;
      var prev = current;
      current = i;
      chaps.forEach(function (c, k) { c.classList.toggle('is-active', k === i); });
      // laisser la nouvelle carte se mettre en place avant de viser
      requestAnimationFrame(function () {
        if (i === 0) {
          if (prev > 0) jump(spot(0), true);
          return;
        }
        if (!jumper.classList.contains('on')) {
          place(spot(0));
          jumper.classList.add('on');
        }
        jump(spot(i), false);
      });
    }

    function update() {
      queued = false;
      var r = story.getBoundingClientRect();
      var range = r.height - window.innerHeight;
      var p = range > 0 ? clamp(-r.top / range) : 0;
      stage.style.setProperty('--p', (p * 0.45).toFixed(4));
      // le ruisseau descend de la colline (0 → 60 % du récit), puis le lac s'étale (55 → 100 %)
      flow.setAttribute('height', (8 + clamp((p - 0.04) / 0.56) * 232).toFixed(1));
      // rayon 0 = lac invisible tant que le ruisseau n'est pas arrivé à l'embouchure
      spread.setAttribute('r', (clamp((p - 0.58) / 0.38) * 900).toFixed(1));
      if (cue) cue.style.opacity = String(clamp(1 - p * 12));
      go(Math.min(chaps.length - 1, Math.floor(p * chaps.length)));
    }

    function onScroll() { if (!queued) { queued = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () {
      if (current > 0 && !anim) place(spot(current));
      onScroll();
    });
    update();
  });
})();
