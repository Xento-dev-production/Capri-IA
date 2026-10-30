// ===== Ajoute 5 objets fonctionnels de plus (avec nouvelle icône) à capri_inventaire.js =====
// Usage : node appliquer_items2.js   (dans le dossier du projet, là où est index.html)
// À lancer APRÈS appliquer_items.js. Sauvegarde : capri_inventaire.avant_items2.js
const fs = require('fs');
const path = require('path');

const FICHIER = path.join(__dirname, 'capri_inventaire.js');
const SAUVEGARDE = path.join(__dirname, 'capri_inventaire.avant_items2.js');
const MARQUEUR = '// === OBJETS FONCTIONNELS 2 ===';

if (!fs.existsSync(FICHIER)) { console.error('Introuvable : ' + FICHIER); process.exit(1); }
let src = fs.readFileSync(FICHIER, 'utf8');
if (src.includes(MARQUEUR)) { console.log('Déjà appliqué, rien à faire.'); process.exit(0); }
if (!src.includes('const texteFlottant')) { console.error("Lance d'abord : node appliquer_items.js"); process.exit(1); }

const ENTREES = `    ${MARQUEUR}
    cellule: {
      nom: "CELLULE D'ÉNERGIE", w: 34, h: 56, couleur: '#00ffa3', couleurs: ['#00ffa3', '#ffffff', '#27e6ff'], duree: 18000,
      svg: (w, h) => '<svg width="' + w + '" height="' + h + '" viewBox="0 0 34 56" fill="none">' +
        '<rect x="11" y="2" width="12" height="6" fill="#00ffa3"/>' +
        '<rect x="4" y="8" width="26" height="46" fill="#021209" stroke="#00ffa3" stroke-width="2"/>' +
        '<rect x="9" y="13" width="16" height="7" fill="#00ffa3" fill-opacity="0.45"/>' +
        '<rect x="9" y="23" width="16" height="7" fill="#00ffa3" fill-opacity="0.75"/>' +
        '<rect x="9" y="33" width="16" height="7" fill="#00ffa3"/>' +
        '<polygon points="19,36 12,46 17,46 15,53 23,42 18,42" fill="#ffffff"/></svg>',
      tick(d, age, now, c, fin) {
        const t = age / 1000;
        d.x += (c.cx - c.larg * 0.65 - d.x) * 0.12;
        d.y += (c.cy + Math.sin(t * 2.4) * 8 - d.y) * 0.12;
        poserDeco(d, d.x, d.y, Math.sin(t * 2) * 6, 0.85);
        if (!d.init) { d.init = true; texteFlottant(c.cx, c.haut - 6, '+ÉNERGIE', '#00ffa3'); }
        if (absente()) { walker.style.filter = ''; return; }
        walker.style.filter = 'drop-shadow(0 0 ' + (8 + 5 * Math.sin(t * 5)).toFixed(1) + 'px #00ffa3)';
        if (now > d.arc) {                                   // le courant coule de la cellule vers Capri
          d.arc = now + (fin ? 150 : 380);
          eclair(d.x, d.y, c.cx + alea(-10, 10), c.cy + alea(-20, 20), {
            couleur: '#00ffa3', halo: '#00ffa3', coeur: '#ffffff', epaisseur: 1.5, duree: 220, descente: 35,
            rugosite: 0.4, pas: 5, branches: 0, echelleBr: 0
          });
          particules(c.cx, c.cy, {
            couleurs: ['#00ffa3', '#ffffff'], n: 3, vmin: 40, vmax: 120, tailleMin: 2, tailleMax: 3,
            angleMin: -Math.PI, angleMax: Math.PI, duree: 400
          });
        }
      },
      nettoyer() { walker.style.filter = ''; }
    },
    batterie_lourde: {
      nom: 'BATTERIE LOURDE', w: 60, h: 34, couleur: '#27e6ff', couleurs: ['#27e6ff', '#ffffff', '#00ffa3'], duree: 22000,
      svg: (w, h) => '<svg width="' + w + '" height="' + h + '" viewBox="0 0 60 34" fill="none">' +
        '<rect x="2" y="4" width="48" height="26" fill="#02121a" stroke="#27e6ff" stroke-width="2.2"/>' +
        '<rect x="50" y="11" width="8" height="12" fill="#27e6ff"/>' +
        '<path d="M8 8V26M15 8V26M22 8V26M29 8V26" stroke="#27e6ff" stroke-width="3.6" stroke-opacity="0.8"/>' +
        '<path d="M36 8V26" stroke="#27e6ff" stroke-width="3.6" stroke-opacity="0.35"/>' +
        '<path d="M44 8L38 18H43L40 27L47 15H42Z" fill="#ffffff"/></svg>',
      tick(d, age, now, c, fin) {
        const t = age / 1000;
        d.x += (c.cx + Math.sin(t * 1.1) * c.larg * 0.8 - d.x) * 0.1;
        d.y += (c.bas - 18 - d.y) * 0.15;
        poserDeco(d, d.x, d.y, Math.sin(t * 1.1) * 6, 0.9);
        if (absente()) { walker.style.filter = ''; return; }
        walker.style.filter = 'drop-shadow(0 0 10px #27e6ff) brightness(' + (1.05 + 0.1 * Math.sin(t * 4)).toFixed(2) + ')';
        if (now > d.arc) {                                   // arcs bleus entre la batterie et ses pieds
          d.arc = now + (fin ? 180 : 450);
          eclair(d.x, d.y, c.cx + alea(-25, 25), c.bas - alea(5, c.hauteur * 0.6), {
            couleur: '#27e6ff', halo: '#27e6ff', coeur: '#ffffff', epaisseur: 1.8, duree: 240, descente: 35,
            rugosite: 0.45, pas: 5, branches: 0.04, echelleBr: 0.3
          });
        }
        if (now > d.scan) {                                  // grosse impulsion lourde au sol
          d.scan = now + 3000;
          ondeChoc(d.x, c.bas);
          secousseEcran(3, 160);
          particules(d.x, c.bas - 4, {
            couleurs: ['#27e6ff', '#ffffff'], n: 12, vmin: 100, vmax: 300, tailleMin: 2, tailleMax: 4,
            angleMin: -Math.PI * 0.95, angleMax: -Math.PI * 0.05, duree: 450
          });
        }
      },
      nettoyer() { walker.style.filter = ''; }
    },
    script_boost: {
      nom: 'SCRIPT DE BOOST', w: 50, h: 50, couleur: '#ffe600', couleurs: ['#ffe600', '#27e6ff', '#ffffff'], duree: 18000,
      svg: (w, h) => '<svg width="' + w + '" height="' + h + '" viewBox="0 0 50 50" fill="none">' +
        '<polygon points="25,2 45,13 45,37 25,48 5,37 5,13" fill="#0c0900" stroke="#ffe600" stroke-width="2"/>' +
        '<polygon points="29,8 14,27 23,27 20,43 36,22 27,22" fill="#ffe600"/>' +
        '<path d="M1 20H8M1 30H6M49 20H44M49 30H45" stroke="#27e6ff" stroke-width="2"/></svg>',
      tick(d, age, now, c, fin) {
        const t = age / 1000;
        d.x += (c.cx - d.x) * 0.15;
        d.y += (c.haut - 26 + Math.sin(t * 4) * 5 - d.y) * 0.15;
        poserDeco(d, d.x, d.y, t * 120, 0.85);
        if (absente()) { walker.style.filter = ''; return; }
        walker.style.filter = 'drop-shadow(0 0 9px #ffe600) brightness(1.12)';
        if (now > d.arc) {                                   // lignes de vitesse derrière elle, et fantômes cyan
          d.arc = now + (fin ? 60 : 90);
          const y = c.haut + c.hauteur * alea(0.1, 0.95);
          [[0, c.left - 4], [Math.PI, c.left + c.larg + 4]].forEach(([a, x]) => {
            particules(x, y, {
              couleurs: ['#27e6ff', '#ffe600', '#ffffff'], n: 1, vmin: 260, vmax: 520, tailleMin: 2, tailleMax: 4,
              angleMin: a - 0.08, angleMax: a + 0.08, duree: 300
            });
          });
        }
        if (now > d.scan) {                                  // petit coup de turbo : flash et éclair
          d.scan = now + alea(1500, 2600);
          walker.animate([{ filter: 'brightness(2.4) drop-shadow(0 0 16px #ffe600)' }, { filter: 'none' }], { duration: 260 });
          eclair(c.cx + alea(-90, 90), -10, c.cx, c.haut + 10, {
            couleur: '#ffe600', halo: '#ffe600', coeur: '#ffffff', epaisseur: 2, duree: 300, descente: 50,
            rugosite: 0.4, pas: 6, branches: 0, echelleBr: 0
          });
        }
      },
      nettoyer() { walker.style.filter = ''; }
    },
    mdp_vole: {
      nom: 'MOT DE PASSE VOLÉ', w: 60, h: 34, couleur: '#ffe600', couleurs: ['#ffe600', '#ffffff', '#ff2e63'], duree: 20000,
      svg: (w, h) => '<svg width="' + w + '" height="' + h + '" viewBox="0 0 60 34" fill="none">' +
        '<rect x="2" y="4" width="56" height="26" fill="#0c0900" stroke="#ffe600" stroke-width="2"/>' +
        '<circle cx="12" cy="17" r="3" fill="#ffe600"/><circle cx="22" cy="17" r="3" fill="#ffe600"/>' +
        '<circle cx="32" cy="17" r="3" fill="#ffe600"/><circle cx="42" cy="17" r="3" fill="#ffe600"/>' +
        '<path d="M50 11V23" stroke="#ff2e63" stroke-width="2.4"/>' +
        '<path d="M2 4L14 30" stroke="#ffffff" stroke-opacity="0.25" stroke-width="3"/></svg>',
      tick(d, age, now, c, fin) {
        const t = age / 1000;
        d.x += (c.cx + Math.cos(t * 1.4) * c.larg * 0.6 - d.x) * 0.1;
        d.y += (c.haut - 22 + Math.sin(t * 2.2) * 6 - d.y) * 0.1;
        poserDeco(d, d.x, d.y, Math.sin(t * 1.8) * 7, 0.85);
        if (absente()) return;
        if (now > d.arc) {                                   // une pluie d'eddies jaunes
          d.arc = now + (fin ? 120 : 280);
          particules(c.cx + alea(-c.larg * 0.6, c.larg * 0.6), c.haut - 30, {
            couleurs: ['#ffe600', '#ffe600', '#ffffff'], n: 2, vmin: 20, vmax: 80, tailleMin: 3, tailleMax: 5,
            angleMin: Math.PI * 0.3, angleMax: Math.PI * 0.7, duree: 1100
          });
        }
        if (now > d.scan) {
          d.scan = now + 1300;
          const txt = ['ACCÈS VOLÉ', '****', '+€$', 'ILLÉGAL', 'PASSWORD: ????'][Math.floor(Math.random() * 5)];
          texteFlottant(d.x, d.y - 16, txt, Math.random() < 0.3 ? '#ff2e63' : '#ffe600');
        }
      }
    },
    script_compa: {
      nom: 'SCRIPT COMPAGNON', w: 52, h: 46, couleur: '#27e6ff', couleurs: ['#27e6ff', '#ff4fd8', '#ffffff'], duree: 24000,
      svg: (w, h) => '<svg width="' + w + '" height="' + h + '" viewBox="0 0 52 46" fill="none">' +
        '<path d="M4 4H48V30H26L16 41V30H4Z" fill="#02121a" stroke="#27e6ff" stroke-width="2"/>' +
        '<path d="M26 25C17 19 16 12 21 10C23.5 9 25.5 10.5 26 12C26.5 10.5 28.5 9 31 10C36 12 35 19 26 25Z" fill="#ff4fd8" fill-opacity="0.5" stroke="#ffffff" stroke-width="1.6"/>' +
        '<path d="M9 18H14M38 18H43" stroke="#27e6ff" stroke-width="1.6"/></svg>',
      tick(d, age, now, c, fin) {
        const t = age / 1000;
        if (d.cote === undefined) d.cote = c.cx > window.innerWidth / 2 ? -1 : 1;
        d.x += (c.cx + d.cote * (c.larg * 0.7 + 14) - d.x) * 0.1;
        d.y += (c.cy - 10 + Math.sin(t * 2.4) * 8 - d.y) * 0.1;
        poserDeco(d, d.x, d.y, Math.sin(t * 2) * 6, 0.85);
        if (absente()) return;
        if (now > d.arc) {                                   // un fil bleu la relie à Capri, des cœurs montent
          d.arc = now + 420;
          eclair(d.x, d.y, c.cx, c.cy, {
            couleur: '#27e6ff', halo: '#27e6ff', epaisseur: 1, duree: 220, descente: 30,
            rugosite: 0.2, pas: 8, branches: 0, echelleBr: 0
          });
          particules(d.x, d.y - 10, {
            couleurs: ['#ff4fd8', '#ffffff'], n: 2, vmin: 30, vmax: 90, tailleMin: 3, tailleMax: 4,
            angleMin: -Math.PI * 0.8, angleMax: -Math.PI * 0.2, duree: 900
          });
        }
        if (now > d.scan) {
          d.scan = now + 2800;
          const txt = ["T'ES PAS SEULE", 'JE SUIS LÀ', 'ON EST DUO', 'CHOOM !'][Math.floor(Math.random() * 4)];
          texteFlottant(d.x, d.y - 28, txt, '#27e6ff');
          anneauHolo(d.x, d.y, '#ff4fd8');
        }
      }
    },
`;

const DESCRIPTIONS = {
  cellule: 'Elle flotte pres de Capri et la recharge a coups de courant vert. Glisse-la sur Capri.',
  batterie_lourde: 'Un gros bloc bleu qui crache des arcs et frappe le sol. Glisse-la sur Capri.',
  script_boost: 'Lignes de vitesse, flashs de turbo et foudre jaune. Glisse-le sur Capri.',
  mdp_vole: 'Une pluie d\'eddies vole autour d\'elle, ACCES VOLE partout. Glisse-le sur Capri.',
  script_compa: 'Une bulle copine la suit, lui envoie des coeurs et des mots doux. Glisse-le sur Capri.'
};

const DEBUT = '  const DECOS = {\n';
if (!src.includes(DEBUT)) { console.error('Je ne trouve pas "const DECOS = {" : le fichier a change.'); process.exit(1); }
src = src.replace(DEBUT, () => DEBUT + ENTREES);

let ok = 0;
Object.keys(DESCRIPTIONS).forEach((id) => {
  const re = new RegExp("(id: '" + id + "'[^\\n]*?desc: ')((?:[^'\\\\]|\\\\.)*)(')");
  if (re.test(src)) { src = src.replace(re, (m, a, b, c) => a + DESCRIPTIONS[id].replace(/'/g, "\\'") + c); ok++; }
  else console.warn('Description non trouvee pour ' + id);
});

fs.copyFileSync(FICHIER, SAUVEGARDE);
fs.writeFileSync(FICHIER, src, 'utf8');
console.log('OK : 5 objets de plus rendus fonctionnels (' + ok + ' descriptions mises a jour).');
console.log('Sauvegarde : ' + path.basename(SAUVEGARDE));
console.log('Relance Capri (ou Ctrl+R) pour voir les nouvelles icones.');
