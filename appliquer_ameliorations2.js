// ===== MEGA-PATCH 2 : promos, succès, collection, casino, tri du sac, sauvegarde... =====
// Usage : node appliquer_ameliorations2.js   (dans le dossier du projet, là où est index.html)
// À lancer APRÈS appliquer_ameliorations.js. Sauvegarde : capri_inventaire.avant_ameliorations2.js
// Tout est vérifié avant d'écrire : si quelque chose ne colle pas, RIEN n'est modifié.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const FICHIER = path.join(__dirname, 'capri_inventaire.js');
const SAUVEGARDE = path.join(__dirname, 'capri_inventaire.avant_ameliorations2.js');
const MARQUEUR1 = '// === AMÉLIORATIONS MAGASIN ===';
const MARQUEUR2 = '// === AMÉLIORATIONS MAGASIN 2 ===';

if (!fs.existsSync(FICHIER)) { console.error('Introuvable : ' + FICHIER); process.exit(1); }
const brut = fs.readFileSync(FICHIER, 'utf8');
const crlf = brut.includes('\r\n');
let src = brut.replace(/\r\n/g, '\n');
if (src.includes(MARQUEUR2)) { console.log('Déjà appliqué, rien à faire.'); process.exit(0); }
if (!src.includes(MARQUEUR1)) { console.error("Lance d'abord : node appliquer_ameliorations.js"); process.exit(1); }

const erreurs = [];
function remplacer(nom, ancre, nouveau) {
  const n = src.split(ancre).length - 1;
  if (n !== 1) { erreurs.push(nom + ' (trouvé ' + n + ' fois)'); return; }
  src = src.replace(ancre, () => nouveau);
}

// ---------- 1. STYLE ----------
remplacer('style', '  .dr-wl, .dr-wr {',
`  .iv-onglets { gap:5px; }
  .iv-onglet { letter-spacing:1px; font-size:11px; }
  .iv-titre2 { font-size:10px; letter-spacing:3px; color:var(--cadre); margin:10px 0 5px; }
  .iv-coll { display:grid; grid-template-columns:repeat(8,1fr); gap:4px; margin:4px 0 8px; }
  .iv-coll > div { border:1px solid rgba(255,77,90,.45); height:44px; display:flex; align-items:center; justify-content:center; overflow:hidden; }
  .iv-coll > div.non { opacity:.2; filter:grayscale(1); }
  .iv-sc { display:flex; gap:8px; align-items:center; padding:6px 8px; margin-bottom:5px; border:1px solid rgba(255,77,90,.45); background:rgba(255,77,90,.05); font-size:11px; letter-spacing:1px; }
  .iv-sc.ok { border-color:var(--vert); background:rgba(0,255,163,.07); }
  .iv-sc > div { flex:1; min-width:0; }
  .iv-sc b { font-weight:normal; color:#e8fff6; }
  .iv-sc.ok b { color:var(--vert); }
  .iv-sc .d { display:block; margin-top:2px; font-size:9px; color:#9fb4cc; }
  .iv-sc em { font-style:normal; color:#ffe600; font-size:10px; }
  .iv-slots { display:flex; gap:10px; justify-content:center; margin:14px 0 10px; }
  .iv-slot { width:72px; height:72px; display:flex; align-items:center; justify-content:center; font-size:44px; background:#000; border:2px solid var(--cadre); box-shadow:inset 0 0 14px rgba(255,77,90,.35); }
  .iv-go { width:100%; box-sizing:border-box; padding:10px; font-size:13px; }
  .iv-ligne { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:6px; }
  .dr-wl, .dr-wr {`);

// ---------- 2. ONGLETS SUCCÈS + CASINO ----------
remplacer('onglets', "MARCHÉ NOIR</button></div>'",
  "MARCHÉ NOIR</button><button class=\"iv-onglet\" data-v=\"succes\">SUCCÈS</button><button class=\"iv-onglet\" data-v=\"casino\">CASINO</button></div>'");
remplacer('vue', "    if (v === 'inv') dessinerInventaire(); else dessinerMagasin();",
  "    if (v === 'inv') dessinerInventaire(); else if (v === 'succes') dessinerSucces(); else if (v === 'casino') dessinerCasino(); else dessinerMagasin();");

// ---------- 3. PROMOS : prix réduits partout ----------
remplacer('promo-bouton-maj', "boutons.forEach(({ b, o }) => b.classList.toggle('trop', eddies < o.prix));", "boutons.forEach(({ b, o }) => b.classList.toggle('trop', eddies < prixDe(o)));");
remplacer('promo-bouton', "b.className = 'iv-ach' + (eddies < o.prix ? ' trop' : '');", "b.className = 'iv-ach' + (eddies < prixDe(o) ? ' trop' : '');");
remplacer('promo-affichage', "' + o.prix + ' €$</div>'", "' + prixHtml(o) + '</div>'");
remplacer('promo-achat-1', 'Math.floor(eddies / o.prix)', 'Math.floor(eddies / prixDe(o))');
remplacer('promo-achat-2', 'eddies < o.prix * n', 'eddies < prixDe(o) * n');
remplacer('promo-achat-3', 'eddies -= o.prix * n;', 'eddies -= prixDe(o) * n;');
remplacer('promo-bandeau', '    corps.appendChild(rech);',
`    corps.appendChild(rech);
    const ban = document.createElement('div');
    ban.id = 'ivPromoT';
    ban.className = 'iv-note';
    ban.style.cssText = 'color:#ffe600;margin:0 0 8px;';
    ban.textContent = texteBandeauPromo();
    corps.appendChild(ban);`);

// ---------- 4. SAC : tri + plus de cases si besoin ----------
remplacer('tri-liste', '    const objets = CATALOGUE.filter((o) => inventaire[o.id] > 0);', '    const objets = trierObjets(CATALOGUE.filter((o) => inventaire[o.id] > 0));');
remplacer('tri-cases', '    for (let i = 0; i < NB_CASES; i++) {', '    for (let i = 0; i < Math.max(NB_CASES, objets.length); i++) {');
remplacer('tri-bouton', '    corps.append(grille, infoEl, note);',
`    const tb = document.createElement('button');
    tb.className = 'iv-filtre';
    tb.style.marginBottom = '8px';
    tb.textContent = 'TRI : ' + TRIS[triSac];
    tb.addEventListener('click', () => { triSac = (triSac + 1) % TRIS.length; ecrire('capri_tri', triSac); dessinerInventaire(); });
    corps.append(tb, grille, infoEl, note);`);

// ---------- 5. COMPTEURS pour les succès ----------
remplacer('compteur-gains', '    afficherGain(n);\n  }', '    afficherGain(n);\n    compter(\'gagnes\', n);\n  }');
remplacer('compteur-achat', "    messageBouton(b, n > 1 ? 'ACHETÉ x' + n : 'ACHETÉ');",
`    messageBouton(b, n > 1 ? 'ACHETÉ x' + n : 'ACHETÉ');
    compter('achats', n);
    compter('depenses', prixDe(o) * n);
    decouvrir(o.id);
    effetAchat(o, b);`);
remplacer('compteur-vente', "    annonce('VENDU : ' + o.nom + '  +' + gain + ' €$', '#ffe600', 1800);",
  "    annonce('VENDU : ' + o.nom + '  +' + gain + ' €$', '#ffe600', 1800);\n    compter('ventes', 1);");
remplacer('compteur-colis', "    if (o.id === 'colis') { ouvrirColis(); return; }", "    if (o.id === 'colis') { compter('utilises', 1); compter('colis', 1); ouvrirColis(); return; }");
remplacer('compteur-booster', "    if (o.id === 'booster') { activerBooster(); return; }", "    if (o.id === 'booster') { compter('utilises', 1); activerBooster(); return; }");
remplacer('compteur-utilise', '    Object.keys(o.effets).forEach((k) => { stats[k] = Math.min(100', '    compter(\'utilises\', 1);\n    Object.keys(o.effets).forEach((k) => { stats[k] = Math.min(100');
remplacer('compteur-colis-objet', '    window.CapriEddies.ajouterObjet(choix.id, 1);', '    window.CapriEddies.ajouterObjet(choix.id, 1);\n    decouvrir(choix.id);');
remplacer('compteur-deco', '    if (!window.CapriEddies.retirerObjet(id)) return false;', '    if (!window.CapriEddies.retirerObjet(id)) return false;\n    compter(\'decos\', 1);');

// ---------- 6. LE GROS BLOC DE NOUVEAU CODE ----------
remplacer('bloc', '  function utiliser(o) {',
`  ${MARQUEUR2}
  const REMISE_PROMO = 0.3;      // -30 % sur les objets en promo
  const NB_PROMOS = 2;           // nombre d'objets en promo (ils changent toutes les heures)
  const REVENU_MS = 120000;      // revenu passif : toutes les 2 minutes en balade...
  const REVENU_EDDIES = 3;       // ...Capri te rapporte ce nombre d'eddies
  const MISES = [10, 50, 100, 250];                      // mises possibles au casino
  const TRIS = ['CATALOGUE', 'RARETÉ', 'PRIX', 'QUANTITÉ'];

  // Sauvegardes supplémentaires
  const lire = (k, def) => { try { const v = JSON.parse(localStorage.getItem(k)); return v === null || v === undefined ? def : v; } catch (e) { return def; } };
  const ecrire = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  let compt = lire('capri_compt', {});
  let decouverts = lire('capri_decouverts', {});
  let succesFaits = lire('capri_succes', {});
  let triSac = (parseInt(lire('capri_tri', 0), 10) || 0) % TRIS.length;
  let miseCasino = MISES[0], tourneCasino = false;

  // ---- Promos : 2 objets à -30 % pendant une heure, puis ça change ----
  const heureCourante = () => Math.floor(Date.now() / 3600000);
  function idsPromo() {
    const h = heureCourante(), n = CATALOGUE.length, ids = [];
    for (let k = 0; ids.length < Math.min(NB_PROMOS, n) && k < 60; k++) {
      const id = CATALOGUE[(h * 7919 + k * 104729 + 13) % n].id;
      if (ids.indexOf(id) < 0) ids.push(id);
    }
    return ids;
  }
  const enPromo = (o) => idsPromo().indexOf(o.id) >= 0;
  const prixDe = (o) => (enPromo(o) ? Math.max(1, Math.round(o.prix * (1 - REMISE_PROMO))) : o.prix);
  const prixHtml = (o) => (enPromo(o)
    ? '<s style="color:#6b7a88">' + o.prix + '</s> ' + prixDe(o) + ' €$ <span style="color:#000;background:#ffe600;padding:0 4px;font-size:9px;letter-spacing:1px">PROMO -' + Math.round(REMISE_PROMO * 100) + '%</span>'
    : o.prix + ' €$');
  function texteBandeauPromo() {
    const noms = idsPromo().map((id) => parId(id).nom).join(', ');
    const reste = 3600 - (Math.floor(Date.now() / 1000) % 3600);
    const mm = String(Math.floor(reste / 60)).padStart(2, '0'), ss = String(reste % 60).padStart(2, '0');
    return '// PROMOS -' + Math.round(REMISE_PROMO * 100) + ' % : ' + noms + '  ·  FIN DANS ' + mm + ':' + ss;
  }
  let heurePromo = heureCourante();
  setInterval(() => {
    const el = document.getElementById('ivPromoT');
    if (el) el.textContent = texteBandeauPromo();
    if (heureCourante() !== heurePromo) { heurePromo = heureCourante(); if (ouvert && vue === 'shop') dessinerMagasin(); }
  }, 1000);

  // ---- Effet quand on achète (plus fort pour les objets rares) ----
  function effetAchat(o, b) {
    if (typeof particules !== 'function') return;
    const col = o.rar === 'epique' ? '#ff2e63' : (o.rar === 'rare' ? '#27e6ff' : '#00ffa3');
    const r = b.getBoundingClientRect();
    particules(r.left + r.width / 2, r.top + r.height / 2, {
      couleurs: [col, '#ffffff'], n: o.rar === 'epique' ? 26 : 10, vmin: 100, vmax: 320, tailleMin: 2, tailleMax: 4,
      angleMin: -Math.PI, angleMax: Math.PI, duree: 450
    });
    if (o.rar === 'epique' && typeof flashBlanc === 'function') flashBlanc(200, 0.15, col);
  }

  // ---- Tri du sac ----
  function trierObjets(liste) {
    const ordre = { epique: 0, rare: 1, commun: 2 };
    const rang = (x) => (ordre[x.rar] === undefined ? 3 : ordre[x.rar]);
    const l = liste.slice();
    if (triSac === 1) l.sort((a, b) => rang(a) - rang(b));
    else if (triSac === 2) l.sort((a, b) => b.prix - a.prix);
    else if (triSac === 3) l.sort((a, b) => (inventaire[b.id] || 0) - (inventaire[a.id] || 0));
    return l;
  }

  // ---- Succès, collection ----
  const nbDecouverts = () => CATALOGUE.filter((o) => decouverts[o.id] || inventaire[o.id] > 0).length;
  const serieBonus = () => { try { return parseInt(localStorage.getItem('capri_bonus_serie'), 10) || 0; } catch (e) { return 0; } };
  const SUCCES = [
    { id: 'achat1', nom: 'PREMIER ACHAT', desc: 'Achète un objet au marché noir.', gain: 20, ok: () => (compt.achats || 0) >= 1 },
    { id: 'achat10', nom: 'CLIENT FIDÈLE', desc: 'Achète 10 objets.', gain: 80, ok: () => (compt.achats || 0) >= 10 },
    { id: 'achat50', nom: 'GROS CLIENT', desc: 'Achète 50 objets.', gain: 300, ok: () => (compt.achats || 0) >= 50 },
    { id: 'vente5', nom: 'RECYCLEUR', desc: 'Vends 5 objets (clic droit dans le sac).', gain: 50, ok: () => (compt.ventes || 0) >= 5 },
    { id: 'util10', nom: 'TOUCHE-À-TOUT', desc: 'Utilise 10 objets.', gain: 60, ok: () => (compt.utilises || 0) >= 10 },
    { id: 'deco5', nom: 'MAÎTRE DU STYLE', desc: 'Glisse 5 objets sur Capri.', gain: 100, ok: () => (compt.decos || 0) >= 5 },
    { id: 'colis5', nom: 'CHASSEUR DE COLIS', desc: 'Ouvre 5 colis mystère.', gain: 120, ok: () => (compt.colis || 0) >= 5 },
    { id: 'riche', nom: 'PREMIER MILLIER', desc: 'Aie 1000 €$ en poche.', gain: 150, ok: () => eddies >= 1000 },
    { id: 'coll12', nom: 'COLLECTIONNEUR', desc: 'Découvre 12 objets différents.', gain: 200, ok: () => nbDecouverts() >= 12 },
    { id: 'collTout', nom: 'COMPLÉTISTE', desc: 'Découvre tous les objets du catalogue.', gain: 500, ok: () => nbDecouverts() >= CATALOGUE.length },
    { id: 'serie3', nom: 'FIDÈLE', desc: 'Reviens 3 jours de suite (bonus quotidien).', gain: 150, ok: () => serieBonus() >= 3 },
    { id: 'serie7', nom: 'ACCRO', desc: 'Reviens 7 jours de suite.', gain: 400, ok: () => serieBonus() >= 7 },
    { id: 'casino10', nom: 'JOUEUR', desc: 'Fais 10 parties au casino.', gain: 50, ok: () => (compt.casinoParties || 0) >= 10 },
    { id: 'jackpot', nom: 'JACKPOT', desc: 'Aligne trois têtes de mort au casino.', gain: 300, ok: () => (compt.jackpot || 0) >= 1 }
  ];
  function verifierSucces() {
    let delai = 0;
    SUCCES.forEach((s) => {
      if (succesFaits[s.id]) return;
      let ok = false;
      try { ok = s.ok(); } catch (e) {}
      if (!ok) return;
      succesFaits[s.id] = true;
      ecrire('capri_succes', succesFaits);
      setTimeout(() => {
        ajouter(s.gain);
        annonce('SUCCÈS : ' + s.nom + '  +' + s.gain + ' €$', '#ff4fd8', 3200);
        if (ouvert && vue === 'succes') dessinerSucces();
      }, delai);
      delai += 3300;
    });
  }
  function compter(k, n) {
    compt[k] = (compt[k] || 0) + (n === undefined ? 1 : n);
    ecrire('capri_compt', compt);
    verifierSucces();
  }
  function decouvrir(id) {
    if (decouverts[id]) return;
    decouverts[id] = true;
    ecrire('capri_decouverts', decouverts);
    verifierSucces();
  }
  CATALOGUE.forEach((o) => { if (inventaire[o.id] > 0) decouverts[o.id] = true; });
  setTimeout(verifierSucces, 4000);

  function faireBouton(txt, f) {
    const b = document.createElement('button');
    b.className = 'iv-filtre';
    b.textContent = txt;
    b.addEventListener('click', f);
    return b;
  }

  function dessinerSucces() {
    corps.innerHTML = '';
    CATALOGUE.forEach((o) => { if (inventaire[o.id] > 0) decouverts[o.id] = true; });
    const t1 = document.createElement('div');
    t1.className = 'iv-titre2';
    t1.textContent = 'COLLECTION  ' + nbDecouverts() + ' / ' + CATALOGUE.length;
    const coll = document.createElement('div');
    coll.className = 'iv-coll';
    CATALOGUE.forEach((o) => {
      const c = document.createElement('div');
      const vu = decouverts[o.id] || inventaire[o.id] > 0;
      c.className = vu ? '' : 'non';
      c.title = vu ? o.nom : '???';
      c.appendChild(icone(o));
      coll.appendChild(c);
    });
    const faits = SUCCES.filter((s) => succesFaits[s.id]).length;
    const t2 = document.createElement('div');
    t2.className = 'iv-titre2';
    t2.textContent = 'SUCCÈS  ' + faits + ' / ' + SUCCES.length;
    const liste = document.createElement('div');
    SUCCES.forEach((s) => {
      const fait = !!succesFaits[s.id];
      const r = document.createElement('div');
      r.className = 'iv-sc' + (fait ? ' ok' : '');
      const txt = document.createElement('div');
      const b = document.createElement('b');
      b.textContent = (fait ? '✓ ' : '▸ ') + s.nom;
      const d = document.createElement('span');
      d.className = 'd';
      d.textContent = s.desc;
      txt.append(b, d);
      const e = document.createElement('em');
      e.textContent = fait ? 'FAIT' : '+' + s.gain + ' €$';
      r.append(txt, e);
      liste.appendChild(r);
    });
    const t3 = document.createElement('div');
    t3.className = 'iv-titre2';
    t3.textContent = 'STATISTIQUES';
    const st = document.createElement('div');
    st.className = 'iv-note';
    st.style.lineHeight = '1.7';
    st.textContent = 'ACHATS ' + (compt.achats || 0) + '  ·  VENTES ' + (compt.ventes || 0) + '  ·  OBJETS UTILISÉS ' + (compt.utilises || 0) +
      '  ·  GAGNÉ ' + (compt.gagnes || 0) + ' €$  ·  DÉPENSÉ ' + (compt.depenses || 0) + ' €$  ·  CASINO ' + (compt.casinoParties || 0) +
      ' PARTIES, BILAN ' + ((compt.casinoNet || 0) >= 0 ? '+' : '') + (compt.casinoNet || 0) + ' €$';
    const ligne = document.createElement('div');
    ligne.className = 'iv-ligne';
    ligne.style.marginTop = '8px';
    ligne.append(
      faireBouton('EXPORTER LA SAUVEGARDE', () => {
        const o = {};
        for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf('capri') === 0) o[k] = localStorage.getItem(k); }
        navigator.clipboard.writeText(JSON.stringify(o)).then(
          () => annonce('SAUVEGARDE COPIÉE DANS LE PRESSE-PAPIER', '#00ffa3', 2000),
          () => annonce('COPIE IMPOSSIBLE', '#ff2e63', 1800));
      }),
      faireBouton('IMPORTER (PRESSE-PAPIER)', () => {
        navigator.clipboard.readText().then((t) => {
          const o = JSON.parse(t);
          const ks = Object.keys(o).filter((k) => k.indexOf('capri') === 0);
          if (!ks.length) throw new Error('vide');
          ks.forEach((k) => localStorage.setItem(k, String(o[k])));
          annonce('IMPORTÉ : RECHARGEMENT...', '#00ffa3', 1500);
          setTimeout(() => location.reload(), 1200);
        }).catch(() => annonce('SAUVEGARDE INVALIDE', '#ff2e63', 1800));
      })
    );
    corps.append(t1, coll, t2, liste, t3, st, ligne);
  }

  // ---- Casino : machine à sous (eddies virtuels, juste pour s'amuser) ----
  const SYM = [
    { c: '◆', col: '#27e6ff', p: 0.28, x3: 3, x2: 1 },
    { c: '▲', col: '#00ffa3', p: 0.24, x3: 4, x2: 1 },
    { c: '●', col: '#ffe600', p: 0.20, x3: 5, x2: 2 },
    { c: '✚', col: '#ff4fd8', p: 0.14, x3: 8, x2: 2 },
    { c: '★', col: '#ffc247', p: 0.09, x3: 15, x2: 3 },
    { c: '☠', col: '#ff2e63', p: 0.05, x3: 25, x2: 3 }
  ];
  function tirerSym() { let t = Math.random(); for (const s of SYM) { t -= s.p; if (t <= 0) return s; } return SYM[0]; }
  function gainCasino(r, mise) {
    if (r[0] === r[1] && r[1] === r[2]) return mise * r[0].x3;
    const paire = (r[0] === r[1] || r[0] === r[2]) ? r[0] : (r[1] === r[2] ? r[1] : null);
    return paire ? mise * paire.x2 : 0;
  }
  function dessinerCasino() {
    corps.innerHTML = '';
    const t = document.createElement('div');
    t.className = 'iv-titre2';
    t.textContent = 'MACHINE À SOUS  //  JEU FICTIF, EDDIES VIRTUELS';
    const mises = document.createElement('div');
    mises.className = 'iv-ligne';
    MISES.forEach((m) => {
      const b = faireBouton(m + ' €$', () => { if (!tourneCasino) { miseCasino = m; dessinerCasino(); } });
      if (m === miseCasino) b.classList.add('actif');
      mises.appendChild(b);
    });
    const rouleaux = document.createElement('div');
    rouleaux.className = 'iv-slots';
    const cases = [0, 1, 2].map(() => {
      const c = document.createElement('div');
      c.className = 'iv-slot';
      c.textContent = '?';
      c.style.color = '#6b7a88';
      rouleaux.appendChild(c);
      return c;
    });
    const resultat = document.createElement('div');
    resultat.className = 'iv-note';
    resultat.style.cssText = 'text-align:center;font-size:12px;min-height:16px;margin:0 0 8px;';
    const go = document.createElement('button');
    go.className = 'iv-ach iv-go' + (tourneCasino ? ' trop' : '');
    go.textContent = 'LANCER  (-' + miseCasino + ' €$)';
    const aide = document.createElement('div');
    aide.className = 'iv-note';
    aide.style.lineHeight = '1.7';
    aide.textContent = '// 3 IDENTIQUES : x3 A x25  ·  PAIRE : x1 A x3  ·  ☠ ☠ ☠ = JACKPOT x25';

    go.addEventListener('click', () => {
      if (tourneCasino) return;
      if (eddies < miseCasino) return messageBouton(go, 'TROP CHER');
      const mise = miseCasino;
      if (!window.CapriEddies.depenser(mise)) return;
      tourneCasino = true;
      const r = [tirerSym(), tirerSym(), tirerSym()];
      go.classList.add('trop');
      resultat.textContent = '...';
      resultat.style.color = '';
      const stops = [700, 1100, 1500], t0 = Date.now();
      const iv = setInterval(() => {
        if (!document.body.contains(rouleaux)) { clearInterval(iv); return; }
        cases.forEach((el, i) => {
          const s = Date.now() - t0 >= stops[i] ? r[i] : SYM[Math.floor(Math.random() * SYM.length)];
          el.textContent = s.c;
          el.style.color = s.col;
        });
      }, 70);
      setTimeout(() => {
        clearInterval(iv);
        const g = gainCasino(r, mise);
        tourneCasino = false;
        if (g > 0) ajouter(g);
        compter('casinoParties', 1);
        compter('casinoNet', g - mise);
        if (r[0] === r[1] && r[1] === r[2] && r[0].c === '☠') compter('jackpot', 1);
        if (document.body.contains(rouleaux)) {
          cases.forEach((el, i) => { el.textContent = r[i].c; el.style.color = r[i].col; });
          go.classList.remove('trop');
          resultat.textContent = g > mise ? 'GAGNÉ : +' + (g - mise) + ' €$ !' : (g === mise ? 'REMBOURSÉ' : (g > 0 ? 'PERDU : -' + (mise - g) + ' €$' : 'PERDU : -' + mise + ' €$'));
          resultat.style.color = g > mise ? '#00ffa3' : (g === mise ? '#27e6ff' : '#ff2e63');
        }
        if (g >= mise * 8) annonce('CASINO : +' + g + ' €$ !!!', '#ffe600', 2600);
      }, 1600);
    });
    corps.append(t, mises, rouleaux, resultat, go, aide);
  }

  // ---- Revenu passif : Capri te rapporte quelques eddies quand elle se balade ----
  setInterval(() => { if (document.body.classList.contains('enAnim')) ajouter(REVENU_EDDIES); }, REVENU_MS);

  // ---- Touches 1 à 4 : changer d'onglet quand le sac est ouvert ----
  document.addEventListener('keydown', (e) => {
    if (!ouvert || e.ctrlKey || e.altKey || e.metaKey) return;
    const tg = e.target;
    if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.isContentEditable)) return;
    const v = { '1': 'inv', '2': 'shop', '3': 'succes', '4': 'casino' }[e.key];
    if (v) changerVue(v);
  });

  function utiliser(o) {`);

// ---------- Vérifications ----------
if (erreurs.length) {
  console.error("Rien n'a été modifié. Ces morceaux n'ont pas été trouvés (le fichier a changé ?) :");
  erreurs.forEach((e) => console.error('  - ' + e));
  process.exit(1);
}
try { new vm.Script(src, { filename: 'capri_inventaire.js' }); }
catch (e) { console.error("Le résultat aurait une erreur de syntaxe, rien n'a été modifié : " + e.message); process.exit(1); }

fs.copyFileSync(FICHIER, SAUVEGARDE);
fs.writeFileSync(FICHIER, crlf ? src.replace(/\n/g, '\r\n') : src, 'utf8');
console.log('OK : toutes les nouvelles améliorations sont appliquées. Sauvegarde : ' + path.basename(SAUVEGARDE));
console.log('Relance Capri (ou Ctrl+R).');
