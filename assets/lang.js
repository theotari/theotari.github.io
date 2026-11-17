// Langue de la page : ?lang=en|fr, puis le dernier choix, puis la langue du navigateur.
// Sans JavaScript, la page reste en français (data-lang="fr" dans le HTML).
(function () {
  var root = document.documentElement;
  var titles = { fr: document.title, en: root.getAttribute('data-title-en') };

  function stored() {
    try { return localStorage.getItem('lang'); } catch (e) { return null; }
  }
  function pick() {
    var q = new URLSearchParams(location.search).get('lang');
    if (q === 'fr' || q === 'en') return q;
    var s = stored();
    if (s === 'fr' || s === 'en') return s;
    return (navigator.language || 'fr').toLowerCase().indexOf('fr') === 0 ? 'fr' : 'en';
  }
  function apply(lang) {
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang);
    if (titles[lang]) document.title = titles[lang];
  }

  apply(pick());

  // Récit au défilement de l'accueil : seulement si le mouvement est autorisé.
  var motion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
  if (motion) root.classList.add('motion');

  function story() {
    var el = document.querySelector('.story');
    if (!el || !motion) return;
    var scene = el.querySelector('.scene');
    var chapters = el.querySelectorAll('.chapter');
    var queued = false;
    function update() {
      queued = false;
      var r = el.getBoundingClientRect();
      var range = r.height - window.innerHeight;
      var p = range > 0 ? Math.min(1, Math.max(0, -r.top / range)) : 0;
      scene.style.setProperty('--p', p.toFixed(4));
      scene.style.setProperty('--flood', Math.min(1, Math.max(0, (p - 0.82) / 0.16)).toFixed(3));
      var i = p < 0.3 ? 0 : p < 0.6 ? 1 : 2;
      for (var k = 0; k < chapters.length; k++) chapters[k].classList.toggle('is-active', k === i);
    }
    function onScroll() { if (!queued) { queued = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  document.addEventListener('DOMContentLoaded', function () {
    titles.fr = titles.fr || document.title;
    story();
    var btn = document.querySelector('.langbtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-lang') === 'fr' ? 'en' : 'fr';
      try { localStorage.setItem('lang', next); } catch (e) { /* navigation privée */ }
      apply(next);
    });
  });
})();
