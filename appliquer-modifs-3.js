// Troisième série de modifications de Capri :
//  - si on la secoue longtemps, elle peut bugger (éclairs, bulles de texte), disparaître et lâcher la puce
//  - six fenêtres de hacking au lieu de trois, qui finissent chacune à un moment différent
// Utilisation : node appliquer-modifs-3.js nom-de-ton-fichier.html
const fs = require('fs');

const fichier = process.argv[2];
if (!fichier || !fs.existsSync(fichier)) {
  console.log('Utilisation : node appliquer-modifs-3.js nom-de-ton-fichier.html');
  process.exit(1);
}

let txt = fs.readFileSync(fichier, 'utf8');
const crlf = txt.includes('\r\n');
txt = txt.replace(/\r\n/g, '\n');

if (txt.includes('function bugCapri')) {
  console.log('Ces modifications sont déjà appliquées dans ce fichier.');
  process.exit(0);
}
if (!txt.includes('async function lancerReboot') || !txt.includes('function lancerPuce')) {
  console.log('Ce fichier ne contient pas la puce / les fenêtres de hacking : ce n\'est pas la bonne version.');
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

// ---------- 1. Style des nouvelles fenêtres ----------
remplacer('fin du style',
  "</style>\n</head>",
`
  /* ===== Fenêtres supplémentaires : RÉSEAU, MÉMOIRE, DÉCHIFFREMENT ===== */
  .nt { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 11px; letter-spacing: 1.5px; color: var(--vert); }
  .nt span { flex: 1; }
  .nt em { font-style: normal; width: 120px; text-align: right; color: #6b7a88; }
  .nt em.cours { color: var(--cyan); }
  .nt em.fin { color: var(--vert); }
  .nt i { flex-shrink: 0; width: 8px; height: 8px; background: #3a4558; }
  .nt i.cours { background: var(--cyan); box-shadow: 0 0 6px var(--cyan); }
  .nt i.fin { background: var(--vert); box-shadow: 0 0 6px var(--vert); }
  #memGrille { display: grid; grid-template-columns: repeat(12, 14px); gap: 2px; margin-top: 12px; }
  #memGrille i { display: block; width: 14px; height: 14px; background: #2a1219; }
  #memGrille i.rep { background: var(--rouge); box-shadow: 0 0 5px var(--rouge); }
  #memGrille i.ok { background: var(--vert); box-shadow: 0 0 4px var(--vert); }
  .reboot-log.hex { height: 110px; font-size: 12px; margin: 12px 0 10px; }
  #errBilan { font-size: 10px; letter-spacing: 1px; }
</style>
</head>`);

// ---------- 2. Position des fenêtres existantes ----------
remplacer('position ACCES ROOT',
  'id="rbRoot" style="left:870px; top:110px; width:490px"',
  'id="rbRoot" style="left:870px; top:20px; width:490px"');
remplacer('position JOURNAL',
  'id="rbErr" style="left:220px; top:575px; width:740px"',
  'id="rbErr" style="left:300px; top:560px; width:560px"');

// ---------- 3. Les trois nouvelles fenêtres (HTML) ----------
remplacer('fenetre 3',
  "<!-- Fenêtre 3 : JOURNAL D'ERREURS -->",
`<!-- Fenêtre 4 : RÉSEAU (relais NETWATCH) -->
      <div class="rb-fenetre" id="rbNet" style="left:870px; top:450px; width:490px">
        <div class="rb-cadre cy" id="netCadre"><div class="rb-in">
          <div class="rb-tete">
            <div class="reboot-titre pt" id="netTitre">RÉSEAU NETWATCH</div>
            <div class="rb-meta" id="netMeta">0 / 5 RELAIS</div>
          </div>
          <div id="netListe" style="margin-top:12px"></div>
          <div class="rb-scan"></div>
        </div></div>
      </div>

      <!-- Fenêtre 5 : MÉMOIRE (défragmentation) -->
      <div class="rb-fenetre" id="rbMem" style="left:40px; top:560px; width:240px">
        <div class="rb-cadre cy" id="memCadre"><div class="rb-in">
          <div class="rb-tete">
            <div class="reboot-titre pt" id="memTitre">MÉMOIRE</div>
          </div>
          <div id="memGrille"></div>
          <div class="rb-meta" id="memMeta" style="margin-top:8px; text-align:left">SECTEURS 0 / 96</div>
          <div class="rb-scan"></div>
        </div></div>
      </div>

      <!-- Fenêtre 6 : DÉCHIFFREMENT -->
      <div class="rb-fenetre" id="rbCle" style="left:870px; top:645px; width:490px">
        <div class="rb-cadre ro" id="cleCadre"><div class="rb-in">
          <div class="rb-tete">
            <div class="reboot-titre pt" id="cleTitre">DÉCHIFFREMENT</div>
            <div class="rb-meta" id="cleMeta">AES-256  //  0%</div>
          </div>
          <div class="reboot-log hex" id="cleLog"></div>
          <div class="reboot-barre" style="height:22px"><div class="reboot-fill" id="cleFill"></div></div>
          <div class="rb-scan"></div>
        </div></div>
      </div>

      <!-- Fenêtre 3 : JOURNAL D'ERREURS -->`);

// ---------- 4. Les six fenêtres : logique (ouvertures et fins à des moments différents) ----------
txt = txt.replace(/\n[ \t]*\/\/ Les trois fenêtres :[^\n]*/, '');

remplacerPlage('lancerReboot',
  "async function lancerReboot(s) {",
  "reapparaitre(s);\n  }",
`// ===== Les six fenêtres de hacking =====
  // Quand chaque fenêtre s'ouvre et quand elle a fini (en % de la progression globale).
  // Elles finissent à des moments différents : change ces chiffres comme tu veux.
  // (ACCÈS ROOT : voir OUVERTURE_ROOT et FIN_ROOT plus haut. RÉINITIALISATION finit en dernier, à 100 %.)
  const OUV_NET = 4,  FIN_NET = 46;
  const OUV_ERR = 12, FIN_ERR = 86;
  const OUV_MEM = 18, FIN_MEM = 78;
  const OUV_CLE = 34, FIN_CLE = 92;

  const rbNet = document.getElementById('rbNet');
  const rbMem = document.getElementById('rbMem');
  const rbCle = document.getElementById('rbCle');
  const netCadre = document.getElementById('netCadre');
  const memCadre = document.getElementById('memCadre');
  const cleCadre = document.getElementById('cleCadre');
  const netTitre = document.getElementById('netTitre');
  const memTitre = document.getElementById('memTitre');
  const cleTitre = document.getElementById('cleTitre');
  const netMeta = document.getElementById('netMeta');
  const memMeta = document.getElementById('memMeta');
  const cleMeta = document.getElementById('cleMeta');
  const netListe = document.getElementById('netListe');
  const memGrille = document.getElementById('memGrille');
  const cleLog = document.getElementById('cleLog');
  const cleFill = document.getElementById('cleFill');

  // Fenêtre RÉSEAU : une ligne par relais à contourner (ajoutes-en si tu veux)
  const RELAIS = ['RELAIS TOKYO-3', 'PROXY NIGHT CITY', 'NOEUD ARASAKA-07', 'PARE-FEU NETWATCH', 'PASSERELLE BLACKWALL'];
  const lignesNet = RELAIS.map((nom) => {
    const d = document.createElement('div');
    d.className = 'nt';
    d.innerHTML = '<i></i><span></span><em>EN ATTENTE</em>';
    d.querySelector('span').textContent = nom;
    netListe.appendChild(d);
    return { i: d.querySelector('i'), e: d.querySelector('em') };
  });
  function majNet(pr) {
    const n = lignesNet.length;
    let fait = 0;
    lignesNet.forEach((l, k) => {
      const deb = k / n * 100, fin = (k + 1) / n * 100;
      let cls = '', texte = 'EN ATTENTE';
      if (pr >= fin) { cls = 'fin'; texte = 'CONTOURNÉ'; fait++; }
      else if (pr > deb) { cls = 'cours'; texte = 'CONNEXION ' + Math.floor((pr - deb) / (fin - deb) * 100) + '%'; }
      l.i.className = cls;
      l.e.className = cls;
      l.e.textContent = texte;
    });
    netMeta.textContent = fait + ' / ' + n + ' RELAIS';
  }

  // Fenêtre MÉMOIRE : une grille de secteurs qui passent du rouge au vert
  const NB_CELLULES = 96;
  const cellules = [];
  for (let i = 0; i < NB_CELLULES; i++) {
    const c = document.createElement('i');
    memGrille.appendChild(c);
    cellules.push(c);
  }
  function majMem(pr) {
    const fait = Math.floor(pr / 100 * NB_CELLULES);
    cellules.forEach((c, i) => {
      c.className = i < fait ? 'ok' : (i < fait + 4 && Math.random() < 0.7 ? 'rep' : '');
    });
    memMeta.textContent = 'SECTEURS ' + fait + ' / ' + NB_CELLULES;
  }

  // Fenêtre DÉCHIFFREMENT : de l'hexadécimal qui défile et une barre
  function majCle(pr) {
    cleFill.style.width = pr.toFixed(0) + '%';
    cleMeta.textContent = 'AES-256  //  ' + Math.floor(pr) + '%';
  }
  function ajouterHex() {
    const l = document.createElement('div');
    l.className = 'lg';
    l.innerHTML = '<span class="lt"></span><span class="ok">[OK]</span>';
    l.firstChild.textContent = hex(8) + ' ' + hex(8) + ' ' + hex(8) + ' ' + hex(4);
    cleLog.appendChild(l);
    while (cleLog.children.length > 5) cleLog.removeChild(cleLog.firstChild);
  }

  // Une fenêtre a fini : son cadre passe au vert, elle reste un instant, puis elle se ferme
  async function finirFenetre(f, cadre, titre, texte, s) {
    titre.textContent = texte;
    cadre.style.animation = 'none';
    cadre.style.background = 'var(--vert)';
    await wait(900);
    if (s !== session) return;
    await fermerFenetre(f);
  }

  async function lancerReboot(s) {
    etat = 'reboot';
    // Tout s'adapte à la taille de l'écran
    const ech = Math.min(1, window.innerWidth / 1480, window.innerHeight / 940);
    rbScene.style.transform = 'scale(' + ech.toFixed(3) + ')';
    [rbMain, rbRoot, rbErr, rbNet, rbMem, rbCle].forEach((f) => { f.style.display = 'none'; });
    [rebootCadre, rootCadre, errCadre, netCadre, memCadre, cleCadre].forEach((c) => { c.style.animation = ''; c.style.background = ''; });
    rebootFill.style.width = '0%';
    rebootPct.textContent = '0%';
    rebootSous.textContent = ETAPES_REBOOT[0][1];
    rebootTitre.textContent = 'RÉINITIALISATION';
    rebootMeta.textContent = 'SESSION ' + hex(4) + '-' + hex(4) + '  //  ACCÈS ROOT';
    rootTitre.textContent = 'ACCÈS ROOT';
    rootSous.textContent = 'capri@night-city:~#  ÉLÉVATION DES PRIVILÈGES...';
    errTitre.textContent = "JOURNAL D'ERREURS";
    netTitre.textContent = 'RÉSEAU NETWATCH';
    memTitre.textContent = 'MÉMOIRE';
    cleTitre.textContent = 'DÉCHIFFREMENT';
    rebootLog.innerHTML = '';
    errLog.innerHTML = '';
    cleLog.innerHTML = '';
    indexLog = 0; errTotal = 0; errFixed = 0; errCrit = 0; rootFermee = false;
    majErr(); majJauges(0); majRoot(0); majNet(0); majMem(0); majCle(0);
    rebootT0 = performance.now();
    rebootEl.style.display = 'block';
    ouvrirFenetre(rbMain);
    ajouterLog();

    const ouv = { net: false, err: false, root: false, mem: false, cle: false };
    const fini = { net: false, err: false, root: false, mem: false, cle: false };
    const prog = (p, a, b) => Math.min(100, Math.max(0, (p - a) / (b - a) * 100));
    let p = 0;
    while (p < 100) {
      await wait(alea(100, 240));
      if (s !== session) return;
      if (Math.random() < 0.1) {                 // de temps en temps la barre se bloque un instant
        await wait(alea(250, 600));
        if (s !== session) return;
      }
      p = Math.min(100, p + alea(1.8, 5.5));
      const n = Math.floor(p);
      rebootFill.style.width = n + '%';
      rebootPct.textContent = n + '%';
      for (const [seuil, txt] of ETAPES_REBOOT) if (n >= seuil) rebootSous.textContent = txt;
      majJauges(p);
      ajouterLog();

      // Chaque fenêtre s'ouvre à son moment
      if (!ouv.net && p >= OUV_NET) { ouv.net = true; ouvrirFenetre(rbNet); }
      if (!ouv.err && p >= OUV_ERR) { ouv.err = true; ouvrirFenetre(rbErr); }
      if (!ouv.root && p >= OUVERTURE_ROOT) { ouv.root = true; ouvrirFenetre(rbRoot); }
      if (!ouv.mem && p >= OUV_MEM) { ouv.mem = true; ouvrirFenetre(rbMem); }
      if (!ouv.cle && p >= OUV_CLE) { ouv.cle = true; ouvrirFenetre(rbCle); }

      // RÉSEAU
      if (ouv.net && !fini.net) {
        const pr = prog(p, OUV_NET, FIN_NET);
        majNet(pr);
        if (pr >= 100) { fini.net = true; finirFenetre(rbNet, netCadre, netTitre, 'RÉSEAU : RELAIS CONTOURNÉS', s); }
      }
      // ACCÈS ROOT
      if (ouv.root && !fini.root) {
        const pr = prog(p, OUVERTURE_ROOT, FIN_ROOT);
        majRoot(pr);
        if (pr >= 100) { fini.root = true; finirRoot(s); }
      }
      // MÉMOIRE
      if (ouv.mem && !fini.mem) {
        const pr = prog(p, OUV_MEM, FIN_MEM);
        majMem(pr);
        if (pr >= 100) { fini.mem = true; finirFenetre(rbMem, memCadre, memTitre, 'MÉMOIRE : OK', s); }
      }
      // DÉCHIFFREMENT
      if (ouv.cle && !fini.cle) {
        const pr = prog(p, OUV_CLE, FIN_CLE);
        majCle(pr);
        ajouterHex();
        if (pr >= 100) { fini.cle = true; finirFenetre(rbCle, cleCadre, cleTitre, 'DÉCHIFFREMENT TERMINÉ', s); }
      }
      // JOURNAL D'ERREURS
      if (ouv.err && !fini.err) {
        if (p >= FIN_ERR) {
          fini.err = true;
          errLog.querySelectorAll('.bad').forEach((t) => { t.className = 'ok'; t.textContent = '[RÉPARÉ]'; });
          errFixed = errTotal;
          majErr();
          finirFenetre(rbErr, errCadre, errTitre, "JOURNAL D'ERREURS : TOUT EST RÉPARÉ", s);
        } else if (Math.random() < 0.6) {
          ajouterErreur(s);
        }
      }
    }

    // Terminé : la fenêtre principale passe au vert (les autres ont déjà fini, chacune à son tour)
    majJauges(100);
    rebootTitre.textContent = 'RÉINITIALISATION TERMINÉE';
    rebootSous.textContent = 'CAPRI // ACCÈS ACCORDÉ';
    rebootCadre.style.animation = 'none';
    rebootCadre.style.background = 'var(--vert)';
    await wait(1500);
    if (s !== session) return;
    for (const f of [rbRoot, rbErr, rbNet, rbMem, rbCle]) {   // au cas où une fenêtre n'aurait pas encore fermé
      if (f.style.display !== 'none') { fermerFenetre(f); await wait(150); }
    }
    await fermerFenetre(rbMain);
    if (s !== session) return;
    rebootEl.style.display = 'none';
    afficherUSB(false);
    await wait(250);
    if (s !== session) return;
    reapparaitre(s);
  }`);

// ---------- 5. La puce peut apparaître en l'air (quand Capri bugge) ----------
remplacer('lancerPuce signature',
  "function lancerPuce(x, y) {",
  "function lancerPuce(x, y, calme) {");
remplacer('lancerPuce position',
  "puceY = y - 30;",
  "puceY = calme ? y : y - 30;");
remplacer('lancerPuce vitesse',
  "puceVX = dir * alea(200, 380);\n    puceVY = -alea(1300, 1700);",
  "puceVX = calme ? alea(-140, 140) : dir * alea(200, 380);\n    puceVY = calme ? -alea(80, 320) : -alea(1300, 1700);");

// ---------- 6. Le nouvel état 'bug' ----------
remplacer('occupee',
  "etat === 'puce' || etat === 'reboot';",
  "etat === 'puce' || etat === 'reboot' || etat === 'bug';");
remplacer('clic sur Capri',
  "if (etat === 'puce' || etat === 'reboot') return; // Capri est absente ou en réinitialisation",
  "if (etat === 'puce' || etat === 'reboot' || etat === 'bug') return; // Capri est absente, en réinitialisation ou en plein bug");
remplacer('bulle pendant le bug',
  "if (bulleActive && etat !== 'parle' && etat !== 'attrapee' && etat !== 'ecrasee') cacherBulle();",
  "if (bulleActive && etat !== 'parle' && etat !== 'attrapee' && etat !== 'ecrasee' && etat !== 'bug') cacherBulle();");
remplacer('phrase quand on la tient',
  "if (!bulleActive && now > prochaineBulleAtt) {",
  "if (etat === 'attrapee' && !bulleActive && now > prochaineBulleAtt) {");
remplacer('detection des secousses',
  "vsY += (((curY - curYAvant) / dt) - vsY) * 0.3;\n      curXAvant = curX; curYAvant = curY;",
`vsY += (((curY - curYAvant) / dt) - vsY) * 0.3;
      curXAvant = curX; curYAvant = curY;
      // Secousses : si tu la secoues fort assez longtemps, elle risque de bugger
      if (Math.hypot(vs, vsY) > SECOUSSE_VITESSE) secousse += dt;
      else secousse = Math.max(0, secousse - dt * 0.5);
      if (secousse > SECOUSSE_DUREE && Math.random() < CHANCE_BUG * dt) bugCapri(s);`);
remplacer('debut de la prise',
  "phi = 0; omega = 0; vs = 0; vsY = 0; accX = 0; accY = 0;",
  "phi = 0; omega = 0; vs = 0; vsY = 0; accX = 0; accY = 0;\n    secousse = 0;");

// ---------- 7. Le bug : éclairs, bulles, disparition, puce ----------
remplacer('avant atterrissage',
  "// ===== Atterrissage : elle s'écrase comme une crêpe, se plaint, puis repart =====",
`// ===== Bug : si on la secoue trop longtemps, elle déraille, disparaît et lâche une puce =====
  const SECOUSSE_VITESSE = 900;   // vitesse minimale de la souris (pixels par seconde) pour compter comme une "secousse"
  const SECOUSSE_DUREE = 1.8;     // secondes de secousses (cumulées) avant que ça puisse bugger
  const CHANCE_BUG = 0.25;        // chance de bug par seconde une fois la durée atteinte (0.25 = faible ; mets 5 pour tester)
  const SEQUENCES_BUG = [         // chaque bug choisit une série au hasard : les phrases s'enchaînent
    ["Il se passe quelque chose...", "Choom... ça déconne...", "Je... je disparais ?!"],
    ["Hé... j'ai un truc bizarre...", "Mes implants s'affolent !", "Je me sens... flatline..."],
    ["Euh... c'est normal, ça ?", "Mon neuro-link grésille !", "Choom, aide-moi... !"],
    ["Qu'est-ce qui m'arrive ?!", "Tout devient blanc...", "Ça bug, ça bug, ça bug !"],
    ["J'ai comme un... glitch...", "Mon cyberware surchauffe !", "Reboot... il me faut un reboot !"]
  ];
  let secousse = 0;               // temps de secousses accumulé pendant qu'on la tient (secondes)

  async function bugCapri(s) {
    etat = 'bug';                  // elle arrête de suivre la souris
    secousse = 0;
    tenue = false; survolCapri = false;
    walker.style.pointerEvents = 'none';
    majClic();
    cacherBulle();

    // Elle grésille : son image saute et change de couleur
    const jit = sprite.animate([
      { transform: 'translate(0px, 0px)', filter: 'none' },
      { transform: 'translate(-7px, 2px) skewX(8deg)', filter: 'hue-rotate(90deg) brightness(1.6)', offset: 0.25 },
      { transform: 'translate(6px, -3px)', filter: 'invert(1)', offset: 0.5 },
      { transform: 'translate(-3px, 4px) skewX(-6deg)', filter: 'hue-rotate(200deg)', offset: 0.75 },
      { transform: 'translate(0px, 0px)', filter: 'none' }
    ], { duration: 240, iterations: Infinity, easing: 'steps(1)' });

    // Des éclairs de couleurs la frappent pendant tout le bug
    glitchEcran(1200);
    frappes();
    const salves = setInterval(() => { if (s === session && etat === 'bug') frappes(); }, 380);
    const flashs = setInterval(() => {
      if (s === session && etat === 'bug') flashBlanc(160, 0.12, PALETTE[Math.floor(Math.random() * PALETTE.length)]);
    }, 700);
    const arreter = () => { clearInterval(salves); clearInterval(flashs); jit.cancel(); };

    // Elle dit plusieurs phrases à la suite
    const serie = SEQUENCES_BUG[Math.floor(Math.random() * SEQUENCES_BUG.length)];
    for (let i = 0; i < serie.length; i++) {
      const ok = await direPhrase([serie[i]], 750, 250);
      if (!ok || s !== session) { arreter(); return; }
      if (i === 1) glitchEcran(900);
    }

    // Le grand bug : salve finale, l'écran déraille, et elle disparaît
    glitchEcran(700);
    frappes();
    flashBlanc(350, 0.45, '#ffffff');
    await wait(260);
    if (s !== session) { arreter(); return; }
    arreter();
    const h = HAUTEUR_ATTRAPEE * ECHELLE;
    const cx = curX + Math.sin(phi) * h * 0.5, cy = curY + Math.cos(phi) * h * 0.5;
    walker.style.opacity = 0;
    particules(cx, cy, {
      couleurs: PALETTE.concat(['#ffffff']), n: 26, vmin: 150, vmax: 520,
      tailleMin: 2, tailleMax: 6, angleMin: -Math.PI, angleMax: Math.PI, duree: 600
    });

    // La puce apparaît à sa place et retombe : il faut la glisser dans un port USB
    cancelAnimationFrame(raf);
    etat = 'puce';
    rot = 0; phi = 0; omega = 0;
    walker.style.transformOrigin = '';
    lancerPuce(cx, cy, true);
    await wait(900);
    if (s !== session) return;
    puceSession = s;
    puceEl.style.pointerEvents = '';
    afficherUSB(true);
  }

  // ===== Atterrissage : elle s'écrase comme une crêpe, se plaint, puis repart =====`);

// ---------- Enregistrement (avec une copie de sécurité) ----------
fs.copyFileSync(fichier, fichier + '.bak3');
if (crlf) txt = txt.replace(/\n/g, '\r\n');
fs.writeFileSync(fichier, txt, 'utf8');
console.log('Terminé ! Les modifications sont appliquées dans ' + fichier);
console.log('Une copie de la version précédente est dans ' + fichier + '.bak3');
