// ===== CAPRI : INVENTAIRE + MAGASIN + EDDIES =====
// Fichier autonome : aucune modification de main.js ni de index.html, sauf la ligne <script> à ajouter.
// Les eddies montent à chaque réponse de Capri (discussion normale ET tablette).
(() => {
  // ---------- RÉGLAGES ----------
  const GAIN_MIN = 15;           // eddies gagnés par message (min et max)
  const GAIN_MAX = 25;
  const ACHAT_ACTIF = true;      // false = le bouton ACHETER affiche "BIENTÔT" ; true = l'achat marche vraiment
  const NB_CASES = 20;           // nombre de cases de l'inventaire
  const BOUTON_GAUCHE = 150;     // position du bouton INVENTAIRE (pixels depuis la gauche, à côté de PARLER)
  const BOUTON_HAUT = 18;
  const PANNEAU_DROITE = 18;     // position du panneau
  const PANNEAU_HAUT = 90;
  // Images de l'interface (laisse vide '' = dessin de remplacement)
  const IMG_EDDIES = '';         // ex. 'ui_eddies.png'
  const IMG_INVENTAIRE = '';     // ex. 'ui_sac.png'
  const IMG_COLIS = '';          // ex. 'ui_colis.png' (pour la future animation "commande en route")

  // ---------- CATALOGUE ----------
  // img : nom du fichier image (quand tu l'ajouteras, il remplacera l'emoji tout seul)
  // effets : faim / energie / humeur / affection (les noms internes restent les mêmes, pour ne rien casser ailleurs)
  // rar : 'commun', 'rare' ou 'epique' (change la couleur du nom)
  const CATEGORIES = [
    ['puces', 'PUCES'], ['dossiers', 'DOSSIERS'], ['codes', 'CODES'],
    ['scripts', 'SCRIPTS'], ['energie', 'ÉNERGIE'], ['mods', 'MODS']
  ];
  const COUL_RAR = { commun: 'var(--vert)', rare: '#27e6ff', epique: '#ff2e63' };
  const CATALOGUE = [
    { id: 'puce_memoire',  cat: 'puces',    rar: 'commun', nom: 'PUCE MÉMOIRE',        prix: 30,  emoji: '💾', img: 'item_puce_memoire.png',  desc: 'Une puce de stockage standard.',          effets: { faim: 25 } },
    { id: 'puce_combat',   cat: 'puces',    rar: 'rare',   nom: 'PUCE DE COMBAT',      prix: 120, emoji: '🧿', img: 'item_puce_combat.png',   desc: 'Reflexes de solo : elle dashe et tranche l\'air. Glisse-la sur Capri.',       effets: { energie: 20, humeur: 15 } },
    { id: 'puce_perso',    cat: 'puces',    rar: 'epique', nom: 'PUCE PERSONNALITÉ',   prix: 250, emoji: '🧠', img: 'item_puce_perso.png',    desc: 'Un halo rose, des coeurs de pixels : la vraie Capri se reveille. Glisse-la sur Capri.',                effets: { humeur: 40, affection: 15 } },
    { id: 'shard',         cat: 'puces',    rar: 'rare',   nom: 'SHARD CORROMPU',      prix: 45,  emoji: '🔮', img: 'item_shard.png',         desc: 'Il la fait glitcher de partout. Glisse-le sur Capri.',      effets: { humeur: 25, faim: 10 } },
    { id: 'dossier_souv',  cat: 'dossiers', rar: 'commun', nom: 'DOSSIER SOUVENIRS',   prix: 35,  emoji: '📁', img: 'item_dossier_souv.png',  desc: 'Des vieux souvenirs de Night City.',      effets: { humeur: 12, affection: 10 } },
    { id: 'dossier_corr',  cat: 'dossiers', rar: 'commun', nom: 'DOSSIER CORROMPU',    prix: 15,  emoji: '📂', img: 'item_dossier_corr.png',  desc: 'À moitié illisible, mais ça se mange.',   effets: { faim: 12 } },
    { id: 'dossier_arasaka', cat: 'dossiers', rar: 'epique', nom: 'DOSSIER ARASAKA',   prix: 180, emoji: '🗂️', img: 'item_dossier_arasaka.png', desc: 'Un dossier top secret flotte sur elle et lache des fichiers. Glisse-le sur Capri.',     effets: { faim: 40, humeur: 20 } },
    { id: 'code_acces',    cat: 'codes',    rar: 'commun', nom: "CODE D'ACCÈS",        prix: 20,  emoji: '🔑', img: 'item_code_acces.png',    desc: 'Ouvre une porte, pas forcément la bonne.', effets: { faim: 15 } },
    { id: 'cle_dechiff',   cat: 'codes',    rar: 'rare',   nom: 'CLÉ DE DÉCHIFFREMENT', prix: 60, emoji: '🗝️', img: 'item_cle_dechiff.png',   desc: 'Elle tourne autour de Capri et dechiffre tout sur son passage. Glisse-la sur Capri.',     effets: { faim: 30, humeur: 5 } },
    { id: 'mdp_vole',      cat: 'codes',    rar: 'rare',   nom: 'MOT DE PASSE VOLÉ',   prix: 90,  emoji: '🔐', img: 'item_mdp_vole.png',      desc: 'Pas très légal, mais très fun.',          effets: { humeur: 20, affection: 10 } },
    { id: 'script_repar',  cat: 'scripts',  rar: 'commun', nom: 'SCRIPT DE RÉPARATION', prix: 40, emoji: '🛠️', img: 'item_script_repar.png',  desc: 'Répare les petits bugs de ses implants.', effets: { energie: 20, faim: 10 } },
    { id: 'script_boost',  cat: 'scripts',  rar: 'rare',   nom: 'SCRIPT DE BOOST',     prix: 70,  emoji: '⚡', img: 'item_script_boost.png',  desc: 'Un coup de fouet pour son processeur.',   effets: { energie: 45 } },
    { id: 'script_glitch', cat: 'scripts',  rar: 'commun', nom: 'SCRIPT GLITCH',       prix: 55,  emoji: '👾', img: 'item_script_glitch.png', desc: 'Capri se dedouble en rouge et cyan, l\'ecran deraille. Glisse-le sur Capri.',            effets: { humeur: 30 } },
    { id: 'script_compa',  cat: 'scripts',  rar: 'epique', nom: 'SCRIPT COMPAGNON',    prix: 110, emoji: '💬', img: 'item_script_compa.png',  desc: 'Elle se sent moins seule.',               effets: { affection: 30, humeur: 15 } },
    { id: 'cellule',       cat: 'energie',  rar: 'commun', nom: "CELLULE D'ÉNERGIE",   prix: 12,  emoji: '🔋', img: 'item_cellule.png',       desc: 'La batterie de base.',                    effets: { energie: 25 } },
    { id: 'batterie_lourde', cat: 'energie', rar: 'rare',  nom: 'BATTERIE LOURDE',     prix: 35,  emoji: '🪫', img: 'item_batterie_lourde.png', desc: 'Pour tenir toute une nuit.',            effets: { energie: 55 } },
    { id: 'surcharge',     cat: 'energie',  rar: 'epique', nom: 'SURCHARGE',           prix: 95,  emoji: '🔌', img: 'item_surcharge.png',     desc: 'Elle crépite d\'électricité, puis se décharge. Glisse-la sur Capri.', effets: { energie: 80, humeur: 10 } },
    { id: 'holofleurs',    cat: 'mods',     rar: 'commun', nom: 'HOLO-FLEURS',         prix: 60,  emoji: '💐', img: 'item_holofleurs.png',    desc: 'Un bouquet flotte sur elle et des fleurs poussent sur son passage. Glisse-le sur Capri.', effets: { affection: 25, humeur: 15 } },
    { id: 'drone',         cat: 'mods',     rar: 'rare',   nom: 'MINI-DRONE',          prix: 90,  emoji: '🤖', img: '',         desc: 'Un petit copain qui vole autour. Glisse-le sur Capri.',        effets: { humeur: 35 } },
    { id: 'lunettes',      cat: 'mods',     rar: 'rare',   nom: 'LUNETTES HOLO',       prix: 150, emoji: '🕶️', img: 'item_lunettes.png',      desc: 'Elle les porte sur le nez, avec HUD intégré. Glisse-les sur Capri.',                effets: { affection: 30 } }
  ];
  const NOMS_EFFETS = { faim: 'MÉMOIRE', energie: 'ÉNERGIE', humeur: 'HUMEUR', affection: 'LIEN' };
  const effetsTexte = (o) => Object.keys(o).map((k) => NOMS_EFFETS[k] + ' +' + o[k]).join('  ·  ');
  const parId = (id) => CATALOGUE.find((x) => x.id === id);

  // ---------- SAUVEGARDE ----------
  let eddies = 0, inventaire = {};
  try { eddies = parseInt(localStorage.getItem('capri_eddies'), 10) || 0; } catch (e) {}
  try { inventaire = JSON.parse(localStorage.getItem('capri_inventaire')) || {}; } catch (e) {}
  const sauver = () => {
    try {
      localStorage.setItem('capri_eddies', String(eddies));
      localStorage.setItem('capri_inventaire', JSON.stringify(inventaire));
    } catch (e) {}
  };

  // ---------- STYLE ----------
  const css = document.createElement('style');
  css.textContent = `
  #ivBtn { display:none; position:fixed; z-index:62; cursor:pointer; top:${BOUTON_HAUT}px; left:${BOUTON_GAUCHE}px;
    translate:0 -320%; transition:translate 0.6s cubic-bezier(0.2,0.9,0.25,1.08); }
  body.enAnim #ivBtn { display:block; }
  body.dockOuvert #ivBtn { translate:0 0; }
  #ivBtn:hover .tag-in { filter:brightness(1.5); }
  .iv-ed { display:inline-flex; align-items:center; justify-content:center; min-width:22px; height:16px; padding:0 3px; box-sizing:border-box;
    font-size:9px; font-weight:bold; letter-spacing:0; color:#000; background:var(--cyan); vertical-align:middle;
    clip-path:polygon(0 0,100% 0,100% 70%,82% 100%,0 100%); }
  .iv-ed img { height:14px; display:block; }
  #ivPanel { display:none; position:fixed; z-index:65; width:420px; max-height:calc(100vh - ${PANNEAU_HAUT + 20}px);
    top:${PANNEAU_HAUT}px; right:${PANNEAU_DROITE}px; }
  #ivPanel .rb-in { padding:14px 16px; max-height:calc(100vh - ${PANNEAU_HAUT + 28}px); overflow:hidden; display:flex; flex-direction:column; }
  #ivPanel .rb-cadre { max-height:inherit; }
  .iv-tete { display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .iv-titre { display:flex; align-items:center; gap:8px; font-size:17px; letter-spacing:4px; color:var(--vert); text-shadow:0 0 8px rgba(0,255,163,.6); }
  .iv-titre::before { content:""; width:8px; height:8px; background:var(--rouge); }
  .iv-titre img { height:20px; }
  .iv-solde { display:flex; align-items:center; gap:7px; font-size:16px; letter-spacing:2px; color:var(--cyan); text-shadow:0 0 6px rgba(39,230,255,.5); }
  .iv-solde .iv-ed { height:20px; min-width:28px; font-size:11px; }
  .iv-solde.bump { animation:ivbump .45s ease-out; }
  @keyframes ivbump { 40% { transform:scale(1.25); color:#fff; } }
  #ivFermer { width:26px; height:26px; background:#000; color:var(--cadre); border:1px solid var(--cadre); cursor:pointer; font-family:inherit; }
  #ivFermer:hover { background:rgba(255,77,90,.2); }
  .iv-onglets { display:flex; gap:8px; margin:12px 0 10px; }
  .iv-onglet { flex:1; padding:7px 0; background:#000; color:var(--vert); border:1px solid var(--vert); cursor:pointer;
    font-family:inherit; font-size:12px; letter-spacing:3px; }
  .iv-onglet:hover { background:rgba(0,255,163,.12); }
  .iv-onglet.actif { background:var(--vert); color:#000; font-weight:bold; box-shadow:0 0 10px rgba(0,255,163,.5); }
  .iv-corps { overflow-y:auto; min-height:0; flex:1; padding-right:4px; }
  .iv-corps::-webkit-scrollbar { width:8px; }
  .iv-corps::-webkit-scrollbar-track { background:#000; border-left:1px solid var(--cadre); }
  .iv-corps::-webkit-scrollbar-thumb { background:var(--vert); box-shadow:0 0 6px var(--vert); }
  .iv-corps::-webkit-scrollbar-button { display:none; }
  .iv-grille { display:grid; grid-template-columns:repeat(5,1fr); gap:6px; }
  .iv-case { --c:8px; position:relative; aspect-ratio:1; background:var(--cadre); padding:2px; box-sizing:border-box;
    clip-path:polygon(0 0,100% 0,100% calc(100% - var(--c)),calc(100% - var(--c)) 100%,0 100%); }
  .iv-case.vide { background:rgba(255,77,90,.35); }
  .iv-case.plein { animation:alerte 1.6s steps(2,start) infinite; cursor:help; }
  .iv-case-in { height:100%; background:#000; display:flex; align-items:center; justify-content:center; position:relative;
    clip-path:polygon(0 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%); }
  .iv-ico { font-size:26px; line-height:1; display:flex; align-items:center; justify-content:center; }
  .iv-ico img { max-width:42px; max-height:42px; display:block; -webkit-user-drag:none; }
  .iv-qte { position:absolute; right:4px; bottom:2px; font-size:10px; color:var(--cyan); text-shadow:0 0 4px var(--cyan); }
  .iv-info { margin-top:10px; min-height:34px; font-size:11px; letter-spacing:1.5px; line-height:1.5; color:var(--cyan); }
  .iv-filtres { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px; }
  .iv-filtre { padding:3px 10px; background:transparent; color:var(--cadre); border:1px solid var(--cadre); cursor:pointer;
    font-family:inherit; font-size:10px; letter-spacing:2px; }
  .iv-filtre.actif { background:var(--cadre); color:#000; }
  .iv-art { display:flex; align-items:center; gap:10px; padding:8px; margin-bottom:6px; border:1px solid rgba(255,77,90,.5); background:rgba(255,77,90,.05); }
  .iv-art .iv-ico { width:46px; height:46px; flex-shrink:0; background:#000; border:1px solid var(--cadre); }
  .iv-art-txt { flex:1; min-width:0; }
  .iv-art-nom { font-size:12px; letter-spacing:2px; color:var(--vert); }
  .iv-art-desc { margin-top:3px; font-size:10px; letter-spacing:1px; color:#9fb4cc; }
  .iv-art-eff { margin-top:3px; font-size:9px; letter-spacing:1px; color:var(--cyan); }
  .iv-art-prix { margin-top:3px; font-size:12px; color:#ffe600; }
  .iv-ach { flex-shrink:0; padding:7px 10px; background:#000; color:var(--vert); border:1px solid var(--vert); cursor:pointer;
    font-family:inherit; font-size:11px; letter-spacing:2px; }
  .iv-ach:hover { background:rgba(0,255,163,.15); }
  .iv-ach.trop { color:#6b7a88; border-color:#6b7a88; cursor:not-allowed; }
  .iv-ach.mal { color:var(--rouge); border-color:var(--rouge); }
  .iv-note { margin-top:8px; font-size:9px; letter-spacing:2px; color:#6b7a88; }
  #ivToast { display:none; position:fixed; z-index:66; pointer-events:none; left:${BOUTON_GAUCHE}px; top:${BOUTON_HAUT + 44}px;
    font-size:15px; font-weight:bold; letter-spacing:2px; color:var(--cyan); text-shadow:0 0 8px var(--cyan); }
  .iv-eb { display:grid; grid-template-columns:70px 1fr 32px; align-items:center; gap:6px; margin-top:3px; font-size:9px; letter-spacing:1px; color:var(--c); }
  #ivStats { margin:0 0 10px; padding:6px 8px; border:1px solid rgba(255,77,90,.45); background:rgba(255,77,90,.05); }
  .iv-eb-b { height:6px; border:1px solid var(--c); padding:1px; box-sizing:border-box; }
  .iv-eb-f { height:100%; background:repeating-linear-gradient(90deg,var(--c) 0 3px,transparent 3px 5px); box-shadow:0 0 4px var(--c); }
  .iv-eb b { font-weight:normal; text-align:right; }
  .dr-wl, .dr-wr { transform-box:fill-box; animation:drflap .14s steps(2) infinite; }
  .dr-wl { transform-origin:100% 50%; } .dr-wr { transform-origin:0 50%; }
  @keyframes drflap { 50% { transform:scaleY(.55); } }
  .dr-eye { animation:dreye 2.4s steps(1) infinite; }
  @keyframes dreye { 0%,90%,100% { opacity:1; } 94% { opacity:.15; } }
  `;
  document.head.appendChild(css);

  // ---------- STRUCTURE ----------
  const iconeEd = () => IMG_EDDIES ? '<span class="iv-ed"><img src="' + IMG_EDDIES + '"></span>' : '<span class="iv-ed">€$</span>';

  const btn = document.createElement('div');
  btn.id = 'ivBtn';
  btn.innerHTML = '<div class="tag-cadre"><div class="tag-in" style="padding:5px 12px 6px 9px"><div class="tag-t" style="font-size:12px;letter-spacing:3px">' +
    (IMG_INVENTAIRE ? '<img src="' + IMG_INVENTAIRE + '" style="height:14px">' : '') + 'SAC&nbsp;<span id="ivBtnEd"></span></div></div></div>';
  document.body.appendChild(btn);

  const panel = document.createElement('div');
  panel.id = 'ivPanel';
  panel.innerHTML = '<div class="rb-cadre"><div class="rb-in">' +
    '<div class="iv-tete"><div class="iv-titre">' + (IMG_INVENTAIRE ? '<img src="' + IMG_INVENTAIRE + '">' : '') + 'INVENTAIRE</div>' +
    '<div class="iv-solde" id="ivSolde"></div><button id="ivFermer" title="Fermer">✕</button></div>' +
    '<div class="iv-onglets"><button class="iv-onglet actif" data-v="inv">SAC</button><button class="iv-onglet" data-v="shop">MARCHÉ NOIR</button></div>' +
    '<div id="ivStats"></div><div class="iv-corps" id="ivCorps"></div><div class="rb-scan"></div></div></div>';
  document.body.appendChild(panel);

  const toast = document.createElement('div');
  toast.id = 'ivToast';
  document.body.appendChild(toast);

  const corps = panel.querySelector('#ivCorps');
  const solde = panel.querySelector('#ivSolde');
  let vue = 'inv', filtre = 'puces', ouvert = false, survol = false, infoEl = null;

  // ---------- AFFICHAGE ----------
  function icone(item) {
    const w = document.createElement('div');
    w.className = 'iv-ico';
    if (item.id === 'drone') { w.innerHTML = droneSVG(42, 28); return w; }
    if (DECOS[item.id]) { w.innerHTML = iconeDeco(item.id); w.style.filter = 'drop-shadow(0 0 4px ' + DECOS[item.id].couleur + ')'; return w; }
    w.innerHTML = iconeSVG(item.cat);
    w.style.color = COUL_RAR[item.rar] || COUL_RAR.commun;
    w.style.filter = 'drop-shadow(0 0 4px currentColor)';
    if (item.img) {                       // l'image remplace l'emoji dès qu'elle existe
      const im = new Image();
      im.draggable = false;
      im.onload = () => { w.textContent = ''; w.appendChild(im); };
      im.src = item.img;
    }
    return w;
  }

  function majCompteurs() {
    solde.innerHTML = iconeEd() + '<span>' + eddies + '</span>';
    document.getElementById('ivBtnEd').textContent = eddies;
    if (ouvert && vue === 'shop') majBoutonsAchat();
  }

  function dessinerInventaire() {
    corps.innerHTML = '';
    const grille = document.createElement('div');
    grille.className = 'iv-grille';
    const objets = CATALOGUE.filter((o) => inventaire[o.id] > 0);
    for (let i = 0; i < NB_CASES; i++) {
      const o = objets[i];
      const c = document.createElement('div');
      c.className = 'iv-case ' + (o ? 'plein' : 'vide');
      const dedans = document.createElement('div');
      dedans.className = 'iv-case-in';
      if (o) {
        dedans.appendChild(icone(o));
        const q = document.createElement('div');
        q.className = 'iv-qte';
        q.textContent = 'x' + inventaire[o.id];
        dedans.appendChild(q);
        c.addEventListener('mouseenter', () => montrerInfo(o));
        c.addEventListener('mouseleave', () => { infoEl.textContent = ''; });
        if (o.id === 'drone') { c.style.cursor = 'grab'; c.addEventListener('pointerdown', (e) => glisserDrone(e)); }
        else if (DECOS[o.id]) { c.style.cursor = 'grab'; c.addEventListener('pointerdown', (e) => glisserDeco(e, o.id)); }
        else { c.style.cursor = 'pointer'; c.addEventListener('click', () => utiliser(o)); }
      }
      c.appendChild(dedans);
      grille.appendChild(c);
    }
    infoEl = document.createElement('div');
    infoEl.className = 'iv-info';
    const note = document.createElement('div');
    note.className = 'iv-note';
    note.textContent = objets.length ? '' : '// STOCKAGE VIDE : VA FAIRE UN TOUR AU MARCHÉ NOIR';
    corps.append(grille, infoEl, note);
  }

  let boutons = [];
  function majBoutonsAchat() {
    boutons.forEach(({ b, o }) => b.classList.toggle('trop', eddies < o.prix));
  }

  function dessinerMagasin() {
    corps.innerHTML = '';
    boutons = [];
    const f = document.createElement('div');
    f.className = 'iv-filtres';
    CATEGORIES.forEach(([k, nom]) => {
      const b = document.createElement('button');
      b.className = 'iv-filtre' + (filtre === k ? ' actif' : '');
      b.textContent = nom;
      b.addEventListener('click', () => { filtre = k; dessinerMagasin(); });
      f.appendChild(b);
    });
    corps.appendChild(f);
    CATALOGUE.filter((o) => o.cat === filtre).forEach((o) => {
      const a = document.createElement('div');
      a.className = 'iv-art';
      a.appendChild(icone(o));
      const t = document.createElement('div');
      t.className = 'iv-art-txt';
      t.innerHTML = '<div class="iv-art-nom"></div><div class="iv-art-desc"></div><div class="iv-art-eff"></div><div class="iv-art-prix">' + o.prix + ' €$</div>';
      t.firstChild.textContent = o.nom;
      t.firstChild.style.color = COUL_RAR[o.rar] || COUL_RAR.commun;
      t.children[1].textContent = o.desc;
      t.children[2].appendChild(barres(o.effets));
      const b = document.createElement('button');
      b.className = 'iv-ach' + (eddies < o.prix ? ' trop' : '');
      b.textContent = 'ACHETER';
      b.addEventListener('click', () => acheter(o, b));
      a.append(t, b);
      corps.appendChild(a);
      boutons.push({ b, o });
    });
    const note = document.createElement('div');
    note.className = 'iv-note';
    note.textContent = ACHAT_ACTIF ? '' : '// MARCHÉ NOIR FERMÉ POUR L\'INSTANT';
    corps.appendChild(note);
  }

  function messageBouton(b, txt) {
    const ancien = b.textContent;
    b.textContent = txt;
    b.classList.add('mal');
    b.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], { duration: 220 });
    setTimeout(() => { b.textContent = ancien; b.classList.remove('mal'); }, 1100);
  }

  function acheter(o, b) {
    if (!ACHAT_ACTIF) return messageBouton(b, 'BIENTÔT');
    if (eddies < o.prix) return messageBouton(b, 'TROP CHER');
    eddies -= o.prix;
    inventaire[o.id] = (inventaire[o.id] || 0) + 1;
    sauver();
    majCompteurs();
    messageBouton(b, 'ACHETÉ');
    b.classList.remove('mal');
  }

  function changerVue(v) {
    vue = v;
    panel.querySelectorAll('.iv-onglet').forEach((b) => b.classList.toggle('actif', b.dataset.v === v));
    if (v === 'inv') dessinerInventaire(); else dessinerMagasin();
  }

  // ---------- OUVERTURE / FERMETURE ----------
  const maj = () => { if (typeof majClic === 'function') majClic(); };

  function ouvrir() {
    if (ouvert) return;
    ouvert = true;
    panel.style.display = 'block';
    changerVue(vue);
    panel.animate([
      { clipPath: 'inset(0 0 100% 0)', opacity: 0.3 },
      { clipPath: 'inset(0 0 0% 0)', opacity: 1 }
    ], { duration: 520, easing: 'steps(14)' });
    if (typeof decoder === 'function') decoder(panel.querySelector('.iv-titre'), 'INVENTAIRE', 450);
    maj();
  }
  function fermer() {
    if (!ouvert) return;
    ouvert = false;
    survol = false;
    panel.style.display = 'none';
    maj();
  }

  btn.addEventListener('click', () => (ouvert ? fermer() : ouvrir()));
  panel.querySelector('#ivFermer').addEventListener('click', fermer);
  panel.querySelectorAll('.iv-onglet').forEach((b) => b.addEventListener('click', () => changerVue(b.dataset.v)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fermer(); });

  // La souris doit "accrocher" le bouton et le panneau (le reste de l'écran laisse passer les clics)
  [btn, panel].forEach((el) => {
    el.addEventListener('mouseenter', () => { survol = true; maj(); });
    el.addEventListener('mouseleave', () => { survol = false; maj(); });
  });
  if (typeof uiCapte === 'function') {
    const ancienne = uiCapte;
    window.uiCapte = () => ancienne() || survol || ouvert;
  }

  // Quand la balade s'arrête, le panneau se ferme
  new MutationObserver(() => { if (!document.body.classList.contains('enAnim')) fermer(); })
    .observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // ---------- LES EDDIES ----------
  let toastTimer = null;
  function afficherGain(n) {
    solde.classList.remove('bump');
    void solde.offsetWidth;
    solde.classList.add('bump');
    if (!document.body.classList.contains('enAnim')) return;
    toast.textContent = '+' + n + ' €$';
    toast.style.display = 'block';
    toast.getAnimations().forEach((a) => a.cancel());
    toast.animate([
      { opacity: 0, transform: 'translateY(10px)' },
      { opacity: 1, transform: 'translateY(0)', offset: 0.15 },
      { opacity: 1, transform: 'translateY(-4px)', offset: 0.75 },
      { opacity: 0, transform: 'translateY(-14px)' }
    ], { duration: 1800, easing: 'ease-out' });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.style.display = 'none'; }, 1800);
  }

  function ajouter(n) {
    eddies += n;
    sauver();
    majCompteurs();
    afficherGain(n);
  }

  // Chaque réponse réussie de Capri rapporte quelques eddies (on écoute l'historique de la conversation)
  if (typeof history !== 'undefined' && Array.isArray(history)) {
    history.push = function (...items) {
      items.forEach((m) => {
        if (m && m.role === 'assistant') ajouter(GAIN_MIN + Math.floor(Math.random() * (GAIN_MAX - GAIN_MIN + 1)));
      });
      return Array.prototype.push.apply(this, items);
    };
  }

  // Pour le futur système (objets installés ou exécutés par Capri, etc.)
  window.CapriEddies = {
    solde: () => eddies,
    ajouter,
    depenser: (n) => { if (eddies < n) return false; eddies -= n; sauver(); majCompteurs(); return true; },
    quantite: (id) => inventaire[id] || 0,
    ajouterObjet: (id, n = 1) => { inventaire[id] = (inventaire[id] || 0) + n; sauver(); if (ouvert && vue === 'inv') dessinerInventaire(); },
    retirerObjet: (id, n = 1) => {
      if ((inventaire[id] || 0) < n) return false;
      inventaire[id] -= n;
      if (inventaire[id] <= 0) delete inventaire[id];
      sauver();
      if (ouvert && vue === 'inv') dessinerInventaire();
      return true;
    },
    catalogue: CATALOGUE,
    parId
  };

  // ---------- BARRES DE PROGRESSION DES EFFETS ----------
  const COUL_EFFETS = { faim: '#ffe600', energie: '#27e6ff', humeur: '#00ffa3', affection: '#ff2e63' };
  function barres(effets) {
    const w = document.createElement('div');
    Object.keys(effets).forEach((k) => {
      const v = effets[k];
      const r = document.createElement('div');
      r.className = 'iv-eb';
      r.style.setProperty('--c', COUL_EFFETS[k] || '#27e6ff');
      r.innerHTML = '<span class="iv-eb-n"></span><div class="iv-eb-b"><div class="iv-eb-f"></div></div><b></b>';
      r.querySelector('.iv-eb-n').textContent = NOMS_EFFETS[k] || k;
      r.querySelector('.iv-eb-f').style.width = Math.min(100, v) + '%';
      r.querySelector('b').textContent = '+' + v;
      w.appendChild(r);
    });
    return w;
  }
  function montrerInfo(o) {
    infoEl.textContent = '';
    const n = document.createElement('div');
    n.textContent = o.nom + ' : ' + o.desc;
    infoEl.append(n, barres(o.effets));
    if (o.id === 'drone' || DECOS[o.id]) {
      const h = document.createElement('div');
      h.style.color = '#b66bff';
      h.textContent = '▸ GLISSE-LE SUR CAPRI';
      infoEl.appendChild(h);
    } else {
      const h = document.createElement('div');
      h.style.color = 'var(--vert)';
      h.textContent = "▸ CLIQUE POUR L'UTILISER";
      infoEl.appendChild(h);
    }
  }

  // ---------- LE DRONE : boule d'électricité violette, verte et noire ----------
  const DRONE_DUREE = 20000;   // temps avant qu'il explose (ms)
  let drone = null;
  function droneSVG(w, h) {
    return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 60 40" fill="none">' +
      '<polygon class="dr-wl" points="1,13 17,17 17,25 5,31" fill="#8a2cff" stroke="#b66bff" stroke-width="1"/>' +
      '<polygon class="dr-wr" points="59,13 43,17 43,25 55,31" fill="#8a2cff" stroke="#b66bff" stroke-width="1"/>' +
      '<polygon points="30,3 44,16 40,32 30,38 20,32 16,16" fill="#05000c" stroke="#b66bff" stroke-width="1.6"/>' +
      '<polygon class="dr-eye" points="22,17 38,17 34,24 26,24" fill="#00ffa3"/>' +
      '<rect x="28" y="18.5" width="4" height="3.5" fill="#000"/>' +
      '<path d="M30 3V11M24 30L30 34L36 30" stroke="#00ffa3" stroke-width="1.2"/></svg>';
  }
  const surCapri = (x, y) => {
    const r = walker.getBoundingClientRect();
    return x > r.left - 30 && x < r.right + 30 && y > r.top - 30 && y < r.bottom + 30;
  };
  // On prend le drone dans le sac et on le glisse sur Capri pour le lui donner
  function glisserDrone(e) {
    if (e.button !== 0) return;
    if (drone) { infoEl.textContent = '// UN DRONE EST DÉJÀ EN VOL'; return; }
    e.preventDefault();
    const g = document.createElement('div');
    g.style.cssText = 'position:fixed;left:0;top:0;z-index:99;pointer-events:none;width:60px;height:40px;margin:-20px 0 0 -30px;filter:drop-shadow(0 0 8px #b66bff);';
    g.innerHTML = droneSVG(60, 40);
    document.body.appendChild(g);
    const vis = document.getElementById('discViseur');
    if (vis) {
      const r = walker.getBoundingClientRect();
      vis.style.display = 'block';
      vis.style.translate = (r.left + r.width / 2).toFixed(0) + 'px ' + (r.top + r.height / 2).toFixed(0) + 'px';
    }
    const place = (m) => {
      g.style.transform = 'translate(' + m.clientX + 'px,' + m.clientY + 'px)';
      if (vis) vis.classList.toggle('proche', surCapri(m.clientX, m.clientY));
    };
    const fin = (m) => {
      window.removeEventListener('pointermove', place, true);
      window.removeEventListener('pointerup', fin, true);
      g.remove();
      if (vis) { vis.style.display = 'none'; vis.classList.remove('proche'); }
      if (surCapri(m.clientX, m.clientY) && lancerDrone(m.clientX, m.clientY)) fermer();
    };
    place(e);
    window.addEventListener('pointermove', place, true);
    window.addEventListener('pointerup', fin, true);
  }
  function lancerDrone(x0, y0) {
    if (drone || !document.body.classList.contains('enAnim')) return false;
    if (!window.CapriEddies.retirerObjet('drone')) return false;
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;left:0;top:0;z-index:96;pointer-events:none;width:60px;height:40px;margin:-20px 0 0 -30px;' +
      'filter:drop-shadow(0 0 8px #b66bff);';
    el.innerHTML = droneSVG(60, 40);
    document.body.appendChild(el);
    const r = walker.getBoundingClientRect();
    drone = { el, x: x0, y: y0, t0: performance.now(), arc: 0 };
    // Capri reçoit le drone : flash et arc électrique entre elle et lui
    flashBlanc(180, 0.2, '#b66bff');
    ondeChoc(x0, y0);
    eclair(r.left + r.width / 2, r.top + r.height * 0.4, x0, y0, {
      couleur: '#b66bff', halo: '#00ffa3', coeur: '#ffffff', epaisseur: 2.4, duree: 320, descente: 50,
      rugosite: 0.5, pas: 4, branches: 0, echelleBr: 0
    });
    el.animate([{ opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1 }], { duration: 350 });
    requestAnimationFrame(tickDrone);
    return true;
  }
  function tickDrone(now) {
    const d = drone;
    if (!d) return;
    if (!document.body.classList.contains('enAnim')) { d.el.remove(); drone = null; return; }
    const age = now - d.t0;
    if (age > DRONE_DUREE) { exploserDrone(d); return; }
    const r = walker.getBoundingClientRect();
    const t = age / 1000;
    const tx = r.left + r.width / 2 + Math.cos(t * 1.1) * 130 + Math.sin(t * 3.1) * 18;
    const ty = r.top + r.height * 0.35 - 40 + Math.sin(t * 1.7) * 70 + Math.cos(t * 4.3) * 14;
    const tilt = Math.max(-25, Math.min(25, (tx - d.x) * 0.25));
    d.x += (tx - d.x) * 0.06;
    d.y += (ty - d.y) * 0.06;
    const fin = age > DRONE_DUREE - 1800;         // juste avant d'exploser : il tremble et enfle
    const j = fin ? 4 : 0;
    d.el.style.transform = 'translate(' + (d.x + (Math.random() - 0.5) * j).toFixed(1) + 'px,' + (d.y + (Math.random() - 0.5) * j).toFixed(1) +
      'px) rotate(' + tilt.toFixed(1) + 'deg) scale(' + (fin ? 1 + 0.3 * Math.sin(age / 40) : 1 + 0.08 * Math.sin(age / 200)).toFixed(3) + ')';
    d.el.style.filter = 'drop-shadow(0 0 8px #b66bff) brightness(' + (0.8 + Math.random() * 0.6).toFixed(2) + ')';
    if (now > d.arc) {
      d.arc = now + (fin ? 60 : 140);
      const c = ['#b66bff', '#00ffa3', '#ffffff'][Math.floor(Math.random() * 3)], a = Math.random() * Math.PI * 2, L = alea(30, 75);
      eclair(d.x, d.y, d.x + Math.cos(a) * L, d.y + Math.sin(a) * L, {
        couleur: c, halo: c === '#ffffff' ? '#b66bff' : c, epaisseur: 1.4, duree: 180, descente: 25,
        rugosite: 0.5, pas: 4, branches: 0, echelleBr: 0
      });
    }
    requestAnimationFrame(tickDrone);
  }
  function exploserDrone(d) {
    drone = null;
    d.el.remove();
    const x = d.x, y = d.y;
    flashBlanc(260, 0.3, '#b66bff');
    ondeChoc(x, y);
    secousseEcran(6, 260);
    particules(x, y, {
      couleurs: ['#b66bff', '#00ffa3', '#000000', '#ffffff'], n: 30, vmin: 150, vmax: 520,
      tailleMin: 3, tailleMax: 7, angleMin: -Math.PI, angleMax: Math.PI, duree: 600
    });
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI * 2 * i) / 10, L = alea(60, 150), c = i % 2 ? '#b66bff' : '#00ffa3';
      eclair(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L, {
        couleur: c, halo: c, coeur: '#ffffff', epaisseur: 2.4, duree: 380, descente: 40,
        rugosite: 0.5, pas: 4, branches: 0, echelleBr: 0
      });
    }
  }

  // ---------- COMPAGNONS : chacun a son propre pouvoir (on les glisse sur Capri) ----------
  // LUNETTES HOLO  : elle les porte sur le visage, avec un petit écran qui défile ; à la fin elles tombent.
  // HOLO-FLEURS    : un bouquet flotte au-dessus d'elle, et des fleurs holo poussent là où elle passe.
  // SHARD CORROMPU : il flotte au-dessus de sa tête et la fait glitcher (image qui saute, écran qui bugue).
  // SURCHARGE      : la boule entre dans sa poitrine : elle crépite d'électricité, puis se décharge.
  // Réglages des lunettes : leur place sur son visage (si elles sont mal placées, change ces 3 chiffres)
  const LUNETTES_Y = 0.14;       // hauteur des yeux (0 = haut de la tête, 1 = les pieds)
  const LUNETTES_X = 0.5;        // 0.5 = au milieu de Capri
  const LUNETTES_L = 0.55;       // largeur des lunettes (part de la largeur de Capri)
  const DECO_MAX = 3;            // nombre maximal de compagnons en même temps
  const decos = [];
  let decoRaf = null;
  const absente = () => walker.style.opacity === '0';
  const poserDeco = (d, x, y, rot, k) => {
    d.rot = rot; d.k = k;
    d.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + rot.toFixed(1) + 'deg) scale(' + k.toFixed(3) + ')';
  };
  const fleurSVG = (cx, cy, r, c) => {
    let s = '';
    for (let a = 0; a < 360; a += 72) {
      s += '<ellipse cx="' + cx + '" cy="' + (cy - r * 0.62) + '" rx="' + (r * 0.36) + '" ry="' + (r * 0.62) +
        '" transform="rotate(' + a + ' ' + cx + ' ' + cy + ')" fill="' + c + '" fill-opacity="0.35" stroke="' + c + '" stroke-width="1.2"/>';
    }
    return s + '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.22) + '" fill="#ffffff"/>';
  };
  // Une petite fleur holo qui pousse au sol, reste un moment, puis s'efface
  function fleurSol(x, yBas) {
    const col = ['#ff4fd8', '#27e6ff', '#00ffa3', '#ffe600'][Math.floor(Math.random() * 4)];
    const el = document.createElement('div');
    el.style.cssText = 'position:absolute;pointer-events:none;left:' + (x - 15).toFixed(0) + 'px;top:' + (yBas - 40).toFixed(0) +
      'px;width:30px;height:40px;transform-origin:50% 100%;filter:drop-shadow(0 0 5px ' + col + ');';
    el.innerHTML = '<svg width="30" height="40" viewBox="0 0 30 40" fill="none"><path d="M15 40V17" stroke="#00ffa3" stroke-width="1.6"/>' +
      '<path d="M15 32L24 26L19 36Z M15 28L7 23L11 33Z" fill="#00ffa3" fill-opacity="0.6"/>' + fleurSVG(15, 13, 10, col) + '</svg>';
    anim.insertBefore(el, walker);
    el.animate([
      { opacity: 0, transform: 'scale(0)' },
      { opacity: 1, transform: 'scale(1.2)', offset: 0.1 },
      { opacity: 1, transform: 'scale(1)', offset: 0.18 },
      { opacity: 1, transform: 'scale(1)', offset: 0.75 },
      { opacity: 0, transform: 'scale(0.85)' }
    ], { duration: 4500, easing: 'ease-out' }).onfinish = () => el.remove();
    particules(x, yBas - 4, {
      couleurs: [col, '#ffffff'], n: 3, vmin: 30, vmax: 110, tailleMin: 2, tailleMax: 3,
      angleMin: -Math.PI * 0.9, angleMax: -Math.PI * 0.1, duree: 500
    });
  }
  // w, h : taille à l'écran ; duree : temps avant la fin (ms)
  // tick(d, age, now, c, fin) : ce que fait l'objet à chaque image (c = la position de Capri ; fin = vrai dans les dernières secondes)
  // fin(d) : ce qui se passe à la fin
  // === NOUVEAUX OBJETS FONCTIONNELS ===
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
  const DECOS = {
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
    },
    holofleurs: {
      nom: 'HOLO-FLEURS', w: 56, h: 56, couleur: '#ff4fd8', couleurs: ['#ff4fd8', '#27e6ff', '#00ffa3', '#ffffff'], duree: 30000,
      svg: (w, h) => '<svg width="' + w + '" height="' + h + '" viewBox="0 0 60 60" fill="none">' +
        '<path d="M30 57L16 28M30 57L30 20M30 57L44 30" stroke="#00ffa3" stroke-width="1.6"/>' +
        '<path d="M30 48L41 41L35 52Z M30 44L19 38L25 49Z" fill="#00ffa3" fill-opacity="0.6"/>' +
        fleurSVG(16, 24, 11, '#ff4fd8') + fleurSVG(30, 15, 12, '#27e6ff') + fleurSVG(44, 26, 10, '#ff4fd8') +
        '<path d="M24 52H36" stroke="#ffe600" stroke-width="2.4"/></svg>',
      tick(d, age, now, c, fin) {
        const t = age / 1000;
        d.x += (c.cx - d.x) * 0.12;
        d.y += (c.haut - 28 + Math.sin(t * 2.2) * 6 - d.y) * 0.12;
        poserDeco(d, d.x, d.y, Math.sin(t * 1.6) * 8, 0.75);
        if (absente()) return;
        // Des fleurs poussent derrière elle quand elle marche, et de temps en temps quand elle reste là
        if (Math.abs(c.cx - d.dernierX) > 45) { d.dernierX = c.cx; d.prochain = now + 1400; fleurSol(c.cx + alea(-12, 12), c.bas - 2); }
        else if (now > d.prochain) { d.prochain = now + (fin ? 500 : 1400); fleurSol(c.cx + alea(-45, 45), c.bas - 2); }
        if (now > d.arc) {                                   // des pétales tombent du bouquet
          d.arc = now + 260;
          particules(d.x, d.y + 12, {
            couleurs: ['#ff4fd8', '#27e6ff', '#ffffff'], n: 2, vmin: 10, vmax: 70, tailleMin: 2, tailleMax: 4,
            angleMin: 0.4, angleMax: Math.PI - 0.4, duree: 900
          });
        }
      },
      fin(d) {                                               // le bouquet se dissout en pétales
        d.el.remove();
        flashBlanc(200, 0.2, '#ff4fd8');
        ondeChoc(d.x, d.y);
        particules(d.x, d.y, {
          couleurs: ['#ff4fd8', '#27e6ff', '#00ffa3', '#ffffff'], n: 40, vmin: 80, vmax: 320, tailleMin: 3, tailleMax: 6,
          angleMin: -Math.PI, angleMax: Math.PI, duree: 1000
        });
      }
    },
    lunettes: {
      nom: 'LUNETTES HOLO', w: 64, h: 32, couleur: '#27e6ff', couleurs: ['#27e6ff', '#00ffa3', '#ffffff'], duree: 25000,
      svg: (w, h) => '<svg width="' + w + '" height="' + h + '" viewBox="0 0 60 30" fill="none">' +
        '<polygon points="3,8 27,8 25,23 8,23" fill="#27e6ff" fill-opacity="0.22" stroke="#27e6ff" stroke-width="1.8"/>' +
        '<polygon points="57,8 33,8 35,23 52,23" fill="#27e6ff" fill-opacity="0.22" stroke="#27e6ff" stroke-width="1.8"/>' +
        '<path d="M27 11H33M3 10L0 7M57 10L60 7" stroke="#27e6ff" stroke-width="2"/>' +
        '<path d="M9 13H22M10 17H20M38 13H51M40 17H50" stroke="#00ffa3" stroke-width="1"/>' +
        '<path d="M6 11L12 11" stroke="#ff2e63" stroke-width="1.6"/></svg>',
      tick(d, age, now, c, fin) {
        // Elles volent jusqu'à son visage, puis restent collées dessus
        const k = Math.max(0.3, (c.larg * LUNETTES_L) / 64);
        const tx = c.left + c.larg * LUNETTES_X, ty = c.haut + c.hauteur * LUNETTES_Y;
        const v = age < 700 ? 0.15 : 0.5;
        d.x += (tx - d.x) * v;
        d.y += (ty - d.y) * v;
        poserDeco(d, d.x, d.y, 0, k);
        d.el.style.filter = 'drop-shadow(0 0 6px #27e6ff) brightness(' + (1 + 0.25 * Math.sin(age / 250)).toFixed(2) + ')';
        d.el.style.opacity = fin && Math.random() < 0.4 ? 0.3 : 1;      // elles clignotent avant de tomber
        if (absente() || age < 700) return;
        if (now > d.arc) { d.arc = now + 700; glyphe(d.x + alea(-14, 14), d.y - alea(6, 22)); }   // le HUD fait monter du code
        if (now > d.scan) {                                                                     // un scan toutes les 3 secondes
          d.scan = now + 3000;
          particules(d.x, d.y, {
            couleurs: ['#27e6ff', '#00ffa3', '#ffffff'], n: 8, vmin: 40, vmax: 140, tailleMin: 2, tailleMax: 3,
            angleMin: -Math.PI, angleMax: Math.PI, duree: 400
          });
          eclair(d.x - 14, d.y, d.x + 14, d.y, {
            couleur: '#00ffa3', halo: '#27e6ff', epaisseur: 1.2, duree: 240, descente: 30,
            rugosite: 0.3, pas: 4, branches: 0, echelleBr: 0
          });
        }
      },
      fin(d) {                                               // elles glitchent, glissent du nez et tombent par terre
        const x = d.x, y = d.y, k = d.k;
        const T = (px, py, r) => 'translate(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px) rotate(' + r.toFixed(0) + 'deg) scale(' + k.toFixed(3) + ')';
        const sol = window.innerHeight - 14, dx = alea(-35, 35);
        glitchEcran(250);
        d.el.style.opacity = 1;
        d.el.animate([
          { transform: T(x, y, 0), opacity: 1 },
          { transform: T(x + dx, sol, alea(-220, 220)), opacity: 1, offset: 0.8 },
          { transform: T(x + dx, sol, alea(-220, 220)), opacity: 0 }
        ], { duration: 950, easing: 'ease-in', fill: 'forwards' }).onfinish = () => d.el.remove();
        setTimeout(() => particules(x + dx, sol, {
          couleurs: ['#27e6ff', '#00ffa3', '#ffffff'], n: 12, vmin: 80, vmax: 260, tailleMin: 2, tailleMax: 4,
          angleMin: -Math.PI * 0.95, angleMax: -Math.PI * 0.05, duree: 450
        }), 750);
      }
    },
    shard: {
      nom: 'SHARD CORROMPU', w: 38, h: 54, couleur: '#ff2e63', couleurs: ['#ff2e63', '#27e6ff', '#ffffff'], duree: 20000,
      svg: (w, h) => '<svg width="' + w + '" height="' + h + '" viewBox="0 0 40 56" fill="none">' +
        '<polygon points="20,2 34,18 28,52 20,54 10,40 6,18" fill="#12060d" stroke="#ff2e63" stroke-width="1.8"/>' +
        '<polygon points="20,2 34,18 20,24" fill="#ff2e63" fill-opacity="0.65"/>' +
        '<polygon points="6,18 20,24 10,40" fill="#27e6ff" fill-opacity="0.5"/>' +
        '<path d="M20 24L28 52" stroke="#00ffa3" stroke-width="1.2"/></svg>',
      tick(d, age, now, c, fin) {
        const t = age / 1000;
        d.x += (c.cx - d.x) * 0.1;
        d.y += (c.haut - 36 + Math.sin(t * 2.5) * 7 - d.y) * 0.1;
        poserDeco(d, d.x + (fin ? (Math.random() - 0.5) * 6 : 0), d.y, t * 70, 0.9);
        d.el.style.filter = 'drop-shadow(0 0 8px #ff2e63) hue-rotate(' + (Math.random() < 0.15 ? 120 : 0) + 'deg)';
        if (absente()) return;
        if (now > d.arc) { d.arc = now + (fin ? 90 : 260); glyphe(d.x + alea(-25, 25), d.y + alea(0, 40)); }
        if (now > d.glitch) {                                // Capri glitche : son image saute et change de couleur
          d.glitch = now + (fin ? alea(300, 700) : alea(1500, 3200));
          const j = alea(5, 10) * (Math.random() < 0.5 ? -1 : 1);
          walker.animate([
            { filter: 'none', translate: '0px 0px' },
            { filter: 'hue-rotate(90deg) brightness(1.6)', translate: j + 'px 2px', offset: 0.25 },
            { filter: 'invert(1)', translate: (-j) + 'px -2px', offset: 0.5 },
            { filter: 'hue-rotate(220deg) saturate(3)', translate: (j / 2) + 'px 0px', offset: 0.75 },
            { filter: 'none', translate: '0px 0px' }
          ], { duration: 280, easing: 'steps(1)' });
          eclair(d.x, d.y, c.cx + alea(-12, 12), c.haut + c.hauteur * 0.15, {
            couleur: '#ff2e63', halo: '#ff2e63', epaisseur: 1.4, duree: 200, descente: 30,
            rugosite: 0.5, pas: 4, branches: 0, echelleBr: 0
          });
          if (Math.random() < 0.5) glitchEcran(320);
        }
      },
      fin(d) {                                               // il éclate : l'écran déraille, Capri grésille
        glitchEcran(600);
        walker.animate([{ filter: 'brightness(3) hue-rotate(90deg)' }, { filter: 'none' }], { duration: 320 });
        finDeco(d);
      }
    },
    surcharge: {
      nom: 'SURCHARGE', w: 46, h: 46, couleur: '#ffe600', couleurs: ['#ffe600', '#ffffff', '#27e6ff'], duree: 18000,
      svg: (w, h) => '<svg width="' + w + '" height="' + h + '" viewBox="0 0 50 50" fill="none">' +
        '<circle cx="25" cy="25" r="21" fill="#0c0900" stroke="#ffe600" stroke-width="2"/>' +
        '<circle cx="25" cy="25" r="16" stroke="#ffe600" stroke-opacity="0.4" stroke-dasharray="4 4"/>' +
        '<polygon points="29,7 15,28 24,28 20,43 35,21 26,21" fill="#ffe600"/></svg>',
      tick(d, age, now, c, fin) {
        if (age < 700) {                                     // la boule file dans sa poitrine
          d.x += (c.cx - d.x) * 0.18;
          d.y += (c.cy - d.y) * 0.18;
          poserDeco(d, d.x, d.y, age / 3, 1 - 0.85 * (age / 700) * (age / 700));
          return;
        }
        if (!d.dedans) {
          d.dedans = true;
          d.el.style.display = 'none';
          flashBlanc(200, 0.3, '#ffe600');
          ondeChoc(c.cx, c.cy);
          walker.animate([{ filter: 'brightness(4) drop-shadow(0 0 20px #ffe600)' }, { filter: 'none' }], { duration: 400 });
        }
        if (absente()) { walker.style.filter = ''; return; }
        // Elle crépite : lueur jaune qui vacille, arcs sur son corps, et la foudre qui lui tombe dessus
        walker.style.filter = 'drop-shadow(0 0 ' + (fin ? 18 : 10) + 'px #ffe600) brightness(' + (1.05 + Math.random() * (fin ? 0.6 : 0.25)).toFixed(2) + ')';
        if (now > d.arc) {
          d.arc = now + (fin ? 45 : 110);
          const x1 = c.left + alea(0.1, 0.9) * c.larg, y1 = c.haut + alea(0.05, 0.95) * c.hauteur;
          const a = Math.random() * Math.PI * 2, L = alea(25, 70), col = ['#ffe600', '#ffffff', '#27e6ff'][Math.floor(Math.random() * 3)];
          eclair(x1, y1, x1 + Math.cos(a) * L, y1 + Math.sin(a) * L, {
            couleur: col, halo: col, epaisseur: 1.4, duree: 180, descente: 25,
            rugosite: 0.5, pas: 4, branches: 0, echelleBr: 0
          });
        }
        if (now > d.foudre) {
          d.foudre = now + alea(2200, 3600);
          eclair(c.cx + alea(-120, 120), -10, c.cx, c.haut + 10, {
            couleur: '#ffe600', halo: '#ffe600', coeur: '#ffffff', epaisseur: 2.6, duree: 420, descente: 60,
            rugosite: 0.4, pas: 6, branches: 0.05, echelleBr: 0.6
          });
          particules(c.cx, c.haut + 10, {
            couleurs: ['#ffe600', '#ffffff'], n: 10, vmin: 100, vmax: 300, tailleMin: 2, tailleMax: 4,
            angleMin: -Math.PI, angleMax: Math.PI, duree: 400
          });
        }
      },
      nettoyer() { walker.style.filter = ''; },
      fin(d) {                                               // la décharge : tout part d'un coup
        walker.style.filter = '';
        walker.animate([{ filter: 'brightness(3.5) drop-shadow(0 0 20px #ffe600)' }, { filter: 'none' }], { duration: 400 });
        const r = walker.getBoundingClientRect();
        d.x = r.left + r.width / 2; d.y = r.top + r.height * 0.4;
        finDeco(d);
      }
    }
  };
  // L'icône dans le sac et dans la boutique
  function iconeDeco(id) {
    const D = DECOS[id], k = Math.min(42 / D.w, 40 / D.h);
    return D.svg(Math.round(D.w * k), Math.round(D.h * k));
  }
  // On prend l'objet dans le sac et on le glisse sur Capri pour le lui donner
  function glisserDeco(e, id) {
    if (e.button !== 0) return;
    const D = DECOS[id];
    if (decos.some((x) => x.id === id)) { infoEl.textContent = '// ' + D.nom + ' DÉJÀ ACTIF'; return; }
    if (decos.length >= DECO_MAX) { infoEl.textContent = '// TROP DE COMPAGNONS EN MÊME TEMPS'; return; }
    e.preventDefault();
    const g = document.createElement('div');
    g.style.cssText = 'position:fixed;left:0;top:0;z-index:99;pointer-events:none;width:' + D.w + 'px;height:' + D.h + 'px;' +
      'margin:' + (-D.h / 2) + 'px 0 0 ' + (-D.w / 2) + 'px;filter:drop-shadow(0 0 8px ' + D.couleur + ');';
    g.innerHTML = D.svg(D.w, D.h);
    document.body.appendChild(g);
    const vis = document.getElementById('discViseur');
    if (vis) {
      const r = walker.getBoundingClientRect();
      vis.style.display = 'block';
      vis.style.translate = (r.left + r.width / 2).toFixed(0) + 'px ' + (r.top + r.height / 2).toFixed(0) + 'px';
    }
    const place = (m) => {
      g.style.transform = 'translate(' + m.clientX + 'px,' + m.clientY + 'px)';
      if (vis) vis.classList.toggle('proche', surCapri(m.clientX, m.clientY));
    };
    const fin = (m) => {
      window.removeEventListener('pointermove', place, true);
      window.removeEventListener('pointerup', fin, true);
      g.remove();
      if (vis) { vis.style.display = 'none'; vis.classList.remove('proche'); }
      if (surCapri(m.clientX, m.clientY) && lancerDeco(id, m.clientX, m.clientY)) fermer();
    };
    place(e);
    window.addEventListener('pointermove', place, true);
    window.addEventListener('pointerup', fin, true);
  }
  function lancerDeco(id, x0, y0) {
    const D = DECOS[id], item = parId(id);
    if (!D || !document.body.classList.contains('enAnim')) return false;
    if (decos.some((x) => x.id === id) || decos.length >= DECO_MAX) return false;
    if (!window.CapriEddies.retirerObjet(id)) return false;
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;left:0;top:0;z-index:96;pointer-events:none;width:' + D.w + 'px;height:' + D.h + 'px;' +
      'margin:' + (-D.h / 2) + 'px 0 0 ' + (-D.w / 2) + 'px;filter:drop-shadow(0 0 8px ' + D.couleur + ');';
    el.innerHTML = D.svg(D.w, D.h);
    document.body.appendChild(el);
    const r = walker.getBoundingClientRect();
    const now = performance.now();
    decos.push({
      id, el, x: x0, y: y0, t0: now, arc: 0, scan: now + 1500, glitch: now + 1200, foudre: now + 1500,
      dernierX: r.left + r.width / 2, prochain: 0, rot: 0, k: 1, dedans: false
    });
    flashBlanc(180, 0.2, D.couleur);
    ondeChoc(x0, y0);
    eclair(r.left + r.width / 2, r.top + r.height * 0.4, x0, y0, {
      couleur: D.couleur, halo: D.couleur, coeur: '#ffffff', epaisseur: 2.4, duree: 320, descente: 50,
      rugosite: 0.5, pas: 4, branches: 0, echelleBr: 0
    });
    el.animate([{ opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1 }], { duration: 350 });
    // Les effets de l'objet remplissent les jauges de Capri
    if (item && item.effets) {
      Object.keys(item.effets).forEach((k) => { stats[k] = Math.min(100, (stats[k] || 0) + item.effets[k]); });
      sauverStats();
      majStats();
    }
    if (!decoRaf) decoRaf = requestAnimationFrame(tickDeco);
    return true;
  }
  function tickDeco(now) {
    decoRaf = null;
    if (!decos.length) return;
    const enBalade = document.body.classList.contains('enAnim');
    const r = walker.getBoundingClientRect();
    const c = {
      cx: r.left + r.width / 2, cy: r.top + r.height * 0.4,
      left: r.left, haut: r.top, bas: r.bottom, larg: r.width, hauteur: r.height
    };
    const cache = absente();
    for (let i = decos.length - 1; i >= 0; i--) {
      const d = decos[i], D = DECOS[d.id];
      if (!enBalade) { if (D.nettoyer) D.nettoyer(d); d.el.remove(); decos.splice(i, 1); continue; }
      const age = now - d.t0;
      if (age > D.duree) { decos.splice(i, 1); if (D.nettoyer) D.nettoyer(d); if (D.fin) D.fin(d); else finDeco(d); continue; }
      d.el.style.visibility = cache ? 'hidden' : 'visible';   // si Capri a disparu, son objet aussi
      D.tick(d, age, now, c, age > D.duree - 1800);
    }
    if (decos.length) decoRaf = requestAnimationFrame(tickDeco);
  }
  // Explosion générale (utilisée par le shard et la surcharge)
  function finDeco(d) {
    const D = DECOS[d.id], x = d.x, y = d.y;
    d.el.remove();
    flashBlanc(240, 0.28, D.couleur);
    ondeChoc(x, y);
    secousseEcran(5, 220);
    particules(x, y, {
      couleurs: D.couleurs.concat(['#000000']), n: 28, vmin: 150, vmax: 500,
      tailleMin: 3, tailleMax: 7, angleMin: -Math.PI, angleMax: Math.PI, duree: 600
    });
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8, L = alea(60, 140), c = D.couleurs[i % D.couleurs.length];
      eclair(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L, {
        couleur: c, halo: c, coeur: '#ffffff', epaisseur: 2.2, duree: 360, descente: 40,
        rugosite: 0.5, pas: 4, branches: 0, echelleBr: 0
      });
    }
  }

  // ---------- ICÔNES NÉON (une par catégorie) ----------
  const ICONES = {
    puces: '<rect x="10" y="10" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"/><rect x="16" y="16" width="8" height="8" fill="currentColor"/><path d="M14 5v5M20 5v5M26 5v5M14 30v5M20 30v5M26 30v5M5 14h5M5 20h5M5 26h5M30 14h5M30 20h5M30 26h5" stroke="currentColor" stroke-width="2"/>',
    dossiers: '<path d="M5 11h12l3 4h15v18H5z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 20h30M12 26h10" stroke="currentColor" stroke-width="2"/>',
    codes: '<circle cx="13" cy="20" r="6" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M19 20h16M29 20v7M34 20v5" stroke="currentColor" stroke-width="2.2"/>',
    scripts: '<path d="M14 11L5 20l9 9M26 11l9 9-9 9M23 8l-6 24" fill="none" stroke="currentColor" stroke-width="2.2"/>',
    energie: '<rect x="5" y="13" width="26" height="14" fill="none" stroke="currentColor" stroke-width="2"/><rect x="31" y="17" width="4" height="6" fill="currentColor"/><path d="M19 15l-6 6h5l-3 5 9-7h-5l3-4z" fill="currentColor"/>',
    mods: '<polygon points="20,4 34,12 34,28 20,36 6,28 6,12" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="20" r="5" fill="currentColor"/><path d="M20 4v11M6 12l9 5M34 12l-9 5" stroke="currentColor" stroke-width="1.5"/>'
  };
  function iconeSVG(cat) {
    return '<svg width="38" height="38" viewBox="0 0 40 40">' + (ICONES[cat] || ICONES.mods) + '</svg>';
  }

  // ---------- JAUGES DE CAPRI (fonctionnelles) : les objets les remplissent, elles baissent avec le temps ----------
  const DECLIN_MS = 30000;     // toutes les 30 s, MÉMOIRE / ÉNERGIE / HUMEUR baissent de 1
  const stats = { faim: 60, energie: 60, humeur: 50, affection: 20 };
  try { Object.assign(stats, JSON.parse(localStorage.getItem('capri_stats')) || {}); } catch (e) {}
  function majStats() {
    const b = document.getElementById('ivStats');
    if (!b) return;
    b.innerHTML = '';
    Object.keys(COUL_EFFETS).forEach((k) => {
      const v = Math.round(stats[k]);
      const r = document.createElement('div');
      r.className = 'iv-eb';
      r.style.setProperty('--c', COUL_EFFETS[k]);
      r.innerHTML = '<span></span><div class="iv-eb-b"><div class="iv-eb-f"></div></div><b></b>';
      r.firstChild.textContent = NOMS_EFFETS[k];
      r.querySelector('.iv-eb-f').style.width = v + '%';
      r.querySelector('b').textContent = v + '%';
      b.appendChild(r);
    });
  }
  function sauverStats() { try { localStorage.setItem('capri_stats', JSON.stringify(stats)); } catch (e) {} }
  function utiliser(o) {
    if (!window.CapriEddies.retirerObjet(o.id)) return;
    Object.keys(o.effets).forEach((k) => { stats[k] = Math.min(100, (stats[k] || 0) + o.effets[k]); });
    sauverStats();
    majStats();
    if (document.body.classList.contains('enAnim')) {
      toast.textContent = o.nom + ' ✓';
      toast.style.display = 'block';
      toast.getAnimations().forEach((a) => a.cancel());
      toast.animate([{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], { duration: 1600 });
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toast.style.display = 'none'; }, 1600);
    }
  }
  setInterval(() => {
    ['faim', 'energie', 'humeur'].forEach((k) => { stats[k] = Math.max(0, stats[k] - 1); });
    sauverStats();
    majStats();
  }, DECLIN_MS);

  // ---------- CODE SECRET : Capri donne des eddies à celui qui connaît le code ----------
  const CODE_SECRET = '1973';
  let attenteCode = null;      // quantité demandée, en attendant le code
  const ipcEd = require('electron').ipcRenderer;
  const invoqueOrig = ipcEd.invoke.bind(ipcEd);
  ipcEd.invoke = function (canal, ...args) {
    if (canal === 'ask' && Array.isArray(args[0]) && args[0].length) {
      const texte = String(args[0][args[0].length - 1].content || '');
      const rep = (t) => Promise.resolve(t);
      if (attenteCode !== null) {
        const n = attenteCode;
        attenteCode = null;
        if (texte.indexOf(CODE_SECRET) >= 0) { ajouter(n); return rep('Code accepté, choom. Je te file ' + n + ' €$. Ne le dis à personne.'); }
        return rep('Mauvais code... Je ne te file rien, gonk.');
      }
      if (/(eddies?|edis?|€\$|\bids?\b)/i.test(texte) && /(donne|file|envoie|ajoute|veux|besoin)/i.test(texte)) {
        const m = texte.match(/\d[\d ]*/);
        const n = m ? parseInt(m[0].replace(/ /g, ''), 10) : 100;
        if (texte.indexOf(CODE_SECRET) >= 0) { ajouter(n); return rep('Code accepté, choom. Je te file ' + n + ' €$.'); }
        attenteCode = n;
        return rep('Hmm... ' + n + ' €$ ? Donne-moi le code, choom.');
      }
    }
    return invoqueOrig(canal, ...args);
  };

  majStats();
  majCompteurs();
})();
