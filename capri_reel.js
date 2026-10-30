/* ===== MODE RÉEL : les vraies images de Capri + menu clic droit organisé ===== */
(function () {
  const IM = {
    bug: 'reel_bug.png', mal: 'reel_mal.png', still: 'reel_suspendu.png', swing: 'reel_elan.png',
    coin: 'reel_coin.png', top: 'reel_assis.png', a: 'reel_debout1.png', b: 'reel_debout2.png'
  };
  // H = hauteur affichée (px) ; px/py = où le curseur l'accroche quand on la tient (0 à 1)
  const T = {
    bug: { H: 180 }, mal: { H: 200 }, still: { H: 180, px: 0.51, py: 0.05 }, swing: { H: 180, px: 0.61, py: 0.06 },
    coin: { H: 170 }, top: { H: 150 }, a: { H: 185 }, b: { H: 185 }
  };
  const SEUIL_COIN = 90;       // distance (px) du bord de la fenêtre en dessous de laquelle c'est vraiment "le coin"
  const DESCENTE_JAMBES = 0.3; // de combien elle s'enfonce dans le fichier (part de sa hauteur) : plus grand = plus de jambes dans le fichier
  const pre = {};
  Object.keys(IM).forEach((k) => { pre[k] = new Image(); pre[k].src = IM[k]; });
  const ratio = (k) => (pre[k].naturalWidth && pre[k].naturalHeight) ? pre[k].naturalWidth / pre[k].naturalHeight : (k === 'top' ? 1 : 2 / 3);

  let reel = localStorage.getItem('capri_reel') === '1';
  let raw = sprite.getAttribute('src') || '';
  const orig = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  Object.defineProperty(sprite, 'src', {
    configurable: true,
    get() { return orig.get.call(sprite); },
    set(v) { raw = String(v); if (reel) appliquer(); else orig.set.call(sprite, v); }
  });

  const coin = (f, cx) => (cx - f.x < SEUIL_COIN ? -1 : (f.x + f.w - cx < SEUIL_COIN ? 1 : 0));   // -1 coin gauche, 1 coin droit, 0 milieu
  const st = (p, v) => { if (sprite.style[p] !== v) sprite.style[p] = v; };

  function decider() {
    let k = null, flip = false;
    const cx = ax + sprite.offsetWidth / 2;
    if (etat === 'bug') k = 'bug';
    else if (etat === 'ecrasee' && !fenetre && pose === 'attrapee') k = 'mal';
    else if (etat === 'tablette' || pose === 'tablette') k = 'top';   // elle lit et répond : reel_assis
    else if (etat === 'attrapee' || etat === 'chute') {
      if (assiseTenue || (etat === 'chute' && chuteFenetre)) {
        const f = etat === 'chute' ? chuteFenetre : cibleFenetre;
        const c = f ? coin(f, etat === 'attrapee' ? curX : cx) : 0;
        k = c ? 'coin' : 'top'; flip = c > 0;
      } else {
        k = 'still';   // toujours la même image droite quand on la tient
      }
    } else if (pose === 'assise' || (etat === 'ecrasee' && fenetre)) {
      const c = fenetre ? coin(fenetre, cx) : 0;
      k = c ? 'coin' : 'top'; flip = c > 0;
    } else if (typeof pose === 'number') {
      k = 'top';       // plus jamais debout : toujours reel_assis
    }
    return k ? { k, flip } : null;
  }

  let enCours = false;
  function appliquer() {
    if (enCours) return;
    enCours = true;
    try {
      const d = decider();
      if (!d) {
        if (orig.get.call(sprite) !== raw && !orig.get.call(sprite).endsWith(raw)) orig.set.call(sprite, raw);
        st('scale', ''); st('translate', '');
        return;
      }
      const t = T[d.k];
      if (!orig.get.call(sprite).endsWith(IM[d.k])) orig.set.call(sprite, IM[d.k]);
      st('height', t.H + 'px'); st('width', 'auto');
      st('scale', d.flip ? '-1 1' : ''); st('translate', d.k === 'coin' ? '0 ' + Math.round(t.H * DESCENTE_JAMBES) + 'px' : '');   // fesses sur le haut du fichier, jambes dans le fichier
      if (etat === 'attrapee') {
        const px = t.px === undefined ? 0.5 : t.px, py = t.py === undefined ? 0.04 : t.py;
        tenueH = t.H / ECHELLE; tenueW = tenueH * ratio(d.k);
        tenuePX = d.flip ? 1 - px : px; tenuePY = py;
        const o = (tenuePX * 100) + '% ' + (tenuePY * 100) + '%';
        if (walker.style.transformOrigin !== o) walker.style.transformOrigin = o;
      }
    } finally { enCours = false; }
  }
  new MutationObserver(() => { if (reel) appliquer(); }).observe(sprite, { attributes: true, attributeFilter: ['style'] });
  (function boucleReel() { if (reel) appliquer(); requestAnimationFrame(boucleReel); })();

  // ===== Menu clic droit : catégories séparées par des barres =====
  const css = document.createElement('style');
  css.textContent =
    '#menu .sep{height:1px;margin:5px 10px;background:linear-gradient(90deg,transparent,var(--vert),transparent);box-shadow:0 0 6px var(--vert)}' +
    '#menu .cat{font-size:9px;letter-spacing:3px;color:var(--cadre);padding:3px 16px 1px;text-shadow:0 0 5px rgba(255,77,90,.6)}';
  document.head.appendChild(css);

  const inn = document.querySelector('#menu .in');
  const bReel = document.createElement('button');
  bReel.id = 'mReel';
  inn.appendChild(bReel);
  const majBouton = () => { bReel.textContent = 'MODE RÉEL' + (reel ? '  ✓' : ''); };

  function basculer() {
    reel = !reel;
    localStorage.setItem('capri_reel', reel ? '1' : '0');
    majBouton();
    if (reel) appliquer();
    else {
      orig.set.call(sprite, raw); st('scale', ''); st('translate', '');
      if (typeof pose === 'number') setPose(pose);
      else if (pose === 'assise') setPoseAssise();
    }
  }
  bReel.addEventListener('click', () => { fermerMenu(); basculer(); });

  const obs = new MutationObserver(organiser);
  function organiser() {
    obs.disconnect();
    inn.querySelectorAll('.sep,.cat').forEach((e) => e.remove());
    const G = { 'APPEL': [], 'ANIMATION': [], 'MODES': [] };
    [...inn.children].forEach((b) => {
      const g = b.id === 'mHang' ? 'APPEL' : (b.id === 'mAnim' || b.id === 'mDesanim') ? 'ANIMATION' : 'MODES';
      G[g].push(b);
    });
    let premier = true;
    Object.keys(G).forEach((nom) => {
      if (!G[nom].length) return;
      if (!premier) { const s = document.createElement('div'); s.className = 'sep'; inn.appendChild(s); }
      const c = document.createElement('div'); c.className = 'cat'; c.textContent = nom; inn.appendChild(c);
      G[nom].forEach((b) => inn.appendChild(b));
      premier = false;
    });
    obs.observe(inn, { childList: true });
  }
  majBouton();
  organiser();
  if (reel) appliquer();

  // ===== Réponse qui suit Capri : pendant qu'elle répond, on peut l'attraper et la balancer =====
  // Sa bulle de réponse reste affichée, la suit partout (tenue, chute, atterrissage), puis s'efface.
  let suivi = null, pendant = false, derniereReponse = '';
  const cacherOrig = window.cacherBulle, direTexteOrig = window.direTexte, direPhraseOrig = window.direPhrase, attraperOrig = window.attraperCapri;
  window.cacherBulle = function () { if (suivi && enAnim) return; return cacherOrig.apply(this, arguments); };
  window.direTexte = function (texte) { derniereReponse = texte; return direTexteOrig.apply(this, arguments); };
  window.direPhrase = function (liste, duree, fondu) {   // pas de petite phrase par-dessus la réponse
    if (suivi && enAnim) return wait((duree === undefined ? 2000 : duree) + (fondu === undefined ? 600 : fondu)).then(() => true);
    return direPhraseOrig.apply(this, arguments);
  };
  window.attraperCapri = function () {
    if (pendant) {
      pendant = false;
      const d = Math.min(BULLE_REPONSE_MAX, Math.max(BULLE_REPONSE_MIN, derniereReponse.length * BULLE_REPONSE_PAR_CARACTERE));
      suivi = { fin: performance.now() + d };
      bulleId++;                                   // arrête l'écriture d'origine
      bulle.getAnimations().forEach((a) => a.cancel());
      attraperOrig.apply(this, arguments);
      bulleTxt.classList.add('longue');
      bulleTxt.textContent = derniereReponse;      // la réponse entière, qui la suit
      bulle.style.display = 'block';
      bulleActive = true;
      return;
    }
    return attraperOrig.apply(this, arguments);
  };
  // Avant le gestionnaire d'origine : si elle est en train de répondre, on autorise l'attrape
  walker.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !enAnim || tenue) return;
    if (etat === 'tablette' && bulleActive && bulleTxt.classList.contains('longue')) { pendant = true; etat = 'parle'; }
  }, true);
  window.addEventListener('pointerup', () => { setTimeout(() => { pendant = false; }, 0); }, true);
  (function boucleSuivi() {
    requestAnimationFrame(boucleSuivi);
    if (!suivi) return;
    if (!enAnim) { suivi = null; return; }
    if (bulleActive) positionnerBulle();
    if (performance.now() > suivi.fin && !suivi.fondu) {
      suivi.fondu = true;
      bulle.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1200, fill: 'forwards' }).finished
        .then(() => { suivi = null; cacherOrig(); }).catch(() => { suivi = null; });
    }
  })();

  // Écrasée au sol : moins aplatie, pour qu'on voie encore l'image
  const ECRASEE_DOUCE = 'scale(1.12, 0.7)';
  new MutationObserver(() => {
    if (reel && sprite.style.transform.replace(/\s/g, '') === 'scale(1.3,0.35)') sprite.style.transform = ECRASEE_DOUCE;
  }).observe(sprite, { attributes: true, attributeFilter: ['style'] });
})();
