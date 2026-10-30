// ===== VERSION ALLÉGÉE de la discussion-balade (fichier à part) =====
// Ce fichier est chargé après le code principal de index.html :
// les fonctions ci-dessous remplacent celles du même nom.

// Un peu de style (ajouté ici, pas besoin de toucher au CSS de index.html)
(function () {
  const st = document.createElement('style');
  st.textContent =
    '#discTab { box-shadow: 0 0 0 1px rgba(39, 230, 255, 0.7), 0 0 10px rgba(39, 230, 255, 0.35); }' +
    '#discTab.proche { box-shadow: 0 0 0 1px rgba(0, 255, 163, 0.95), 0 0 12px rgba(0, 255, 163, 0.45); }' +
    '.tb-ecran::after { display: none; }';
  document.head.appendChild(st);
})();

// Seulement le trait de données (plus de viseur)
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
    addRow('moi').textContent = texte;
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
