// capri_heure.js : Capri réagit à l'heure de la journée
(function () {
  // Les moments de la journée : heure (h), minute (m), durée pendant laquelle elle peut encore le dire (en minutes)
  // Pour ajouter un moment, copie simplement un bloc et change les chiffres et les phrases.
  var EVENEMENTS = [
    { id: 'matin', h: 8, m: 0, duree: 120, phrases: [
      "Bonjour, choom ! Un café et on hack le monde.",
      "Debout, gonk ! Le soleil est déjà en ligne.",
      "Nouveau jour, nouveaux runs. Prêt, choom ?"
    ] },
    { id: 'midi', h: 12, m: 0, duree: 60, phrases: [
      "Midi pile, choom. Va manger un truc, même un netrunner a un estomac.",
      "Ton carburant est à zéro. Mange, gonk !",
      "Pause déj, choom. Les eddies, ça se mange pas."
    ] },
    { id: 'soir', h: 19, m: 0, duree: 60, phrases: [
      "À table, choom ! Pas de run avant d'avoir mangé.",
      "19h ! À table, gonk, ou ton estomac va flatline.",
      "Ferme tes onglets et va manger, choom."
    ] },
    { id: 'minuit', h: 0, m: 0, duree: 60, phrases: [
      "Minuit, choom... Même les solos vont dormir.",
      "Il se fait tard. Sauvegarde et va te coucher, gonk.",
      "Minuit passé. Night City dort, toi aussi."
    ] },
    { id: 'tard', h: 2, m: 0, duree: 90, phrases: [
      "Il est 2h, choom. Va dormir, sérieusement.",
      "Tu veux flatline de fatigue ? Dodo, gonk !",
      "Même mes implants bâillent... Va dormir."
    ] }
  ];

  var occupe = false;

  function cleDuJour() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function dejaDit(id) {
    try { return localStorage.getItem('capri_heure_' + id) === cleDuJour(); } catch (e) { return false; }
  }
  function marquerDit(id) {
    try { localStorage.setItem('capri_heure_' + id, cleDuJour()); } catch (e) {}
  }

  // Quel moment de la journée est en cours (et pas encore dit aujourd'hui) ?
  function momentActuel() {
    var d = new Date();
    var minutes = d.getHours() * 60 + d.getMinutes();
    for (var i = 0; i < EVENEMENTS.length; i++) {
      var e = EVENEMENTS[i];
      var debut = e.h * 60 + e.m;
      if (minutes >= debut && minutes < debut + e.duree && !dejaDit(e.id)) return e;
    }
    return null;
  }

  // Elle s'assoit au sol, dit sa phrase, puis se relève et repart marcher
  async function parlerHeure(e) {
    occupe = true;
    marquerDit(e.id);
    var s = session;
    etat = 'transition';
    frappes();
    await wait(150);
    if (s !== session) { occupe = false; return; }
    await ecrase();
    if (s !== session) { occupe = false; return; }
    await setPoseAssise();
    if (s !== session) { occupe = false; return; }
    await wait(30);
    if (s !== session) { occupe = false; return; }
    ax = borner(ax, 0, Math.max(0, window.innerWidth - sprite.offsetWidth));
    await reforme(340);
    if (s !== session) { occupe = false; return; }

    etat = 'parle';
    var fini = await direPhrase(e.phrases, 7000, 2500);
    if (!fini || s !== session) { occupe = false; return; }

    adir = Math.random() < 0.5 ? -1 : 1;
    var ok = await transformer(MARCHE, s);
    if (!ok) { occupe = false; return; }
    etat = 'marche';
    finEtat = performance.now() + alea(4000, 10000);
    prochaineBulle = performance.now() + alea(BULLE_MIN, BULLE_MAX);
    occupe = false;
  }

  function verifier() {
    if (occupe) return;
    var e;
    try {
      e = momentActuel();
      if (!e) return;
      var phrase = e.phrases[Math.floor(Math.random() * e.phrases.length)];
      if (enAnim) {
        // Pendant la balade : seulement si elle marche tranquillement
        if (bulleActive || (etat !== 'marche' && etat !== 'pose')) return;
        parlerHeure(e);
      } else if (call.style.display === 'flex' && !busy) {
        // Pendant l'appel : elle l'écrit dans la discussion
        marquerDit(e.id);
        addRow('capri').textContent = phrase;
      }
    } catch (err) {
      occupe = false;
    }
  }

  setInterval(verifier, 20000);
})();
