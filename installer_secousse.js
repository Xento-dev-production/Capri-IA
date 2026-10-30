// ===== Patch : le bug de Capri (puce) ne se déclenche qu'en la secouant fort =====
// Lance-le depuis le dossier de Capri :  node installer_secousse.js
const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'index.html');
if (!fs.existsSync(p)) { console.log('ERREUR : index.html introuvable. Ouvre le terminal dans le dossier de Capri.'); process.exit(1); }
let h = fs.readFileSync(p, 'utf8');
if (h.includes('dernierRetournement')) { console.log('Déjà installé, rien à faire.'); process.exit(0); }

const LOGIQUE = /if \(Math\.hypot\(vs, vsY\) > SECOUSSE_VITESSE\) secousse \+= dt;\s*else secousse = Math\.max\(0, secousse - dt \* 0\.5\);/;
if (!LOGIQUE.test(h) || !/let secousse = 0;/.test(h)) {
  console.log("ERREUR : je ne retrouve pas le code des secousses dans index.html (il a peut-être été modifié). Rien n'a été changé.");
  process.exit(1);
}
fs.copyFileSync(p, p + '.bak_secousse');

h = h.replace(/let secousse = 0;/, 'let dernierSensX = 0, dernierRetournement = 0;  // pour repérer les allers-retours\n  let secousse = 0;');
h = h.replace(LOGIQUE,
`// Une vraie secousse = des allers-retours rapides (pas juste un déplacement rapide dans un seul sens)
      const sensX = Math.abs(vs) > SECOUSSE_VITESSE * 0.6 ? Math.sign(vs) : 0;
      if (sensX !== 0) {
        if (dernierSensX !== 0 && sensX !== dernierSensX) dernierRetournement = now;
        dernierSensX = sensX;
      }
      if (Math.hypot(vs, vsY) > SECOUSSE_VITESSE && now - dernierRetournement < 250) secousse += dt;
      else secousse = Math.max(0, secousse - dt * 1.5);`);
h = h.replace(/(const SECOUSSE_VITESSE = )[\d.]+;/, '$11500;');
h = h.replace(/(const SECOUSSE_DUREE = )[\d.]+;/, '$11.2;');
h = h.replace(/(const CHANCE_BUG = )[\d.]+;/, '$10.6;');
h = h.replace(/(secousse = 0;\s*\n\s*curXAvant = curX;)/, 'dernierSensX = 0; dernierRetournement = 0;\n    $1');
fs.writeFileSync(p, h, 'utf8');
console.log('index.html modifié (sauvegarde : index.html.bak_secousse). Relance Capri avec npm start.');
console.log('Pour régler : SECOUSSE_VITESSE (plus grand = faut secouer plus fort), SECOUSSE_DUREE (plus grand = plus longtemps), CHANCE_BUG (plus petit = plus rare).');
