// ===== Capri : comportement "DORMIR" + menu VEILLE =====
// Ce fichier s'ajoute à index.html tout seul (voir installer_dodo.js).
(function () {
  const IMAGE_DORT = 'personnage_rouge_9.png';
  const IMAGE_SURSAUT = 'reel_bug.png';
  const ECHELLE_DORT = 0.6;     // taille de l'image allongée : plus petit = plus petite
  const ECHELLE_SURSAUT = 0.4;  // taille de l'image qui sursaute
  const DORS_MIN = 25000;       // si tu ne cliques pas, elle se réveille toute seule après ce temps (ms)
  const DORS_MAX = 50000;
  const PHRASES_SURSAUT = [
    "Hein ?! Je dormais pas, choom !",
    "Wow ! J'ai failli flatline !",
    "Quoi ?! Qui ?! Où ?!",
    "Je... je surveillais, hein !",
    "Tu m'as fait peur, gonk !"
  ];

  precharge(IMAGE_DORT);
  precharge(IMAGE_SURSAUT);

  let modeAFK = 'parle';
  try { modeAFK = localStorage.getItem('capriModeAFK') || 'parle'; } catch (e) {}
  let zzzTimer = null, reveilTimer = null;

  // ----- Le menu clic droit : barre de séparation + deux choix -----
  const style = document.createElement('style');
  style.textContent =
    '#menu .sep{display:none;height:1px;margin:6px 12px;background:var(--cadre);box-shadow:0 0 6px var(--rouge)}' +
    '#menu .sepT{display:none;padding:2px 16px 4px;font-size:9px;letter-spacing:4px;color:var(--cadre)}' +
    '#menu button.actif{color:var(--cyan)}' +
    '#menu button.actif::before{opacity:1}';
  document.head.appendChild(style);

  const dedans = document.querySelector('#menu .in');
  const mSep = document.createElement('div'); mSep.className = 'sep';
  const mSepT = document.createElement('div'); mSepT.className = 'sepT'; mSepT.textContent = 'VEILLE';
  const mParle = document.createElement('button'); mParle.textContent = 'PAPOTER';
  const mDort = document.createElement('button'); mDort.textContent = 'DORMIR';
  [mSep, mSepT, mParle, mDort].forEach((el) => dedans.appendChild(el));

  function majMenuMode() {
    mParle.classList.toggle('actif', modeAFK === 'parle');
    mDort.classList.toggle('actif', modeAFK === 'dort');
  }
  function choisir(m) {
    modeAFK = m;
    try { localStorage.setItem('capriModeAFK', m); } catch (e) {}
    majMenuMode();
    fermerMenu();
  }
  mParle.addEventListener('click', () => choisir('parle'));
  mDort.addEventListener('click', () => choisir('dort'));

  // Le séparateur et les deux choix n'apparaissent que pendant la balade
  const ouvrirMenuOrigine = ouvrirMenu;
  ouvrirMenu = function (x, y) {
    const v = enAnim ? 'block' : 'none';
    [mSep, mSepT, mParle, mDort].forEach((el) => { el.style.display = v; });
    majMenuMode();
    ouvrirMenuOrigine(x, y);
  };

  // ----- Quand elle devrait s'asseoir et parler, elle s'endort si ce mode est choisi -----
  const parlerAssiseOrigine = parlerAssise;
  parlerAssise = function (s) {
    if (modeAFK === 'dort') return dormir(s);
    return parlerAssiseOrigine(s);
  };

  // Met une image (si le fichier manque, on garde une pose normale)
  async function poserImage(src, echelle) {
    pose = 'speciale';
    const im = new Image();
    im.src = src;
    try {
      await im.decode();
      sprite.src = src;
      sprite.style.height = im.naturalHeight * echelle * ECHELLE + 'px';
    } catch (e) {
      console.warn('Image introuvable : ' + src);
      sprite.src = 'capri' + POSES[0] + '.png';
      sprite.style.height = HAUTEURS[POSES[0]] * ECHELLE + 'px';
    }
    sprite.style.width = 'auto';
  }

  // Un petit "Z" qui monte au-dessus de sa tête
  function zzz() {
    const el = document.createElement('div');
    el.textContent = Math.random() < 0.5 ? 'Z' : 'z';
    const x = ax + sprite.offsetWidth * 0.2 + alea(-10, 20);
    const y = window.innerHeight - ay - sprite.offsetHeight * 0.7;
    el.style.cssText = 'position:absolute;pointer-events:none;font-weight:bold;' +
      'font-family:Consolas,"Courier New",monospace;left:' + x + 'px;top:' + y + 'px;' +
      'font-size:' + alea(14, 24).toFixed(0) + 'px;color:#27e6ff;text-shadow:0 0 8px #27e6ff;';
    anim.insertBefore(el, walker);
    el.animate([
      { opacity: 0, transform: 'translate(0,0)' },
      { opacity: 1, offset: 0.2 },
      { opacity: 0, transform: 'translate(' + alea(10, 35).toFixed(0) + 'px,-60px)' }
    ], { duration: 2200, easing: 'ease-out' }).onfinish = () => el.remove();
  }

  // === GARDIEN DE L'IMAGE DORT ===
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

  // ----- Elle s'endort -----
  async function dormir(s) {
    frappes();
    await wait(150);
    if (s !== session) return;
    await ecrase();
    if (s !== session) return;
    await poserImage(IMAGE_DORT, ECHELLE_DORT);
    await wait(30);
    if (s !== session) return;
    ax = borner(ax, 0, Math.max(0, window.innerWidth - sprite.offsetWidth));
    await reforme(340);
    if (s !== session) return;

    etat = 'dort';
    garderImageDort(s);
    clearInterval(zzzTimer);
    zzzTimer = setInterval(() => {
      if (etat !== 'dort' || s !== session) { clearInterval(zzzTimer); return; }
      zzz();
    }, 1100);
    clearTimeout(reveilTimer);
    reveilTimer = setTimeout(() => {
      if (etat === 'dort' && s === session) reveil(s, false);
    }, alea(DORS_MIN, DORS_MAX));
  }

  // ----- Elle se réveille (en sursautant si on a cliqué sur elle) -----
  async function reveil(s, sursaut) {
    if (etat !== 'dort') return;
    etat = 'transition';
    clearInterval(zzzTimer);
    clearTimeout(reveilTimer);

    if (sursaut) {
      const centre = ax + sprite.offsetWidth / 2;
      await poserImage(IMAGE_SURSAUT, ECHELLE_SURSAUT);
      if (s !== session) return;
      await wait(20);
      ax = borner(centre - sprite.offsetWidth / 2, 0, Math.max(0, window.innerWidth - sprite.offsetWidth));
      walker.animate([{ filter: 'brightness(3)' }, { filter: 'none' }], { duration: 260 });
      secousseEcran(4, 200);
      particules(centre, window.innerHeight - 4, {
        couleurs: ['#00ffa3', '#ff2e63', '#ffffff'], n: 14, vmin: 120, vmax: 380,
        tailleMin: 2, tailleMax: 5, angleMin: -Math.PI * 0.95, angleMax: -Math.PI * 0.05, duree: 450
      });
      sprite.animate([
        { transform: 'scale(1.2, 0.8)' },
        { transform: 'translateY(-35px) scale(0.92, 1.12)', offset: 0.3 },
        { transform: 'scale(1, 1)' }
      ], { duration: 450, easing: 'ease-out' });
      etat = 'parle';
      const fini = await direPhrase(PHRASES_SURSAUT, 1800, 600);
      if (!fini || s !== session) return;
    }

    adir = Math.random() < 0.5 ? -1 : 1;
    const ok = await transformer(MARCHE, s);
    if (!ok) return;
    etat = 'marche';
    const t = performance.now();
    finEtat = t + alea(4000, 9000);
    prochaineEscapade = t + alea(ESCAPADE_MIN, ESCAPADE_MAX);
    prochaineBulle = t + alea(BULLE_MIN, BULLE_MAX);
  }

  // Un clic sur Capri endormie la fait sursauter (au lieu de la désanimer)
  walker.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || etat !== 'dort') return;
    e.preventDefault();
    e.stopImmediatePropagation();
    reveil(session, true);
  }, true);
})();
