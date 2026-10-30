// capri_jauges_anim.js : la jauge d'humeur qui apparaît à côté de Capri quand elle est à l'arrêt
(function () {
  var ipc = require('electron').ipcRenderer;

  // Les trois jauges : pour changer un nom ou une couleur, modifie simplement cette liste
  var JAUGES = [
    { cle: 'joyeuse', nom: 'JOYEUSE', couleur: '#00ffa3' },
    { cle: 'pasContente', nom: 'ÉNERVÉE', couleur: '#ff2e63' },
    { cle: 'ennui', nom: 'ENNUI', couleur: '#27e6ff' }
  ];

  var LARGEUR = 176;          // largeur de la jauge (pixels)
  var ECART = 10;             // distance entre Capri et la jauge (pixels)
  var DELAI_APPARITION = 350; // Capri doit être à l'arrêt depuis ce temps avant que la jauge apparaisse (ms)
  // Les moments où Capri est "à l'arrêt" : assise, en pose, ou en train de parler
  var ETATS_ARRET = ['pose', 'assise', 'parle', 'ligne-assise'];

  var css = document.createElement('style');
  css.textContent =
    '#capriJaugesAnim{display:none;position:fixed;left:0;top:0;z-index:52;pointer-events:none;opacity:0;' +
    'transition:opacity 0.3s;width:' + LARGEUR + 'px;font-family:Consolas,"Courier New",monospace}' +
    '.cja-cadre{--c:9px;background:var(--cadre);padding:2px;clip-path:polygon(0 0,100% 0,100% calc(100% - var(--c)),calc(100% - var(--c)) 100%,0 100%);animation:alerte 1.6s steps(2,start) infinite}' +
    '.cja-in{background:rgba(0,0,0,0.92);padding:7px 9px 8px 8px;font-size:10px;letter-spacing:1.5px;' +
    'clip-path:polygon(0 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%)}' +
    '.cja-t{display:flex;justify-content:space-between;margin-bottom:6px;color:var(--cadre)}' +
    '.cja-t b{font-weight:normal;color:var(--cyan)}' +
    '.cja{display:grid;grid-template-columns:62px 1fr 30px;align-items:center;gap:5px;margin-bottom:5px;color:var(--c)}' +
    '.cja:last-child{margin-bottom:0}' +
    '.cja-b{height:8px;padding:1px;border:1px solid var(--c);box-sizing:border-box}' +
    '.cja-f{height:100%;width:0%;background:repeating-linear-gradient(90deg,var(--c) 0 4px,transparent 4px 6px);box-shadow:0 0 5px var(--c);transition:width 0.6s}' +
    '.cja b{font-weight:normal;text-align:right}' +
    '.cja.dom .cja-n{text-shadow:0 0 6px var(--c)}';
  document.head.appendChild(css);

  var boite = document.createElement('div');
  boite.id = 'capriJaugesAnim';
  var cadre = document.createElement('div');
  cadre.className = 'cja-cadre';
  var dedans = document.createElement('div');
  dedans.className = 'cja-in';
  dedans.innerHTML = '<div class="cja-t"><span>HUMEUR</span><b id="cjaDom">---</b></div>';
  cadre.appendChild(dedans);
  boite.appendChild(cadre);

  var lignes = {};
  JAUGES.forEach(function (j) {
    var d = document.createElement('div');
    d.className = 'cja';
    d.style.setProperty('--c', j.couleur);
    d.innerHTML = '<span class="cja-n"></span><div class="cja-b"><div class="cja-f"></div></div><b>0%</b>';
    d.querySelector('.cja-n').textContent = j.nom;
    dedans.appendChild(d);
    lignes[j.cle] = { el: d, f: d.querySelector('.cja-f'), v: d.querySelector('b') };
  });
  document.body.appendChild(boite);
  var domEl = document.getElementById('cjaDom');

  function afficher(h) {
    var domCle = null, max = -1;
    JAUGES.forEach(function (j) {
      var v = Math.max(0, Math.min(100, Math.round(h[j.cle] || 0)));
      lignes[j.cle].f.style.width = v + '%';
      lignes[j.cle].v.textContent = v + '%';
      if (v > max) { max = v; domCle = j.cle; }
    });
    JAUGES.forEach(function (j) {
      lignes[j.cle].el.classList.toggle('dom', j.cle === domCle);
      if (j.cle === domCle) domEl.textContent = j.nom;
    });
  }

  // Les valeurs : d'abord celles des jauges de la fenêtre d'appel ; si elles ne répondent pas,
  // on les calcule à partir de l'énergie, de l'ennui et de l'affection de Capri
  function maj() {
    if (!document.body.classList.contains('enAnim')) return;
    ipc.invoke('capri-humeur').then(function (h) {
      if (h) { afficher(h); return; }
      throw new Error('vide');
    }).catch(function () {
      ipc.invoke('vie-charger').then(function (v) {
        if (!v || !v.humeur) return;
        var e = v.humeur;
        afficher({
          joyeuse: (e.energie + e.affection) / 2,
          pasContente: 100 - e.affection,
          ennui: e.ennui
        });
      }).catch(function () {});
    });
  }
  setInterval(maj, 1500);
  maj();

  // À chaque image : on regarde si Capri est à l'arrêt et on colle la jauge à côté d'elle
  var arretDepuis = 0, visible = false;
  function suivre() {
    requestAnimationFrame(suivre);
    var ok = false;
    try {
      ok = enAnim && ETATS_ARRET.indexOf(etat) !== -1 && walker.style.opacity !== '0';
    } catch (e) { ok = false; }
    var now = performance.now();
    if (!ok) { arretDepuis = 0; }
    else if (!arretDepuis) { arretDepuis = now; }
    var voulu = ok && now - arretDepuis >= DELAI_APPARITION;

    if (voulu !== visible) {
      visible = voulu;
      if (voulu) boite.style.display = 'block';
      boite.style.opacity = voulu ? '1' : '0';
      if (!voulu) setTimeout(function () { if (!visible) boite.style.display = 'none'; }, 320);
    }
    if (!voulu) return;

    var w = sprite.offsetWidth, h = sprite.offsetHeight;
    var gw = boite.offsetWidth, gh = boite.offsetHeight;
    var x = ax + w + ECART;                               // à droite de Capri...
    if (x + gw > window.innerWidth - 6) x = ax - gw - ECART; // ...ou à gauche s'il n'y a pas la place
    x = Math.max(6, Math.min(x, window.innerWidth - gw - 6));
    var y = window.innerHeight - ay - h / 2 - gh / 2;       // à mi-hauteur de son corps
    y = Math.max(6, Math.min(y, window.innerHeight - gh - 6));
    boite.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
  }
  requestAnimationFrame(suivre);
})();
