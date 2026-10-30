// ===== Capri dort : on ne garde QUE personnage_rouge_9.png =====
// Usage : node appliquer_dodo.js   (dans le dossier du projet, là où est index.html)
// Sauvegarde : capri_dodo.avant_fix.js
const fs = require('fs');
const path = require('path');

const FICHIER = path.join(__dirname, 'capri_dodo.js');
const SAUVEGARDE = path.join(__dirname, 'capri_dodo.avant_fix.js');
const MARQUEUR = '// === GARDIEN DE L\'IMAGE DORT ===';

if (!fs.existsSync(FICHIER)) { console.error('Introuvable : ' + FICHIER); process.exit(1); }
let src = fs.readFileSync(FICHIER, 'utf8');
if (src.includes(MARQUEUR)) { console.log('Déjà appliqué, rien à faire.'); process.exit(0); }

const FONCTION = `  ${MARQUEUR}
  // Tant qu'elle dort, si un autre script change son image, on remet tout de suite celle du dodo.
  // (Quand elle sursaute ou se réveille, le gardien s'arrête tout seul : l'image de sursaut reste la bonne.)
  let gardien = null;
  function garderImageDort(s) {
    if (gardien) gardien.disconnect();
    const hauteur = sprite.style.height;
    const corriger = () => {
      if (etat !== 'dort' || s !== session) { if (gardien) { gardien.disconnect(); gardien = null; } return; }
      if (!sprite.src.endsWith(IMAGE_DORT)) {
        console.warn('Image parasite bloquee pendant le dodo : ' + sprite.src.split('/').pop());
        sprite.src = IMAGE_DORT;
      }
      if (sprite.style.height !== hauteur) sprite.style.height = hauteur;
    };
    gardien = new MutationObserver(corriger);
    gardien.observe(sprite, { attributes: true, attributeFilter: ['src', 'style'] });
    corriger();
  }

`;

const ANCRE1 = "  // ----- Elle s'endort -----\n";
const ANCRE2 = "    etat = 'dort';\n    clearInterval(zzzTimer);\n";
if (!src.includes(ANCRE1) || !src.includes(ANCRE2)) { console.error('Le fichier a change : je ne trouve pas les bons endroits.'); process.exit(1); }

src = src.replace(ANCRE1, FONCTION + ANCRE1);
src = src.replace(ANCRE2, "    etat = 'dort';\n    garderImageDort(s);\n    clearInterval(zzzTimer);\n");

fs.copyFileSync(FICHIER, SAUVEGARDE);
fs.writeFileSync(FICHIER, src, 'utf8');
console.log('OK : pendant le dodo, seule personnage_rouge_9.png reste affichée.');
console.log('Relance Capri (ou Ctrl+R). Si une autre image apparaît encore, ouvre la console (Ctrl+Maj+I) : son nom y sera écrit.');
