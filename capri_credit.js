// ===== CRÉDIT + DISCORD (généré par appliquer_credit.js) =====
(function () {
  const CFG = {"blaze":"Xento_draw","serveur":"","lien":"https://discord.gg/Gh8gD6QSky"};
  const sansHttp = (u) => u.replace(/^https?:\/\//i, '');

  // ----- Style -----
  const css = document.createElement('style');
  css.textContent =
    '#credit{display:none;position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:210;width:min(360px,calc(100vw - 24px));}' +
    '#credit .rb-in{padding:16px 18px;}' +
    '#credit .cr-tete{display:flex;justify-content:space-between;align-items:center;gap:10px;}' +
    '#crX{background:#000;color:var(--cadre);border:1px solid var(--cadre);width:26px;height:26px;cursor:pointer;font-family:inherit;}' +
    '#credit .cr-nom{font-size:15px;letter-spacing:3px;color:var(--vert);margin:8px 0 6px;text-shadow:0 0 8px rgba(0,255,163,.5);word-break:break-word;}' +
    '#credit .cr-nom b{color:var(--cyan);font-weight:normal;}' +
    '#credit .cr-srv{font-size:11px;letter-spacing:2px;color:var(--cyan);margin-bottom:4px;word-break:break-word;}' +
    '#credit .cr-txt{font-size:12px;line-height:1.5;color:#9fb4cc;margin:8px 0 12px;}' +
    '.cr-btn{display:block;width:100%;box-sizing:border-box;margin-bottom:8px;padding:9px;background:#000;color:var(--vert);border:1px solid var(--vert);cursor:pointer;font-family:inherit;font-size:12px;letter-spacing:3px;}' +
    '.cr-btn:hover{background:rgba(0,255,163,.15);}' +
    '.cr-btn.main{background:var(--vert);color:#000;font-weight:bold;box-shadow:0 0 12px rgba(0,255,163,.5);}' +
    '.cr-btn.main:hover{background:var(--cyan);}' +
    '#credit .cr-pied{margin-top:6px;font-size:9px;letter-spacing:2px;line-height:1.6;color:#6b7a88;}' +
    '#crFoot{flex-shrink:0;margin-top:6px;padding:5px;background:transparent;border:1px dashed rgba(255,77,90,.6);color:var(--cyan);font-family:inherit;font-size:10px;letter-spacing:2px;cursor:pointer;animation:crpulse 2.4s ease-in-out infinite;}' +
    '#crFoot b{font-weight:normal;color:var(--vert);}' +
    '@keyframes crpulse{50%{border-color:var(--vert);color:var(--vert);}}';
  document.head.appendChild(css);

  // ----- Lien -----
  function copier(bouton) {
    if (!CFG.lien) return;
    navigator.clipboard.writeText(CFG.lien).then(() => retour(bouton, 'LIEN COPIÉ !'), () => {});
  }
  function ouvrirLien(bouton) {
    if (!CFG.lien) return;
    try {
      const p = require('electron').shell.openExternal(CFG.lien);
      if (p && p.catch) p.catch(() => copier(bouton));
    } catch (e) { copier(bouton); }
  }
  function retour(bouton, txt) {
    if (!bouton) return;
    const ancien = bouton.dataset.txt || bouton.textContent;
    bouton.dataset.txt = ancien;
    bouton.textContent = txt;
    setTimeout(() => { bouton.textContent = ancien; }, 1400);
  }

  // ----- La fenêtre À PROPOS -----
  const box = document.createElement('div');
  box.id = 'credit';
  box.innerHTML =
    '<div class="rb-cadre cy"><div class="rb-in">' +
    '<div class="cr-tete"><div class="reboot-titre pt">À PROPOS</div><button id="crX" title="Fermer">✕</button></div>' +
    '<div class="reboot-sous">// CAPRI · IA DE BUREAU</div>' +
    '<div class="cr-nom">CRÉÉ PAR <b id="crBlaze"></b></div>' +
    '<div class="cr-srv" id="crSrv"></div>' +
    '<div class="cr-txt">Un projet fait avec passion. Rejoins la communauté : partage tes idées, tes captures et tes objets préférés !</div>' +
    '<button class="cr-btn main" id="crJoin">REJOINDRE LE DISCORD</button>' +
    '<button class="cr-btn" id="crCopy">COPIER LE LIEN</button>' +
    '<div class="cr-pied">MERCI D AVOIR ESSAYÉ CAPRI<br>PROJET DE FAN, NON AFFILIÉ À CD PROJEKT RED.</div>' +
    '<div class="rb-scan"></div></div></div>';
  document.body.appendChild(box);
  box.querySelector('#crBlaze').textContent = CFG.blaze;
  const srv = box.querySelector('#crSrv');
  const parties = [];
  if (CFG.serveur) parties.push('SERVEUR : ' + CFG.serveur);
  if (CFG.lien) parties.push('▸ ' + sansHttp(CFG.lien));
  srv.textContent = parties.join('   ');
  if (!CFG.lien) { box.querySelector('#crJoin').style.display = 'none'; box.querySelector('#crCopy').style.display = 'none'; }
  const bJoin = box.querySelector('#crJoin'), bCopy = box.querySelector('#crCopy');
  bJoin.addEventListener('click', () => ouvrirLien(bJoin));
  bCopy.addEventListener('click', () => copier(bCopy));

  let creditOuvert = false;
  const majc = () => { if (typeof majClic === 'function') majClic(); };
  function ouvrirCredit() {
    if (creditOuvert) return;
    creditOuvert = true;
    box.style.display = 'block';
    box.animate([{ opacity: 0, transform: 'translate(-50%,-50%) scale(0.92)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' }], { duration: 260, easing: 'ease-out' });
    if (typeof decoder === 'function') decoder(box.querySelector('.reboot-titre'), 'À PROPOS', 400);
    majc();
  }
  function fermerCredit() {
    if (!creditOuvert) return;
    creditOuvert = false;
    box.style.display = 'none';
    majc();
  }
  box.querySelector('#crX').addEventListener('click', fermerCredit);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fermerCredit(); });

  // Pendant la balade, l'écran laisse passer les clics : on garde la fenêtre cliquable
  if (typeof uiCapte === 'function') {
    const ancienne = uiCapte;
    window.uiCapte = () => ancienne() || creditOuvert;
  }

  // ----- Ligne de crédit tout le temps visible dans la fenêtre d'appel -----
  const appel = document.getElementById('call');
  if (appel) {
    const foot = document.createElement('button');
    foot.id = 'crFoot';
    foot.innerHTML = 'CRÉÉ PAR <b></b>' + (CFG.lien ? '  ·  DISCORD' : '');
    foot.querySelector('b').textContent = CFG.blaze;
    foot.addEventListener('click', ouvrirCredit);
    appel.appendChild(foot);
  }

  // ----- Entrée À PROPOS dans le menu clic droit -----
  const dedans = document.querySelector('#menu .in');
  if (dedans) {
    const mCredit = document.createElement('button');
    mCredit.textContent = 'À PROPOS';
    mCredit.addEventListener('click', () => { if (typeof fermerMenu === 'function') fermerMenu(); ouvrirCredit(); });
    dedans.appendChild(mCredit);
  }

  // ----- La toute première fois : la fenêtre s'ouvre une fois toute seule -----
  let vu = false;
  try { vu = localStorage.getItem('capri_credit_vu') === '1'; } catch (e) {}
  if (!vu) {
    const guet = setInterval(() => {
      const visible = (appel && appel.style.display === 'flex') || document.body.classList.contains('enAnim');
      if (!visible) return;
      clearInterval(guet);
      try { localStorage.setItem('capri_credit_vu', '1'); } catch (e) {}
      setTimeout(ouvrirCredit, 1500);
    }, 1500);
  }
})();
