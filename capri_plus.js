// ===== CAPRI PLUS : discussion-balade allégée + petites nouveautés (sans aucun son) =====
// Ce fichier REMPLACE legere.js. Il est chargé après le code principal de index.html :
// les fonctions ci-dessous remplacent celles du même nom.
//
// Nouveautés :
//  1. La réponse de Capri se "décode" dans la bulle (des caractères de code se transforment en texte).
//  2. Pendant qu'elle lit, la bulle affiche "ANALYSE" avec des points qui avancent.
//  3. Un bouton FICHIER dans le panneau d'écriture : tu choisis un fichier texte (ou tu le glisses
//     sur le panneau) et son contenu est ajouté à ton message.

// ----- Un peu de style (pas besoin de toucher au CSS de index.html) -----
(function () {
  const st = document.createElement('style');
  st.textContent =
    '#discTab { box-shadow: 0 0 0 1px rgba(39, 230, 255, 0.7), 0 0 10px rgba(39, 230, 255, 0.35); }' +
    '#discTab.proche { box-shadow: 0 0 0 1px rgba(0, 255, 163, 0.95), 0 0 12px rgba(0, 255, 163, 0.45); }' +
    '.tb-ecran::after { display: none; }' +
    '#discFichier { flex-shrink: 0; height: 28px; padding: 0 9px; background: #000; color: var(--vert);' +
    ' border: 1px solid var(--vert); cursor: pointer; font-family: inherit; font-size: 10px; letter-spacing: 2px; }' +
    '#discFichier:hover { background: rgba(0, 255, 163, 0.18); }' +
    '#discPanel.depot { outline: 2px dashed var(--vert); outline-offset: -6px; }';
  document.head.appendChild(st);
})();

// ----- Bouton FICHIER dans le panneau d'écriture -----
(function () {
  const bar = document.getElementById('discBar');
  const choix = document.createElement('input');
  choix.type = 'file';
  choix.accept = '.txt,.md,.json,.js,.html,.css,.csv,.py,.log,.xml,.yml,.yaml,.ini,.cfg';
  choix.style.display = 'none';
  const bouton = document.createElement('button');
  bouton.id = 'discFichier';
  bouton.textContent = 'FICHIER';
  bouton.title = 'Ajouter un fichier texte au message';
  bar.insertBefore(bouton, bar.firstChild);
  bar.appendChild(choix);

  async function lireFichier(f) {
    if (!f) return;
    if (f.size > 1000000) { signalerPanneau('FICHIER TROP GROS (1 MO MAX)'); return; }
    let txt = '';
    try { txt = await f.text(); } catch (e) { signalerPanneau('IMPOSSIBLE DE LIRE CE FICHIER'); return; }
    if (txt.indexOf('\u0000') >= 0) { signalerPanneau('CE FICHIER N\u2019EST PAS DU TEXTE'); return; }
    const coupe = txt.length > 6000;
    discInput.value += (discInput.value ? '\n' : '') + '[FICHIER ' + f.name + ']\n' + txt.slice(0, 6000) + (coupe ? '\n[...]' : '');
    discHint.textContent = '\u25A3 ' + f.name + ' CHARGÉ' + (coupe ? ' (DÉBUT SEULEMENT)' : '');
    discHint.classList.remove('mal');
    clearTimeout(aideTimer);
    aideTimer = setTimeout(() => { discHint.textContent = TEXTE_AIDE; }, 2600);
    discInput.focus();
  }

  bouton.addEventListener('click', () => choix.click());
  choix.addEventListener('change', () => { lireFichier(choix.files[0]); choix.value = ''; });

  // Glisser un fichier sur le panneau (en plus du bouton)
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => e.preventDefault());
  discPanel.addEventListener('dragover', () => discPanel.classList.add('depot'));
  discPanel.addEventListener('dragleave', () => discPanel.classList.remove('depot'));
  discPanel.addEventListener('drop', (e) => {
    discPanel.classList.remove('depot');
    lireFichier(e.dataTransfer && e.dataTransfer.files[0]);
  });
})();

// ----- Seulement le trait de données (plus de viseur) -----
function montrerLien() { discLien.style.display = 'block'; }

// Un petit anneau qui s'élargit (le seul effet à l'arrivée de la tablette)
function anneau(x, y, c) {
  const o = document.createElement('div');
  o.style.cssText = 'position:fixed;pointer-events:none;z-index:97;border-radius:50%;width:24px;height:24px;' +
    'border:2px solid ' + c + ';box-shadow:0 0 8px ' + c + ';left:' + (x - 12) + 'px;top:' + (y - 12) + 'px;';
  document.body.appendChild(o);
  o.animate([{ opacity: 0.9, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(5)' }],
    { duration: 420, easing: 'ease-out' }).onfinish = () => o.remove();
}

// Le panneau se replie simplement vers la tablette
async function comprimerPanneau() {
  discPanel.getAnimations().forEach((a) => a.cancel());
  const a = discPanel.animate([
    { transform: 'scale(1)', opacity: 1 },
    { transform: 'scale(0.12, 0.08)', opacity: 0 }
  ], { duration: 220, easing: 'ease-in', fill: 'forwards' });
  try { await a.finished; } catch (e) { return; }
  discPanel.style.display = 'none';
  a.cancel();
  if (enAnim && !panneauOuvert) { discBtn.style.display = 'block'; survolBtn = dansRect(discBtn); majClic(); }
}

// La tablette file droit vers les mains de Capri (pas de tour, pas de traînée)
function volerVersCapri(monFlux, s) {
  return new Promise((res) => {
    const x0 = tabX, y0 = tabY, cible = mainsCapri();
    const D = borner(260 + Math.hypot(cible.x - x0, cible.y - y0) * 0.25, 300, 650);
    const t0 = performance.now();
    const tick = (now) => {
      if (monFlux !== flux || s !== session) { res(false); return; }
      const p = Math.min(1, (now - t0) / D), e = lisse(p);
      const x = x0 + (cible.x - x0) * e, y = y0 + (cible.y - y0) * e;
      placerTab(x, y, -8 * (1 - e), 1 - 0.25 * e);
      viser(x, y);
      majLien(x, y);
      if (p >= 1) { res(true); return; }
      rafVol = requestAnimationFrame(tick);
    };
    rafVol = requestAnimationFrame(tick);
  });
}

// Pendant qu'elle lit : un simple trait de scanner qui descend sur elle
function demarrerLecture(s) {
  arreterLecture();
  const r = sprite.getBoundingClientRect();
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;z-index:97;pointer-events:none;overflow:hidden;left:' + r.left + 'px;top:' + r.top +
    'px;width:' + r.width + 'px;height:' + r.height + 'px;';
  el.innerHTML = '<div style="position:absolute;left:0;right:0;height:2px;top:0;background:#27e6ff;box-shadow:0 0 8px #27e6ff"></div>';
  document.body.appendChild(el);
  el.firstChild.animate([{ top: '0px' }, { top: r.height + 'px' }], { duration: 1100, iterations: Infinity, easing: 'linear' });
  lectureEl = el;
}

// La bulle d'attente : "ANALYSE" avec des points qui avancent
function bulleAttente(s) {
  const id = ++bulleId;
  bulle.getAnimations().forEach((a) => a.cancel());
  bulleActive = true;
  bulleTxt.classList.remove('longue');
  bulleTxt.textContent = 'ANALYSE';
  bulle.style.display = 'block';
  positionnerBulle();
  let n = 0;
  clearInterval(pointsTimer);
  pointsTimer = setInterval(() => {
    if (id !== bulleId || s !== session) { clearInterval(pointsTimer); return; }
    n = (n + 1) % 4;
    bulleTxt.textContent = 'ANALYSE' + '.'.repeat(n);
  }, 320);
}

// La réponse "se décode" : des caractères de code se transforment peu à peu en texte
// (fx : un petit effet joué quand la bulle apparaît)
async function direTexte(texte, duree, fondu, vitesse, fx) {
  const id = ++bulleId;
  clearInterval(pointsTimer);
  bulle.getAnimations().forEach((a) => a.cancel());
  bulleActive = true;
  bulleTxt.classList.add('longue');
  bulleTxt.textContent = '';
  bulle.style.display = 'block';
  positionnerBulle();
  bulle.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120 });
  if (fx) fx();

  const CAR = '01#<>/$%';
  const pas = Math.max(1, Math.ceil(texte.length / 90));   // plus le texte est long, plus ça avance par paquets
  for (let n = 0; n <= texte.length; n += pas) {
    if (id !== bulleId) return false;
    let r = texte.slice(0, n);
    const queue = Math.min(6, texte.length - n);
    for (let i = 0; i < queue; i++) {
      const c = texte[n + i];
      r += (c === ' ' || c === '\n') ? c : CAR[Math.floor(Math.random() * CAR.length)];
    }
    bulleTxt.textContent = r;
    positionnerBulle();
    await wait(vitesse);
  }
  bulleTxt.textContent = texte;
  positionnerBulle();
  await wait(duree);
  if (id !== bulleId) return false;
  try {
    await bulle.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fondu, fill: 'forwards' }).finished;
  } catch (e) { return false; }
  if (id !== bulleId) return false;
  cacherBulle();
  return true;
}

// L'envoi : vol de la tablette, lecture, réponse dans la bulle
async function lancerEnvoi(monFlux, s, texte, auto) {
  const encore = () => monFlux === flux && s === session;
  try {
    if (auto) { await wait(250); if (!encore()) return; }
    const ok = await volerVersCapri(monFlux, s);
    if (!ok || !encore()) return;

    // Elle attrape la tablette
    discTab.style.display = 'none';
    cacherLien();
    poserTablette('lecture', 1);
    const m = mainsCapri();
    anneau(m.x, m.y, '#27e6ff');
    await wait(250);
    if (!encore()) return;

    // Elle lit pendant que l'IA réfléchit
    demarrerLecture(s);
    bulleAttente(s);
    const reply = await ipcRenderer.invoke('ask', history.concat([{ role: 'user', content: texte }]));
    arreterLecture();
    if (!encore()) return;
    const erreur = reply.startsWith('[Erreur');
    if (!erreur) {
      history.push({ role: 'user', content: texte });
      history.push({ role: 'assistant', content: reply });
      while (history.length > 20) history.splice(0, 2);
    }
    // La discussion apparaît aussi dans la fenêtre d'appel (message coupé s'il est très long, par exemple un fichier)
    addRow('moi').textContent = texte.length > 300 ? texte.slice(0, 300) + '\u2026' : texte;
    addRow('capri').textContent = reply;

    const aDire = erreur ? "Pas de signal, choom... Ollama est bien lancé ?" : reply;
    const duree = Math.min(BULLE_REPONSE_MAX, Math.max(BULLE_REPONSE_MIN, aDire.length * BULLE_REPONSE_PAR_CARACTERE));
    // Un seul petit "grésillement" quand la bulle apparaît
    const fx = () => bulle.animate([{ filter: 'hue-rotate(60deg) brightness(1.6)' }, { filter: 'none' }], { duration: 160, easing: 'steps(2)' });
    const fini = await direTexte(aDire, duree, 1200, BULLE_REPONSE_VITESSE, fx);
    if (!fini || !encore()) return;
    await finDiscussion(s);
  } finally {
    arreterLecture();
    if (monFlux === flux) { discTab.style.display = 'none'; cacherLien(); }
  }
}

// On appuie sur le bouton de compression : le panneau devient la tablette que l'on tient
function demarrerTablette(px, py, auto) {
  if (!enAnim || tabActif || !panneauOuvert) return;
  const texte = discInput.value.trim();
  if (!texte) { signalerPanneau("ÉCRIS D'ABORD UN MESSAGE..."); discInput.focus(); return; }
  if (occupee() && etat !== 'tablette') { signalerPanneau('CAPRI EST OCCUPÉE... RÉESSAIE DANS UN INSTANT'); return; }

  const monFlux = ++flux;
  tabActif = true;
  tabTenue = true;
  panneauOuvert = false;
  survolPanneau = false;
  discInput.value = '';
  discInput.blur();
  prendreCapri();
  const s = session;
  tabX = px; tabY = py; tabVX = 0; tabRot = -8;
  tbTxt.textContent = '> ' + texte.slice(0, 60);
  discTab.style.display = 'block';
  placerTab(px, py, -8, 1);
  discTab.animate([{ scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1 }], { duration: 200, easing: 'ease-out' });
  comprimerPanneau();
  viser(px, py);
  montrerLien();
  majLien(px, py);
  majClic();

  if (auto) {
    tabTenue = false; tabActif = false; majClic();
    lancerEnvoi(monFlux, s, texte, true);
    return;
  }

  cancelAnimationFrame(rafTabHold);
  rafTabHold = requestAnimationFrame(boucleTabTenue);
  const bouge = (m) => {
    tabVX += ((m.clientX - tabX) - tabVX) * 0.35;
    tabX = m.clientX; tabY = m.clientY;
    viser(tabX, tabY);
    majLien(tabX, tabY);
  };
  const retirer = () => {
    window.removeEventListener('pointermove', bouge);
    window.removeEventListener('pointerup', fin);
    window.removeEventListener('pointercancel', fin);
    tabNettoyer = null;
  };
  const fin = () => {
    retirer();
    tabTenue = false; tabActif = false;
    cancelAnimationFrame(rafTabHold);
    majClic();
    lancerEnvoi(monFlux, s, texte, false);
  };
  window.addEventListener('pointermove', bouge);
  window.addEventListener('pointerup', fin);
  window.addEventListener('pointercancel', fin);
  tabNettoyer = retirer;
}

// ===== CORRECTION : Capri n'apparaît plus une seconde en bas à gauche au lancement de l'animation =====
// (identique à l'ancienne fonction, avec une ligne en plus : Capri est invisible avant que l'écran s'affiche)
async function animer() {
  call.style.display = 'none';
  walker.style.opacity = 0;   // NOUVEAU : invisible dès le départ
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

// ===== CORRECTION : l'écran ne disparaît plus quand la puce touche ou entre dans un port USB =====
// Avant, la secousse faisait trembler toute la page (body). Or une page qui "bouge" ainsi change le
// repère de tous les éléments fixes : pendant un instant, toute l'interface disparaissait.
// Maintenant, seule la zone de balade tremble (la secousse ne fait plus disparaître l'interface).
function secousseEcran(amp, duree) {
  const kf = [];
  for (let i = 0; i < 10; i++) kf.push({ transform: 'translate(' + alea(-amp, amp).toFixed(1) + 'px,' + alea(-amp, amp).toFixed(1) + 'px)' });
  kf.push({ transform: 'none' });
  anim.animate(kf, { duration: duree, easing: 'linear' });
}
