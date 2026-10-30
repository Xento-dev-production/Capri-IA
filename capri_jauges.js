// capri_jauges.js : trois jauges d'humeur dans la fenêtre d'appel
(function () {
  var ipc = require('electron').ipcRenderer;
  var call = document.getElementById('call');
  var chat = document.getElementById('chat');
  if (!call || !chat) return;

  // Les trois jauges : pour changer un nom ou une couleur, modifie simplement cette liste
  var JAUGES = [
    { cle: 'joyeuse', nom: 'JOYEUSE', couleur: '#00ffa3' },
    { cle: 'pasContente', nom: 'PAS CONTENTE', couleur: '#ff2e63' },
    { cle: 'ennui', nom: 'ENNUI', couleur: '#27e6ff' }
  ];

  var css = document.createElement('style');
  css.textContent =
    '#capriJauges{flex-shrink:0;margin-top:10px;padding:7px 9px;border:1px solid rgba(255,77,90,0.45);' +
    'background:rgba(255,77,90,0.05);font-size:10px;letter-spacing:2px}' +
    '.cj-t{display:flex;justify-content:space-between;margin-bottom:6px;color:var(--cadre)}' +
    '.cj-t b{font-weight:normal;color:var(--cyan)}' +
    '.cj{display:grid;grid-template-columns:96px 1fr 36px;align-items:center;gap:6px;margin-bottom:5px;color:var(--c)}' +
    '.cj:last-child{margin-bottom:0}' +
    '.cj-b{height:8px;padding:1px;border:1px solid var(--c);box-sizing:border-box}' +
    '.cj-f{height:100%;width:0%;background:repeating-linear-gradient(90deg,var(--c) 0 4px,transparent 4px 6px);' +
    'box-shadow:0 0 5px var(--c);transition:width 0.6s}' +
    '.cj b{font-weight:normal;text-align:right}' +
    '.cj.dom .cj-n{text-shadow:0 0 6px var(--c)}' +
    '.cj.dom .cj-n::before{content:"▸ "}';
  document.head.appendChild(css);

  var boite = document.createElement('div');
  boite.id = 'capriJauges';
  var titre = document.createElement('div');
  titre.className = 'cj-t';
  titre.innerHTML = '<span>HUMEUR</span><b id="cjDom">---</b>';
  boite.appendChild(titre);

  var lignes = {};
  JAUGES.forEach(function (j) {
    var d = document.createElement('div');
    d.className = 'cj';
    d.style.setProperty('--c', j.couleur);
    d.innerHTML = '<span class="cj-n"></span><div class="cj-b"><div class="cj-f"></div></div><b>0%</b>';
    d.querySelector('.cj-n').textContent = j.nom;
    boite.appendChild(d);
    lignes[j.cle] = { el: d, f: d.querySelector('.cj-f'), v: d.querySelector('b') };
  });
  chat.parentNode.insertBefore(boite, chat);
  var cjDom = document.getElementById('cjDom');

  function maj() {
    if (call.style.display !== 'flex') return; // seulement quand la fenêtre d'appel est ouverte
    ipc.invoke('capri-humeur').then(function (h) {
      if (!h) return;
      var domCle = null, max = -1;
      JAUGES.forEach(function (j) {
        var v = Math.max(0, Math.min(100, Math.round(h[j.cle] || 0)));
        lignes[j.cle].f.style.width = v + '%';
        lignes[j.cle].v.textContent = v + '%';
        if (v > max) { max = v; domCle = j.cle; }
      });
      JAUGES.forEach(function (j) { lignes[j.cle].el.classList.toggle('dom', j.cle === domCle); });
      JAUGES.forEach(function (j) { if (j.cle === domCle) cjDom.textContent = j.nom; });
    }).catch(function () {});
  }
  setInterval(maj, 2000);
  maj();
})();
