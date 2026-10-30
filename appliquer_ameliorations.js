// ===== MEGA-PATCH : plein d'améliorations pour le sac et le marché noir, en un seul fichier =====
// Usage : node appliquer_ameliorations.js   (dans le dossier du projet, là où est index.html)
// Sauvegarde : capri_inventaire.avant_ameliorations.js
// Tout est vérifié avant d'écrire : si quelque chose ne colle pas, RIEN n'est modifié.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const FICHIER = path.join(__dirname, 'capri_inventaire.js');
const SAUVEGARDE = path.join(__dirname, 'capri_inventaire.avant_ameliorations.js');
const MARQUEUR = '// === AMÉLIORATIONS MAGASIN ===';

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

// ---------- 1. STYLE ----------
remplacer('style', '  .dr-wl, .dr-wr {',
`  .iv-rech { width:100%; box-sizing:border-box; margin-bottom:8px; padding:6px 8px; background:#000; color:#e8fff6; border:1px solid var(--cadre); font-family:inherit; font-size:12px; letter-spacing:1px; outline:none; user-select:text; }
  .iv-rech:focus { border-color:var(--vert); box-shadow:0 0 8px rgba(0,255,163,.35); }
  .iv-stock { margin-top:3px; font-size:9px; letter-spacing:1px; color:#6b7a88; }
  .iv-art.epique { animation:ivepique 2.4s ease-in-out infinite; }
  @keyframes ivepique { 50% { box-shadow:0 0 12px rgba(255,46,99,.55); } }
  .iv-eb.bas { animation:ivbas .7s steps(2,start) infinite; }
  @keyframes ivbas { 50% { opacity:.35; } }
  .dr-wl, .dr-wr {`);

// ---------- 2. NOUVEAUX OBJETS DU CATALOGUE ----------
remplacer('catalogue', "    { id: 'lunettes',",
`    { id: 'colis',        cat: 'mods',    rar: 'epique', nom: 'COLIS MYSTÈRE',  prix: 80,  emoji: '📦', img: '', desc: 'Clique pour ouvrir : un objet au hasard, ou des eddies.', effets: {} },
    { id: 'booster',      cat: 'scripts', rar: 'rare',   nom: 'BOOSTER €$',     prix: 100, emoji: '🚀', img: '', desc: 'x2 eddies par message pendant 5 minutes. Clique pour activer.', effets: {} },
    { id: 'megapack',     cat: 'energie', rar: 'epique', nom: 'MÉGA-PACK',      prix: 300, emoji: '🎁', img: '', desc: 'Remplit un peu tout : mémoire, énergie, humeur et lien.', effets: { faim: 30, energie: 30, humeur: 30, affection: 30 } },
    { id: 'lunettes',`);

// ---------- 3. ÉTAT DE LA RECHERCHE ----------
remplacer('recherche', "  let vue = 'inv', filtre = 'puces',", "  let recherche = '';\n  let vue = 'inv', filtre = 'puces',");

// ---------- 4. ICÔNES SPÉCIALES (colis, booster, méga-pack) ----------
remplacer('icones', '    w.innerHTML = iconeSVG(item.cat);',
`    if (ICONES_SPE[item.id]) { w.innerHTML = ICONES_SPE[item.id]; w.style.filter = 'drop-shadow(0 0 5px ' + (item.rar === 'epique' ? '#ff2e63' : '#27e6ff') + ')'; return w; }
    w.innerHTML = iconeSVG(item.cat);`);

// ---------- 5. SAC : texte d'aide + clic droit pour vendre ----------
remplacer('sac-note', "note.textContent = objets.length ? '' :",
  "note.textContent = objets.length ? '// ' + objets.length + ' / ' + NB_CASES + ' OBJETS  ·  CLIC DROIT SUR UN OBJET = VENDRE (' + Math.round(VENTE_TAUX * 100) + ' %)' :");
remplacer('sac-vendre', "        c.addEventListener('mouseleave', () => { infoEl.textContent = ''; });",
`        c.addEventListener('mouseleave', () => { infoEl.textContent = ''; });
        c.addEventListener('contextmenu', (ev) => { ev.preventDefault(); ev.stopPropagation(); vendre(o); });`);
remplacer('sac-info', '    infoEl.append(n, barres(o.effets));',
`    infoEl.append(n, barres(o.effets));
    const vh = document.createElement('div');
    vh.style.color = '#ffe600';
    vh.textContent = '▸ CLIC DROIT : VENDRE (+' + Math.max(1, Math.floor(o.prix * VENTE_TAUX)) + ' €$)';
    infoEl.appendChild(vh);`);

// ---------- 6. MAGASIN : TOUT + recherche, raretés, stock, achat x5 ----------
remplacer('magasin-filtre', '    CATALOGUE.filter((o) => o.cat === filtre).forEach((o) => {',
`    const bt = document.createElement('button');
    bt.className = 'iv-filtre' + (filtre === 'tout' ? ' actif' : '');
    bt.textContent = 'TOUT';
    bt.addEventListener('click', () => { filtre = 'tout'; dessinerMagasin(); });
    f.insertBefore(bt, f.firstChild);
    const rech = document.createElement('input');
    rech.className = 'iv-rech';
    rech.placeholder = 'RECHERCHER...  (MAJ + CLIC SUR ACHETER = x5)';
    rech.value = recherche;
    rech.autocomplete = 'off';
    rech.spellcheck = false;
    rech.addEventListener('input', () => {
      recherche = rech.value.trim().toLowerCase();
      const p = rech.selectionStart;
      dessinerMagasin();
      const n = corps.querySelector('.iv-rech');
      if (n) { n.focus(); n.setSelectionRange(p, p); }
    });
    corps.appendChild(rech);
    CATALOGUE.filter((o) => (filtre === 'tout' || o.cat === filtre) && (!recherche || o.nom.toLowerCase().indexOf(recherche) >= 0)).forEach((o) => {`);
remplacer('magasin-rarete', "      a.className = 'iv-art';",
`      a.className = 'iv-art' + (o.rar === 'epique' ? ' epique' : '');
      a.style.borderColor = COUL_RAR[o.rar] || '';`);
remplacer('magasin-nom', '      t.firstChild.textContent = o.nom;', "      t.firstChild.textContent = o.nom + '   [' + String(o.rar).toUpperCase() + ']';");
remplacer('magasin-stock', '      t.children[2].appendChild(barres(o.effets));',
`      t.children[2].appendChild(barres(o.effets));
      const sk = document.createElement('div');
      sk.className = 'iv-stock';
      sk.textContent = 'EN STOCK : ' + (inventaire[o.id] || 0);
      t.appendChild(sk);`);
remplacer('achat-clic', "      b.addEventListener('click', () => acheter(o, b));", "      b.addEventListener('click', (ev) => acheter(o, b, ev.shiftKey ? 5 : 1));");
remplacer('achat-fonction', '  function acheter(o, b) {',
  '  function acheter(o, b, n) {\n    n = n || 1;\n    if (n > 1) n = Math.max(1, Math.min(n, Math.floor(eddies / o.prix)));');
remplacer('achat-trop-cher', "    if (eddies < o.prix) return messageBouton(b, 'TROP CHER');", "    if (eddies < o.prix * n) return messageBouton(b, 'TROP CHER');");
remplacer('achat-debit', '    eddies -= o.prix;', '    eddies -= o.prix * n;');
remplacer('achat-objet', '    inventaire[o.id] = (inventaire[o.id] || 0) + 1;', '    inventaire[o.id] = (inventaire[o.id] || 0) + n;');
remplacer('achat-message', "    messageBouton(b, 'ACHETÉ');",
`    messageBouton(b, n > 1 ? 'ACHETÉ x' + n : 'ACHETÉ');
    const skk = b.parentNode && b.parentNode.querySelector('.iv-stock');
    if (skk) skk.textContent = 'EN STOCK : ' + inventaire[o.id];`);

// ---------- 7. EDDIES : bonus de humeur/lien, booster x2, affichage x2 ----------
remplacer('gain-message', 'ajouter(GAIN_MIN + Math.floor(Math.random() * (GAIN_MAX - GAIN_MIN + 1)))', 'ajouter(gainMessage())');
remplacer('solde-bouton', "    document.getElementById('ivBtnEd').textContent = eddies;", "    document.getElementById('ivBtnEd').textContent = eddies + (boostActif() ? ' x2' : '');");
remplacer('toast-gain', "    toast.textContent = '+' + n + ' €$';", "    toast.style.color = ''; toast.style.textShadow = '';\n    toast.textContent = '+' + n + ' €$';");
remplacer('toast-utiliser', "      toast.textContent = o.nom + ' ✓';", "      toast.style.color = ''; toast.style.textShadow = '';\n      toast.textContent = o.nom + ' ✓';");

// ---------- 8. JAUGES : clignotent quand elles sont basses + alerte ----------
remplacer('jauge-basse', "      r.className = 'iv-eb';\n      r.style.setProperty('--c', COUL_EFFETS[k]);", "      r.className = 'iv-eb' + (v < 20 ? ' bas' : '');\n      r.style.setProperty('--c', COUL_EFFETS[k]);");
remplacer('jauge-alerte', "    ['faim', 'energie', 'humeur'].forEach((k) => { stats[k] = Math.max(0, stats[k] - 1); });",
`    ['faim', 'energie', 'humeur'].forEach((k) => { stats[k] = Math.max(0, stats[k] - 1); });
    ['faim', 'energie', 'humeur'].forEach((k) => { if (stats[k] === 15 || stats[k] === 5) alerteStat(k); });`);

// ---------- 9. UTILISER : colis et booster ----------
remplacer('utiliser-special', '    if (!window.CapriEddies.retirerObjet(o.id)) return;',
`    if (!window.CapriEddies.retirerObjet(o.id)) return;
    if (o.id === 'colis') { ouvrirColis(); return; }
    if (o.id === 'booster') { activerBooster(); return; }`);

// ---------- 10. LE GROS BLOC DE NOUVEAU CODE (avant "function utiliser") ----------
remplacer('bloc', '  function utiliser(o) {',
`  ${MARQUEUR}
  const VENTE_TAUX = 0.5;        // on revend un objet à 50 % de son prix (clic droit dans le sac)
  const BOOST_MS = 300000;       // durée du booster d'eddies (ms) : 5 minutes
  const BONUS_BASE = 40;         // bonus quotidien : eddies le 1er jour
  const BONUS_PAR_JOUR = 10;     // eddies de plus par jour d'affilée
  const BONUS_MAX_SERIE = 6;     // la série s'arrête de monter après ce nombre de jours
  const BONUS_HUMEUR = 5;        // eddies en plus par message quand HUMEUR >= 80
  const BONUS_LIEN = 5;          // eddies en plus par message quand LIEN >= 80
  const POIDS_RAR = { commun: 60, rare: 30, epique: 10 };   // chances du colis mystère

  const ICONES_SPE = {
    colis: '<svg width="38" height="38" viewBox="0 0 40 40" fill="none"><rect x="6" y="14" width="28" height="22" fill="#12060d" stroke="#ff2e63" stroke-width="2"/><rect x="3" y="8" width="34" height="7" fill="#12060d" stroke="#ff2e63" stroke-width="2"/><path d="M20 8V36" stroke="#ffe600" stroke-width="2"/><text x="20" y="31" text-anchor="middle" font-size="13" font-weight="bold" fill="#ffe600" stroke="none">?</text></svg>',
    booster: '<svg width="38" height="38" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="16" fill="#02121a" stroke="#27e6ff" stroke-width="2"/><path d="M22 5L13 19H19L17 28L27 14H21Z" fill="#ffe600"/><text x="20" y="36" text-anchor="middle" font-size="10" font-weight="bold" fill="#27e6ff" stroke="none">x2</text></svg>',
    megapack: '<svg width="38" height="38" viewBox="0 0 40 40" fill="none"><rect x="4" y="4" width="32" height="32" fill="#000" stroke="#ff2e63" stroke-width="2"/><rect x="7" y="7" width="12" height="12" fill="#ffe600" fill-opacity="0.85"/><rect x="21" y="7" width="12" height="12" fill="#27e6ff" fill-opacity="0.85"/><rect x="7" y="21" width="12" height="12" fill="#00ffa3" fill-opacity="0.85"/><rect x="21" y="21" width="12" height="12" fill="#ff2e63" fill-opacity="0.85"/><path d="M20 12V28M12 20H28" stroke="#ffffff" stroke-width="2.4"/></svg>'
  };

  // Un message temporaire près du bouton SAC (couleur et durée au choix)
  function annonce(txt, col, ms) {
    ms = ms || 1800;
    toast.textContent = txt;
    toast.style.color = col || '';
    toast.style.textShadow = col ? '0 0 8px ' + col : '';
    toast.style.display = 'block';
    toast.getAnimations().forEach((a) => a.cancel());
    toast.animate([
      { opacity: 0, transform: 'translateY(10px)' },
      { opacity: 1, transform: 'translateY(0)', offset: 0.12 },
      { opacity: 1, transform: 'translateY(-4px)', offset: 0.85 },
      { opacity: 0, transform: 'translateY(-14px)' }
    ], { duration: ms, easing: 'ease-out' });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.style.display = 'none'; toast.style.color = ''; toast.style.textShadow = ''; }, ms);
    if (typeof flashBlanc === 'function' && col) flashBlanc(180, 0.12, col);
  }

  // Vendre un objet (clic droit dans le sac)
  function vendre(o) {
    const gain = Math.max(1, Math.floor(o.prix * VENTE_TAUX));
    if (!window.CapriEddies.retirerObjet(o.id)) return;
    ajouter(gain);
    annonce('VENDU : ' + o.nom + '  +' + gain + ' €$', '#ffe600', 1800);
  }

  // Colis mystère : un objet au hasard (selon sa rareté) ou, 1 fois sur 5, une somme d'eddies
  function ouvrirColis() {
    if (Math.random() < 0.2) {
      const g = 40 + Math.floor(Math.random() * 120);
      ajouter(g);
      annonce('COLIS : ' + g + ' €$ !', '#ffe600', 2400);
      return;
    }
    const pool = CATALOGUE.filter((x) => x.id !== 'colis');
    let total = 0;
    pool.forEach((x) => { total += POIDS_RAR[x.rar] || 10; });
    let t = Math.random() * total, choix = pool[0];
    for (const x of pool) { t -= POIDS_RAR[x.rar] || 10; if (t <= 0) { choix = x; break; } }
    window.CapriEddies.ajouterObjet(choix.id, 1);
    annonce('COLIS : ' + choix.nom + ' [' + String(choix.rar).toUpperCase() + '] !', choix.rar === 'epique' ? '#ff2e63' : (choix.rar === 'rare' ? '#27e6ff' : '#00ffa3'), 2600);
  }

  // Booster : les eddies gagnés par message sont doublés pendant 5 minutes (le temps s'additionne)
  let boostFin = 0;
  try { boostFin = parseInt(localStorage.getItem('capri_booster'), 10) || 0; } catch (e) {}
  const boostActif = () => Date.now() < boostFin;
  function activerBooster() {
    boostFin = Math.max(Date.now(), boostFin) + BOOST_MS;
    try { localStorage.setItem('capri_booster', String(boostFin)); } catch (e) {}
    annonce('BOOSTER ACTIF : x2 €$ PENDANT ' + Math.round((boostFin - Date.now()) / 60000) + ' MIN', '#27e6ff', 2600);
    majCompteurs();
  }
  setInterval(() => majCompteurs(), 5000);   // le "x2" disparaît tout seul à la fin

  // Eddies gagnés pour une réponse de Capri
  function gainMessage() {
    let g = GAIN_MIN + Math.floor(Math.random() * (GAIN_MAX - GAIN_MIN + 1));
    if (stats.humeur >= 80) g += BONUS_HUMEUR;
    if (stats.affection >= 80) g += BONUS_LIEN;
    return boostActif() ? g * 2 : g;
  }

  // Alerte quand une jauge devient basse
  function alerteStat(k) {
    if (!document.body.classList.contains('enAnim')) return;
    annonce(NOMS_EFFETS[k] + ' BASSE ! UN PASSAGE AU MARCHÉ NOIR ?', '#ff2e63', 2800);
  }

  // Bonus quotidien : le premier lancement de la journée (en mode balade) rapporte des eddies, de plus en plus si tu reviens tous les jours
  let bonusEnAttente = null;
  (function () {
    const cle = (d) => d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    const jour = cle(new Date()), hier = cle(new Date(Date.now() - 86400000));
    let dernier = '', serie = 0;
    try { dernier = localStorage.getItem('capri_bonus_jour') || ''; serie = parseInt(localStorage.getItem('capri_bonus_serie'), 10) || 0; } catch (e) {}
    if (dernier === jour) return;
    serie = dernier === hier ? serie + 1 : 1;
    bonusEnAttente = { jour, serie, n: BONUS_BASE + BONUS_PAR_JOUR * Math.min(serie - 1, BONUS_MAX_SERIE) };
  })();
  function reclamerBonus() {
    if (!bonusEnAttente || !document.body.classList.contains('enAnim')) return;
    const b = bonusEnAttente;
    bonusEnAttente = null;
    try { localStorage.setItem('capri_bonus_jour', b.jour); localStorage.setItem('capri_bonus_serie', String(b.serie)); } catch (e) {}
    setTimeout(() => {
      ajouter(b.n);
      annonce('BONUS QUOTIDIEN  JOUR ' + b.serie + '  +' + b.n + ' €$', '#ffe600', 3400);
    }, 2500);
  }
  new MutationObserver(reclamerBonus).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  setTimeout(reclamerBonus, 500);

  // Raccourci clavier : la touche I ouvre et ferme le sac (sauf quand tu écris quelque part)
  document.addEventListener('keydown', (e) => {
    if ((e.key !== 'i' && e.key !== 'I') || e.ctrlKey || e.altKey || e.metaKey) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (!document.body.classList.contains('enAnim')) return;
    btn.click();
  });

  function utiliser(o) {`);

// ---------- Vérifications ----------
if (erreurs.length) {
  console.error('Rien n\'a été modifié. Ces morceaux n\'ont pas été trouvés (le fichier a changé ?) :');
  erreurs.forEach((e) => console.error('  - ' + e));
  process.exit(1);
}
try { new vm.Script(src, { filename: 'capri_inventaire.js' }); }
catch (e) { console.error('Le résultat aurait une erreur de syntaxe, rien n\'a été modifié : ' + e.message); process.exit(1); }

fs.copyFileSync(FICHIER, SAUVEGARDE);
fs.writeFileSync(FICHIER, crlf ? src.replace(/\n/g, '\r\n') : src, 'utf8');
console.log('OK : toutes les améliorations sont appliquées. Sauvegarde : ' + path.basename(SAUVEGARDE));
console.log('Relance Capri (ou Ctrl+R).');
