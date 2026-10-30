// Installe le comportement DORMIR : ajoute une ligne dans index.html (avec une sauvegarde).
// Utilisation : node installer_dodo.js
const fs = require('fs');
const path = require('path');

const dossier = __dirname;
const fichier = path.join(dossier, 'index.html');
const tag = '<script src="capri_dodo.js"></script>';

for (const f of ['capri_dodo.js', 'capri_dort.png', 'capri_sursaut.png', 'index.html']) {
  if (!fs.existsSync(path.join(dossier, f))) {
    console.log('Il manque le fichier : ' + f + ' (il doit être dans le même dossier que index.html)');
    process.exit(1);
  }
}

let html = fs.readFileSync(fichier, 'utf8');
if (html.includes(tag)) {
  console.log('Déjà installé, rien à faire.');
  process.exit(0);
}

fs.writeFileSync(fichier + '.sauvegarde_avant_dodo', html);

const dernier = '<script src="capri_batterie.js"></script>';
if (html.includes(dernier)) html = html.replace(dernier, dernier + '\n' + tag);
else if (html.includes('</body>')) html = html.replace('</body>', tag + '\n</body>');
else html += '\n' + tag + '\n';

fs.writeFileSync(fichier, html);
console.log('Installé ! Relance Capri. (Sauvegarde : index.html.sauvegarde_avant_dodo)');
