// Capri : beaucoup plus de caractères dans la pluie de code
// Utilisation : mets ce fichier dans le même dossier que index.html,
// puis tape dans le terminal de VS Code :  node appliquer-plus.js

const fs = require('fs');
const path = require('path');

const FICHIER = path.join(__dirname, 'index.html');
const SAUVEGARDE = path.join(__dirname, 'index.avant-plus.html');
const MARQUEUR = 'TRAINEE_NOMBRE_MIN';

if (!fs.existsSync(FICHIER)) {
  console.log("ERREUR : je ne trouve pas index.html à côté de ce fichier.");
  console.log("Vérifie que appliquer-plus.js est bien dans le même dossier que index.html.");
  process.exit(1);
}

const original = fs.readFileSync(FICHIER, 'utf8');
let html = original;

if (html.includes(MARQUEUR)) {
  console.log("Déjà appliqué : la pluie de code est déjà plus fournie. Rien à faire.");
  console.log("(Pour en avoir encore plus, change TRAINEE_PAUSE, TRAINEE_NOMBRE_MIN et TRAINEE_NOMBRE_MAX dans index.html.)");
  process.exit(0);
}

if (!html.includes('Traînée pluie de code')) {
  console.log("Je ne trouve pas la pluie de code dans ton index.html. Rien n'a été modifié.");
  console.log("Lance d'abord :  node appliquer-couleurs.js   puis relance celui-ci.");
  process.exit(1);
}

// 1. Les réglages : apparitions plus rapprochées, et plusieurs caractères à chaque fois
const pauseRx = /const TRAINEE_PAUSE = \d+;[^\n]*\n/;
// 2. Le nombre de caractères créés à chaque apparition
const nombreRx = /const n = Math\.random\(\) < 0\.35 \? 2 : 1;\r?\n(\s*)for \(let i = 0; i < n; i\+\+\) glyphe\(bx \+ alea\(-18, 18\), by \+ alea\(-24, 24\)\);/;

if (!pauseRx.test(html) || !nombreRx.test(html)) {
  console.log("ERREUR : je ne reconnais pas la pluie de code dans ton index.html. Rien n'a été modifié.");
  console.log("Envoie-moi ton index.html actuel et je l'adapte.");
  process.exit(1);
}

html = html.replace(pauseRx, () =>
  "const TRAINEE_PAUSE = 40;       // temps entre deux apparitions (ms) : plus petit = plus de caractères\n" +
  "  const TRAINEE_NOMBRE_MIN = 2;   // nombre minimal de caractères à chaque apparition\n" +
  "  const TRAINEE_NOMBRE_MAX = 3;   // nombre maximal de caractères à chaque apparition\n"
);

html = html.replace(nombreRx, (m, indent) =>
  "const n = TRAINEE_NOMBRE_MIN + Math.floor(Math.random() * (TRAINEE_NOMBRE_MAX - TRAINEE_NOMBRE_MIN + 1));\n" +
  indent + "for (let i = 0; i < n; i++) glyphe(bx + alea(-28, 28), by + alea(-36, 36)); // zone un peu plus large : ça se répartit mieux"
);

fs.writeFileSync(SAUVEGARDE, original, 'utf8');
fs.writeFileSync(FICHIER, html, 'utf8');

console.log("C'est fait : la pluie de code est beaucoup plus fournie.");
console.log("Ton ancien fichier est gardé dans index.avant-plus.html (au cas où).");
console.log("Ferme Capri (Ctrl + Alt + Q) et relance-la.");
