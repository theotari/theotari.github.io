// Formulaire de contact de minougame.
// Le site est statique (GitHub Pages) : sans service d'envoi, le message
// s'ouvre tout prêt dans l'application e-mail du visiteur.
// Pour un envoi direct (Formspree, Web3Forms…), mettre l'adresse du service dans ENDPOINT.
(function () {
  var ENDPOINT = '';
  var TO = 'minougame.dev@gmail.com';

  var TXT = {
    fr: {
      reason: 'Choisis une raison, pour que le bon chat s’en occupe.',
      emailEmpty: 'Indique ton e-mail pour qu’on puisse te répondre.',
      emailBad: 'Cette adresse e-mail ne semble pas complète (exemple : nom@exemple.fr).',
      msgEmpty: 'Écris ton message.',
      msgShort: 'Ton message est un peu court : 10 caractères au moins.',
      sendFail: 'L’envoi n’a pas marché. Réessaie, ou écris directement à ' + TO + '.',
      labels: { bug: 'Bug', idee: 'Idée', question: 'Question', cause: 'La cause', coucou: 'Coucou' },
      fields: { reason: 'Raison', game: 'Concerne', device: 'Téléphone', name: 'Prénom', email: 'E-mail', message: 'Message' }
    },
    en: {
      reason: 'Pick a reason, so the right cat takes care of it.',
      emailEmpty: 'Enter your email so we can reply.',
      emailBad: 'This email address doesn’t look complete (example: name@example.com).',
      msgEmpty: 'Write your message.',
      msgShort: 'Your message is a bit short: at least 10 characters.',
      sendFail: 'Sending failed. Try again, or write directly to ' + TO + '.',
      labels: { bug: 'Bug', idee: 'Idea', question: 'Question', cause: 'Our cause', coucou: 'Hello' },
      fields: { reason: 'Reason', game: 'About', device: 'Phone', name: 'Name', email: 'Email', message: 'Message' }
    }
  };

  function lang() { return document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'fr'; }

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('contact-form');
    if (!form) return;
    var card = form.closest('.form-card');
    var arts = card.querySelectorAll('.reason-art .cat-svg');
    var gameWrap = document.getElementById('f-game-wrap');
    var deviceWrap = document.getElementById('f-device-wrap');
    var reasonsBox = form.querySelector('.reasons');

    // Textes des options de la liste selon la langue.
    function translateOptions() {
      var l = lang();
      form.querySelectorAll('option[data-fr]').forEach(function (o) { o.textContent = o.getAttribute('data-' + l); });
    }
    translateOptions();
    new MutationObserver(translateOptions).observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });

    // Le chat du haut et les champs utiles changent avec la raison.
    function show(reason) {
      var r = reason || 'coucou';
      arts.forEach(function (a) { a.classList.toggle('is-shown', a.getAttribute('data-reason') === r); });
      gameWrap.hidden = !(reason === 'bug' || reason === 'idee' || reason === 'question');
      deviceWrap.hidden = reason !== 'bug';
    }
    var wanted = new URLSearchParams(location.search).get('raison');
    var pre = wanted && form.querySelector('input[name="reason"][value="' + wanted.replace(/[^a-z]/g, '') + '"]');
    if (pre) pre.checked = true;
    show(pre ? pre.value : null);
    form.addEventListener('change', function (e) {
      if (e.target.name === 'reason') { show(e.target.value); setError('reason', ''); }
    });

    // Le chat curieux regarde ce que tu écris.
    var msgField = form.querySelector('.msg-field');
    var typingTimer;
    form.message.addEventListener('input', function () {
      msgField.classList.add('typing');
      clearTimeout(typingTimer);
      typingTimer = setTimeout(function () { msgField.classList.remove('typing'); }, 900);
      if (form.message.getAttribute('aria-invalid') === 'true') check('message');
    });
    form.email.addEventListener('blur', function () { if (form.email.value) check('email'); });

    function setError(name, text) {
      document.getElementById('err-' + name).textContent = text;
      var el = name === 'reason' ? reasonsBox : form[name];
      el.setAttribute('aria-invalid', text ? 'true' : 'false');
    }
    function check(name) {
      var t = TXT[lang()];
      if (name === 'reason') {
        var ok = !!form.querySelector('input[name="reason"]:checked');
        setError('reason', ok ? '' : t.reason);
        return ok;
      }
      if (name === 'email') {
        var v = form.email.value.trim();
        var msg = !v ? t.emailEmpty : (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : t.emailBad);
        setError('email', msg);
        return !msg;
      }
      var m = form.message.value.trim();
      var err = !m ? t.msgEmpty : (m.length < 10 ? t.msgShort : '');
      setError('message', err);
      return !err;
    }

    function collect() {
      var t = TXT[lang()];
      var reason = form.querySelector('input[name="reason"]:checked').value;
      var data = {
        reason: t.labels[reason],
        game: gameWrap.hidden ? '' : form.game.options[form.game.selectedIndex].text,
        device: deviceWrap.hidden ? '' : form.device.value.trim(),
        name: form.elements.pseudo.value.trim(),
        email: form.email.value.trim(),
        message: form.message.value.trim()
      };
      data.subject = '[minougame] ' + data.reason + (data.game ? ' · ' + data.game : '') + (data.name ? ' · ' + data.name : '');
      return data;
    }

    function done() {
      card.classList.add('sent');
      card.querySelector('.form-done h2').focus();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form._gotcha.value) return; // robot
      var okReason = check('reason'), okEmail = check('email'), okMsg = check('message');
      if (!okReason) { (form.querySelector('input[name="reason"]')).focus(); return; }
      if (!okEmail) { form.email.focus(); return; }
      if (!okMsg) { form.message.focus(); return; }

      var d = collect();
      var f = TXT[lang()].fields;
      if (ENDPOINT) {
        var body = new FormData();
        ['reason', 'game', 'device', 'name', 'email', 'message', 'subject'].forEach(function (k) { if (d[k]) body.append(k, d[k]); });
        fetch(ENDPOINT, { method: 'POST', body: body, headers: { Accept: 'application/json' } })
          .then(function (r) { if (!r.ok) throw new Error(r.status); done(); })
          .catch(function () { setError('message', TXT[lang()].sendFail); });
        return;
      }
      var lines = [f.reason + ' : ' + d.reason];
      if (d.game) lines.push(f.game + ' : ' + d.game);
      if (d.device) lines.push(f.device + ' : ' + d.device);
      if (d.name) lines.push(f.name + ' : ' + d.name);
      lines.push(f.email + ' : ' + d.email, '', d.message);
      location.href = 'mailto:' + TO + '?subject=' + encodeURIComponent(d.subject) + '&body=' + encodeURIComponent(lines.join('\n'));
      done();
    });

    document.getElementById('again').addEventListener('click', function () {
      card.classList.remove('sent');
      form.message.value = '';
      form.message.focus();
    });
  });
})();
