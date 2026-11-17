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

  document.addEventListener('DOMContentLoaded', function () {
    titles.fr = titles.fr || document.title;
    var btn = document.querySelector('.langbtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-lang') === 'fr' ? 'en' : 'fr';
      try { localStorage.setItem('lang', next); } catch (e) { /* navigation privée */ }
      apply(next);
    });
  });
})();
