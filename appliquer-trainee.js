// Capri : nouvelle traînée (plus discrète et plus stylée)
// Utilisation : mets ce fichier dans le même dossier que index.html,
// puis tape dans le terminal de VS Code :  node appliquer-trainee.js

const fs = require('fs');
const path = require('path');

const FICHIER = path.join(__dirname, 'index.html');
const SAUVEGARDE = path.join(__dirname, 'index.avant-trainee.html');
const MARQUEUR = 'Traînée glitch en tranches';

if (!fs.existsSync(FICHIER)) {
  console.log("ERREUR : je ne trouve pas index.html à côté de ce fichier.");
  console.log("Vérifie que appliquer-trainee.js est bien dans le même dossier que index.html.");
  process.exit(1);
}

let html = fs.readFileSync(FICHIER, 'utf8');

if (html.includes(MARQUEUR)) {
  console.log("Déjà appliqué : la nouvelle traînée est déjà dans index.html. Rien à faire.");
  process.exit(0);
}

// ---------- 1. Les réglages de la traînée ----------
const NOUVEAUX_REGLAGES = `// ${MARQUEUR} : tranches vertes et rouges qui se décalent derrière elle et s'effacent vite
  const TRAINEE_PAUSE = 90;       // temps entre deux tranches (ms) : plus grand = traînée plus discrète
  const TRAINEE_VITESSE = 380;    // vitesse minimale (pixels par seconde) pour laisser une traînée
  const TRAINEE_OPACITE = 0.55;   // force de départ des tranches (de 0 à 1)
  const TRAINEE_DUREE = 280;      // temps que met une tranche pour disparaître (ms)
  const TRAINEE_COULEURS = ['#00ffa3', '#ff2e63'];  // vert et rouge
`;

const reglagesRx = /\/\/ Traînée d'éclairs[\s\S]*?const TRAINEE_COULEURS = \[[\s\S]*?\];\r?\n/;

// ---------- 2. Les fonctions qui dessinent la traînée ----------
const NOUVELLES_FONCTIONS = `// ===== ${MARQUEUR} derrière Capri quand on la tient =====
  // Une tranche : une bande horizontale de Capri, colorée, décalée sur le côté, qui s'efface vite
  function tranche(couleur, decalage) {
    const w = sprite.offsetWidth, h = sprite.offsetHeight;
    const haut = alea(0, 70);
    const bas = haut + alea(14, 30);   // la bande, en pourcentage de la hauteur
    const g = document.createElement('div');
    g.style.cssText = 'position:absolute;left:0;bottom:0;pointer-events:none;' +
      'width:' + w + 'px;height:' + h + 'px;' +
      'transform-origin:' + walker.style.transformOrigin + ';' +
      'transform:translate(' + decalage + 'px,0px) ' + walker.style.transform + ';' +
      'filter:drop-shadow(0 0 4px ' + couleur + ');';
    const forme = document.createElement('div');
    forme.style.cssText = 'width:100%;height:100%;background:' + couleur + ';' +
      '-webkit-mask-image:url("' + sprite.src + '");-webkit-mask-size:100% 100%;-webkit-mask-repeat:no-repeat;' +
      'clip-path:inset(' + haut + '% 0 ' + (100 - bas) + '% 0);';
    g.appendChild(forme);
    anim.insertBefore(g, walker);
    g.animate([{ opacity: TRAINEE_OPACITE }, { opacity: 0 }], { duration: TRAINEE_DUREE, easing: 'ease-out' })
      .onfinish = () => g.remove();
  }

  function emettreTrainee(now, bx, by) {
    histCorps.push({ x: bx, y: by, t: now });
    while (histCorps.length > 1 && now - histCorps[0].t > 120) histCorps.shift();
    if (now < prochaineTrainee || histCorps.length < 2) return;
    const a = histCorps[0];
    const duree = (now - a.t) / 1000;
    if (Math.hypot(bx - a.x, by - a.y) / duree < TRAINEE_VITESSE) return;
    prochaineTrainee = now + TRAINEE_PAUSE;
    // Une tranche d'une couleur, et parfois une deuxième de l'autre couleur
    const i = Math.random() < 0.5 ? 0 : 1;
    tranche(TRAINEE_COULEURS[i], alea(-10, 10));
    if (Math.random() < 0.4) tranche(TRAINEE_COULEURS[1 - i], alea(-10, 10));
  }

  `;

const fonctionsRx = /\/\/ ===== Traînée de fantômes glitch[\s\S]*?(?=\/\/ Des petits fichiers qui giclent)/;

if (!reglagesRx.test(html) || !fonctionsRx.test(html)) {
  console.log("ERREUR : je ne reconnais pas l'ancienne traînée dans ton index.html.");
  console.log("Rien n'a été modifié. Envoie-moi ton index.html actuel et je l'adapte.");
  process.exit(1);
}

// Sauvegarde de l'original, puis modifications
fs.writeFileSync(SAUVEGARDE, html, 'utf8');
html = html.replace(reglagesRx, () => NOUVEAUX_REGLAGES);
html = html.replace(fonctionsRx, () => NOUVELLES_FONCTIONS);
fs.writeFileSync(FICHIER, html, 'utf8');

console.log("C'est fait : la nouvelle traînée est dans index.html.");
console.log("Ton ancien fichier est gardé dans index.avant-trainee.html (au cas où).");
console.log("Ferme Capri (Ctrl + Alt + Q) et relance-la.");
