// capri_batterie.js : alerte "batterie faible" façon hacking, avec réaction de Capri
(function () {
  var SEUIL_FAIBLE = 20;      // % de batterie : première alerte
  var SEUIL_CRITIQUE = 10;    // % de batterie : alerte critique
  var DUREE_BANNIERE = 6500;  // temps d'affichage de l'alerte (ms)
  // Mets true pour tester : 5 secondes après le lancement, Capri réagit comme si la batterie était à 15 %,
  // puis à 8 %, puis comme si tu branchais le chargeur.
  var TEST = false;

  var PHRASES_FAIBLE = [
    "Batterie à {n} %, choom... branche-moi vite !",
    "Je sens mes implants faiblir... {n} % seulement !",
    "Ton PC a soif, choom : {n} % de batterie."
  ];
  var PHRASES_CRITIQUE = [
    "{n} % !! Je vais flatline, choom, branche le chargeur !",
    "Alerte rouge : {n} % ! Sauve tes fichiers !",
    "Plus que {n} %... c'est la fin, gonk !"
  ];
  var PHRASES_CHARGE = [
    "Ouf, ça recharge... j'ai cru mourir.",
    "Preem ! Le courant revient, choom."
  ];

  var css = document.createElement('style');
  css.textContent =
    '.batt-alerte{position:fixed;left:50%;top:62px;z-index:94;width:300px;margin-left:-150px;pointer-events:none;' +
    'font-family:Consolas,"Courier New",monospace;--k:var(--rouge)}' +
    '.batt-alerte.charge{--k:var(--vert)}' +
    '.batt-cadre{--c:12px;background:var(--k);padding:2px;clip-path:polygon(0 0,100% 0,100% calc(100% - var(--c)),calc(100% - var(--c)) 100%,0 100%);animation:alerte 0.7s steps(2,start) infinite}' +
    '.batt-alerte.charge .batt-cadre{animation:none}' +
    '.batt-in{background:#000;padding:9px 16px 10px 12px;clip-path:polygon(0 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%)}' +
    '.batt-t{display:flex;align-items:center;gap:8px;font-size:14px;letter-spacing:4px;color:var(--k);text-shadow:0 0 7px var(--k)}' +
    '.batt-t::before{content:"";width:7px;height:7px;background:var(--k)}' +
    '.batt-s{margin:5px 0 7px;font-size:10px;letter-spacing:2px;color:var(--cyan)}' +
    '.batt-b{height:12px;padding:2px;border:1px solid var(--k);box-sizing:border-box}' +
    '.batt-f{height:100%;background:repeating-linear-gradient(90deg,var(--k) 0 5px,transparent 5px 7px);box-shadow:0 0 6px var(--k)}';
  document.head.appendChild(css);

  var dejaFaible = false, dejaCritique = false, enAttente = null, rechargeAnnoncee = true;

  function dispo() {
    try { return enAnim || call.style.display === 'flex'; } catch (e) { return false; }
  }
  function choisir(liste, n) {
    return liste[Math.floor(Math.random() * liste.length)].replace('{n}', n);
  }

  function banniere(type, niveau) {
    var el = document.createElement('div');
    el.className = 'batt-alerte' + (type === 'charge' ? ' charge' : '');
    var titre = type === 'charge' ? 'CHARGE EN COURS' : (type === 'critique' ? 'BATTERIE CRITIQUE' : 'BATTERIE FAIBLE');
    var sous = type === 'charge' ? 'ALIMENTATION RÉTABLIE // ' + niveau + '%'
      : 'NIVEAU ' + niveau + '% // ALIMENTATION INSTABLE';
    el.innerHTML = '<div class="batt-cadre"><div class="batt-in"><div class="batt-t"></div>' +
      '<div class="batt-s"></div><div class="batt-b"><div class="batt-f" style="width:' + niveau + '%"></div></div></div></div>';
    el.querySelector('.batt-s').textContent = sous;
    var t = el.querySelector('.batt-t');
    t.textContent = titre;
    document.body.appendChild(el);
    try { decoder(t, titre, 450); } catch (e) {}
    el.animate([
      { opacity: 0, transform: 'scale(0.9, 0.05)', filter: 'brightness(2.4)' },
      { opacity: 1, transform: 'scale(1.03, 0.1)', offset: 0.25 },
      { opacity: 1, transform: 'none', filter: 'none' }
    ], { duration: 450 });
    setTimeout(function () {
      el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' }).onfinish = function () { el.remove(); };
    }, DUREE_BANNIERE);
  }

  // Capri dit sa phrase : dans sa bulle si elle est libre, ou dans la fenêtre d'appel
  async function parler(texte) {
    try {
      if (enAnim) {
        if (['marche', 'pose', 'assise'].indexOf(etat) === -1) return;   // occupée : l'alerte suffit
        var s = session, avant = etat;
        etat = 'parle';
        var fini = await direPhrase([texte], 3500, 800);
        if (fini && s === session && etat === 'parle') etat = avant;
      } else if (call.style.display === 'flex') {
        addRow('capri').textContent = texte;
      }
    } catch (e) {}
  }

  function reagir(type, niveau) {
    if (!dispo()) { enAttente = { type: type, niveau: niveau }; return; }   // on réessaie dès que Capri est visible
    enAttente = null;
    banniere(type, niveau);
    try { glitchEcran(500); secousseEcran(type === 'charge' ? 3 : 6, 260); son(type === 'charge' ? 'connecte' : 'echec'); } catch (e) {}
    try { flashBlanc(220, 0.14, type === 'charge' ? '#00ffa3' : '#ff2e63'); } catch (e) {}
    var liste = type === 'charge' ? PHRASES_CHARGE : (type === 'critique' ? PHRASES_CRITIQUE : PHRASES_FAIBLE);
    parler(choisir(liste, niveau));
  }

  setInterval(function () { if (enAttente && dispo()) reagir(enAttente.type, enAttente.niveau); }, 4000);

  function verifier(niveau, charge) {
    if (charge) {
      if (!rechargeAnnoncee && (dejaFaible || dejaCritique)) { rechargeAnnoncee = true; reagir('charge', niveau); }
      dejaFaible = false; dejaCritique = false;
      return;
    }
    rechargeAnnoncee = false;
    if (niveau > SEUIL_FAIBLE + 5) { dejaFaible = false; dejaCritique = false; rechargeAnnoncee = true; return; }
    if (niveau <= SEUIL_CRITIQUE && !dejaCritique) { dejaCritique = true; dejaFaible = true; reagir('critique', niveau); }
    else if (niveau <= SEUIL_FAIBLE && !dejaFaible) { dejaFaible = true; reagir('faible', niveau); }
  }

  if (TEST) {
    setTimeout(function () { verifier(15, false); }, 5000);
    setTimeout(function () { verifier(8, false); }, 14000);
    setTimeout(function () { verifier(30, true); }, 23000);
  }

  if (navigator.getBattery) {
    navigator.getBattery().then(function (b) {
      var maj = function () { verifier(Math.round(b.level * 100), b.charging); };
      b.addEventListener('levelchange', maj);
      b.addEventListener('chargingchange', maj);
      maj();
    }).catch(function () {});
  }
})();
