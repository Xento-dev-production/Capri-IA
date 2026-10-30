// ===== Dernier lot : les 5 derniers objets du marché noir deviennent fonctionnels =====
// Usage : node appliquer_items3.js   (dans le dossier du projet, là où est index.html)
// À lancer APRÈS appliquer_items.js. Sauvegarde : capri_inventaire.avant_items3.js
const fs = require('fs');
const path = require('path');

const FICHIER = path.join(__dirname, 'capri_inventaire.js');
const SAUVEGARDE = path.join(__dirname, 'capri_inventaire.avant_items3.js');
const MARQUEUR = '// === OBJETS FONCTIONNELS 3 ===';

if (!fs.existsSync(FICHIER)) { console.error('Introuvable : ' + FICHIER); process.exit(1); }
let src = fs.readFileSync(FICHIER, 'utf8');
if (src.includes(MARQUEUR)) { console.log('Déjà appliqué, rien à faire.'); process.exit(0); }
if (!src.includes('const texteFlottant')) { console.error("Lance d'abord : node appliquer_items.js"); process.exit(1); }

const AIDES = `  ${MARQUEUR}
  // Une petite photo holographique (souvenir) qui apparaît puis s'efface
  const souvenirHolo = (x, y) => {
    const col = ['#ffc247', '#ff9ad5', '#27e6ff'][Math.floor(Math.random() * 3)];
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;left:' + (x - 19) + 'px;top:' + (y - 15) + 'px;width:38px;height:30px;z-index:95;pointer-events:none;box-sizing:border-box;border:2px solid ' + col + ';background:linear-gradient(135deg,' + col + '55,#000000aa);box-shadow:0 0 10px ' + col + ';';
    document.body.appendChild(el);
    const r = alea(-14, 14);
    el.animate([
      { opacity: 0, transform: 'rotate(' + r + 'deg) scale(0.4)' },
      { opacity: 0.95, transform: 'rotate(' + r + 'deg) scale(1)', offset: 0.15 },
      { opacity: 0.9, offset: 0.7 },
      { opacity: 0, transform: 'rotate(' + r + 'deg) scale(1.1)' }
    ], { duration: 2000 }).onfinish = () => el.remove();
  };
`;

const ENTREES = `    puce_memoire: {
      nom: 'PUCE MÉMOIRE', w: 56, h: 40, couleur: '#00ffa3', couleurs: ['#00ffa3', '#ffffff', '#27e6ff'], duree: 20000,
      svg: (w, h) => '<svg width="' + w + '" height="' + h + '" viewBox="0 0 56 40" fill="none">' +
        '<path d="M12 0V5M20 0V5M28 0V5M36 0V5M44 0V5M12 35V40M20 35V40M28 35V40M36 35V40M44 35V40" stroke="#ffe600" stroke-width="2.2"/>' +
        '<rect x="5" y="5" width="46" height="30" fill="#02120a" stroke="#00ffa3" stroke-width="2"/>' +
        '<rect x="10" y="10" width="15" height="8" fill="#00ffa3"/>' +
        '<rect x="10" y="22" width="15" height="8" fill="#00ffa3" fill-opacity="0.4"/>' +
        '<rect x="30" y="10" width="16" height="20" stroke="#27e6ff" stroke-width="1.4"/>' +
        '<path d="M33 15H43M33 20H43M33 25H40" stroke="#27e6ff" stroke-width="1.4"/></svg>',
      tick(d, age, now, c, fin) {
        const t = age / 1000;
        d.x += (c.cx - c.larg * 0.55 - d.x) * 0.1;
        d.y += (c.haut - 14 + Math.sin(t * 2.2) * 6 - d.y) * 0.1;
        poserDeco(d, d.x, d.y, Math.sin(t * 1.6) * 8, 0.85);
        if (absente()) return;
        if (now > d.scan) {                                  // téléchargement en pourcentage, puis sauvegarde
          d.pct = (d.pct || 0) + Math.floor(alea(12, 22));
          if (d.pct >= 100) {
            d.pct = 0; d.scan = now + 1800;
            texteFlottant(d.x, d.y - 20, 'SAUVEGARDÉ', '#ffffff');
            anneauHolo(c.cx, c.cy, '#00ffa3');
          } else {
            d.scan = now + 650;
            texteFlottant(d.x, d.y - 20, 'MÉMOIRE ' + d.pct + '%', '#00ffa3');
          }
        }
        if (now > d.arc) { d.arc = now + 2500; faisceauDonnees(d.x, d.y, c.cx, c.cy); }
      }
    },
    dossier_souv: {
      nom: 'DOSSIER SOUVENIRS', w: 56, h: 46, couleur: '#ffc247', couleurs: ['#ffc247', '#ff9ad5', '#ffffff'], duree: 22000,
      svg: (w, h) => '<svg width="' + w + '" height="' + h + '" viewBox="0 0 56 46" fill="none">' +
        '<path d="M4 14V6H22L26 11H52V20" fill="#1a1000" stroke="#ffc247" stroke-width="2"/>' +
        '<g transform="rotate(-9 20 18)"><rect x="10" y="3" width="20" height="24" fill="#fff8e6" fill-opacity="0.9" stroke="#ffffff"/><rect x="13" y="6" width="14" height="12" fill="#ffc247" fill-opacity="0.6"/></g>' +
        '<g transform="rotate(8 38 18)"><rect x="29" y="5" width="20" height="24" fill="#fff8e6" fill-opacity="0.9" stroke="#ffffff"/><rect x="32" y="8" width="14" height="12" fill="#ff9ad5" fill-opacity="0.6"/></g>' +
        '<path d="M4 20H52V44H4Z" fill="#1a1000" stroke="#ffc247" stroke-width="2"/>' +
        '<path d="M28 38C21 33 20 28 24 26.5C26 25.7 27.5 27 28 28.5C28.5 27 30 25.7 32 26.5C36 28 35 33 28 38Z" fill="#ff9ad5" fill-opacity="0.7"/></svg>',
      tick(d, age, now, c, fin) {
        const t = age / 1000;
        d.x += (c.cx + Math.cos(t * 0.9) * c.larg * 0.6 - d.x) * 0.1;
        d.y += (c.haut - 26 + Math.sin(t * 2) * 6 - d.y) * 0.1;
        poserDeco(d, d.x, d.y, Math.sin(t * 1.5) * 8, 0.85);
        if (absente()) return;
        if (now > d.arc) {                                   // des photos holo apparaissent autour d'elle
          d.arc = now + (fin ? 500 : 1300);
          souvenirHolo(c.cx + alea(-c.larg * 0.9, c.larg * 0.9), c.cy + alea(-c.hauteur * 0.4, c.hauteur * 0.3));
        }
        if (now > d.scan) {
          d.scan = now + 4000;
          texteFlottant(c.cx, c.haut - 8, ['SOUVENIR RESTAURÉ', 'NIGHT CITY, 2077', 'UN BON JOUR'][Math.floor(Math.random() * 3)], '#ffc247');
          particules(d.x, d.y, {
            couleurs: ['#ffc247', '#ff9ad5', '#ffffff'], n: 6, vmin: 40, vmax: 120, tailleMin: 3, tailleMax: 4,
            angleMin: -Math.PI * 0.8, angleMax: -Math.PI * 0.2, duree: 900
          });
        }
      }
    },
    dossier_corr: {
      nom: 'DOSSIER CORROMPU', w: 56, h: 46, couleur: '#ff8a1f', couleurs: ['#ff8a1f', '#ff2e63', '#ffffff'], duree: 18000,
      svg: (w, h) => '<svg width="' + w + '" height="' + h + '" viewBox="0 0 56 46" fill="none">' +
        '<path d="M4 8H22L27 14H34L38 20L46 16L52 23V43H4Z" fill="#120800" stroke="#ff8a1f" stroke-width="2"/>' +
        '<rect x="30" y="26" width="16" height="4" fill="#27e6ff" fill-opacity="0.8"/>' +
        '<rect x="8" y="32" width="12" height="3" fill="#ff2e63"/>' +
        '<rect x="22" y="37" width="22" height="3" fill="#ff8a1f"/>' +
        '<rect x="10" y="22" width="9" height="3" fill="#ff8a1f" fill-opacity="0.6"/>' +
        '<path d="M22 24L30 32M30 24L22 32" stroke="#ff2e63" stroke-width="2.2"/></svg>',
      tick(d, age, now, c, fin) {
        const t = age / 1000;
        d.x += (c.cx + Math.sin(t * 1.7) * c.larg * 0.6 - d.x) * 0.12;
        d.y += (c.cy - c.hauteur * 0.1 + Math.cos(t * 2.3) * 14 - d.y) * 0.12;
        poserDeco(d, d.x + (Math.random() < 0.2 ? alea(-5, 5) : 0), d.y + (Math.random() < 0.2 ? alea(-3, 3) : 0), Math.sin(t * 3) * 10, 0.85);
        d.el.style.filter = 'drop-shadow(0 0 8px #ff8a1f) hue-rotate(' + (Math.random() < 0.1 ? 150 : 0) + 'deg)';
        if (absente()) return;
        if (now > d.arc) {                                   // elle "mange" le dossier : des morceaux filent vers elle
          d.arc = now + (fin ? 140 : 320);
          const a = Math.atan2(c.cy - d.y, c.cx - d.x);
          particules(d.x, d.y, {
            couleurs: ['#ff8a1f', '#ffffff', '#ff2e63'], n: 3, vmin: 180, vmax: 320, tailleMin: 3, tailleMax: 6,
            angleMin: a - 0.25, angleMax: a + 0.25, duree: 380
          });
        }
        if (now > d.scan) {
          d.scan = now + 1500;
          const txt = ['MIAM !', 'ERR 0x' + Math.floor(Math.random() * 65535).toString(16).toUpperCase(), 'CORROMPU...', 'NOM NOM'][Math.floor(Math.random() * 4)];
          texteFlottant(d.x, d.y - 18, txt, '#ff8a1f');
        }
      },
      fin(d) { glitchEcran(500); finDeco(d); }
    },
    code_acces: {
      nom: "CODE D'ACCÈS", w: 44, h: 56, couleur: '#27e6ff', couleurs: ['#27e6ff', '#00ffa3', '#ffffff'], duree: 18000,
      svg: (w, h) => '<svg width="' + w + '" height="' + h + '" viewBox="0 0 44 56" fill="none">' +
        '<polygon points="4,2 40,2 40,48 32,54 4,54" fill="#02121a" stroke="#27e6ff" stroke-width="2"/>' +
        '<rect x="8" y="6" width="28" height="11" fill="#000" stroke="#27e6ff" stroke-width="1.2"/>' +
        '<path d="M12 11.5H15M19 11.5H22M26 11.5H29M33 11.5H34" stroke="#00ffa3" stroke-width="2.4"/>' +
        '<g fill="#27e6ff" fill-opacity="0.65"><rect x="9" y="22" width="7" height="7"/><rect x="19" y="22" width="7" height="7"/><rect x="29" y="22" width="7" height="7"/>' +
        '<rect x="9" y="32" width="7" height="7"/><rect x="19" y="32" width="7" height="7"/><rect x="29" y="32" width="7" height="7"/>' +
        '<rect x="9" y="42" width="7" height="7"/><rect x="19" y="42" width="7" height="7"/></g>' +
        '<rect x="29" y="42" width="7" height="7" fill="#00ffa3"/></svg>',
      tick(d, age, now, c, fin) {
        const t = age / 1000;
        d.x += (c.cx + c.larg * 0.7 - d.x) * 0.1;
        d.y += (c.cy - 8 + Math.sin(t * 2.2) * 6 - d.y) * 0.1;
        poserDeco(d, d.x, d.y, Math.sin(t * 1.6) * 6, 0.8);
        if (absente()) return;
        if (now > d.scan) {                                  // elle tape un code chiffre par chiffre, puis l'accès s'ouvre
          d.n = (d.n || 0) + 1;
          d.scan = now + 550;
          if (d.n <= 4) {
            texteFlottant(d.x, d.y - 34, String(Math.floor(Math.random() * 10)), '#27e6ff');
            particules(d.x, d.y, {
              couleurs: ['#27e6ff', '#ffffff'], n: 3, vmin: 40, vmax: 110, tailleMin: 2, tailleMax: 3,
              angleMin: -Math.PI, angleMax: Math.PI, duree: 300
            });
          } else if (d.n === 5) {
            texteFlottant(c.cx, c.haut - 6, 'ACCÈS ACCORDÉ', '#00ffa3');
            anneauHolo(c.cx, c.cy, '#00ffa3');
            flashBlanc(160, 0.12, '#00ffa3');
            d.scan = now + 1500;
          } else { d.n = 0; }
        }
      }
    },
    script_repar: {
      nom: 'SCRIPT DE RÉPARATION', w: 52, h: 52, couleur: '#4d7cff', couleurs: ['#4d7cff', '#ffe600', '#ffffff'], duree: 20000,
      svg: (w, h) => '<svg width="' + w + '" height="' + h + '" viewBox="0 0 52 52" fill="none">' +
        '<circle cx="26" cy="26" r="17" stroke="#4d7cff" stroke-width="6" stroke-dasharray="6.4 6.4"/>' +
        '<circle cx="26" cy="26" r="12" fill="#02061a" stroke="#4d7cff" stroke-width="2"/>' +
        '<path d="M26 20V32M20 26H32" stroke="#00ffa3" stroke-width="2.2"/>' +
        '<path d="M8 46L28 26" stroke="#ffffff" stroke-width="4.4" stroke-linecap="round"/>' +
        '<circle cx="34" cy="20" r="6.5" stroke="#ffffff" stroke-width="3.4"/>' +
        '<rect x="35" y="11" width="6" height="8" fill="#02061a" transform="rotate(45 38 15)"/></svg>',
      tick(d, age, now, c, fin) {
        const t = age / 1000, a = t * 1.6;
        d.x += (c.cx + Math.cos(a) * c.larg * 0.7 - d.x) * 0.2;
        d.y += (c.cy + Math.sin(a) * c.hauteur * 0.3 - d.y) * 0.2;
        poserDeco(d, d.x, d.y, t * 90, 0.8);
        if (absente()) return;
        if (now > d.arc) {                                   // des soudures bleues : étincelles sur son corps
          d.arc = now + (fin ? 200 : 550);
          const x = c.left + c.larg * alea(0.2, 0.8), y = c.haut + c.hauteur * alea(0.1, 0.9);
          eclair(d.x, d.y, x, y, {
            couleur: '#4d7cff', halo: '#4d7cff', coeur: '#ffffff', epaisseur: 1.4, duree: 180, descente: 25,
            rugosite: 0.3, pas: 5, branches: 0, echelleBr: 0
          });
          particules(x, y, {
            couleurs: ['#ffffff', '#ffe600', '#4d7cff'], n: 8, vmin: 80, vmax: 260, tailleMin: 2, tailleMax: 3,
            angleMin: -Math.PI, angleMax: 0, duree: 500
          });
          walker.animate([{ filter: 'brightness(1.7) drop-shadow(0 0 10px #4d7cff)' }, { filter: 'none' }], { duration: 180 });
        }
        if (now > d.scan) {
          d.scan = now + 1700;
          texteFlottant(c.cx, c.haut - 6, 'BUG #' + (Math.floor(Math.random() * 900) + 100) + ' RÉPARÉ', '#4d7cff');
        }
      }
    },
`;

const DESCRIPTIONS = {
  puce_memoire: 'Elle telecharge sa memoire en pourcentage, puis sauvegarde. Glisse-la sur Capri.',
  dossier_souv: 'Des photos holo de Night City apparaissent autour d\'elle. Glisse-le sur Capri.',
  dossier_corr: 'Il glitche de partout et elle le grignote. Glisse-le sur Capri.',
  code_acces: 'Un digicode tape son code, puis ACCES ACCORDE. Glisse-le sur Capri.',
  script_repar: 'Une cle et un engrenage soudent ses petits bugs, etincelles a l\'appui. Glisse-le sur Capri.'
};

const DEBUT = '  const DECOS = {\n';
if (!src.includes(DEBUT)) { console.error('Je ne trouve pas "const DECOS = {" : le fichier a change.'); process.exit(1); }
src = src.replace(DEBUT, () => AIDES + DEBUT + ENTREES);

let ok = 0;
Object.keys(DESCRIPTIONS).forEach((id) => {
  const re = new RegExp("(id: '" + id + "'[^\\n]*?desc: ')((?:[^'\\\\]|\\\\.)*)(')");
  if (re.test(src)) { src = src.replace(re, (m, a, b, c) => a + DESCRIPTIONS[id].replace(/'/g, "\\'") + c); ok++; }
  else console.warn('Description non trouvee pour ' + id);
});

fs.copyFileSync(FICHIER, SAUVEGARDE);
fs.writeFileSync(FICHIER, src, 'utf8');
console.log('OK : les 5 derniers objets sont fonctionnels (' + ok + ' descriptions mises a jour).');
console.log('Sauvegarde : ' + path.basename(SAUVEGARDE));
console.log('Relance Capri (ou Ctrl+R) pour voir les nouvelles icones.');
