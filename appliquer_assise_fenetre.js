// Mise à jour Capri : quand tu tiens Capri et que tu l'amènes en haut d'une fenêtre,
// elle se met assise. Quand tu la lâches, elle tombe dessus et reste assise.
// Ce script modifie tout seul index.html et main.js (avec une copie de sauvegarde).

const fs = require('fs');
const path = require('path');

const dossier = process.cwd();
const fIndex = path.join(dossier, 'index.html');
const fMain = path.join(dossier, 'main.js');
const MARQUE = 'CAPRI-ASSISE-FENETRE';

function erreur(msg) {
  console.log('\n❌ ' + msg + '\n');
  process.exit(1);
}

if (!fs.existsSync(fIndex) || !fs.existsSync(fMain)) {
  erreur('Je ne trouve pas index.html et main.js dans ce dossier : ' + dossier +
    '\nOuvre bien le dossier de Capri dans VS Code, puis ouvre un NOUVEAU terminal.');
}

let index = fs.readFileSync(fIndex, 'utf8');
let main = fs.readFileSync(fMain, 'utf8');

if (index.includes(MARQUE) || main.includes(MARQUE)) {
  console.log('\n✅ Cette mise à jour est déjà installée. Rien à faire.\n');
  process.exit(0);
}

// Remplace un morceau de texte, mais seulement s'il existe exactement une fois
function remplacer(texte, ancien, nouveau, nom) {
  const n = texte.split(ancien).length - 1;
  if (n !== 1) {
    erreur('Je n\'ai pas trouvé le bon endroit (' + nom + ', trouvé ' + n + ' fois).' +
      '\nRien n\'a été modifié. Dis-le moi et je corrige.');
  }
  return texte.replace(ancien, () => nouveau);
}

// ===================== main.js =====================
const BLOC_MAIN = `
// ===== ${MARQUE} : la liste des fenêtres (de la plus devant à la plus derrière) =====
ipcMain.handle('fenetres-sol', () => {
  if (modeActuel !== 'anim' || !win || win.isDestroyed()) return [];
  const liste = [];
  for (const [h, f] of derniereScan) {
    if (f.iconic || ignoree(f)) continue;
    const r = rectPage(f);
    if (!r) continue;
    liste.push({ id: h, x: r.x, y: r.y, w: r.w, h: r.h });
  }
  return liste;
});

// Capri vient de se poser sur une fenêtre : main.js la suit (si elle bouge ou se ferme, Capri suit)
ipcMain.on('assise-sur', (event, h) => {
  if (modeActuel !== 'anim' || !win || win.isDestroyed()) return;
  const f = derniereScan.get(h);
  if (!f || f.iconic) return;
  suivi = h;
  suiviManque = 0;
  suiviLigne = null;
  dernierRect = [f.l, f.t, f.r, f.b].join(',');
  const r = rectPage(f);
  if (r) win.webContents.send('fenetre-bouge', r);
});
`;

main = remplacer(
  main,
  "ipcMain.on('ligne-finie', () => { suiviLigne = null; });",
  "ipcMain.on('ligne-finie', () => { suiviLigne = null; });\n" + BLOC_MAIN,
  'main.js : ligne-finie'
);

// ===================== index.html =====================
const BLOC_INDEX = `// ===== ${MARQUE} : poser Capri sur le haut d'une fenêtre =====
  // Tu tiens Capri et tu amènes ses pieds près du haut d'une fenêtre : un trait vert apparaît
  // et elle se met assise. Tu la lâches : elle tombe dessus et reste assise (elle suit la fenêtre).
  const DESCENTE_REPERAGE = 40;    // de combien (pixels) ses pieds peuvent passer SOUS le haut de la fenêtre
  const HAUTEUR_REPERAGE = 120;    // de combien (pixels) ses pieds peuvent être AU-DESSUS du haut de la fenêtre
  const imgAssiseTenue = new Image();
  imgAssiseTenue.src = IMAGE_ASSISE;
  let tenueH = HAUTEUR_ATTRAPEE, tenueW = HAUTEUR_ATTRAPEE * RATIO_ATTRAPEE;
  let tenuePX = PIVOT_X, tenuePY = PIVOT_Y;
  let assiseTenue = false;         // vrai quand elle est en position assise pendant qu'on la tient
  let cibleFenetre = null;         // la fenêtre repérée (ou null)
  let chuteCible = 0;              // hauteur où elle doit s'arrêter en tombant (0 = le sol)
  let chuteFenetre = null;         // la fenêtre sur laquelle elle va tomber
  let listeFen = [], interrogeFen = false, derniereInterFen = 0;
  let repereEl = null;

  // Demande régulièrement à main.js la liste des fenêtres ouvertes
  function rafraichirFenetres() {
    const now = performance.now();
    if (interrogeFen || now - derniereInterFen < 120) return;
    interrogeFen = true;
    derniereInterFen = now;
    ipcRenderer.invoke('fenetres-sol')
      .then((l) => { listeFen = l || []; })
      .catch(() => {})
      .then(() => { interrogeFen = false; });
  }

  // Cherche la fenêtre dont le haut est près de ses pieds
  function chercherFenetre(cx, piedY, hSit, actif) {
    for (const f of listeFen) {
      if (cx < f.x || cx > f.x + f.w) continue;
      const haut = Math.max(f.y, hSit + 8);
      const dessus = actif ? HAUTEUR_REPERAGE + 30 : HAUTEUR_REPERAGE;
      const dessous = actif ? DESCENTE_REPERAGE + 50 : DESCENTE_REPERAGE;
      if (piedY >= haut - dessus && piedY <= haut + dessous) {
        return { id: f.id, x: f.x, y: f.y, w: f.w, h: f.h, haut: haut };
      }
      // Ses pieds sont derrière cette fenêtre : on ne peut pas la poser sur une fenêtre cachée
      if (piedY > haut + dessous && piedY <= f.y + f.h) return null;
    }
    return null;
  }

  // Le trait vert au-dessus de la fenêtre repérée
  function montrerRepere(c) {
    if (!c) { if (repereEl) repereEl.style.display = 'none'; return; }
    if (!repereEl) {
      repereEl = document.createElement('div');
      repereEl.style.cssText = 'position:absolute;z-index:55;pointer-events:none;height:3px;background:#00ffa3;' +
        'box-shadow:0 0 10px #00ffa3,0 0 22px #00ffa3;';
      anim.appendChild(repereEl);
    }
    repereEl.style.display = 'block';
    repereEl.style.left = c.x + 'px';
    repereEl.style.top = (c.haut - 1) + 'px';
    repereEl.style.width = c.w + 'px';
  }
  // Si elle n'est plus tenue (lâchée, bug...), le trait disparaît
  setInterval(() => {
    if (etat !== 'attrapee' && repereEl && repereEl.style.display !== 'none') montrerRepere(null);
  }, 150);

  // Change l'image de Capri tenue : mains jointes (normal) ou assise (au-dessus d'une fenêtre)
  function poseTenue(assise) {
    assiseTenue = assise;
    if (assise) {
      tenueH = imgAssiseTenue.naturalHeight; tenueW = imgAssiseTenue.naturalWidth;
      tenuePX = 0.5; tenuePY = 0.04;
      sprite.src = IMAGE_ASSISE;
      pose = 'assise';
    } else {
      tenueH = HAUTEUR_ATTRAPEE; tenueW = HAUTEUR_ATTRAPEE * RATIO_ATTRAPEE;
      tenuePX = PIVOT_X; tenuePY = PIVOT_Y;
      sprite.src = IMAGE_ATTRAPEE;
      pose = 'attrapee';
    }
    sprite.style.height = tenueH * ECHELLE + 'px';
    sprite.style.width = 'auto';
    walker.style.transformOrigin = (tenuePX * 100) + '% ' + (tenuePY * 100) + '%';
  }

  // Appelée à chaque image tant qu'on tient Capri
  function majSurFenetre() {
    rafraichirFenetres();
    const ok = imgAssiseTenue.naturalHeight > 0;
    const w = sprite.offsetWidth;
    const hSit = imgAssiseTenue.naturalHeight * ECHELLE;
    const trouve = ok ? chercherFenetre(ax + w / 2, window.innerHeight - ay, hSit, assiseTenue) : null;
    if (trouve && !assiseTenue) {
      poseTenue(true);
      son('verrou');
      particules(ax + w / 2, window.innerHeight - ay, {
        couleurs: ['#00ffa3', '#27e6ff', '#ffffff'], n: 8, vmin: 60, vmax: 220,
        tailleMin: 2, tailleMax: 4, angleMin: -Math.PI, angleMax: Math.PI, duree: 350
      });
    } else if (!trouve && assiseTenue) {
      poseTenue(false);
    }
    cibleFenetre = trouve;
    montrerRepere(trouve);
  }

  // Elle tombe sur le haut de la fenêtre, fait un petit "boum" et reste assise
  async function atterrirFenetre(s) {
    const F = chuteFenetre;
    chuteFenetre = null;
    etat = 'ecrasee';
    rot = 0; phi = 0; omega = 0;
    walker.style.transformOrigin = '';
    assiseTenue = false;
    montrerRepere(null);
    const w = sprite.offsetWidth;
    const mini = Math.max(0, F.x);
    const maxi = Math.max(mini, Math.min(window.innerWidth - w, F.x + F.w - w));
    ax = borner(ax, mini, maxi);
    ay = chuteCible;
    fenetre = { x: F.x, y: F.y, w: F.w, h: F.h };
    decalageX = ax - F.x;
    cibleAx = ax; cibleAy = ay;
    fermeeEnAttente = false;
    majTransform(1);
    const xi = ax + w / 2, yi = window.innerHeight - ay;
    impact(xi, yi, true);
    particules(xi, yi - 2, {
      couleurs: ['#00ffa3', '#27e6ff', '#ffffff'], n: 10, vmin: 80, vmax: 260,
      tailleMin: 2, tailleMax: 4, angleMin: -Math.PI * 0.95, angleMax: -Math.PI * 0.05, duree: 380
    });
    await sprite.animate([
      { transform: 'scale(1.25, 0.72)' },
      { transform: 'scale(0.95, 1.07)', offset: 0.6 },
      { transform: 'scale(1, 1)' }
    ], { duration: 300, easing: 'ease-out' }).finished.catch(() => {});
    if (s !== session) return;
    sprite.style.transform = '';
    etat = 'assise';
    prochainSaut = performance.now() + alea(SAUT_MIN, SAUT_MAX);
    ipcRenderer.send('assise-sur', F.id);
  }

  // ===== Attraper Capri :`;

index = remplacer(index, '// ===== Attraper Capri :', BLOC_INDEX, 'index.html : bloc principal');

index = remplacer(
  index,
  'const h = HAUTEUR_ATTRAPEE * ECHELLE, wA = h * RATIO_ATTRAPEE;',
  'majSurFenetre();\n      const h = tenueH * ECHELLE, wA = tenueW * ECHELLE;',
  'index.html : taille tenue'
);
index = remplacer(
  index,
  'ax = curX - PIVOT_X * wA;',
  'ax = curX - tenuePX * wA;',
  'index.html : position x'
);
index = remplacer(
  index,
  'ay = window.innerHeight - curY - h + PIVOT_Y * h;',
  'ay = window.innerHeight - curY - h + tenuePY * h;',
  'index.html : position y'
);
index = remplacer(
  index,
  'if (ay <= 0) atterrir(s);',
  'if (ay <= chuteCible) { if (chuteFenetre) atterrirFenetre(s); else atterrir(s); }',
  'index.html : fin de chute'
);
index = remplacer(
  index,
  "walker.style.transformOrigin = (PIVOT_X * 100) + '% ' + (PIVOT_Y * 100) + '%';",
  "tenueH = HAUTEUR_ATTRAPEE; tenueW = HAUTEUR_ATTRAPEE * RATIO_ATTRAPEE; tenuePX = PIVOT_X; tenuePY = PIVOT_Y;\n" +
  "    assiseTenue = false; cibleFenetre = null; chuteCible = 0; chuteFenetre = null; montrerRepere(null);\n" +
  "    walker.style.transformOrigin = (PIVOT_X * 100) + '% ' + (PIVOT_Y * 100) + '%';",
  'index.html : début de prise'
);
index = remplacer(
  index,
  'vChute = borner(vsY, -2000, 2000);',
  "chuteCible = 0; chuteFenetre = null;\n" +
  "    if (cibleFenetre && assiseTenue) {\n" +
  "      chuteFenetre = cibleFenetre;\n" +
  "      chuteCible = Math.max(1, window.innerHeight - cibleFenetre.haut);\n" +
  "    }\n" +
  "    montrerRepere(null);\n" +
  "    vChute = borner(vsY, -2000, 2000);",
  'index.html : lâcher'
);

// ===================== On écrit (avec sauvegardes) =====================
fs.copyFileSync(fIndex, fIndex + '.avant-assise.bak');
fs.copyFileSync(fMain, fMain + '.avant-assise.bak');
fs.writeFileSync(fIndex, index, 'utf8');
fs.writeFileSync(fMain, main, 'utf8');

console.log('\n✅ Mise à jour installée !');
console.log('   Sauvegardes : index.html.avant-assise.bak et main.js.avant-assise.bak');
console.log('   Relance Capri comme d\'habitude pour essayer.\n');
