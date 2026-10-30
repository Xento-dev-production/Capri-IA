// Deuxième série de modifications de Capri :
//  - balancement limité (plus de tours complets), un tout petit peu plus poussé qu'avant
//  - nouvelle traînée : fantômes "glitch" vert et rouge
//  - crêpe moins écrasée
//  - à l'impact : éclairs et fichiers qui giclent partout
// Utilisation : node appliquer-modifs-2.js nom-de-ton-fichier.html
const fs = require('fs');

const fichier = process.argv[2];
if (!fichier || !fs.existsSync(fichier)) {
  console.log('Utilisation : node appliquer-modifs-2.js nom-de-ton-fichier.html');
  process.exit(1);
}

let txt = fs.readFileSync(fichier, 'utf8');
const crlf = txt.includes('\r\n');
txt = txt.replace(/\r\n/g, '\n');

if (txt.includes('function explosionImpact')) {
  console.log('Ces modifications sont déjà appliquées dans ce fichier.');
  process.exit(0);
}
if (!txt.includes('function atterrir')) {
  console.log('Le premier script (appliquer-modifs.js) n\'a pas encore été appliqué sur ce fichier.');
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

// ---------- 1. Balancement : comme avant (angle limité), un tout petit peu plus poussé ----------
remplacerPlage('pendule',
  "// Elle pend au curseur par les mains : vrai pendule, tours complets possibles",
  "emettreTrainee(now, curX + Math.sin(phi) * h * 0.5, curY + Math.cos(phi) * h * 0.5);",
`// Elle pend au curseur par les mains et se balance comme un pendule
      const dt = Math.min(0.033, Math.max(0.001, (now - derniereFrame) / 1000));
      derniereFrame = now;
      const h = HAUTEUR_ATTRAPEE * ECHELLE, wA = h * RATIO_ATTRAPEE;
      vs += (((curX - curXAvant) / dt) - vs) * 0.3;    // vitesse de la souris, lissée
      vsY += (((curY - curYAvant) / dt) - vsY) * 0.3;
      curXAvant = curX; curYAvant = curY;
      const L = h * 0.55;
      const pas = 4, d = dt / pas;
      for (let i = 0; i < pas; i++) {
        const alpha = -(GRAVITE / L) * Math.sin(phi) - (TRAINEE * vs) / L - AMORTI * omega;
        omega += alpha * d;
        phi += omega * d;
        if (phi > ANGLE_MAX) { phi = ANGLE_MAX; omega *= -0.3; }
        if (phi < -ANGLE_MAX) { phi = -ANGLE_MAX; omega *= -0.3; }
      }
      rot = -phi * 180 / Math.PI;
      ax = curX - PIVOT_X * wA;
      ay = window.innerHeight - curY - h + PIVOT_Y * h;
      // Traînée de fantômes glitch derrière son corps
      emettreTrainee(now, curX + Math.sin(phi) * h * 0.5, curY + Math.cos(phi) * h * 0.5);`);

// ---------- 2. Réglages ----------
remplacerPlage('reglages pendule',
  "const TRAINEE = 1.0;",
  "const ACC_MAX = 16000;",
`const TRAINEE = 1.15;           // plus grand = elle se penche plus quand tu bouges vite
  const AMORTI = 1.7;             // plus petit = elle se balance plus longtemps
  const ANGLE_MAX = 1.5;          // inclinaison maximale (radians, environ 86 degrés)

  // Gerbe à l'impact (quand elle touche le sol)
  const NB_ECLAIRS_IMPACT = 12;   // éclairs qui partent dans tous les sens
  const NB_FICHIERS = 22;         // fichiers qui giclent partout
  const COULEURS_FICHIERS = ['#00ffa3', '#ff2e63', '#27e6ff', '#e8fff6', '#ffe600'];`);

// ---------- 3. Crêpe moins écrasée ----------
remplacer('crepe',
  "const CREPE = 'scale(1.55, 0.1)';",
  "const CREPE = 'scale(1.3, 0.35)';");
remplacer('hauteur de bulle',
  "(etat === 'ecrasee' ? 0.12 : 1)",
  "(etat === 'ecrasee' ? 0.35 : 1)");
remplacer('ecrasement a l\'impact',
  "{ transform: 'scale(1.9, 0.05)', offset: 0.5 },",
  "{ transform: 'scale(1.5, 0.2)', offset: 0.5 },");
remplacer('retour a la forme',
  "await reforme(340);\n    if (s !== session) return;\n    etat = 'marche';\n    const t = performance.now();",
`await sprite.animate([
      { transform: CREPE },
      { transform: 'scale(1.1, 0.7)', offset: 0.35 },
      { transform: 'scale(0.94, 1.08)', offset: 0.7 },
      { transform: 'scale(1, 1)' }
    ], { duration: 340, easing: 'ease-out' }).finished.catch(() => {});
    sprite.style.transform = '';
    if (s !== session) return;
    etat = 'marche';
    const t = performance.now();`);

// ---------- 4. Impact : plus de blocs gris, mais des éclairs et des fichiers ----------
remplacer('impact (signature)',
  "function impact(x, bas) {",
  "function impact(x, bas, sansBlocs) {");
remplacer('impact (blocs)',
  "particules(x, bas - 2, {",
  "if (!sansBlocs) particules(x, bas - 2, {");
remplacer('appel de impact',
  "impact(ax + sprite.offsetWidth / 2, window.innerHeight - 2);",
`const xi = ax + sprite.offsetWidth / 2, yi = window.innerHeight - 2;
    impact(xi, yi, true);
    explosionImpact(xi, yi);`);

// ---------- 5. Nouvelle traînée + gerbe d'éclairs et de fichiers ----------
remplacer('titre de la trainee',
  "// ===== Traînée d'éclairs derrière Capri quand on la tient =====",
  "// ===== Traînée de fantômes glitch derrière Capri quand on la tient =====");

remplacerPlage('trainee',
  "function emettreTrainee(now, bx, by) {",
  "rugosite: 0.55, pas: 4, branches: 0, echelleBr: 0\n    });\n  }",
`// Un fantôme : copie sombre de Capri avec une lueur de couleur, qui s'efface derrière elle
  function fantome(couleur, decalage) {
    const g = document.createElement('img');
    g.src = sprite.src;
    g.style.cssText = 'position:absolute;left:0;bottom:0;pointer-events:none;display:block;' +
      'height:' + sprite.style.height + ';width:auto;' +
      'transform-origin:' + walker.style.transformOrigin + ';' +
      'transform:translate(' + decalage + 'px,0px) ' + walker.style.transform + ';' +
      'filter:brightness(0) drop-shadow(0 0 3px ' + couleur + ') drop-shadow(0 0 9px ' + couleur + ');';
    anim.insertBefore(g, walker);
    g.animate([{ opacity: 0.75 }, { opacity: 0 }], { duration: 360, easing: 'ease-out' }).onfinish = () => g.remove();
  }

  function emettreTrainee(now, bx, by) {
    histCorps.push({ x: bx, y: by, t: now });
    while (histCorps.length > 1 && now - histCorps[0].t > 120) histCorps.shift();
    if (now < prochaineTrainee || histCorps.length < 2) return;
    const a = histCorps[0];
    const duree = (now - a.t) / 1000;
    if (Math.hypot(bx - a.x, by - a.y) / duree < TRAINEE_VITESSE) return;
    prochaineTrainee = now + TRAINEE_PAUSE;
    // Un fantôme vert, puis un rouge, décalés pour l'effet glitch
    const vert = Math.floor(now / TRAINEE_PAUSE) % 2 === 0;
    fantome(vert ? '#00ffa3' : '#ff2e63', vert ? -5 : 5);
    // Quelques petits carrés qui s'échappent
    particules(bx + alea(-14, 14), by + alea(-14, 14), {
      couleurs: ['#00ffa3', '#ff2e63', '#ffffff'], n: 2, vmin: 40, vmax: 180,
      tailleMin: 2, tailleMax: 4, angleMin: -Math.PI, angleMax: Math.PI, duree: 380
    });
  }

  // Des petits fichiers qui giclent d'un point (avec gravité)
  function fichiers(x, y, n) {
    const G = 1600;
    for (let i = 0; i < n; i++) {
      const a = alea(-Math.PI * 0.97, -Math.PI * 0.03), v = alea(320, 950);
      const vx = Math.cos(a) * v, vy = Math.sin(a) * v;
      const w = alea(16, 30), h = w * 1.3;
      const col = COULEURS_FICHIERS[Math.floor(Math.random() * COULEURS_FICHIERS.length)];
      const el = document.createElement('div');
      el.style.cssText = 'position:fixed;pointer-events:none;z-index:97;will-change:transform,opacity;' +
        'left:' + (x - w / 2) + 'px;top:' + (y - h / 2) + 'px;width:' + w + 'px;height:' + h + 'px;' +
        'background-color:' + col + ';' +
        'background-image:repeating-linear-gradient(0deg, rgba(0,0,0,0.45) 0 2px, transparent 2px 5px);' +
        'background-size:100% 60%;background-repeat:no-repeat;background-position:0 100%;' +
        'clip-path:polygon(0 0, 68% 0, 100% 26%, 100% 100%, 0 100%)';
      document.body.appendChild(el);
      const D = Math.min(1.4, Math.max(0.4, 2 * Math.abs(vy) / G));
      const rot = alea(-540, 540);
      const N = 16, kf = [];
      for (let k = 0; k <= N; k++) {
        const s = (k / N) * D;
        kf.push({
          transform: 'translate(' + (vx * s).toFixed(1) + 'px,' + (vy * s + 0.5 * G * s * s).toFixed(1) + 'px) rotate(' + (rot * s).toFixed(0) + 'deg)',
          opacity: k > N - 3 ? (N - k) / 3 : 1
        });
      }
      el.animate(kf, { duration: D * 1000, easing: 'linear' }).onfinish = () => el.remove();
    }
  }

  // Gerbe à l'impact : des éclairs qui partent dans tous les sens, et des fichiers qui giclent
  function explosionImpact(x, y) {
    for (let i = 0; i < NB_ECLAIRS_IMPACT; i++) {
      setTimeout(() => {
        const c = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        const ang = -Math.PI * alea(0.03, 0.97);   // vers le haut, à gauche et à droite
        const len = alea(90, 260);
        eclair(x, y - 2, x + Math.cos(ang) * len, y - 2 + Math.sin(ang) * len, {
          couleur: c, halo: c, epaisseur: alea(1.8, 3),
          duree: alea(320, 480), descente: 55,
          rugosite: 0.5, pas: 5, branches: 0, echelleBr: 0
        });
      }, i * 18);
    }
    fichiers(x, y - 4, NB_FICHIERS);
  }`);

// ---------- Enregistrement (avec une copie de sécurité) ----------
fs.copyFileSync(fichier, fichier + '.bak2');
if (crlf) txt = txt.replace(/\n/g, '\r\n');
fs.writeFileSync(fichier, txt, 'utf8');
console.log('Terminé ! Les modifications sont appliquées dans ' + fichier);
console.log('Une copie de la version précédente est dans ' + fichier + '.bak2');
