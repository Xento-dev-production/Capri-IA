// Capri : un tout petit peu plus de caractères dans la pluie de code
// Utilisation : mets ce fichier dans le même dossier que index.html,
// puis tape dans le terminal de VS Code :  node appliquer-un-peu-plus.js

const fs = require('fs');
const path = require('path');

const FICHIER = path.join(__dirname, 'index.html');
const SAUVEGARDE = path.join(__dirname, 'index.avant-un-peu-plus.html');
const NOUVELLE_PAUSE = 30; // avant : 40 (plus petit = plus de caractères)

if (!fs.existsSync(FICHIER)) {
  console.log("ERREUR : je ne trouve pas index.html à côté de ce fichier.");
  console.log("Vérifie que appliquer-un-peu-plus.js est bien dans le même dossier que index.html.");
  process.exit(1);
}

const original = fs.readFileSync(FICHIER, 'utf8');

if (!original.includes('TRAINEE_NOMBRE_MIN')) {
  console.log("Je ne trouve pas la version « plus fournie » de la pluie de code. Rien n'a été modifié.");
  console.log("Lance d'abord :  node appliquer-plus.js   puis relance celui-ci.");
  process.exit(1);
}

const pauseRx = /const TRAINEE_PAUSE = (\d+);/;
const m = original.match(pauseRx);
if (!m) {
  console.log("ERREUR : je ne trouve pas TRAINEE_PAUSE dans ton index.html. Rien n'a été modifié.");
  process.exit(1);
}
if (+m[1] <= NOUVELLE_PAUSE) {
  console.log("Déjà appliqué : TRAINEE_PAUSE vaut déjà " + m[1] + ". Rien à faire.");
  console.log("(Pour en avoir encore plus, baisse ce nombre à la main dans index.html.)");
  process.exit(0);
}

const html = original.replace(pauseRx, 'const TRAINEE_PAUSE = ' + NOUVELLE_PAUSE + ';');

fs.writeFileSync(SAUVEGARDE, original, 'utf8');
fs.writeFileSync(FICHIER, html, 'utf8');

console.log("C'est fait : TRAINEE_PAUSE passe de " + m[1] + " à " + NOUVELLE_PAUSE + " (environ un tiers de caractères en plus).");
console.log("Ton ancien fichier est gardé dans index.avant-un-peu-plus.html (au cas où).");
console.log("Ferme Capri (Ctrl + Alt + Q) et relance-la.");
