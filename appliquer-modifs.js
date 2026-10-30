// Applique les modifications de Capri (pendule 360°, traînée d'éclairs, atterrissage en crêpe)
// sur ton fichier HTML.
// Utilisation : node appliquer-modifs.js nom-de-ton-fichier.html
const fs = require('fs');

const fichier = process.argv[2];
if (!fichier || !fs.existsSync(fichier)) {
  console.log('Utilisation : node appliquer-modifs.js nom-de-ton-fichier.html');
  process.exit(1);
}

let txt = fs.readFileSync(fichier, 'utf8');
const crlf = txt.includes('\r\n');
txt = txt.replace(/\r\n/g, '\n');

if (txt.includes('function atterrir')) {
  console.log('Les modifications sont déjà appliquées dans ce fichier.');
  process.exit(0);
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

// ---------- 1. Variables ----------
remplacer('occupee',
  "const occupee = () => etat === 'attrapee' || etat === 'chute';",
`let vxChute = 0;           // vitesse vers la droite ou la gauche gardée quand on la lâche
  let vsY = 0, accX = 0, accY = 0, curYAvant = 0;  // vitesse et accélération de la souris
  let histCorps = [];        // positions récentes de son corps (pour la traînée d'éclairs)
  let prochaineTrainee = 0;
  const occupee = () => etat === 'attrapee' || etat === 'chute' || etat === 'ecrasee';`);

// ---------- 2. Hauteur de la bulle quand elle est écrasée ----------
remplacer('positionnerBulle',
  "const bw = bulle.offsetWidth, bh = bulle.offsetHeight;\n    const w = sprite.offsetWidth, h = sprite.offsetHeight;",
  "const bw = bulle.offsetWidth, bh = bulle.offsetHeight;\n    const w = sprite.offsetWidth, h = sprite.offsetHeight * (etat === 'ecrasee' ? 0.12 : 1);");

// ---------- 3. Réglages ----------
remplacerPlage('reglages',
  "const GRAVITE = 1800;",
  "const GRAVITE_CHUTE = 2600;",
`const GRAVITE = 1800;           // plus grand = elle revient plus vite à la verticale
  const TRAINEE = 1.0;            // plus grand = elle part plus fort quand tu bouges vite
  const AMORTI = 0.7;             // plus petit = elle se balance plus longtemps
  const OMEGA_MAX = 28;           // vitesse de rotation maximale (radians par seconde, 28 = environ 4 tours par seconde)
  const ACC_MAX = 16000;          // limite de l'accélération de la souris prise en compte
  const GRAVITE_CHUTE = 2600;     // vitesse de sa chute quand tu la lâches

  // Écrasement au sol
  const CREPE = 'scale(1.55, 0.1)';  // sa forme de crêpe (le 2e chiffre = l'épaisseur)
  const DUREE_CREPE = 1800;       // temps où la phrase reste affichée une fois écrite (ms) : écrasée en tout environ 3,5 s
  const PHRASES_AIE = [
    "Aïe ! Ça fait mal, choom !",
    "Ouille... mes implants !",
    "Tchoum... c'est pas nova, ça.",
    "J'ai failli flatline, gonk !",
    "Mes chromes ont pris cher...",
    "Aïe, ça pique, choom !",
    "Même un solo aurait eu mal !",
    "Mon cyberware est en vrac..."
  ];

  // Traînée d'éclairs
  const TRAINEE_PAUSE = 45;       // temps entre deux éclairs (ms) : plus petit = plus d'éclairs
  const TRAINEE_LONGUEUR = 170;   // longueur de la traînée (ms de trajet derrière elle)
  const TRAINEE_VITESSE = 250;    // vitesse minimale (pixels par seconde) pour laisser une traînée
  const TRAINEE_COULEURS = [
    { couleur: '#00ffa3', halo: '#00ffa3', coeur: '#eafff6' },  // vert
    { couleur: '#ff2e63', halo: '#ff2e63', coeur: '#ffe6ec' },  // rouge
    { couleur: '#000000', halo: '#00ffa3', coeur: '#000000' },  // noir, lueur verte
    { couleur: '#000000', halo: '#ff2e63', coeur: '#000000' }   // noir, lueur rouge
  ];`);

// ---------- 4. Cœur des éclairs (blanc par défaut) ----------
remplacer('coeur des eclairs',
  "trace(s, '#fff', e * 0.8, 1);",
  "trace(s, o.coeur || '#fff', e * 0.8, 1);");

// ---------- 5. Nouvelles fonctions : traînée + atterrissage ----------
remplacer('lancement de la balade',
  "// ===== Lancement de la balade =====",
`// ===== Traînée d'éclairs derrière Capri quand on la tient =====
  function emettreTrainee(now, bx, by) {
    histCorps.push({ x: bx, y: by, t: now });
    while (histCorps.length > 1 && now - histCorps[0].t > TRAINEE_LONGUEUR) histCorps.shift();
    if (now < prochaineTrainee || histCorps.length < 2) return;
    const a = histCorps[0];
    const duree = (now - a.t) / 1000;
    if (Math.hypot(bx - a.x, by - a.y) / duree < TRAINEE_VITESSE) return;
    prochaineTrainee = now + TRAINEE_PAUSE;
    const c = TRAINEE_COULEURS[Math.floor(Math.random() * TRAINEE_COULEURS.length)];
    eclair(a.x + alea(-6, 6), a.y + alea(-6, 6), bx + alea(-6, 6), by + alea(-6, 6), {
      couleur: c.couleur, halo: c.halo, coeur: c.coeur,
      epaisseur: alea(1.8, 3), duree: alea(260, 380), descente: 40,
      rugosite: 0.55, pas: 4, branches: 0, echelleBr: 0
    });
  }

  // ===== Atterrissage : elle s'écrase comme une crêpe, se plaint, puis repart =====
  async function atterrir(s) {
    etat = 'ecrasee';
    ay = 0; rot = 0; phi = 0; omega = 0;
    walker.style.transformOrigin = '';
    ax = borner(ax, 0, Math.max(0, window.innerWidth - sprite.offsetWidth));
    impact(ax + sprite.offsetWidth / 2, window.innerHeight - 2);

    // Écrasement
    const a = sprite.animate([
      { transform: 'scale(1, 1)' },
      { transform: 'scale(1.9, 0.05)', offset: 0.5 },
      { transform: CREPE }
    ], { duration: 240, easing: 'ease-out', fill: 'forwards' });
    await a.finished.catch(() => {});
    if (s !== session) return;
    sprite.style.transform = CREPE;
    a.cancel();

    // Elle se plaint
    const fini = await direPhrase(PHRASES_AIE, DUREE_CREPE, 600);
    if (!fini || s !== session) return;

    // Éclairs, puis elle reprend forme et repart marcher
    frappes();
    await wait(200);
    if (s !== session) return;
    adir = Math.random() < 0.5 ? -1 : 1;
    setPose(MARCHE);
    await wait(20);
    if (s !== session) return;
    ax = borner(ax, 0, Math.max(0, window.innerWidth - sprite.offsetWidth));
    await reforme(340);
    if (s !== session) return;
    etat = 'marche';
    const t = performance.now();
    finEtat = t + alea(4000, 9000);
    prochaineEscapade = t + alea(ESCAPADE_MIN, ESCAPADE_MAX);
    prochaineBulle = t + alea(BULLE_MIN, BULLE_MAX);
  }

  // ===== Lancement de la balade =====`);

// ---------- 6. Pendule, chute, attraper, lâcher ----------
remplacerPlage('pendule',
  "// Elle pend au curseur par les mains et se balance comme un pendule",
  "etat = 'chute';\n  }",
`// Elle pend au curseur par les mains : vrai pendule, tours complets possibles
      const dt = Math.min(0.033, Math.max(0.001, (now - derniereFrame) / 1000));
      derniereFrame = now;
      const h = HAUTEUR_ATTRAPEE * ECHELLE, wA = h * RATIO_ATTRAPEE;
      // Vitesse et accélération du curseur (lissées)
      const nvx = vs + (((curX - curXAvant) / dt) - vs) * 0.35;
      const nvy = vsY + (((curY - curYAvant) / dt) - vsY) * 0.35;
      accX += (borner((nvx - vs) / dt, -ACC_MAX, ACC_MAX) - accX) * 0.5;
      accY += (borner((nvy - vsY) / dt, -ACC_MAX, ACC_MAX) - accY) * 0.5;
      vs = nvx; vsY = nvy;
      curXAvant = curX; curYAvant = curY;
      const L = h * 0.55;
      const pas = 6, d = dt / pas;
      for (let i = 0; i < pas; i++) {
        const alpha = -((GRAVITE + accY) / L) * Math.sin(phi)
                      - ((TRAINEE * accX) / L) * Math.cos(phi)
                      - AMORTI * omega;
        omega = borner(omega + alpha * d, -OMEGA_MAX, OMEGA_MAX);
        phi += omega * d;
      }
      // Garde l'angle entre -180 et +180 degrés (elle peut faire des tours complets)
      phi = ((phi + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
      rot = -phi * 180 / Math.PI;
      ax = curX - PIVOT_X * wA;
      ay = window.innerHeight - curY - h + PIVOT_Y * h;
      // Traînée d'éclairs derrière son corps
      emettreTrainee(now, curX + Math.sin(phi) * h * 0.5, curY + Math.cos(phi) * h * 0.5);
      // De temps en temps, elle dit une phrase
      if (!bulleActive && now > prochaineBulleAtt) {
        direPhrase(PHRASES_ATTRAPEE, 2200, 700);
        prochaineBulleAtt = now + alea(BULLE_ATT_MIN, BULLE_ATT_MAX);
      }
    } else if (etat === 'chute') {
      // Lâchée : elle garde son élan, tombe au sol et s'écrase
      const dt = Math.min(0.033, Math.max(0.001, (now - derniereFrame) / 1000));
      derniereFrame = now;
      vChute += GRAVITE_CHUTE * dt;
      ay -= vChute * dt;
      ax = borner(ax + vxChute * dt, 0, Math.max(0, window.innerWidth - sprite.offsetWidth));
      vxChute *= Math.pow(0.15, dt);
      phi *= Math.pow(0.001, dt);
      rot = -phi * 180 / Math.PI;
      if (ay <= 0) atterrir(s);
    }

    // La bulle reste au-dessus de Capri tant qu'elle parle, et disparaît dès qu'elle fait autre chose
    if (bulleActive && etat !== 'parle' && etat !== 'attrapee' && etat !== 'ecrasee') cacherBulle();
    else if (bulleActive) positionnerBulle();

    const flip = pose === MARCHE ? adir * SENS_MARCHE : 1;
    majTransform(flip);
    raf = requestAnimationFrame(boucle);
  }

  // Le reste de l'écran reste cliquable : seule Capri capte la souris
  document.addEventListener('dragstart', (e) => e.preventDefault()); // aucun glisser-déposer d'image
  walker.addEventListener('mouseenter', () => { survolCapri = true; majClic(); });
  walker.addEventListener('mouseleave', () => { survolCapri = false; majClic(); });

  // ===== Attraper Capri : on reste appuyé sur elle, elle s'accroche au curseur =====
  function attraperCapri() {
    if (!enAnim) return;
    session++;                        // annule ce qu'elle était en train de faire
    cancelAnimationFrame(raf);
    sprite.getAnimations().forEach((a) => a.cancel());
    walker.getAnimations().forEach((a) => a.cancel());
    sprite.style.transform = '';
    walker.style.opacity = 1;
    cacherBulle();
    ligne = null; ipcRenderer.send('ligne-finie');
    fenetre = null; fermeeEnAttente = false; lignePerdue = false;

    tenue = true;
    majClic();
    pose = 'attrapee';
    sprite.src = IMAGE_ATTRAPEE;
    sprite.style.height = HAUTEUR_ATTRAPEE * ECHELLE + 'px';
    sprite.style.width = 'auto';
    walker.style.transformOrigin = (PIVOT_X * 100) + '% ' + (PIVOT_Y * 100) + '%';

    phi = 0; omega = 0; vs = 0; vsY = 0; accX = 0; accY = 0;
    curXAvant = curX; curYAvant = curY;
    histCorps = [];
    derniereFrame = performance.now();
    prochaineBulleAtt = derniereFrame + alea(1500, 3000);
    etat = 'attrapee';
    raf = requestAnimationFrame(boucle);
  }

  // On relâche : elle tombe en gardant la vitesse de ta souris
  function lacherCapri() {
    if (etat !== 'attrapee') return;
    tenue = false;
    survolCapri = false;
    majClic();
    cacherBulle();
    vChute = borner(vsY, -2000, 2000);
    vxChute = borner(vs, -1800, 1800);
    derniereFrame = performance.now();
    etat = 'chute';
  }`);

// ---------- Enregistrement (avec une copie de sécurité) ----------
fs.copyFileSync(fichier, fichier + '.bak');
if (crlf) txt = txt.replace(/\n/g, '\r\n');
fs.writeFileSync(fichier, txt, 'utf8');
console.log('Terminé ! Les 6 modifications sont appliquées dans ' + fichier);
console.log('Une copie de l\'ancienne version est dans ' + fichier + '.bak');
