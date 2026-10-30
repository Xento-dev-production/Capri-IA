// ===== La fenêtre du sac / marché noir devient déplaçable (reste appuyé dessus et glisse) =====
// Usage : node appliquer_deplacer.js   (dans le dossier du projet, là où est index.html)
// Sauvegarde : capri_inventaire.avant_deplacer.js
// Double-clic sur le titre INVENTAIRE = la fenêtre revient à sa place d'origine.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const FICHIER = path.join(__dirname, 'capri_inventaire.js');
const SAUVEGARDE = path.join(__dirname, 'capri_inventaire.avant_deplacer.js');
const MARQUEUR = '// === PANNEAU DÉPLAÇABLE ===';

if (!fs.existsSync(FICHIER)) { console.error('Introuvable : ' + FICHIER); process.exit(1); }
const brut = fs.readFileSync(FICHIER, 'utf8');
const crlf = brut.includes('\r\n');
let src = brut.replace(/\r\n/g, '\n');
if (src.includes(MARQUEUR)) { console.log('Déjà appliqué, rien à faire.'); process.exit(0); }

const erreurs = [];
function remplacer(nom, ancre, nouveau) {
  const n = src.split(ancre).length - 1;
  if (n !== 1) { erreurs.push(nom + ' (trouvé ' + n + ' fois)'); return; }
  src = src.replace(ancre, () => nouveau);
}

// 1. La hauteur maximale du panneau suit sa position (sinon il dépasserait en bas de l'écran)
remplacer('hauteur-panneau', 'max-height:calc(100vh - ${PANNEAU_HAUT + 20}px);', 'max-height:calc(100vh - var(--ivt, ${PANNEAU_HAUT}px) - 20px);');
remplacer('hauteur-contenu', 'max-height:calc(100vh - ${PANNEAU_HAUT + 28}px);', 'max-height:calc(100vh - var(--ivt, ${PANNEAU_HAUT}px) - 28px);');
remplacer('curseur', '  .dr-wl, .dr-wr {', '  #ivPanel .iv-tete { cursor:grab; }\n  .dr-wl, .dr-wr {');

// 2. Le code du déplacement
remplacer('code', '  function utiliser(o) {',
`  ${MARQUEUR}
  const POS_CLE = 'capri_iv_pos';
  function placerPanneau(x, y) {
    const w = panel.offsetWidth || 420;
    x = Math.min(Math.max(0, x), Math.max(0, window.innerWidth - w));
    y = Math.min(Math.max(0, y), Math.max(0, window.innerHeight - 60));
    panel.style.left = x + 'px';
    panel.style.top = y + 'px';
    panel.style.right = 'auto';
    panel.style.setProperty('--ivt', y + 'px');
    return { x, y };
  }
  function reinitPanneau() {
    panel.style.left = ''; panel.style.top = ''; panel.style.right = '';
    panel.style.removeProperty('--ivt');
    try { localStorage.removeItem(POS_CLE); } catch (e) {}
  }
  // On retrouve la dernière place de la fenêtre
  try {
    const p = JSON.parse(localStorage.getItem(POS_CLE));
    if (p && typeof p.x === 'number' && typeof p.y === 'number') placerPanneau(p.x, p.y);
  } catch (e) {}
  window.addEventListener('resize', () => {
    if (panel.style.left) placerPanneau(parseFloat(panel.style.left), parseFloat(panel.style.top));
  });
  panel.querySelector('.iv-tete').addEventListener('dblclick', (e) => {
    if (e.target.closest('button')) return;
    reinitPanneau();
  });

  // Reste appuyé n'importe où sur la fenêtre (sauf boutons, cases d'objets, champ de recherche, barre de défilement) et glisse
  panel.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('input, textarea, button, select, .iv-case.plein')) return;
    if (e.target === corps && e.clientX > corps.getBoundingClientRect().left + corps.clientWidth) return;
    const r = panel.getBoundingClientRect();
    const dx = e.clientX - r.left, dy = e.clientY - r.top, x0 = e.clientX, y0 = e.clientY;
    let bouge = false, pos = null;
    try { panel.setPointerCapture(e.pointerId); } catch (err) {}
    const suivre = (m) => {
      if (!bouge && Math.hypot(m.clientX - x0, m.clientY - y0) < 4) return;
      if (!bouge) { bouge = true; panel.style.cursor = 'grabbing'; }
      pos = placerPanneau(m.clientX - dx, m.clientY - dy);
    };
    const fin = () => {
      panel.removeEventListener('pointermove', suivre);
      panel.removeEventListener('pointerup', fin);
      panel.removeEventListener('pointercancel', fin);
      panel.style.cursor = '';
      if (bouge && pos) { try { localStorage.setItem(POS_CLE, JSON.stringify(pos)); } catch (err) {} }
    };
    panel.addEventListener('pointermove', suivre);
    panel.addEventListener('pointerup', fin);
    panel.addEventListener('pointercancel', fin);
  });

  function utiliser(o) {`);

if (erreurs.length) {
  console.error("Rien n'a été modifié. Ces morceaux n'ont pas été trouvés (le fichier a changé ?) :");
  erreurs.forEach((e) => console.error('  - ' + e));
  process.exit(1);
}
try { new vm.Script(src, { filename: 'capri_inventaire.js' }); }
catch (e) { console.error("Le résultat aurait une erreur de syntaxe, rien n'a été modifié : " + e.message); process.exit(1); }

fs.copyFileSync(FICHIER, SAUVEGARDE);
fs.writeFileSync(FICHIER, crlf ? src.replace(/\n/g, '\r\n') : src, 'utf8');
console.log('OK : la fenêtre du sac est déplaçable. Sauvegarde : ' + path.basename(SAUVEGARDE));
console.log('Relance Capri (ou Ctrl+R).');
