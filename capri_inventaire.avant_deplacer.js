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
    { id: 'puce_memoire',  cat: 'puces',    rar: 'commun', nom: 'PUCE MÉMOIRE',        prix: 30,  emoji: '💾', img: 'item_puce_memoire.png',  desc: 'Elle telecharge sa memoire en pourcentage, puis sauvegarde. Glisse-la sur Capri.',          effets: { faim: 25 } },
    { id: 'puce_combat',   cat: 'puces',    rar: 'rare',   nom: 'PUCE DE COMBAT',      prix: 120, emoji: '🧿', img: 'item_puce_combat.png',   desc: 'Reflexes de solo : elle dashe et tranche l\'air. Glisse-la sur Capri.',       effets: { energie: 20, humeur: 15 } },
    { id: 'puce_perso',    cat: 'puces',    rar: 'epique', nom: 'PUCE PERSONNALITÉ',   prix: 250, emoji: '🧠', img: 'item_puce_perso.png',    desc: 'Un halo rose, des coeurs de pixels : la vraie Capri se reveille. Glisse-la sur Capri.',                effets: { humeur: 40, affection: 15 } },
    { id: 'shard',         cat: 'puces',    rar: 'rare',   nom: 'SHARD CORROMPU',      prix: 45,  emoji: '🔮', img: 'item_shard.png',         desc: 'Il la fait glitcher de partout. Glisse-le sur Capri.',      effets: { humeur: 25, faim: 10 } },
    { id: 'dossier_souv',  cat: 'dossiers', rar: 'commun', nom: 'DOSSIER SOUVENIRS',   prix: 35,  emoji: '📁', img: 'item_dossier_souv.png',  desc: 'Des photos holo de Night City apparaissent autour d\'elle. Glisse-le sur Capri.',      effets: { humeur: 12, affection: 10 } },
    { id: 'dossier_corr',  cat: 'dossiers', rar: 'commun', nom: 'DOSSIER CORROMPU',    prix: 15,  emoji: '📂', img: 'item_dossier_corr.png',  desc: 'Il glitche de partout et elle le grignote. Glisse-le sur Capri.',   effets: { faim: 12 } },
    { id: 'dossier_arasaka', cat: 'dossiers', rar: 'epique', nom: 'DOSSIER ARASAKA',   prix: 180, emoji: '🗂️', img: 'item_dossier_arasaka.png', desc: 'Un dossier top secret flotte sur elle et lache des fichiers. Glisse-le sur Capri.',     effets: { faim: 40, humeur: 20 } },
    { id: 'code_acces',    cat: 'codes',    rar: 'commun', nom: "CODE D'ACCÈS",        prix: 20,  emoji: '🔑', img: 'item_code_acces.png',    desc: 'Un digicode tape son code, puis ACCES ACCORDE. Glisse-le sur Capri.', effets: { faim: 15 } },
    { id: 'cle_dechiff',   cat: 'codes',    rar: 'rare',   nom: 'CLÉ DE DÉCHIFFREMENT', prix: 60, emoji: '🗝️', img: 'item_cle_dechiff.png',   desc: 'Elle tourne autour de Capri et dechiffre tout sur son passage. Glisse-la sur Capri.',     effets: { faim: 30, humeur: 5 } },
    { id: 'mdp_vole',      cat: 'codes',    rar: 'rare',   nom: 'MOT DE PASSE VOLÉ',   prix: 90,  emoji: '🔐', img: 'item_mdp_vole.png',      desc: 'Une pluie d\'eddies vole autour d\'elle, ACCES VOLE partout. Glisse-le sur Capri.',          effets: { humeur: 20, affection: 10 } },
    { id: 'script_repar',  cat: 'scripts',  rar: 'commun', nom: 'SCRIPT DE RÉPARATION', prix: 40, emoji: '🛠️', img: 'item_script_repar.png',  desc: 'Une cle et un engrenage soudent ses petits bugs, etincelles a l\'appui. Glisse-le sur Capri.', effets: { energie: 20, faim: 10 } },
    { id: 'script_boost',  cat: 'scripts',  rar: 'rare',   nom: 'SCRIPT DE BOOST',     prix: 70,  emoji: '⚡', img: 'item_script_boost.png',  desc: 'Lignes de vitesse, flashs de turbo et foudre jaune. Glisse-le sur Capri.',   effets: { energie: 45 } },
    { id: 'script_glitch', cat: 'scripts',  rar: 'commun', nom: 'SCRIPT GLITCH',       prix: 55,  emoji: '👾', img: 'item_script_glitch.png', desc: 'Capri se dedouble en rouge et cyan, l\'ecran deraille. Glisse-le sur Capri.',            effets: { humeur: 30 } },
    { id: 'script_compa',  cat: 'scripts',  rar: 'epique', nom: 'SCRIPT COMPAGNON',    prix: 110, emoji: '💬', img: 'item_script_compa.png',  desc: 'Une bulle copine la suit, lui envoie des coeurs et des mots doux. Glisse-le sur Capri.',               effets: { affection: 30, humeur: 15 } },
    { id: 'cellule',       cat: 'energie',  rar: 'commun', nom: "CELLULE D'ÉNERGIE",   prix: 12,  emoji: '🔋', img: 'item_cellule.png',       desc: 'Elle flotte pres de Capri et la recharge a coups de courant vert. Glisse-la sur Capri.',                    effets: { energie: 25 } },
    { id: 'batterie_lourde', cat: 'energie', rar: 'rare',  nom: 'BATTERIE LOURDE',     prix: 35,  emoji: '🪫', img: 'item_batterie_lourde.png', desc: 'Un gros bloc bleu qui crache des arcs et frappe le sol. Glisse-la sur Capri.',            effets: { energie: 55 } },
    { id: 'surcharge',     cat: 'energie',  rar: 'epique', nom: 'SURCHARGE',           prix: 95,  emoji: '🔌', img: 'item_surcharge.png',     desc: 'Elle crépite d\'électricité, puis se décharge. Glisse-la sur Capri.', effets: { energie: 80, humeur: 10 } },
    { id: 'holofleurs',    cat: 'mods',     rar: 'commun', nom: 'HOLO-FLEURS',         prix: 60,  emoji: '💐', img: 'item_holofleurs.png',    desc: 'Un bouquet flotte sur elle et des fleurs poussent sur son passage. Glisse-le sur Capri.', effets: { affection: 25, humeur: 15 } },
    { id: 'drone',         cat: 'mods',     rar: 'rare',   nom: 'MINI-DRONE',          prix: 90,  emoji: '🤖', img: '',         desc: 'Un petit copain qui vole autour. Glisse-le sur Capri.',        effets: { humeur: 35 } },
    { id: 'colis',        cat: 'mods',    rar: 'epique', nom: 'COLIS MYSTÈRE',  prix: 80,  emoji: '📦', img: '', desc: 'Clique pour ouvrir : un objet au hasard, ou des eddies.', effets: {} },
    { id: 'booster',      cat: 'scripts', rar: 'rare',   nom: 'BOOSTER €$',     prix: 100, emoji: '🚀', img: '', desc: 'x2 eddies par message pendant 5 minutes. Clique pour activer.', effets: {} },
    { id: 'megapack',     cat: 'energie', rar: 'epique', nom: 'MÉGA-PACK',      prix: 300, emoji: '🎁', img: '', desc: 'Remplit un peu tout : mémoire, énergie, humeur et lien.', effets: { faim: 30, energie: 30, humeur: 30, affection: 30 } },
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
  .iv-rech { width:100%; box-sizing:border-box; margin-bottom:8px; padding:6px 8px; background:#000; color:#e8fff6; border:1px solid var(--cadre); font-family:inherit; font-size:12px; letter-spacing:1px; outline:none; user-select:text; }
  .iv-rech:focus { border-color:var(--vert); box-shadow:0 0 8px rgba(0,255,163,.35); }
  .iv-stock { margin-top:3px; font-size:9px; letter-spacing:1px; color:#6b7a88; }
  .iv-art.epique { animation:ivepique 2.4s ease-in-out infinite; }
  @keyframes ivepique { 50% { box-shadow:0 0 12px rgba(255,46,99,.55); } }
  .iv-eb.bas { animation:ivbas .7s steps(2,start) infinite; }
  @keyframes ivbas { 50% { opacity:.35; } }
  .iv-onglets { gap:5px; }
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
    '<div class="iv-onglets"><button class="iv-onglet actif" data-v="inv">SAC</button><button class="iv-onglet" data-v="shop">MARCHÉ NOIR</button><button class="iv-onglet" data-v="succes">SUCCÈS</button><button class="iv-onglet" data-v="casino">CASINO</button></div>' +
    '<div id="ivStats"></div><div class="iv-corps" id="ivCorps"></div><div class="rb-scan"></div></div></div>';
  document.body.appendChild(panel);

  const toast = document.createElement('div');
  toast.id = 'ivToast';
  document.body.appendChild(toast);

  const corps = panel.querySelector('#ivCorps');
  const solde = panel.querySelector('#ivSolde');
  let recherche = '';
  let vue = 'inv', filtre = 'puces', ouvert = false, survol = false, infoEl = null;

  // ---------- AFFICHAGE ----------
  function icone(item) {
    const w = document.createElement('div');
    w.className = 'iv-ico';
    if (item.id === 'drone') { w.innerHTML = droneSVG(42, 28); return w; }
    if (DECOS[item.id]) { w.innerHTML = iconeDeco(item.id); w.style.filter = 'drop-shadow(0 0 4px ' + DECOS[item.id].couleur + ')'; return w; }
    if (ICONES_SPE[item.id]) { w.innerHTML = ICONES_SPE[item.id]; w.style.filter = 'drop-shadow(0 0 5px ' + (item.rar === 'epique' ? '#ff2e63' : '#27e6ff') + ')'; return w; }
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
    document.getElementById('ivBtnEd').textContent = eddies + (boostActif() ? ' x2' : '');
    if (ouvert && vue === 'shop') majBoutonsAchat();
  }

  function dessinerInventaire() {
    corps.innerHTML = '';
    const grille = document.createElement('div');
    grille.className = 'iv-grille';
    const objets = trierObjets(CATALOGUE.filter((o) => inventaire[o.id] > 0));
    for (let i = 0; i < Math.max(NB_CASES, objets.length); i++) {
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
        c.addEventListener('contextmenu', (ev) => { ev.preventDefault(); ev.stopPropagation(); vendre(o); });
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
    note.textContent = objets.length ? '// ' + objets.length + ' / ' + NB_CASES + ' OBJETS  ·  CLIC DROIT SUR UN OBJET = VENDRE (' + Math.round(VENTE_TAUX * 100) + ' %)' : '// STOCKAGE VIDE : VA FAIRE UN TOUR AU MARCHÉ NOIR';
    const tb = document.createElement('button');
    tb.className = 'iv-filtre';
    tb.style.marginBottom = '8px';
    tb.textContent = 'TRI : ' + TRIS[triSac];
    tb.addEventListener('click', () => { triSac = (triSac + 1) % TRIS.length; ecrire('capri_tri', triSac); dessinerInventaire(); });
    corps.append(tb, grille, infoEl, note);
  }

  let boutons = [];
  function majBoutonsAchat() {
    boutons.forEach(({ b, o }) => b.classList.toggle('trop', eddies < prixDe(o)));
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
    const bt = document.createElement('button');
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
    const ban = document.createElement('div');
    ban.id = 'ivPromoT';
    ban.className = 'iv-note';
    ban.style.cssText = 'color:#ffe600;margin:0 0 8px;';
    ban.textContent = texteBandeauPromo();
    corps.appendChild(ban);
    CATALOGUE.filter((o) => (filtre === 'tout' || o.cat === filtre) && (!recherche || o.nom.toLowerCase().indexOf(recherche) >= 0)).forEach((o) => {
      const a = document.createElement('div');
      a.className = 'iv-art' + (o.rar === 'epique' ? ' epique' : '');
      a.style.borderColor = COUL_RAR[o.rar] || '';
      a.appendChild(icone(o));
      const t = document.createElement('div');
      t.className = 'iv-art-txt';
      t.innerHTML = '<div class="iv-art-nom"></div><div class="iv-art-desc"></div><div class="iv-art-eff"></div><div class="iv-art-prix">' + prixHtml(o) + '</div>';
      t.firstChild.textContent = o.nom + '   [' + String(o.rar).toUpperCase() + ']';
      t.firstChild.style.color = COUL_RAR[o.rar] || COUL_RAR.commun;
      t.children[1].textContent = o.desc;
      t.children[2].appendChild(barres(o.effets));
      const sk = document.createElement('div');
      sk.className = 'iv-stock';
      sk.textContent = 'EN STOCK : ' + (inventaire[o.id] || 0);
      t.appendChild(sk);
      const b = document.createElement('button');
      b.className = 'iv-ach' + (eddies < prixDe(o) ? ' trop' : '');
      b.textContent = 'ACHETER';
      b.addEventListener('click', (ev) => acheter(o, b, ev.shiftKey ? 5 : 1));
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

  function acheter(o, b, n) {
    n = n || 1;
    if (n > 1) n = Math.max(1, Math.min(n, Math.floor(eddies / prixDe(o))));
    if (!ACHAT_ACTIF) return messageBouton(b, 'BIENTÔT');
    if (eddies < prixDe(o) * n) return messageBouton(b, 'TROP CHER');
    eddies -= prixDe(o) * n;
    inventaire[o.id] = (inventaire[o.id] || 0) + n;
    sauver();
    majCompteurs();
    messageBouton(b, n > 1 ? 'ACHETÉ x' + n : 'ACHETÉ');
    compter('achats', n);
    compter('depenses', prixDe(o) * n);
    decouvrir(o.id);
    effetAchat(o, b);
    const skk = b.parentNode && b.parentNode.querySelector('.iv-stock');
    if (skk) skk.textContent = 'EN STOCK : ' + inventaire[o.id];
    b.classList.remove('mal');
  }

  function changerVue(v) {
    vue = v;
    panel.querySelectorAll('.iv-onglet').forEach((b) => b.classList.toggle('actif', b.dataset.v === v));
    if (v === 'inv') dessinerInventaire(); else if (v === 'succes') dessinerSucces(); else if (v === 'casino') dessinerCasino(); else dessinerMagasin();
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
    toast.style.color = ''; toast.style.textShadow = '';
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
    compter('gagnes', n);
  }

  // Chaque réponse réussie de Capri rapporte quelques eddies (on écoute l'historique de la conversation)
  if (typeof history !== 'undefined' && Array.isArray(history)) {
    history.push = function (...items) {
      items.forEach((m) => {
        if (m && m.role === 'assistant') ajouter(gainMessage());
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
    const vh = document.createElement('div');
    vh.style.color = '#ffe600';
    vh.textContent = '▸ CLIC DROIT : VENDRE (+' + Math.max(1, Math.floor(o.prix * VENTE_TAUX)) + ' €$)';
    infoEl.appendChild(vh);
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
  // === OBJETS FONCTIONNELS 3 ===
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
  const DECOS = {
    puce_memoire: {
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
    // === OBJETS FONCTIONNELS 2 ===
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
    compter('decos', 1);
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
      r.className = 'iv-eb' + (v < 20 ? ' bas' : '');
      r.style.setProperty('--c', COUL_EFFETS[k]);
      r.innerHTML = '<span></span><div class="iv-eb-b"><div class="iv-eb-f"></div></div><b></b>';
      r.firstChild.textContent = NOMS_EFFETS[k];
      r.querySelector('.iv-eb-f').style.width = v + '%';
      r.querySelector('b').textContent = v + '%';
      b.appendChild(r);
    });
  }
  function sauverStats() { try { localStorage.setItem('capri_stats', JSON.stringify(stats)); } catch (e) {} }
  // === AMÉLIORATIONS MAGASIN ===
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
    compter('ventes', 1);
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
    decouvrir(choix.id);
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

  // === AMÉLIORATIONS MAGASIN 2 ===
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

  function utiliser(o) {
    if (!window.CapriEddies.retirerObjet(o.id)) return;
    if (o.id === 'colis') { compter('utilises', 1); compter('colis', 1); ouvrirColis(); return; }
    if (o.id === 'booster') { compter('utilises', 1); activerBooster(); return; }
    compter('utilises', 1);
    Object.keys(o.effets).forEach((k) => { stats[k] = Math.min(100, (stats[k] || 0) + o.effets[k]); });
    sauverStats();
    majStats();
    if (document.body.classList.contains('enAnim')) {
      toast.style.color = ''; toast.style.textShadow = '';
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
    ['faim', 'energie', 'humeur'].forEach((k) => { if (stats[k] === 15 || stats[k] === 5) alerteStat(k); });
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
