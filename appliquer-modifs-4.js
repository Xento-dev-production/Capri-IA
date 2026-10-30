// Quatrième série de modifications de Capri :
//  - le bug quand on la secoue arrive beaucoup plus vite
//  - insertion de la puce dans le port USB réaliste : mauvais sens, rebond, correction, résistance, "clic", sons
//  - fenêtres de hacking plus Cyberpunk : écran assombri, pluie de code, alerte NETWATCH, titres qui se décodent, glitchs
// Utilisation : node appliquer-modifs-4.js nom-de-ton-fichier.html
const fs = require('fs');

const fichier = process.argv[2];
if (!fichier || !fs.existsSync(fichier)) {
  console.log('Utilisation : node appliquer-modifs-4.js nom-de-ton-fichier.html');
  process.exit(1);
}

let txt = fs.readFileSync(fichier, 'utf8');
const crlf = txt.includes('\r\n');
txt = txt.replace(/\r\n/g, '\n');

if (txt.includes('function contactPort')) {
  console.log('Ces modifications sont déjà appliquées dans ce fichier.');
  process.exit(0);
}
if (!txt.includes('function bugCapri')) {
  console.log('Le script 3 (appliquer-modifs-3.js) n\'a pas encore été appliqué sur ce fichier.');
  process.exit(1);
}

function erreur(nom, n) {
  console.log('ERREUR : le repère "' + nom + '" a été trouvé ' + n + ' fois (attendu : 1).');
  console.log('Aucun changement n\'a été fait. Envoie-moi ce message.');
  process.exit(1);
}

// Remplace un texte qui doit apparaître exactement une fois
function remplacer(nom, ancien, nouveau) {
  const n = txt.split(ancien).length - 1;
  if (n !== 1) erreur(nom, n);
  txt = txt.replace(ancien, () => nouveau);
}

// Remplace tout ce qui se trouve entre deux repères (repères compris, jusqu'à la fin de la ligne)
function remplacerPlage(nom, debut, fin, nouveau) {
  const n = txt.split(debut).length - 1;
  if (n !== 1) erreur(nom + ' (début)', n);
  const i = txt.indexOf(debut);
  const j = txt.indexOf(fin, i);
  if (j < 0) erreur(nom + ' (fin)', 0);
  const k = txt.indexOf('\n', j + fin.length - 1);
  const finIdx = k < 0 ? txt.length : k;
  txt = txt.slice(0, i) + nouveau + txt.slice(finIdx);
}

// ---------- 1. Le bug arrive beaucoup plus vite ----------
remplacerPlage('secousse vitesse',
  "const SECOUSSE_VITESSE = 900;", "const SECOUSSE_VITESSE = 900;",
  "const SECOUSSE_VITESSE = 700;   // vitesse minimale de la souris (pixels par seconde) pour compter comme une \"secousse\"");
remplacerPlage('secousse duree',
  "const SECOUSSE_DUREE = 1.8;", "const SECOUSSE_DUREE = 1.8;",
  "const SECOUSSE_DUREE = 0.7;     // secondes de secousses (cumulées) avant que ça puisse bugger : plus petit = plus rapide");
remplacerPlage('chance bug',
  "const CHANCE_BUG = 0.25;", "const CHANCE_BUG = 0.25;",
  "const CHANCE_BUG = 1.0;         // chance de bug par seconde une fois la durée atteinte (1.0 = ça bugge vite ; 0.3 = plus rare)");

// ---------- 2. Style : ambiance du hack + port en erreur ----------
remplacer('fin du style',
  "</style>\n</head>",
`
  /* ===== Ambiance du hack : voile sombre, pluie de code, alerte, glitchs ===== */
  .rb-scene { top: 34px; }
  #rbVoile {
    position: absolute; inset: 0; opacity: 0;
    background: radial-gradient(ellipse at center, rgba(0, 12, 18, 0.55) 0%, rgba(0, 0, 0, 0.9) 100%);
  }
  #rbPluie { position: absolute; left: 0; top: 0; width: 100%; height: 100%; opacity: 0.5; }
  #rbAlerte {
    position: absolute; top: 6px; left: 50%; transform: translateX(-50%); z-index: 3;
    padding: 4px 24px 5px 18px; background: #000; border: 1px solid var(--rouge);
    color: var(--rouge); font-size: 12px; letter-spacing: 4px; white-space: nowrap;
    text-shadow: 0 0 6px rgba(255, 46, 99, 0.7);
    animation: alerteflash 0.9s steps(2, start) infinite;
  }
  #rbAlerte.ok { color: var(--vert); border-color: var(--vert); text-shadow: 0 0 6px rgba(0, 255, 163, 0.7); animation: none; }
  @keyframes alerteflash { 50% { opacity: 0.4; } }
  .rb-in { animation: fenglitch 6s steps(1) infinite; }
  @keyframes fenglitch {
    0%, 100% { transform: none; filter: none; }
    61% { transform: translateX(-3px); filter: hue-rotate(40deg); }
    62% { transform: translateX(4px) skewX(1deg); }
    63% { transform: none; filter: none; }
    88% { transform: translateX(2px); }
    89% { transform: none; }
  }
  .rb-scan::after {
    content: ""; position: absolute; left: 0; right: 0; top: -30%; height: 30%;
    background: linear-gradient(to bottom, transparent, rgba(39, 230, 255, 0.11), transparent);
    animation: balayage 3.8s linear infinite;
  }
  @keyframes balayage { to { top: 110%; } }
  .port.erreur { background: #ff1f4d; animation: none; }
  .port.erreur .port-in::after { background: #ff1f4d; box-shadow: 0 0 8px #ff1f4d; }
</style>
</head>`);

// ---------- 3. HTML : voile, pluie de code et bandeau d'alerte derrière les fenêtres ----------
remplacer('scene des fenetres',
  '<div class="rb-scene" id="rbScene">',
`<div id="rbVoile"></div>
    <canvas id="rbPluie"></canvas>
    <div id="rbAlerte"><span id="rbAlerteTxt">ALERTE // TRACE NETWATCH EN COURS</span></div>
    <div class="rb-scene" id="rbScene">`);

// ---------- 4. L'insertion dure plus longtemps (elle peut rater, puis réussir) ----------
remplacer('duree entree',
  "const DUREE_ENTREE = 1200;",
  "const DUREE_ENTREE = 2600;");
remplacer('objet insertion',
  "bas: r.bottom, port: port, t0: performance.now(), contact: false\n    };",
`bas: r.bottom, port: port, t0: performance.now(), contact: false,
      echec: Math.random() < CHANCE_ECHEC_USB          // première tentative ratée (mauvais sens) ?
    };
    puceEntre.duree = puceEntre.echec ? DUREE_ENTREE : DUREE_ENTREE - 1500;`);
remplacer('attente insertion',
  "await wait(DUREE_ENTREE + 80);",
  "await wait(puceEntre.duree + 80);");
remplacer('son des donnees',
  "faisceauDonnees(px, py, cx, bas);",
  "faisceauDonnees(px, py, cx, bas);\n    son('donnees');");

// ---------- 5. Sons, secousse d'écran, étincelles, contact, échec, ambiance ----------
remplacer('avant ondeChoc',
  "// Les ondes de choc qui partent du port quand la puce touche le fond",
`// ===== Réalisme de l'insertion USB : sons, secousses, tentative ratée, clic =====
  const CHANCE_ECHEC_USB = 0.7;   // chance que la première tentative rate (mauvais sens, comme un vrai USB) : 0 = jamais, 1 = toujours
  const SONS = true;              // mets false pour couper tous les sons

  // Petits sons de synthèse (aucun fichier à ajouter)
  let audio = null;
  function son(nom) {
    if (!SONS) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const t0 = audio.currentTime;
      const ton = (f1, f2, d, type, vol, retard) => {
        const o = audio.createOscillator(), g = audio.createGain();
        const t = t0 + (retard || 0);
        o.type = type;
        o.frequency.setValueAtTime(f1, t);
        o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t + d);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g); g.connect(audio.destination);
        o.start(t); o.stop(t + d + 0.02);
      };
      if (nom === 'clic') { ton(1400, 300, 0.05, 'square', 0.12); ton(90, 40, 0.18, 'sine', 0.35); }
      else if (nom === 'echec') { ton(150, 60, 0.22, 'sawtooth', 0.18); }
      else if (nom === 'connecte') { ton(440, 440, 0.1, 'triangle', 0.14, 0); ton(660, 660, 0.1, 'triangle', 0.14, 0.1); ton(990, 990, 0.2, 'triangle', 0.14, 0.2); }
      else if (nom === 'ouvre') { ton(1800, 600, 0.08, 'square', 0.04); }
      else if (nom === 'donnees') { for (let i = 0; i < 10; i++) ton(alea(600, 2400), alea(600, 2400), 0.05, 'square', 0.035, i * 0.07); }
    } catch (e) {}
  }

  // Tout l'écran tremble un instant
  function secousseEcran(amp, duree) {
    const kf = [];
    for (let i = 0; i < 10; i++) kf.push({ transform: 'translate(' + alea(-amp, amp).toFixed(1) + 'px,' + alea(-amp, amp).toFixed(1) + 'px)' });
    kf.push({ transform: 'none' });
    document.body.animate(kf, { duration: duree, easing: 'linear' });
  }

  // Mauvais sens : ça ne rentre pas. Le port clignote en rouge, ça tremble, ça fait un bruit sec
  function echecPort(E) {
    E.port.classList.add('erreur');
    setTimeout(() => E.port.classList.remove('erreur'), 420);
    usbHint.textContent = 'MAUVAIS SENS...';
    usbHint.style.color = 'var(--rouge)';
    secousseEcran(4, 160);
    son('echec');
    particules(E.xa + E.dx, E.bas + 2, {
      couleurs: ['#ff2e63', '#ffffff', '#ff8a1f'], n: 10, vmin: 80, vmax: 260,
      tailleMin: 2, tailleMax: 4, angleMin: 0.2, angleMax: Math.PI - 0.2, duree: 340
    });
  }

  // Le "clic" : la puce est enfoncée à fond. Le port s'allume, tout tremble, des étincelles partent
  function contactPort(E) {
    E.contact = true;
    E.port.classList.remove('erreur');
    E.port.classList.add('connecte', 'flash');
    setTimeout(() => E.port.classList.remove('flash'), 220);
    ondeChoc(E.xa, E.bas);
    secousseEcran(7, 260);
    son('clic');
    setTimeout(() => son('connecte'), 180);
    usbHint.textContent = 'CONNEXION...';
    usbHint.style.color = 'var(--vert)';
    particules(E.xa, E.bas, {
      couleurs: ['#00ffa3', '#ffffff', '#27e6ff'], n: 18, vmin: 100, vmax: 380,
      tailleMin: 2, tailleMax: 4, angleMin: 0.15, angleMax: Math.PI - 0.15, duree: 420
    });
    etincellesPort(E.port);
  }

  // Tant que la puce est branchée, le port crache de petites étincelles et de minuscules arcs
  function etincellesPort(port) {
    const iv = setInterval(() => {
      if (!enAnim || (etat !== 'puce' && etat !== 'reboot') || !port.classList.contains('connecte')) { clearInterval(iv); return; }
      const r = port.getBoundingClientRect();
      const x = r.left + r.width / 2 + alea(-24, 24), y = r.bottom;
      particules(x, y, {
        couleurs: ['#00ffa3', '#ffffff', '#27e6ff'], n: 3, vmin: 60, vmax: 220,
        tailleMin: 2, tailleMax: 3, angleMin: 0.2, angleMax: Math.PI - 0.2, duree: 380
      });
      if (Math.random() < 0.35) eclair(x, y, x + alea(-50, 50), y + alea(30, 80), {
        couleur: '#27e6ff', halo: '#27e6ff', epaisseur: 1.2, duree: 160, descente: 25,
        rugosite: 0.5, pas: 4, branches: 0, echelleBr: 0
      });
    }, 260);
  }

  // ----- Ambiance du hack : l'écran s'assombrit, une pluie de code tombe, une alerte NETWATCH s'affiche -----
  const pluie = document.getElementById('rbPluie');
  const voile = document.getElementById('rbVoile');
  const alerteEl = document.getElementById('rbAlerte');
  const alerteTxt = document.getElementById('rbAlerteTxt');
  let pluieRaf = null;

  function lancerPluie() {
    cancelAnimationFrame(pluieRaf);
    const cv = pluie, c = cv.getContext('2d');
    cv.width = window.innerWidth; cv.height = window.innerHeight;
    const pas = 20, n = Math.ceil(cv.width / pas), queue = 9;
    const teintes = ['rgba(0,255,163,', 'rgba(39,230,255,', 'rgba(251,17,110,'];
    const car = '01ABCDEF<>/#$%';
    const cols = [];
    for (let i = 0; i < n; i++) cols.push({ y: alea(-20, 0), v: alea(0.3, 0.9), t: teintes[i % teintes.length] });
    let dernier = 0;
    const tick = (t) => {
      pluieRaf = requestAnimationFrame(tick);
      if (t - dernier < 60) return;
      dernier = t;
      c.clearRect(0, 0, cv.width, cv.height);
      c.font = 'bold 14px Consolas, "Courier New", monospace';
      cols.forEach((col, i) => {
        col.y += col.v;
        if ((col.y - queue) * pas > cv.height) { col.y = alea(-12, -2); col.v = alea(0.3, 0.9); }
        for (let k = 0; k < queue; k++) {
          const yy = (col.y - k) * pas;
          if (yy < 0 || yy > cv.height) continue;
          c.fillStyle = k === 0 ? 'rgba(255,255,255,0.9)' : col.t + (0.65 - k * 0.07).toFixed(2) + ')';
          c.fillText(car[Math.floor(Math.random() * car.length)], i * pas, yy);
        }
      });
    };
    pluieRaf = requestAnimationFrame(tick);
  }
  function arreterPluie() {
    cancelAnimationFrame(pluieRaf);
    pluie.getContext('2d').clearRect(0, 0, pluie.width, pluie.height);
    voile.getAnimations().forEach((a) => a.cancel());
    voile.style.opacity = 0;
  }
  function majAlerte(p) {
    if (p >= 100) { alerteEl.classList.add('ok'); alerteTxt.textContent = 'TRACE DÉTOURNÉE // ACCÈS TOTAL'; return; }
    alerteTxt.textContent = 'ALERTE // TRACE NETWATCH EN COURS : ' + Math.min(97, Math.floor(p)) + '%';
  }
  function debutHack() {
    voile.getAnimations().forEach((a) => a.cancel());
    voile.style.opacity = 1;
    voile.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700 });
    alerteEl.classList.remove('ok');
    majAlerte(0);
    lancerPluie();
  }
  async function finHack() {
    await voile.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'forwards' }).finished.catch(() => {});
    arreterPluie();
  }

  // Les ondes de choc qui partent du port quand la puce touche le fond`);

// ---------- 6. Mouvement de la puce : insertion réaliste ----------
remplacer('mouvement de la puce',
  "} else if (puceMode === 'entre' && puceEntre) {",
`} else if (puceMode === 'entre' && puceEntre) {
      // Insertion réaliste : approche de travers, (souvent) mauvais sens, correction, résistance, puis "clic"
      const E = puceEntre;
      if (!E.init) {
        E.init = true;
        E.dx = alea(11, 17) * (Math.random() < 0.5 ? -1 : 1);   // décalage de la mauvaise tentative
        E.ex = E.echec ? E.xa : E.x0;                             // d'où part la deuxième approche
        E.ey = E.echec ? E.ya + 40 : E.y0;
        E.er = E.echec ? 0 : E.rot0;
      }
      const tt = now - E.t0 + (E.echec ? 0 : 1500);
      const ent = (a, b) => lisse(Math.min(1, Math.max(0, (tt - a) / (b - a))));
      const sg = Math.sign(E.dx);
      if (tt < 520) {                                // 1. elle s'approche du port, un peu de travers
        const e = ent(0, 520);
        puceX = E.x0 + (E.xa + E.dx - E.x0) * e;
        puceY = E.y0 + (E.ya + 46 - E.y0) * e;
        puceRot = E.rot0 + (sg * 7 - E.rot0) * e;
      } else if (tt < 760) {                         // 2. elle pousse : ça ne rentre pas
        const e = ent(520, 760);
        puceX = E.xa + E.dx;
        puceY = E.ya + 46 - 54 * e;
        puceRot = sg * 7;
        if (!E.rate && tt >= 740) { E.rate = true; echecPort(E); }
      } else if (tt < 1060) {                        // 3. elle rebondit en arrière en tremblant
        const e = ent(760, 1060);
        puceX = E.xa + E.dx;
        puceY = E.ya - 8 + 48 * e;
        puceRot = sg * 7 + Math.sin((tt - 760) / 35) * 6 * (1 - e);
      } else if (tt < 1500) {                        // 4. elle se remet dans le bon axe
        const e = ent(1060, 1500);
        puceX = E.xa + E.dx * (1 - e);
        puceY = E.ya + 40;
        puceRot = sg * 7 * (1 - e) + Math.sin(e * Math.PI * 2) * 3 * (1 - e);
      } else if (tt < 1850) {                        // 5. deuxième approche, bien droite
        if (E.echec && !E.reessai) { E.reessai = true; usbHint.textContent = 'RÉESSAI...'; usbHint.style.color = 'var(--cyan)'; }
        const e = ent(1500, 1850);
        puceX = E.ex + (E.xa - E.ex) * e;
        puceY = E.ey + (E.ya - E.ey) * e;
        puceRot = E.er * (1 - e);
      } else if (tt < 2050) {                        // 6. l'aimant la capte : elle vibre
        puceX = E.xa + (Math.random() - 0.5) * 3;
        puceY = E.ya + (Math.random() - 0.5) * 3;
        puceRot = 0;
      } else {                                       // 7. elle s'enfonce, avec de la résistance, puis "clic"
        const q = Math.min(1, (tt - 2050) / (DUREE_ENTREE - 2050));
        puceX = E.xa;
        puceY = E.ya + (E.y1 - E.ya) * q * q * q;
        puceRot = 0;
        if (!E.contact && q >= 0.94) contactPort(E);
      }
    } else if (puceMode === 'entre-ancien' && puceEntre) {`);

// ---------- 7. Fenêtres : ouverture plus Cyberpunk (titre qui se décode, bip, glitch décalé) ----------
remplacerPlage('ouvrirFenetre',
  "function ouvrirFenetre(f) {",
  "], { duration: 520 });\n  }",
`function ouvrirFenetre(f) {
    f.style.display = 'block';
    f.animate([
      { opacity: 0, transform: 'scale(0.9, 0.04)', filter: 'hue-rotate(90deg) brightness(2)' },
      { opacity: 1, transform: 'scale(1.04, 0.04)', filter: 'brightness(2.4)', offset: 0.25 },
      { opacity: 0.5, transform: 'scale(1, 1.05)', filter: 'hue-rotate(-60deg)', offset: 0.55 },
      { opacity: 1, transform: 'scale(1, 1)', filter: 'none', offset: 0.7 },
      { opacity: 0.6, offset: 0.82 },
      { opacity: 1, transform: 'none', filter: 'none' }
    ], { duration: 520 });
    // Le titre se "décode", un petit bip, et chaque fenêtre a son propre rythme de glitch
    const tit = f.querySelector('.reboot-titre');
    if (tit) decoder(tit, tit.textContent, 450);
    const dedans = f.querySelector('.rb-in');
    if (dedans) dedans.style.animationDelay = (-Math.random() * 6).toFixed(2) + 's';
    son('ouvre');
  }`);

// ---------- 8. Branchement de l'ambiance dans la réinitialisation ----------
remplacer('debut du hack',
  "rebootEl.style.display = 'block';",
  "rebootEl.style.display = 'block';\n    debutHack();");
remplacer('alerte progression',
  "majJauges(p);\n      ajouterLog();",
  "majJauges(p);\n      majAlerte(p);\n      ajouterLog();");
remplacer('alerte fin',
  "rebootSous.textContent = 'CAPRI // ACCÈS ACCORDÉ';",
  "rebootSous.textContent = 'CAPRI // ACCÈS ACCORDÉ';\n    majAlerte(100);");
remplacer('fin du hack',
  "await fermerFenetre(rbMain);\n    if (s !== session) return;\n    rebootEl.style.display = 'none';",
  "await fermerFenetre(rbMain);\n    if (s !== session) return;\n    await finHack();\n    if (s !== session) return;\n    rebootEl.style.display = 'none';");
remplacer('nettoyage de la puce',
  "rebootEl.style.display = 'none';\n    afficherUSB(false);\n  }",
  "rebootEl.style.display = 'none';\n    arreterPluie();\n    afficherUSB(false);\n  }");

// ---------- Enregistrement (avec une copie de sécurité) ----------
fs.copyFileSync(fichier, fichier + '.bak4');
if (crlf) txt = txt.replace(/\n/g, '\r\n');
fs.writeFileSync(fichier, txt, 'utf8');
console.log('Terminé ! Les modifications sont appliquées dans ' + fichier);
console.log('Une copie de la version précédente est dans ' + fichier + '.bak4');
