// Capri : nouvelle traînée (sillage néon) + fichiers de l'impact un peu plus lents
// Utilisation : mets ce fichier dans le même dossier que index.html,
// puis tape dans le terminal de VS Code :  node appliquer-sillage.js

const fs = require('fs');
const path = require('path');

const FICHIER = path.join(__dirname, 'index.html');
const SAUVEGARDE = path.join(__dirname, 'index.avant-sillage.html');
const MARQUEUR_TRAINEE = 'Traînée sillage néon';
const MARQUEUR_FICHIERS = 'LENTEUR_FICHIERS';

if (!fs.existsSync(FICHIER)) {
  console.log("ERREUR : je ne trouve pas index.html à côté de ce fichier.");
  console.log("Vérifie que appliquer-sillage.js est bien dans le même dossier que index.html.");
  process.exit(1);
}

let html = fs.readFileSync(FICHIER, 'utf8');
const original = html;
const faits = [];

// ---------- 1. Nouvelle traînée : un double ruban néon vert et rouge ----------
const REGLAGES = `// ${MARQUEUR_TRAINEE} : un double ruban lumineux (vert et rouge) qui suit son corps et s'efface
  const TRAINEE_DUREE = 420;      // temps que met le ruban pour disparaître (ms) : plus petit = traînée plus courte
  const TRAINEE_LARGEUR = 5;      // épaisseur du ruban (pixels)
  const TRAINEE_OPACITE = 0.8;    // force du ruban (de 0 à 1)
  const TRAINEE_COULEURS = ['#00ffa3', '#ff2e63'];  // vert et rouge
`;

const FONCTIONS = `// ===== ${MARQUEUR_TRAINEE} derrière Capri quand on la tient =====
  let pointsSillage = [];
  let canvasSillage = null, ctxSillage = null, rafSillage = null;

  // Prépare le calque transparent sur lequel le ruban est dessiné
  function preparerSillage() {
    if (!canvasSillage) {
      canvasSillage = document.createElement('canvas');
      canvasSillage.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;';
      anim.insertBefore(canvasSillage, walker); // derrière Capri
      ctxSillage = canvasSillage.getContext('2d');
    }
    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth, H = window.innerHeight;
    if (canvasSillage.width !== Math.round(W * dpr) || canvasSillage.height !== Math.round(H * dpr)) {
      canvasSillage.width = Math.round(W * dpr);
      canvasSillage.height = Math.round(H * dpr);
      canvasSillage.style.width = W + 'px';
      canvasSillage.style.height = H + 'px';
    }
    ctxSillage.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Dessine le ruban : il est plus épais et plus fort près de Capri, puis s'amincit et s'efface
  function dessinerSillage() {
    rafSillage = null;
    const now = performance.now();
    pointsSillage = pointsSillage.filter((p) => now - p.t < TRAINEE_DUREE);
    preparerSillage();
    ctxSillage.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (pointsSillage.length < 2) return; // plus rien à dessiner : la boucle s'arrête

    ctxSillage.globalCompositeOperation = 'lighter';
    ctxSillage.lineCap = 'round';
    for (let i = 1; i < pointsSillage.length; i++) {
      const a = pointsSillage[i - 1], b = pointsSillage[i];
      if (b.debut) continue; // nouveau trait : pas de ligne depuis l'ancien endroit
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      if (len < 0.5) continue;
      const vie = Math.max(0, 1 - (now - b.t) / TRAINEE_DUREE); // 1 = tout neuf, 0 = effacé
      const nx = -dy / len, ny = dx / len;
      const ecart = 3.5 * vie; // les deux rubans se rejoignent en s'éloignant
      for (let c = 0; c < 2; c++) {
        const cote = c === 0 ? 1 : -1;
        ctxSillage.strokeStyle = TRAINEE_COULEURS[c];
        ctxSillage.shadowColor = TRAINEE_COULEURS[c];
        ctxSillage.shadowBlur = 8;
        ctxSillage.globalAlpha = TRAINEE_OPACITE * vie * vie;
        ctxSillage.lineWidth = TRAINEE_LARGEUR * vie;
        ctxSillage.beginPath();
        ctxSillage.moveTo(a.x + nx * ecart * cote, a.y + ny * ecart * cote);
        ctxSillage.lineTo(b.x + nx * ecart * cote, b.y + ny * ecart * cote);
        ctxSillage.stroke();
      }
    }
    ctxSillage.globalAlpha = 1;
    ctxSillage.shadowBlur = 0;
    rafSillage = requestAnimationFrame(dessinerSillage);
  }

  // Appelée à chaque image pendant qu'on tient Capri : ajoute un point au ruban
  function emettreTrainee(now, bx, by) {
    const dernier = pointsSillage[pointsSillage.length - 1];
    pointsSillage.push({ x: bx, y: by, t: now, debut: !dernier || now - dernier.t > 80 });
    if (!rafSillage) rafSillage = requestAnimationFrame(dessinerSillage);
  }

  `;

// ---------- 2. Fichiers de l'impact : un peu plus lents ----------
const FICHIERS = `// Des petits fichiers qui giclent d'un point (avec gravité)
  const LENTEUR_FICHIERS = 1.4;   // 1 = comme avant ; plus grand = les fichiers volent plus lentement
  function fichiers(x, y, n) {
    const G = 1600;
    for (let i = 0; i < n; i++) {
      const a = alea(-Math.PI * 0.97, -Math.PI * 0.03), v = alea(320, 950);
      const vx = Math.cos(a) * v, vy = Math.sin(a) * v;
      const w = alea(16, 30), h = w * 1.3;
      const col = COULEURS_FICHIERS[Math.floor(Math.random() * COULEURS_FICHIERS.length)];
      const el = document.createElement('div');
      el.style.cssText = 'position:fixed;pointer-events:none;z-index:97;will-change:transform,opacity;' +
        'left:' + (x - w / 2) + 'px;top:' + (y - h / 2) + 'px;width:' + w + 'px;height:' + h + 'px;' +
        'background-color:' + col + ';' +
        'background-image:repeating-linear-gradient(0deg, rgba(0,0,0,0.45) 0 2px, transparent 2px 5px);' +
        'background-size:100% 60%;background-repeat:no-repeat;background-position:0 100%;' +
        'clip-path:polygon(0 0, 68% 0, 100% 26%, 100% 100%, 0 100%)';
      document.body.appendChild(el);
      // Même trajectoire qu'avant, mais parcourue plus lentement
      const D = Math.min(1.4, Math.max(0.4, 2 * Math.abs(vy) / G));
      const rot = alea(-540, 540);
      const N = 16, kf = [];
      for (let k = 0; k <= N; k++) {
        const s = (k / N) * D;
        kf.push({
          transform: 'translate(' + (vx * s).toFixed(1) + 'px,' + (vy * s + 0.5 * G * s * s).toFixed(1) + 'px) rotate(' + (rot * s).toFixed(0) + 'deg)',
          opacity: k > N - 3 ? (N - k) / 3 : 1
        });
      }
      el.animate(kf, { duration: D * 1000 * LENTEUR_FICHIERS, easing: 'linear' }).onfinish = () => el.remove();
    }
  }

  `;

// ---------- Application ----------
if (html.includes(MARQUEUR_TRAINEE)) {
  console.log("- Traînée : déjà appliquée, je ne touche à rien.");
} else {
  // Réglages : soit l'ancienne traînée d'origine, soit celle en tranches
  const reglagesOrigine = /\/\/ Traînée d'éclairs[\s\S]*?const TRAINEE_COULEURS = \[[\s\S]*?\];\r?\n/;
  const reglagesTranches = /\/\/ Traînée glitch en tranches :[^\n]*\n(?:[ \t]*const TRAINEE_[^\n]*\n)+/;
  const fonctionsRx = /\/\/ ===== Traînée (?:de fantômes glitch|glitch en tranches)[\s\S]*?(?=\/\/ Des petits fichiers qui giclent)/;

  const rx = reglagesOrigine.test(html) ? reglagesOrigine : (reglagesTranches.test(html) ? reglagesTranches : null);
  if (!rx || !fonctionsRx.test(html)) {
    console.log("ERREUR : je ne reconnais pas l'ancienne traînée dans ton index.html. Rien n'a été modifié.");
    console.log("Envoie-moi ton index.html actuel et je l'adapte.");
    process.exit(1);
  }
  html = html.replace(rx, () => REGLAGES);
  html = html.replace(fonctionsRx, () => FONCTIONS);
  faits.push('nouvelle traînée (sillage néon)');
}

if (html.includes(MARQUEUR_FICHIERS)) {
  console.log("- Fichiers de l'impact : déjà ralentis, je ne touche à rien.");
} else {
  const fichiersRx = /\/\/ Des petits fichiers qui giclent d'un point[\s\S]*?(?=\/\/ Gerbe à l'impact)/;
  if (!fichiersRx.test(html)) {
    console.log("ERREUR : je ne trouve pas la partie des fichiers qui giclent dans ton index.html. Rien n'a été modifié.");
    console.log("Envoie-moi ton index.html actuel et je l'adapte.");
    process.exit(1);
  }
  html = html.replace(fichiersRx, () => FICHIERS);
  faits.push("fichiers de l'impact plus lents");
}

if (html === original) {
  console.log("Rien à changer : tout était déjà appliqué.");
  process.exit(0);
}

fs.writeFileSync(SAUVEGARDE, original, 'utf8');
fs.writeFileSync(FICHIER, html, 'utf8');

console.log("C'est fait : " + faits.join(' + ') + '.');
console.log("Ton ancien fichier est gardé dans index.avant-sillage.html (au cas où).");
console.log("Ferme Capri (Ctrl + Alt + Q) et relance-la.");
