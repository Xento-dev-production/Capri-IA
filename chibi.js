// chibi.js : le mode CHIBI secret de Capri (V5)
// Ce fichier se charge APRÈS le script de index.html (une seule ligne à ajouter, déjà faite dans la V5).
//
// Pour l'activer / le désactiver :
//   - clique 5 fois vite sur le mot « CAPRI » dans la fenêtre d'appel,
//   - ou écris /chibi dans le chat et appuie sur Entrée.
// Capri se compresse, puis devient une petite Capri pixel. Le choix est gardé quand on relance l'app.

(function () {
  'use strict';

  // ===== Réglages =====
  const CH_ECHELLE = 0.42;     // taille de la petite Capri en balade (plus grand = plus grosse)
  const SECRET_CLICS = 5;      // nombre de clics rapides sur le nom CAPRI
  const SECRET_TEXTE = '/chibi';
  const DELAI_DODO = 45000;    // sans rien faire pendant ce temps (ms), elle s'endort dans l'appel
  const CHANGE_ATTENTE = 7000; // elle change de pose d'attente toutes les 7 s (appel)
  const CHANGE_FENETRE = 9000; // elle change de pose toutes les 9 s quand elle est assise sur une fenêtre

  // Taille de chaque sprite (largeur, hauteur) : sert à les afficher sans clignoter
  const DIM = {
    idle_lotus: [156, 228], idle_repos: [201, 195], idle_dort: [177, 199],
    idle_assis1: [181, 233], idle_assis2: [164, 223],
    tape_etourdie: [191, 241], tape_coeur: [160, 216], tape_gigote: [200, 200], tape_tire: [178, 187],
    jeu_guette: [160, 103], jeu_balle: [206, 197], jeu_hack: [202, 176], jeu_saut: [180, 224]
  };
  // Quand elle guette par-dessus le bord d'une fenêtre, ses mains passent un peu SUR le bord (en pixels écran)
  const DESCENTE_GUETTE = 4;

  // Poses d'arrêt au sol (les images 6, 8, 9, 10, 11 de la V4) -> sprite chibi
  const SOL = { 6: 'jeu_balle', 8: 'jeu_hack', 9: 'jeu_saut', 10: 'idle_dort', 11: 'tape_gigote' };
  // Quand elle est assise sur une fenêtre : elle change de pose de temps en temps
  const FENETRE = ['idle_assis1', 'idle_repos', 'idle_assis2', 'jeu_guette', 'idle_dort'];
  // Dans la fenêtre d'appel, quand elle attend
  const ATTENTE = ['idle_lotus', 'idle_repos', 'idle_assis1', 'idle_assis2'];

  const url = (n) => 'chibi_' + n + '.png';
  Object.keys(DIM).forEach((n) => { // pré-chargement (et mise à jour des tailles réelles)
    const im = new Image();
    im.onload = () => { DIM[n] = [im.naturalWidth, im.naturalHeight]; };
    im.src = url(n);
  });

  // ===== Style (ajouté ici pour ne pas toucher au CSS de index.html) =====
  const st = document.createElement('style');
  st.textContent =
    'body.chibi #sprite{width:var(--cw)!important;height:var(--ch)!important}' +
    '@keyframes chibiSaute{0%{translate:0 0}50%{translate:0 -7px}}' +
    '#sprite.chibi-saute{animation:chibiSaute .5s step-end infinite}' +
    'body.chibi #portrait{background-color:#2b1d42}' +
    'body.chibi #portrait .layer{background-size:contain;background-repeat:no-repeat;background-position:center bottom}';
  document.head.appendChild(st);

  // ===== État =====
  let chibi = false;
  try { chibi = localStorage.getItem('capriChibi') === '1'; } catch (e) {}
  let derniereV4 = sprite.getAttribute('src') || 'capri7.png'; // la dernière image demandée par la V4
  let courant = '';           // le sprite chibi affiché en balade
  let humeurFen = 0;          // quelle pose sur la fenêtre
  let flagBulle = false;      // vrai quand Capri parle en balade (bulle visible)
  let etatPortrait = 'repos'; // repos | ecoute | reflechit | parle | content | caresse
  let nomPoke = 'tape_coeur';
  let reposIdx = 0;
  let derniereAction = Date.now();
  let finPoke = null, finContent = null;

  // ===== Balade : on intercepte sprite.src =====
  const desc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  const lireSrc = () => desc.get.call(sprite);
  const ecrireSrc = (v) => desc.set.call(sprite, v);
  Object.defineProperty(sprite, 'src', {
    configurable: true, enumerable: true,
    get: lireSrc,
    set: (v) => { derniereV4 = String(v); appliquer(); }
  });

  function choisirBalade() {
    const v = derniereV4;
    if (/capri_attrape/.test(v)) return 'tape_etourdie';   // attrapée par le curseur
    if (/capri_tab_lecture/.test(v)) return 'jeu_hack';    // elle lit la tablette
    if (/capri_tab_/.test(v)) return 'jeu_balle';          // elle attrape la tablette
    if (flagBulle) return 'jeu_balle';                     // elle parle
    if (pose === 'assise') return FENETRE[humeurFen % FENETRE.length];
    if (pose === MARCHE) return 'idle_lotus';              // elle flotte et saute en avançant
    return SOL[pose] || 'idle_assis1';
  }

  function appliquer() {
    if (!chibi) {
      courant = '';
      sprite.classList.remove('chibi-saute');
      ecrireSrc(derniereV4);
      return;
    }
    let nom;
    try { nom = choisirBalade(); } catch (e) { nom = 'idle_assis1'; }
    const d = DIM[nom];
    sprite.style.setProperty('--cw', Math.round(d[0] * CH_ECHELLE) + 'px');
    sprite.style.setProperty('--ch', Math.round(d[1] * CH_ECHELLE) + 'px');
    sprite.style.translate = nom === 'jeu_guette' ? '0 ' + DESCENTE_GUETTE + 'px' : '';
    if (courant !== nom) { courant = nom; ecrireSrc(url(nom)); }
    sprite.classList.toggle('chibi-saute', /capri7_/.test(derniereV4) && !flagBulle);
  }

  // La bulle de dialogue visible = Capri est en train de parler
  const bulle = document.getElementById('bulle');
  if (bulle) {
    new MutationObserver(() => {
      const d = bulle.style.display;
      const v = d !== '' && d !== 'none';
      if (v !== flagBulle) { flagBulle = v; if (chibi) appliquer(); }
    }).observe(bulle, { attributes: true, attributeFilter: ['style'] });
  }

  setInterval(() => {
    if (!chibi) return;
    humeurFen++;
    if (pose === 'assise' && !flagBulle) appliquer();
  }, CHANGE_FENETRE);

  // ===== Fenêtre d'appel : le portrait =====
  function majPortrait() {
    if (!chibi) return;
    let nom;
    if (etatPortrait === 'ecoute') nom = 'idle_assis2';
    else if (etatPortrait === 'reflechit') nom = 'tape_etourdie';
    else if (etatPortrait === 'parle') nom = 'jeu_hack';
    else if (etatPortrait === 'content') nom = 'jeu_balle';
    else if (etatPortrait === 'caresse') nom = nomPoke;
    else nom = Date.now() - derniereAction > DELAI_DODO ? 'idle_dort' : ATTENTE[reposIdx % ATTENTE.length];
    portrait.style.setProperty('--img', "url('" + url(nom) + "')");
  }

  setInterval(() => {
    if (chibi && etatPortrait === 'repos') { reposIdx++; majPortrait(); }
  }, CHANGE_ATTENTE);

  // On suit la conversation : qui écoute, qui réfléchit, qui répond
  const parleOrig = window.parle;
  window.parle = function (qui) {
    parleOrig.apply(this, arguments);
    derniereAction = Date.now();
    clearTimeout(finContent);
    if (qui === 'moi') etatPortrait = 'ecoute';
    else if (qui === 'capri') etatPortrait = busy ? 'reflechit' : 'parle';
    else {
      const avait = etatPortrait === 'parle';
      etatPortrait = avait ? 'content' : 'repos';
      if (avait) finContent = setTimeout(() => { if (etatPortrait === 'content') { etatPortrait = 'repos'; majPortrait(); } }, 3500);
    }
    majPortrait();
  };

  // À chaque réponse la V4 change d'image : en mode chibi, elle se met à « écrire » sur son ordi
  const changerOrig = window.changerImage;
  window.changerImage = function () {
    if (chibi) { etatPortrait = 'parle'; majPortrait(); return; }
    changerOrig.apply(this, arguments);
  };

  // Cliquer sur le portrait : câlins et pichenettes (1 clic = cœurs, puis de plus en plus agacée)
  // (on écoute l'appui, pas le clic : la V4 « capture » la souris pour pouvoir déplacer la fenêtre)
  let clics = [];
  portrait.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !chibi) return;
    // si on est en train de déplacer la fenêtre, ce n'est pas un câlin
    setTimeout(() => { if (typeof aDeplace !== 'undefined' && aDeplace) return; caresser(); }, 180);
  });
  function caresser() {
    if (!chibi) return;
    const t = Date.now();
    clics = clics.filter((c) => t - c < 1500);
    clics.push(t);
    derniereAction = t;
    const n = clics.length;
    nomPoke = n === 1 ? 'tape_coeur' : n === 2 ? 'tape_gigote' : n === 3 ? 'tape_tire' : 'tape_etourdie';
    etatPortrait = 'caresse';
    majPortrait();
    portrait.animate([{ transform: 'scale(1,1)' }, { transform: 'scale(1.06,0.94)' }, { transform: 'scale(1,1)' }], { duration: 160 });
    clearTimeout(finPoke);
    finPoke = setTimeout(() => { if (etatPortrait === 'caresse') { etatPortrait = 'repos'; majPortrait(); } }, 2200);
  }

  // ===== Le secret : la compression =====
  let enCours = false;
  async function basculer() {
    if (enCours) return;
    enCours = true;
    const a = portrait.animate([
      { transform: 'scale(1,1)', filter: 'brightness(1)' },
      { transform: 'scale(1.5,0.04)', filter: 'brightness(3)', offset: 0.45 },
      { transform: 'scale(1,1)', filter: 'brightness(1)' }
    ], { duration: 560, easing: 'ease-in-out' });
    setTimeout(() => {
      chibi = !chibi;
      try { localStorage.setItem('capriChibi', chibi ? '1' : '0'); } catch (e) {}
      document.body.classList.toggle('chibi', chibi);
      if (chibi) { etatPortrait = 'repos'; derniereAction = Date.now(); majPortrait(); }
      else portrait.style.setProperty('--img', "url('" + IMAGES[imageActuelle] + "')");
      appliquer();
    }, 250);
    try { await a.finished; } catch (e) {}
    try {
      await typeInto(addRow('capri'), chibi
        ? 'Compression terminée... mode mini activé ! Écris /chibi pour me remettre en grand.'
        : 'Décompression ! Me revoilà en taille normale.', 22);
    } catch (e) {}
    enCours = false;
  }

  // Secret 1 : 5 clics rapides sur le nom « CAPRI »
  const nomCapri = capriBox.querySelector('.nom');
  let secret = [];
  if (nomCapri) {
    nomCapri.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const t = Date.now();
      secret = secret.filter((c) => t - c < 2500);
      secret.push(t);
      if (secret.length >= SECRET_CLICS) { secret = []; basculer(); }
    });
  }

  // Secret 2 : écrire /chibi dans le chat
  function intercepter(e) {
    if (input.value.trim().toLowerCase() !== SECRET_TEXTE) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    input.value = '';
    basculer();
  }
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') intercepter(e); }, true);
  document.getElementById('send').addEventListener('click', intercepter, true);

  // ===== Téléportation : la petite Capri ne marche pas, elle devient une boule d'électricité =====
  const ROSE = '#ff2e63', VERT = '#00ffa3';  // ses couleurs
  const TP_MIN = 2500, TP_MAX = 5500;        // elle se téléporte toutes les 2,5 à 5,5 secondes
  let tp = false, prochainTp = 0;
  const hasard = (a, b) => a + Math.random() * (b - a);

  // Éclairs rose et vert + petits carrés qui jaillissent autour d'un point
  function eclairs(x, y, n, carres) {
    for (let i = 0; i < n; i++) {
      eclair(x + hasard(-45, 45), y - hasard(50, 120), x + hasard(-8, 8), y + hasard(-8, 8), {
        couleur: i % 2 ? ROSE : VERT, halo: i % 2 ? VERT : ROSE, epaisseur: hasard(1.4, 2.2),
        duree: hasard(220, 340), descente: 30, rugosite: 0.45, pas: 4, branches: 0.04, echelleBr: 0.3
      });
    }
    particules(x, y, {
      couleurs: [ROSE, VERT, '#ffffff'], n: carres, vmin: 90, vmax: 300, tailleMin: 2, tailleMax: 4,
      angleMin: -Math.PI, angleMax: Math.PI, duree: 380
    });
  }

  function creerOrbe(x, y) {
    const o = document.createElement('div');
    o.style.cssText = 'position:fixed;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;' +
      'border-radius:50%;pointer-events:none;z-index:97;' +
      'background:radial-gradient(circle,#fff 0,#fff 14%,' + ROSE + ' 42%,rgba(255,46,99,0) 72%);' +
      'box-shadow:0 0 10px ' + ROSE + ',0 0 22px ' + VERT + ';transform:translate(' + x + 'px,' + y + 'px)';
    document.body.appendChild(o);
    o.animate([{ scale: '1' }, { scale: '1.35' }, { scale: '0.85' }, { scale: '1.2' }], { duration: 220, iterations: Infinity });
    return o;
  }

  async function teleporter() {
    const s = session;
    tp = true;
    etat = 'transition';
    let orbe = null, timer = null;
    try {
      const r = sprite.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2, w = sprite.offsetWidth;
      let nx = ax, essais = 0;
      while (Math.abs(nx - ax) < 220 && essais++ < 10) nx = hasard(0, Math.max(0, window.innerWidth - w));
      const dx = nx + w / 2;

      // 1. Elle se compresse en boule, dans une gerbe d'éclairs
      eclairs(cx, cy, 4, 14);
      const a = sprite.animate(
        [{ transform: 'scale(1)', filter: 'brightness(1)' }, { transform: 'scale(0.2)', filter: 'brightness(3)' }],
        { duration: 170, easing: 'ease-in', fill: 'forwards' });
      await a.finished;
      if (s !== session || !enAnim) return;
      walker.style.opacity = 0;
      a.cancel();

      // 2. La boule file jusqu'au nouvel endroit en crépitant
      orbe = creerOrbe(cx, cy);
      const vol = orbe.animate(
        [{ transform: 'translate(' + cx + 'px,' + cy + 'px)' }, { transform: 'translate(' + dx + 'px,' + cy + 'px)' }],
        { duration: 300, easing: 'ease-in-out', fill: 'forwards' });
      timer = setInterval(() => {
        const b = orbe.getBoundingClientRect();
        eclairs(b.left + b.width / 2, b.top + b.height / 2, 1, 3);
      }, 70);
      await vol.finished;
      clearInterval(timer);
      timer = null;
      if (s !== session || !enAnim) return;

      // 3. Elle se redéploie à sa nouvelle place
      ax = nx;
      adir = Math.random() < 0.5 ? -1 : 1;
      await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
      if (s !== session || !enAnim) return;
      walker.style.opacity = 1;
      orbe.remove();
      orbe = null;
      eclairs(dx, cy, 3, 14);
      walker.animate([{ filter: 'brightness(3)' }, { filter: 'none' }], { duration: 240 });
      await sprite.animate([
        { transform: 'scale(0.2)' }, { transform: 'scale(1.2,0.85)', offset: 0.6 }, { transform: 'scale(1)' }
      ], { duration: 260, easing: 'ease-out' }).finished;
    } catch (e) {
      // si quelque chose s'interrompt (raccrocher, nouvelle fenêtre...), la V4 reprend la main
    } finally {
      if (timer) clearInterval(timer);
      if (orbe) orbe.remove();
      tp = false;
      if (s === session) {
        if (enAnim) walker.style.opacity = 1;
        if (etat === 'transition') etat = 'marche';
        prochainTp = performance.now() + hasard(TP_MIN, TP_MAX);
      }
    }
  }

  // On enveloppe la boucle de la V4 : en mode chibi, plus de glissement, elle se téléporte à la place
  const boucleOrig = window.boucle;
  window.boucle = function () {
    if (chibi && enAnim && etat === 'marche' && pose === MARCHE) {
      const now = performance.now();
      let lancer = false;
      if (!tp) {
        if (!prochainTp) prochainTp = now + hasard(1500, 3000);
        else if (now > prochainTp) lancer = true;
      }
      if (lancer) teleporter();
      else ax -= adir * VITESSE; // la V4 va la faire avancer d'un pas : on annule, elle reste sur place
    } else if (!tp) {
      prochainTp = 0;
    }
    boucleOrig.apply(this, arguments);
  };

  // ===== Au démarrage : on retrouve le mode choisi la dernière fois =====
  if (chibi) {
    document.body.classList.add('chibi');
    majPortrait();
    appliquer();
  }
})();
