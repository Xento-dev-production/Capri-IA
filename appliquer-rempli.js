// Capri : pluie de code bien remplie
// Utilisation : mets ce fichier dans le même dossier que index.html,
// puis tape dans le terminal de VS Code :  node appliquer-rempli.js

const fs = require('fs');
const path = require('path');

const FICHIER = path.join(__dirname, 'index.html');
const SAUVEGARDE = path.join(__dirname, 'index.avant-rempli.html');

// Les nouvelles valeurs
const PAUSE = 30;        // temps entre deux apparitions (ms)
const NOMBRE_MIN = 4;    // caractères créés à chaque apparition (avant : 2)
const NOMBRE_MAX = 6;    // (avant : 3)
const DUREE = 750;       // temps avant de disparaître (ms) (avant : 650)
const ETALEMENT_X = 42;  // zone autour de son corps : plus large (avant : 28)
const ETALEMENT_Y = 52;  // (avant : 36)

if (!fs.existsSync(FICHIER)) {
  console.log("ERREUR : je ne trouve pas index.html à côté de ce fichier.");
  console.log("Vérifie que appliquer-rempli.js est bien dans le même dossier que index.html.");
  process.exit(1);
}

const original = fs.readFileSync(FICHIER, 'utf8');

if (!original.includes('TRAINEE_NOMBRE_MIN')) {
  console.log("Je ne trouve pas la version « plus fournie » de la pluie de code. Rien n'a été modifié.");
  console.log("Lance d'abord :  node appliquer-plus.js   puis relance celui-ci.");
  process.exit(1);
}

const remplacements = [
  [/const TRAINEE_PAUSE = \d+;/, 'const TRAINEE_PAUSE = ' + PAUSE + ';'],
  [/const TRAINEE_NOMBRE_MIN = \d+;/, 'const TRAINEE_NOMBRE_MIN = ' + NOMBRE_MIN + ';'],
  [/const TRAINEE_NOMBRE_MAX = \d+;/, 'const TRAINEE_NOMBRE_MAX = ' + NOMBRE_MAX + ';'],
  [/const TRAINEE_DUREE = \d+;/, 'const TRAINEE_DUREE = ' + DUREE + ';'],
  [/glyphe\(bx \+ alea\(-\d+, \d+\), by \+ alea\(-\d+, \d+\)\)/,
   'glyphe(bx + alea(-' + ETALEMENT_X + ', ' + ETALEMENT_X + '), by + alea(-' + ETALEMENT_Y + ', ' + ETALEMENT_Y + '))']
];

let html = original;
for (const [rx, nouveau] of remplacements) {
  if (!rx.test(html)) {
    console.log("ERREUR : je ne reconnais pas un des réglages de la pluie de code. Rien n'a été modifié.");
    console.log("Envoie-moi ton index.html actuel et je l'adapte.");
    process.exit(1);
  }
  html = html.replace(rx, () => nouveau);
}

// Avec beaucoup de caractères, une seule lueur par caractère (plus léger pour l'ordinateur)
html = html.replace(
  "text-shadow:0 0 5px ' + lueur + ',0 0 10px ' + lueur + ';'",
  "text-shadow:0 0 6px ' + lueur + ';'"
);

if (html === original) {
  console.log("Déjà appliqué : la pluie de code est déjà bien remplie. Rien à faire.");
  process.exit(0);
}

fs.writeFileSync(SAUVEGARDE, original, 'utf8');
fs.writeFileSync(FICHIER, html, 'utf8');

console.log("C'est fait : la pluie de code est bien remplie.");
console.log("Ton ancien fichier est gardé dans index.avant-rempli.html (au cas où).");
console.log("Ferme Capri (Ctrl + Alt + Q) et relance-la.");
