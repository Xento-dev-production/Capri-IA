// Capri : nouvelle traînée "pluie de code" (des 0, des 1 et des symboles qui s'échappent d'elle)
// Utilisation : mets ce fichier dans le même dossier que index.html,
// puis tape dans le terminal de VS Code :  node appliquer-code.js

const fs = require('fs');
const path = require('path');

const FICHIER = path.join(__dirname, 'index.html');
const SAUVEGARDE = path.join(__dirname, 'index.avant-code.html');
const MARQUEUR = 'Traînée pluie de code';

if (!fs.existsSync(FICHIER)) {
  console.log("ERREUR : je ne trouve pas index.html à côté de ce fichier.");
  console.log("Vérifie que appliquer-code.js est bien dans le même dossier que index.html.");
  process.exit(1);
}

const original = fs.readFileSync(FICHIER, 'utf8');
let html = original;

if (html.includes(MARQUEUR)) {
  console.log("Déjà appliqué : la pluie de code est déjà dans index.html. Rien à faire.");
  process.exit(0);
}

// ---------- Les réglages ----------
const REGLAGES = `// ${MARQUEUR} : des caractères de code qui s'échappent de Capri et retombent en s'effaçant
  const TRAINEE_PAUSE = 70;       // temps entre deux apparitions (ms) : plus grand = traînée plus discrète
  const TRAINEE_VITESSE = 300;    // vitesse minimale (pixels par seconde) pour laisser une traînée
  const TRAINEE_DUREE = 650;      // temps que met un caractère pour disparaître (ms)
  const TRAINEE_CARACTERES = '01010101ABCDEF<>/#$%';  // les caractères possibles : ajoute-en si tu veux
  const TRAINEE_COULEURS = ['#00ffa3', '#00ffa3', '#00ffa3', '#ff2e63'];  // surtout vert, parfois rouge
`;

// ---------- Les fonctions ----------
const FONCTIONS = `// ===== ${MARQUEUR} derrière Capri quand on la tient =====
  // Un caractère de code apparaît sur son corps, dérive sur le côté et retombe en s'effaçant
  function glyphe(x, y) {
    const couleur = TRAINEE_COULEURS[Math.floor(Math.random() * TRAINEE_COULEURS.length)];
    const el = document.createElement('div');
    el.textContent = TRAINEE_CARACTERES[Math.floor(Math.random() * TRAINEE_CARACTERES.length)];
    el.style.cssText = 'position:absolute;pointer-events:none;white-space:pre;' +
      'font-family:Consolas,"Courier New",monospace;font-weight:bold;' +
      'left:' + x + 'px;top:' + y + 'px;font-size:' + alea(10, 15).toFixed(0) + 'px;' +
      'color:' + couleur + ';text-shadow:0 0 6px ' + couleur + ';';
    anim.insertBefore(el, walker); // derrière Capri
    const dx = alea(-14, 14), chute = alea(30, 70);
    el.animate([
      { opacity: 0.95, transform: 'translate(0px,0px)' },
      { opacity: 0, transform: 'translate(' + dx.toFixed(1) + 'px,' + chute.toFixed(1) + 'px)' }
    ], { duration: TRAINEE_DUREE * alea(0.8, 1.2), easing: 'ease-in' }).onfinish = () => el.remove();
  }

  // Appelée à chaque image pendant qu'on tient Capri
  function emettreTrainee(now, bx, by) {
    histCorps.push({ x: bx, y: by, t: now });
    while (histCorps.length > 1 && now - histCorps[0].t > 120) histCorps.shift();
    if (now < prochaineTrainee || histCorps.length < 2) return;
    const a = histCorps[0];
    const duree = (now - a.t) / 1000;
    if (Math.hypot(bx - a.x, by - a.y) / duree < TRAINEE_VITESSE) return;
    prochaineTrainee = now + TRAINEE_PAUSE;
    const n = Math.random() < 0.35 ? 2 : 1;
    for (let i = 0; i < n; i++) glyphe(bx + alea(-18, 18), by + alea(-24, 24));
  }

  `;

// ---------- Recherche de l'ancienne traînée (n'importe laquelle des versions précédentes) ----------
const reglagesOrigine = /\/\/ Traînée d'éclairs[\s\S]*?const TRAINEE_COULEURS = \[[\s\S]*?\];\r?\n/;
const reglagesAutres = /\/\/ Traînée (?:glitch en tranches|sillage néon) :[^\n]*\n(?:[ \t]*const TRAINEE_[^\n]*\n)+/;
const fonctionsRx = /\/\/ ===== Traînée (?:de fantômes glitch|glitch en tranches|sillage néon)[\s\S]*?(?=\/\/ Des petits fichiers qui giclent)/;

const rx = reglagesOrigine.test(html) ? reglagesOrigine : (reglagesAutres.test(html) ? reglagesAutres : null);
if (!rx || !fonctionsRx.test(html)) {
  console.log("ERREUR : je ne reconnais pas l'ancienne traînée dans ton index.html. Rien n'a été modifié.");
  console.log("Envoie-moi ton index.html actuel et je l'adapte.");
  process.exit(1);
}

html = html.replace(rx, () => REGLAGES);
html = html.replace(fonctionsRx, () => FONCTIONS);

fs.writeFileSync(SAUVEGARDE, original, 'utf8');
fs.writeFileSync(FICHIER, html, 'utf8');

console.log("C'est fait : la pluie de code est dans index.html.");
console.log("Ton ancien fichier est gardé dans index.avant-code.html (au cas où).");
console.log("Ferme Capri (Ctrl + Alt + Q) et relance-la.");
