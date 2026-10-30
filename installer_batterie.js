// installer_batterie.js : branche capri_batterie.js dans index.html (une seule fois)
const fs = require('fs');
const path = require('path');

const dossier = __dirname;
const fichierHtml = path.join(dossier, 'index.html');
const ligneScript = '<script src="capri_batterie.js"></script>';

if (!fs.existsSync(path.join(dossier, 'capri_batterie.js'))) {
  console.log('ERREUR : capri_batterie.js est introuvable. Mets-le dans le même dossier que index.html.');
  process.exit(1);
}
if (!fs.existsSync(fichierHtml)) {
  console.log('ERREUR : index.html est introuvable. Lance cette commande depuis le dossier de Capri.');
  process.exit(1);
}

let html = fs.readFileSync(fichierHtml, 'utf8');
if (html.includes('capri_batterie.js')) {
  console.log('Déjà installé : rien à faire. Relance simplement Capri.');
  process.exit(0);
}

fs.writeFileSync(path.join(dossier, 'index.html.sauvegarde-batterie'), html); // copie de sécurité
const i = html.lastIndexOf('</body>');
if (i === -1) {
  console.log('ERREUR : balise </body> introuvable dans index.html.');
  process.exit(1);
}
html = html.slice(0, i) + ligneScript + '\n' + html.slice(i);
fs.writeFileSync(fichierHtml, html);
console.log("OK : l'alerte batterie est branchée. Relance Capri (npm start).");
console.log('(Une copie de ton ancien fichier est dans index.html.sauvegarde-batterie)');
