// ============================================================
//  INSTALLATEUR : trois jauges d'humeur pour Capri
//  (JOYEUSE, PAS CONTENTE, ENNUI) dans la fenêtre d'appel
//  Lance-le avec :  node installer_jauges.js
//  (depuis le dossier de Capri) -- il faut d'abord avoir installé la mémoire
// ============================================================
const fs = require('fs');
const path = require('path');

const dossier = __dirname;
const fichierHtml = path.join(dossier, 'index.html');
const fichierMemoire = path.join(dossier, 'capri_memoire_main.js');
const fichierJauges = path.join(dossier, 'capri_jauges.js');
const BALISE = '<script src="capri_jauges.js"></script>';

// Ce qui est envoyé à la page : les trois pourcentages calculés à partir de l'énergie, de l'ennui et de l'affection
const ANCIENNE_LIGNE = "ipcMain.handle('capri-humeur', () => m.humeur);";
const NOUVEAU_CODE = String.raw`ipcMain.handle('capri-humeur', () => {
    passerLeTemps();
    const h = m.humeur;
    return {
      joyeuse: borner(Math.round(h.affection * 0.5 + h.energie * 0.3 + (100 - h.ennui) * 0.2), 0, 100),
      pasContente: borner(Math.round((100 - h.affection) * 0.4 + h.ennui * 0.4 + (100 - h.energie) * 0.2), 0, 100),
      ennui: borner(Math.round(h.ennui), 0, 100)
    };
  });`;

const CODE_JAUGES = String.raw`// capri_jauges.js : trois jauges d'humeur dans la fenêtre d'appel
(function () {
  var ipc = require('electron').ipcRenderer;
  var call = document.getElementById('call');
  var chat = document.getElementById('chat');
  if (!call || !chat) return;

  // Les trois jauges : pour changer un nom ou une couleur, modifie simplement cette liste
  var JAUGES = [
    { cle: 'joyeuse', nom: 'JOYEUSE', couleur: '#00ffa3' },
    { cle: 'pasContente', nom: 'PAS CONTENTE', couleur: '#ff2e63' },
    { cle: 'ennui', nom: 'ENNUI', couleur: '#27e6ff' }
  ];

  var css = document.createElement('style');
  css.textContent =
    '#capriJauges{flex-shrink:0;margin-top:10px;padding:7px 9px;border:1px solid rgba(255,77,90,0.45);' +
    'background:rgba(255,77,90,0.05);font-size:10px;letter-spacing:2px}' +
    '.cj-t{display:flex;justify-content:space-between;margin-bottom:6px;color:var(--cadre)}' +
    '.cj-t b{font-weight:normal;color:var(--cyan)}' +
    '.cj{display:grid;grid-template-columns:96px 1fr 36px;align-items:center;gap:6px;margin-bottom:5px;color:var(--c)}' +
    '.cj:last-child{margin-bottom:0}' +
    '.cj-b{height:8px;padding:1px;border:1px solid var(--c);box-sizing:border-box}' +
    '.cj-f{height:100%;width:0%;background:repeating-linear-gradient(90deg,var(--c) 0 4px,transparent 4px 6px);' +
    'box-shadow:0 0 5px var(--c);transition:width 0.6s}' +
    '.cj b{font-weight:normal;text-align:right}' +
    '.cj.dom .cj-n{text-shadow:0 0 6px var(--c)}' +
    '.cj.dom .cj-n::before{content:"▸ "}';
  document.head.appendChild(css);

  var boite = document.createElement('div');
  boite.id = 'capriJauges';
  var titre = document.createElement('div');
  titre.className = 'cj-t';
  titre.innerHTML = '<span>HUMEUR</span><b id="cjDom">---</b>';
  boite.appendChild(titre);

  var lignes = {};
  JAUGES.forEach(function (j) {
    var d = document.createElement('div');
    d.className = 'cj';
    d.style.setProperty('--c', j.couleur);
    d.innerHTML = '<span class="cj-n"></span><div class="cj-b"><div class="cj-f"></div></div><b>0%</b>';
    d.querySelector('.cj-n').textContent = j.nom;
    boite.appendChild(d);
    lignes[j.cle] = { el: d, f: d.querySelector('.cj-f'), v: d.querySelector('b') };
  });
  chat.parentNode.insertBefore(boite, chat);
  var cjDom = document.getElementById('cjDom');

  function maj() {
    if (call.style.display !== 'flex') return; // seulement quand la fenêtre d'appel est ouverte
    ipc.invoke('capri-humeur').then(function (h) {
      if (!h) return;
      var domCle = null, max = -1;
      JAUGES.forEach(function (j) {
        var v = Math.max(0, Math.min(100, Math.round(h[j.cle] || 0)));
        lignes[j.cle].f.style.width = v + '%';
        lignes[j.cle].v.textContent = v + '%';
        if (v > max) { max = v; domCle = j.cle; }
      });
      JAUGES.forEach(function (j) { lignes[j.cle].el.classList.toggle('dom', j.cle === domCle); });
      JAUGES.forEach(function (j) { if (j.cle === domCle) cjDom.textContent = j.nom; });
    }).catch(function () {});
  }
  setInterval(maj, 2000);
  maj();
})();
`;

function sortir(message) {
  console.log('');
  console.log('✗ ' + message);
  console.log('');
  process.exit(1);
}

if (!fs.existsSync(fichierHtml)) {
  sortir("Je ne trouve pas index.html ici. Place ce fichier (installer_jauges.js) dans le dossier de Capri, à côté de index.html, puis relance la commande.");
}
if (!fs.existsSync(fichierMemoire)) {
  sortir("Je ne trouve pas capri_memoire_main.js. Installe d'abord la mémoire (node installer_memoire.js), puis relance cette commande.");
}

// 1. Le programme de la mémoire envoie maintenant les trois pourcentages
let memoire = fs.readFileSync(fichierMemoire, 'utf8');
if (memoire.indexOf('pasContente') !== -1) {
  console.log('✓ la mémoire envoie déjà les trois jauges (rien à changer)');
} else if (memoire.indexOf(ANCIENNE_LIGNE) === -1) {
  sortir("Je ne reconnais pas capri_memoire_main.js (il a été modifié ?). Rien n'a été changé.");
} else {
  const sauvegardeM = path.join(dossier, 'capri_memoire_main.js.sauvegarde_avant_jauges');
  if (!fs.existsSync(sauvegardeM)) fs.writeFileSync(sauvegardeM, memoire, 'utf8');
  memoire = memoire.replace(ANCIENNE_LIGNE, () => NOUVEAU_CODE);
  fs.writeFileSync(fichierMemoire, memoire, 'utf8');
  console.log('✓ capri_memoire_main.js mis à jour');
}

// 2. La page affiche les jauges
fs.writeFileSync(fichierJauges, CODE_JAUGES, 'utf8');
console.log('✓ capri_jauges.js créé');

let html = fs.readFileSync(fichierHtml, 'utf8');
if (html.indexOf('capri_jauges.js') !== -1) {
  console.log('✓ index.html était déjà branché (rien à changer)');
} else {
  const sauvegarde = path.join(dossier, 'index.html.sauvegarde_avant_jauges');
  if (!fs.existsSync(sauvegarde)) {
    fs.writeFileSync(sauvegarde, html, 'utf8');
    console.log('✓ sauvegarde de ton index.html : index.html.sauvegarde_avant_jauges');
  }
  const pos = html.lastIndexOf('</body>');
  if (pos === -1) sortir("Je ne trouve pas la fin de index.html (</body>). Rien n'a été modifié dans index.html.");
  html = html.slice(0, pos) + BALISE + '\n' + html.slice(pos);
  fs.writeFileSync(fichierHtml, html, 'utf8');
  console.log('✓ index.html mis à jour');
}

console.log('');
console.log("Terminé ! Relance Capri comme d'habitude.");
console.log('(Si un jour ça se passe mal : remets index.html.sauvegarde_avant_jauges et capri_memoire_main.js.sauvegarde_avant_jauges.)');
