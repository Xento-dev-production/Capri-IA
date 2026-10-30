// ===== Ajoute 5 objets fonctionnels (avec nouvelle icône) à capri_inventaire.js =====
// Usage : node appliquer_items.js   (à lancer dans le dossier du projet, là où est index.html)
// Une sauvegarde est faite : capri_inventaire.avant_items.js
const fs = require('fs');
const path = require('path');

const FICHIER = path.join(__dirname, 'capri_inventaire.js');
const SAUVEGARDE = path.join(__dirname, 'capri_inventaire.avant_items.js');
const MARQUEUR = '// === NOUVEAUX OBJETS FONCTIONNELS ===';

if (!fs.existsSync(FICHIER)) { console.error('Introuvable : ' + FICHIER); process.exit(1); }
let src = fs.readFileSync(FICHIER, 'utf8');
if (src.includes(MARQUEUR)) { console.log('Déjà appliqué, rien à faire.'); process.exit(0); }

const AIDES = `  ${MARQUEUR}
  // Petit texte qui monte et s'efface
  const texteFlottant = (x, y, txt, col) => {
    const el = document.createElement('div');
    el.textContent = txt;
    el.style.cssText = 'position:fixed;left:0;top:0;z-index:97;pointer-events:none;white-space:nowrap;font:bold 11px Consolas,monospace;letter-spacing:2px;color:' + col + ';text-shadow:0 0 6px ' + col + ';';
    document.body.appendChild(el);
    const base = 'translate(-50%,-50%) translate(' + x.toFixed(0) + 'px,';
    el.animate([
      { opacity: 0, transform: base + y.toFixed(0) + 'px)' },
      { opacity: 1, offset: 0.15 },
      { opacity: 0, transform: base + (y - 46).toFixed(0) + 'px)' }
    ], { duration: 1100, easing: 'ease-out' }).onfinish = () => el.remove();
  };
  // Anneau holographique qui s'élargit autour de Capri
  const anneauHolo = (x, y, col) => {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;left:' + (x - 30) + 'px;top:' + (y - 30) + 'px;width:60px;height:60px;z-index:95;pointer-events:none;border-radius:50%;box-sizing:border-box;border:2px solid ' + col + ';box-shadow:0 0 10px ' + col + ';';
    document.body.appendChild(el);
    el.animate([{ opacity: 0.9, transform: 'scale(0.6)' }, { opacity: 0, transform: 'scale(3.2)' }], { duration: 800, easing: 'ease-out' }).onfinish = () => el.remove();
  };
`;

const ENTREES = `
    puce_combat: {
      nom: 'PUCE DE COMBAT', w: 56, h: 44, couleur: '#ff2e63', couleurs: ['#ff2e63', '#ffffff', '#ffe600'], duree: 20000,
      svg: (w, h) => '<svg width="' + w + '" height="' + h + '" viewBox="0 0 56 44" fill="none">' +
        '<path d="M2 11H8M2 19H8M2 27H8M2 35H8M48 11H54M48 19H54M48 27H54M48 35H54" stroke="#ffe600" stroke-width="2.4"/>' +
        '<polygon points="14,3 42,3 49,10 49,41 7,41 7,10" fill="#12060d" stroke="#ff2e63" stroke-width="2"/>' +
        '<circle cx="28" cy="22" r="10" stroke="#ff2e63" stroke-width="1.8"/>' +
        '<path d="M28 8V15M28 29V36M14 22H21M35 22H42" stroke="#ff2e63" stroke-width="1.6"/>' +
        '<path d="M19 31L37 13" stroke="#27e6ff" stroke-width="2.2"/>' +
        '<circle cx="28" cy="22" r="2.6" fill="#ffffff"/></svg>',
      tick(d, age, now, c, fin) {
        const t = age / 1000;
        d.x += (c.cx + Math.cos(t * 2.4) * c.larg * 0.55 - d.x) * 0.15;
        d.y += (c.haut + c.hauteur * 0.3 + Math.sin(t * 2.4) * 18 - d.y) * 0.15;
        poserDeco(d, d.x, d.y, Math.sin(t * 3) * 12, 0.8);
        if (absente()) { walker.style.filter = ''; return; }
        walker.style.filter = 'drop-shadow(0 0 ' + (fin ? 16 : 9) + 'px #ff2e63) saturate(1.3)';
        if (now > d.arc) {                                   // des coups de lame rouges la traversent
          d.arc = now + (fin ? 220 : 650);
          const sens = Math.random() < 0.5 ? 1 : -1;
          const x1 = c.left + c.larg * (sens > 0 ? alea(0, 0.3) : alea(0.7, 1)), y1 = c.haut + c.hauteur * alea(0.1, 0.45);
          eclair(x1, y1, x1 + sens * c.larg * alea(0.7, 1.1), y1 + c.hauteur * alea(0.25, 0.5), {
            couleur: '#ff2e63', halo: '#ff2e63', coeur: '#ffffff', epaisseur: 1.8, duree: 200, descente: 25,
            rugosite: 0.04, pas: 40, branches: 0, echelleBr: 0
          });
        }
        if (now > d.glitch) {                                // réflexes : elle fait un dash éclair
          d.glitch = now + alea(1000, 2200);
          const j = alea(14, 24) * (Math.random() < 0.5 ? -1 : 1);
          walker.animate([{ translate: '0px 0px' }, { translate: j + 'px 0px', offset: 0.3 }, { translate: '0px 0px' }], { duration: 200, easing: 'ease-out' });
          particules(c.cx, c.cy, {
            couleurs: ['#ff2e63', '#ffffff', '#ffe600'], n: 8, vmin: 120, vmax: 340, tailleMin: 2, tailleMax: 4,
            angleMin: -Math.PI, angleMax: Math.PI, duree: 350
          });
        }
      },
      nettoyer() { walker.style.filter = ''; }
    },
    puce_perso: {
      nom: 'PUCE PERSONNALITÉ', w: 50, h: 54, couleur: '#ff4fd8', couleurs: ['#ff4fd8', '#ffffff', '#27e6ff'], duree: 25000,
      svg: (w, h) => '<svg width="' + w + '" height="' + h + '" viewBox="0 0 50 54" fill="none">' +
        '<path d="M14 2V9M22 2V9M30 2V9M38 2V9M14 45V52M22 45V52M30 45V52M38 45V52" stroke="#ffe600" stroke-width="2.2"/>' +
        '<polygon points="9,9 41,9 46,14 46,45 4,45 4,14" fill="#12060d" stroke="#ff4fd8" stroke-width="2"/>' +
        '<path d="M25 38C14 31 13 21 19 18C22 16.5 24.5 18 25 20C25.5 18 28 16.5 31 18C37 21 36 31 25 38Z" fill="#ff4fd8" fill-opacity="0.35" stroke="#ffffff" stroke-width="1.8"/>' +
        '<path d="M9 30H15L18 26M41 30H35L32 26" stroke="#27e6ff" stroke-width="1.4"/></svg>',
      tick(d, age, now, c, fin) {
        const t = age / 1000;
        d.x += (c.cx - d.x) * 0.1;
        d.y += (c.haut - 30 + Math.sin(t * 2) * 5 - d.y) * 0.1;
        poserDeco(d, d.x, d.y, 0, 0.9 + 0.06 * Math.sin(t * 4));
        if (absente()) { walker.style.filter = ''; return; }
        walker.style.filter = 'drop-shadow(0 0 ' + (8 + 6 * Math.sin(t * 3)).toFixed(1) + 'px #ff4fd8)';
        if (now > d.arc) {                                   // des cœurs de pixels montent, des anneaux roses l'enveloppent
          d.arc = now + (fin ? 250 : 520);
          particules(c.cx + alea(-c.larg * 0.3, c.larg * 0.3), c.cy + alea(0, c.hauteur * 0.2), {
            couleurs: ['#ff4fd8', '#ffffff', '#ff4fd8'], n: 3, vmin: 40, vmax: 130, tailleMin: 3, tailleMax: 5,
            angleMin: -Math.PI * 0.8, angleMax: -Math.PI * 0.2, duree: 1000
          });
        }
        if (now > d.scan) { d.scan = now + 1800; anneauHolo(c.cx, c.cy, '#ff4fd8'); }
        if (now > d.glitch) { d.glitch = now + alea(5000, 8000); texteFlottant(c.cx, c.haut - 10, 'PERSONNALITÉ OK', '#ff4fd8'); }
      },
      nettoyer() { walker.style.filter = ''; }
    },
    cle_dechiff: {
      nom: 'CLÉ DE DÉCHIFFREMENT', w: 60, h: 30, couleur: '#00ffa3', couleurs: ['#00ffa3', '#27e6ff', '#ffffff'], duree: 20000,
      svg: (w, h) => '<svg width="' + w + '" height="' + h + '" viewBox="0 0 60 30" fill="none">' +
        '<circle cx="13" cy="15" r="10" stroke="#00ffa3" stroke-width="2.4"/>' +
        '<circle cx="13" cy="15" r="3.6" fill="#00ffa3"/>' +
        '<path d="M23 15H57M47 15V24M53 15V22M40 15V20" stroke="#00ffa3" stroke-width="2.6"/>' +
        '<path d="M7 7L10 9M19 23L16 21" stroke="#27e6ff" stroke-width="1.6"/></svg>',
      tick(d, age, now, c, fin) {
        const a = age / 1000 * 3.2;                          // la clé tourne autour d'elle
        d.x += (c.cx + Math.cos(a) * c.larg * 0.75 - d.x) * 0.25;
        d.y += (c.cy + Math.sin(a) * c.hauteur * 0.3 - d.y) * 0.25;
        poserDeco(d, d.x, d.y, Math.sin(a) * 25, 0.8);
        if (absente()) return;
        if (now > d.arc) { d.arc = now + 70; glyphe(d.x + alea(-8, 8), d.y + alea(-6, 6)); }
        if (now > d.scan) {                                  // un déchiffrement toutes les 2,5 s
          d.scan = now + (fin ? 1200 : 2500);
          const txt = ['AES-256 OK', 'DÉCHIFFRÉ', '0xA3F2 OK', 'ACCÈS ROOT'][Math.floor(Math.random() * 4)];
          texteFlottant(c.cx, c.haut - 6, txt, '#00ffa3');
          eclair(c.left, c.cy, c.left + c.larg, c.cy + alea(-12, 12), {
            couleur: '#00ffa3', halo: '#27e6ff', epaisseur: 1.3, duree: 240, descente: 30,
            rugosite: 0.3, pas: 6, branches: 0, echelleBr: 0
          });
        }
      }
    },
    script_glitch: {
      nom: 'SCRIPT GLITCH', w: 50, h: 50, couleur: '#b66bff', couleurs: ['#b66bff', '#ff2e63', '#27e6ff', '#ffffff'], duree: 20000,
      svg: (w, h) => '<svg width="' + w + '" height="' + h + '" viewBox="0 0 50 50" fill="none">' +
        '<polygon points="4,4 46,4 46,36 36,46 4,46" fill="#08000f" stroke="#b66bff" stroke-width="2"/>' +
        '<path d="M17 17L9 25L17 33M31 17L39 25L31 33M27 14L21 36" stroke="#ff2e63" stroke-width="2.4" transform="translate(-1.8 0)"/>' +
        '<path d="M17 17L9 25L17 33M31 17L39 25L31 33M27 14L21 36" stroke="#27e6ff" stroke-width="2.4" transform="translate(1.8 0)"/>' +
        '<path d="M17 17L9 25L17 33M31 17L39 25L31 33M27 14L21 36" stroke="#ffffff" stroke-width="2.2"/></svg>',
      tick(d, age, now, c, fin) {
        const t = age / 1000;
        d.x += (c.cx + Math.sin(t * 1.3) * c.larg * 0.5 - d.x) * 0.12;
        d.y += (c.haut - 18 + Math.sin(t * 3) * 6 - d.y) * 0.12;
        poserDeco(d, d.x + (Math.random() < 0.1 ? alea(-6, 6) : 0), d.y, 0, 0.85);
        if (absente()) return;
        if (now > d.glitch) {                                // Capri se dédouble en rouge et cyan
          d.glitch = now + (fin ? alea(150, 400) : alea(500, 1300));
          const j = alea(6, 12) * (Math.random() < 0.5 ? -1 : 1);
          walker.animate([
            { filter: 'none', translate: '0px 0px' },
            { filter: 'drop-shadow(' + (-j) + 'px 0 0 #ff2e63) drop-shadow(' + j + 'px 0 0 #27e6ff)', translate: j + 'px 0px', offset: 0.3 },
            { filter: 'drop-shadow(' + j + 'px 0 0 #ff2e63) drop-shadow(' + (-j) + 'px 0 0 #27e6ff) hue-rotate(90deg)', translate: (-j) + 'px 2px', offset: 0.65 },
            { filter: 'none', translate: '0px 0px' }
          ], { duration: 260, easing: 'steps(1)' });
          for (let i = 0; i < 4; i++) glyphe(c.cx + alea(-c.larg * 0.5, c.larg * 0.5), c.cy + alea(-c.hauteur * 0.4, c.hauteur * 0.4));
        }
        if (now > d.scan) { d.scan = now + alea(2500, 4000); glitchEcran(fin ? 500 : 300); }
      },
      fin(d) { glitchEcran(800); finDeco(d); }
    },
    dossier_arasaka: {
      nom: 'DOSSIER ARASAKA', w: 56, h: 46, couleur: '#ff2e63', couleurs: ['#ff2e63', '#ffffff', '#ffe600'], duree: 22000,
      svg: (w, h) => '<svg width="' + w + '" height="' + h + '" viewBox="0 0 56 46" fill="none">' +
        '<path d="M4 8H22L27 14H52V43H4Z" fill="#12060d" stroke="#ff2e63" stroke-width="2"/>' +
        '<path d="M8 14H48V38H8Z" fill="#ffffff" fill-opacity="0.12"/>' +
        '<path d="M12 20H34M12 25H30M12 30H26" stroke="#ffffff" stroke-opacity="0.55" stroke-width="1.4"/>' +
        '<path d="M4 17H52" stroke="#ff2e63" stroke-opacity="0.6" stroke-width="3"/>' +
        '<rect x="34" y="27" width="14" height="12" fill="#ffe600"/>' +
        '<path d="M37 27V23A4 4 0 0 1 45 23V27" stroke="#ffe600" stroke-width="2.2"/>' +
        '<circle cx="41" cy="33" r="2" fill="#12060d"/></svg>',
      tick(d, age, now, c, fin) {
        const t = age / 1000;
        if (!d.init) { d.init = true; texteFlottant(c.cx, c.haut - 6, 'TOP SECRET', '#ff2e63'); }
        d.x += (c.cx + Math.cos(t * 1.1) * c.larg * 0.5 - d.x) * 0.1;
        d.y += (c.haut - 24 + Math.sin(t * 2) * 8 - d.y) * 0.1;
        poserDeco(d, d.x, d.y, Math.sin(t * 1.5) * 8, 0.85);
        if (absente()) return;
        if (now > d.arc) {                                   // des fichiers s'échappent du dossier
          d.arc = now + (fin ? 500 : 1500);
          fichiers(d.x, d.y + 8, 2);
        }
        if (now > d.scan) {                                  // le cadenas grésille
          d.scan = now + 1400;
          particules(d.x + 10, d.y + 6, {
            couleurs: ['#ffe600', '#ffffff'], n: 5, vmin: 40, vmax: 140, tailleMin: 2, tailleMax: 3,
            angleMin: -Math.PI, angleMax: Math.PI, duree: 350
          });
        }
      },
      fin(d) { fichiers(d.x, d.y, 16); finDeco(d); }
    },`;

const DESCRIPTIONS = {
  puce_combat: 'Reflexes de solo : elle dashe et tranche l\'air. Glisse-la sur Capri.',
  puce_perso: 'Un halo rose, des coeurs de pixels : la vraie Capri se reveille. Glisse-la sur Capri.',
  cle_dechiff: 'Elle tourne autour de Capri et dechiffre tout sur son passage. Glisse-la sur Capri.',
  script_glitch: 'Capri se dedouble en rouge et cyan, l\'ecran deraille. Glisse-le sur Capri.',
  dossier_arasaka: 'Un dossier top secret flotte sur elle et lache des fichiers. Glisse-le sur Capri.'
};

// 1. Les aides + les 5 nouvelles entrées dans DECOS
const DEBUT = '  const DECOS = {\n';
if (!src.includes(DEBUT)) { console.error('Je ne trouve pas "const DECOS = {" : le fichier a change.'); process.exit(1); }
src = src.replace(DEBUT, AIDES + DEBUT + ENTREES.replace(/^\n/, '') + '\n');

// 2. Les descriptions du catalogue (pour dire qu'on peut les glisser sur Capri)
let ok = 0;
Object.keys(DESCRIPTIONS).forEach((id) => {
  const re = new RegExp("(id: '" + id + "'[^\\n]*?desc: ')((?:[^'\\\\]|\\\\.)*)(')");
  if (re.test(src)) { src = src.replace(re, (m, a, b, c) => a + DESCRIPTIONS[id].replace(/'/g, "\\'") + c); ok++; }
  else console.warn('Description non trouvee pour ' + id);
});

fs.copyFileSync(FICHIER, SAUVEGARDE);
fs.writeFileSync(FICHIER, src, 'utf8');
console.log('OK : 5 objets rendus fonctionnels (' + ok + ' descriptions mises a jour).');
console.log('Sauvegarde : ' + path.basename(SAUVEGARDE));
console.log('Relance Capri (ou Ctrl+R) pour voir les nouvelles icones.');
