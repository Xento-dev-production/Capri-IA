// installer_jauges_anim.js : branche capri_jauges_anim.js dans index.html (une seule fois)
const fs = require('fs');
const path = require('path');

const dossier = __dirname;
const fichierHtml = path.join(dossier, 'index.html');
const fichierJauges = path.join(dossier, 'capri_jauges_anim.js');
const ligneScript = '<script src="capri_jauges_anim.js"></script>';

if (!fs.existsSync(fichierJauges)) {
  console.log('ERREUR : capri_jauges_anim.js est introuvable. Mets-le dans le même dossier que index.html.');
  process.exit(1);
}
if (!fs.existsSync(fichierHtml)) {
  console.log('ERREUR : index.html est introuvable. Lance cette commande depuis le dossier de Capri.');
  process.exit(1);
}

let html = fs.readFileSync(fichierHtml, 'utf8');
if (html.includes('capri_jauges_anim.js')) {
  console.log("Déjà installé : rien à faire. Relance simplement Capri.");
  process.exit(0);
}

fs.writeFileSync(path.join(dossier, 'index.html.sauvegarde'), html); // copie de sécurité
const i = html.lastIndexOf('</body>');
if (i === -1) {
  console.log('ERREUR : balise </body> introuvable dans index.html.');
  process.exit(1);
}
html = html.slice(0, i) + ligneScript + '\n' + html.slice(i);
fs.writeFileSync(fichierHtml, html);
console.log('OK : les jauges d\'humeur sont branchées sur le mode balade. Relance Capri (npm start).');
console.log('(Une copie de ton ancien fichier est dans index.html.sauvegarde)');
