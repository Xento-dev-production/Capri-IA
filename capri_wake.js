// ===== Réveil vocal : dis "OK Capri" et elle t'écoute =====
// À charger APRÈS capri_micro.js (et avant capri_langue.js) dans index.html.
//
// Comment ça marche :
//  1. Le micro écoute en continu, mais il n'envoie à Whisper que les moments où tu parles.
//  2. Si Whisper entend "OK Capri", une icône micro rouge apparaît en bas à droite,
//     et le micro de capri_micro.js se lance tout seul.
//  3. Tu poses ta question, puis tu appuies sur ENTRÉE : le message est transcrit et envoyé.
(function () {
  'use strict';
  const { ipcRenderer } = require('electron');

  // ===== Réglages =====
  const ACTIF = true;        // false = le réveil vocal est coupé (le micro n'écoute plus en continu)
  const SEUIL_MIN = 0.04;    // volume minimal pour compter comme "voix" (0 à 1) : plus grand = moins sensible
  const SILENCE_FIN = 3;     // blocs silencieux de suite (1 bloc = 0,26 s) pour dire "la phrase est finie"
  const DUREE_MAX = 14;      // phrase trop longue (musique, discussion...) : elle est ignorée (14 blocs = environ 3,5 secondes)
  const BLOCS_VOIX_MIN = 2;  // il faut au moins ce nombre de blocs avec de la voix (sinon c'est juste un bruit)
  const MAX_PAR_MINUTE = 8;  // nombre maximum d'analyses par minute (protège ton PC contre les saccades)

  if (!ACTIF) return;

  const msg = document.getElementById('msg');
  const discInput = document.getElementById('discInput');
  if (!msg || !discInput) return;

  // ----- L'icône micro (en bas à droite) -----
  const st = document.createElement('style');
  st.textContent =
    '#wakeIcone { display: none; position: fixed; right: 16px; bottom: 16px; z-index: 120; pointer-events: none;' +
    ' align-items: center; gap: 8px; padding: 6px 12px 6px 9px; background: #000; color: var(--rouge);' +
    ' border: 1px solid var(--rouge); font-size: 11px; letter-spacing: 3px; animation: wakePulse 1s ease-in-out infinite; }' +
    '@keyframes wakePulse { 50% { box-shadow: 0 0 14px var(--rouge); } }';
  document.head.appendChild(st);

  const icone = document.createElement('div');
  icone.id = 'wakeIcone';
  icone.innerHTML =
    '<svg width="14" height="18" viewBox="0 0 14 18" fill="none" stroke="currentColor" stroke-width="1.6">' +
    '<rect x="4" y="1" width="6" height="10" rx="3"/><path d="M1.5 8.5C1.5 12 4 14 7 14s5.5-2 5.5-5.5M7 14v3M4 17h6"/></svg>' +
    '<span>OK CAPRI · JE T\'ÉCOUTE</span>';
  document.body.appendChild(icone);

  // ----- Petites infos pour que tout le monde sache qu'on peut dire "OK Capri" -----
  // 1) Une ligne dans la fenêtre d'appel, juste au-dessus de la case d'écriture
  const stInfo = document.createElement('style');
  stInfo.textContent = '#wakeInfo { margin-top: 6px; font-size: 10px; letter-spacing: 1.5px; color: var(--cyan); opacity: 0.75; }';
  document.head.appendChild(stInfo);
  const info = document.createElement('div');
  info.id = 'wakeInfo';
  info.textContent = '◉ Dis « OK Capri » pour me parler';
  const rangee = document.getElementById('inputrow');
  if (rangee && rangee.parentNode) rangee.parentNode.insertBefore(info, rangee);
  // 2) Une info-bulle quand on laisse la souris sur l'orbe CALLING
  const orbEl = document.getElementById('orb');
  if (orbEl) orbEl.title = 'Clique pour appeler, ou dis « OK Capri »';

  const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
  const microEnCours = () => document.querySelector('.micro-actif');

  // "OK Capri" tel que Whisper peut l'écrire (sans accents ni ponctuation)
  function norm(t) {
    return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }
  const RE_REVEIL = /\b(ok|okay|okey|oke|o k)\s+(capri|capris|kapri|capry|cabri|capre)\b/;

  // ----- Écoute en continu -----
  let flux = null, ctx = null, source = null, proc = null;
  let bruit = 0.01, enParole = false, silence = 0, blocs = [], avant = null, voises = 0;
  let ignorer = false;       // vrai après une phrase trop longue : on attend un silence avant de réécouter
  let finAnalyse = 0, appels = [];
  let occupe = false;        // vrai pendant que Whisper analyse une phrase
  let reveilActif = false;   // vrai tant que Capri t'écoute après "OK Capri"

  function oublier() { enParole = false; silence = 0; blocs = []; avant = null; voises = 0; }

  function traiter(e) {
    const d = e.inputBuffer.getChannelData(0);
    // Pendant une analyse, ou quand le micro principal tourne déjà, on n'écoute pas pour le mot magique
    if (occupe || reveilActif || microEnCours()) { oublier(); return; }

    let pic = 0;
    for (let i = 0; i < d.length; i += 4) { const v = Math.abs(d[i]); if (v > pic) pic = v; }
    const voix = pic > Math.max(SEUIL_MIN, bruit * 3);

    if (ignorer) { if (!voix) ignorer = false; return; }   // on attend la fin de la longue phrase

    if (!voix && !enParole) {              // silence : on apprend le bruit de fond
      bruit = bruit * 0.95 + pic * 0.05;
      avant = new Float32Array(d);         // on garde le dernier bloc pour ne pas couper le début du mot
      return;
    }
    if (!enParole) { enParole = true; silence = 0; voises = 0; blocs = avant ? [avant] : []; }
    blocs.push(new Float32Array(d));
    if (voix) voises++;
    silence = voix ? 0 : silence + 1;
    if (blocs.length >= DUREE_MAX) { oublier(); ignorer = true; return; }   // trop long : ce n'est pas "OK Capri"
    if (silence >= SILENCE_FIN) finPhrase();
  }

  async function finPhrase() {
    const morceaux = blocs;
    const nbVoix = voises;
    oublier();
    if (nbVoix < BLOCS_VOIX_MIN) return;                 // juste un bruit
    const maintenant = Date.now();
    if (maintenant - finAnalyse < 1500) return;          // on laisse souffler le PC entre deux analyses
    appels = appels.filter((t) => maintenant - t < 60000);
    if (appels.length >= MAX_PAR_MINUTE) return;         // trop d'analyses cette minute
    let n = 0;
    morceaux.forEach((m) => { n += m.length; });
    if (n < 16000 * 0.4) return;           // trop court : un bruit, pas une phrase
    const audio = new Float32Array(n);
    let o = 0;
    morceaux.forEach((m) => { audio.set(m, o); o += m.length; });

    appels.push(maintenant);
    occupe = true;
    try {
      const r = await ipcRenderer.invoke('micro-transcrire', audio);
      if (r && r.texte && RE_REVEIL.test(norm(r.texte))) await reveiller();
    } catch (err) {
      /* on ignore : on réessaiera à la prochaine phrase */
    } finally {
      occupe = false;
      finAnalyse = Date.now();
    }
  }

  // ----- "OK Capri" entendu : on lance le micro au bon endroit -----
  async function reveiller() {
    if (reveilActif) return;
    reveilActif = true;
    icone.style.display = 'flex';
    try { window.focus(); } catch (e) {}
    try {
      if (typeof enAnim !== 'undefined' && enAnim) {
        // Mode balade : on ouvre le panneau d'écriture, puis son bouton micro
        if (typeof tabActif !== 'undefined' && tabActif) { finReveil(); return; }
        if (!panneauOuvert) { ouvrirPanneau(); await attendre(650); }
        document.getElementById('discMicro').click();
        discInput.focus();
      } else if (call.style.display === 'flex') {
        // Fenêtre d'appel déjà ouverte
        document.getElementById('microCall').click();
        msg.focus();
      } else {
        // Juste l'orbe CALLING : on ouvre l'appel d'abord
        orb.click();
        await attendre(450);
        document.getElementById('microCall').click();
        msg.focus();
      }
    } catch (err) {
      console.warn('Réveil vocal : impossible de lancer le micro', err);
    }
    // On garde l'icône tant que le micro principal écoute
    let vide = 0;
    const iv = setInterval(() => {
      if (microEnCours()) { vide = 0; return; }
      vide++;
      if (vide >= 3) { clearInterval(iv); finReveil(); }
    }, 300);
  }

  function finReveil() {
    reveilActif = false;
    icone.style.display = 'none';
    oublier();
  }

  // ENTRÉE envoie le message, même si le curseur n'est pas dans la case d'écriture
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.shiftKey || !reveilActif) return;
    const b = microEnCours();
    if (!b) return;
    const champ = b.id === 'discMicro' ? discInput : msg;
    if (e.target === champ) return;        // déjà dans la case : capri_micro.js s'en occupe
    e.preventDefault();
    e.stopPropagation();
    champ.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  }, true);

  // ----- Démarrage -----
  async function demarrer() {
    try {
      flux = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
    } catch (err) {
      console.warn('Réveil vocal : micro inaccessible', err);
      return;
    }
    ctx = new AudioContext({ sampleRate: 16000 });
    if (ctx.state === 'suspended') ctx.resume();
    source = ctx.createMediaStreamSource(flux);
    proc = ctx.createScriptProcessor(4096, 1, 1);
    proc.onaudioprocess = traiter;
    source.connect(proc);
    proc.connect(ctx.destination);
    ipcRenderer.send('micro-prechauffe');  // charge Whisper à l'avance
  }
  demarrer();
})();
