// ===== capri_fix.js : deux corrections (à charger APRÈS capri_plus.js) =====
// 1. Capri n'apparaît plus une fraction de seconde en bas à gauche au lancement de l'animation.
// 2. L'interface ne disparaît plus quand la puce touche ou entre dans un port USB
//    (la secousse d'écran est supprimée : c'était elle qui faisait tout disparaître).

// 2. Plus aucune secousse d'écran
function secousseEcran() {}

// 1. Au lancement, Capri est cachée ET placée hors de l'écran avant que quoi que ce soit s'affiche
async function animer() {
  call.style.display = 'none';
  walker.style.opacity = 0;
  walker.style.transform = 'translate(-9999px, 0px)';
  ipcRenderer.send('mode', 'anim');
  enAnim = true;
  const s = ++session;
  await wait(250);
  if (s !== session) return;
  anim.style.display = 'block';
  document.body.classList.add('enAnim');
  montrerBoutonDiscussion();
  afficherUSB(false);
  demarrerBalade(s);
}

// Pareil au début de la balade (le reste est identique à l'original)
async function demarrerBalade(s) {
  walker.style.opacity = 0;
  walker.style.transform = 'translate(-9999px, 0px)';
  etat = 'cache';
  cacherBulle();
  ay = 0; cibleAy = 0;
  fenetre = null;
  setPose(MARCHE);
  await wait(60);
  if (s !== session) return;
  const w = sprite.offsetWidth;
  ax = alea(w, Math.max(w, window.innerWidth - 2 * w));
  adir = Math.random() < 0.5 ? -1 : 1;
  majTransform(adir * SENS_MARCHE);
  walker.style.opacity = 0;
  sprite.style.transform = ECRASE;

  // Le tonnerre blanc tombe du haut de l'écran jusqu'au sol
  const x = ax + w / 2, bas = window.innerHeight - 2;
  eclair(x + alea(-90, 90), -10, x, bas, {
    couleur: '#dfeaff', halo: 'rgba(190,215,255,0.95)', epaisseur: 3.5,
    duree: 750, descente: 85, rugosite: 0.38, pas: 7, branches: 0.05, echelleBr: 1
  });
  await wait(85);
  if (s !== session) return;

  // Impact : explosion de carrés, et Capri apparaît tout de suite
  impact(x, bas);
  walker.style.opacity = 1;
  walker.animate([{ filter: 'brightness(3)' }, { filter: 'none' }], { duration: 260 });
  await reforme(380);
  if (s !== session) return;

  etat = 'marche';
  finEtat = performance.now() + alea(4000, 9000);
  prochaineEscapade = performance.now() + (escapadeVite ? alea(2500, 4000) : alea(ESCAPADE_MIN, ESCAPADE_MAX));
  escapadeVite = false;
  prochaineBulle = performance.now() + alea(BULLE_MIN, BULLE_MAX);
  raf = requestAnimationFrame(boucle);
}
