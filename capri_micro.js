// ===== Saisie vocale de Capri (côté page) =====
// Bouton micro dans la fenêtre d'appel (mode plat) et dans le panneau d'écriture (mode animé).
// 1er appui : le micro enregistre. 2e appui : il s'arrête et ta voix est transcrite (Whisper) dans la case.
// Ensuite tu envoies avec ▶ / Entrée (ou avec la tablette en mode animé).
(function () {
  'use strict';
  const { ipcRenderer } = require('electron');

  // true = dès que tu coupes le micro, le message part tout seul (sans relecture)
  const ENVOI_AUTO = false;

  const msg = document.getElementById('msg');
  const send = document.getElementById('send');
  const discInput = document.getElementById('discInput');
  const discBar = document.getElementById('discBar');
  const discHint = document.getElementById('discHint');
  const discCompress = document.getElementById('discCompress');
  if (!msg || !send || !discInput || !discBar || !discHint) return;

  const style = document.createElement('style');
  style.textContent =
    '#microCall { flex-shrink: 0; background: transparent; color: var(--cyan); border: 1px solid var(--cyan);' +
    ' padding: 0 9px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: inherit; }' +
    '#microCall:hover { background: rgba(39, 230, 255, 0.2); }' +
    '#discMicro { flex-shrink: 0; width: 28px; height: 28px; padding: 0; background: #000; color: var(--cyan);' +
    ' border: 1px solid var(--cyan); cursor: pointer; display: flex; align-items: center; justify-content: center; }' +
    '#discMicro:hover { background: rgba(39, 230, 255, 0.2); }' +
    '.micro-actif { color: #fff !important; background: var(--rouge) !important; border-color: var(--rouge) !important;' +
    ' animation: microPulse 1s ease-in-out infinite; }' +
    '@keyframes microPulse { 50% { box-shadow: 0 0 12px var(--rouge); } }';
  document.head.appendChild(style);

  const SVG = '<svg width="14" height="18" viewBox="0 0 14 18" fill="none" stroke="currentColor" stroke-width="1.6">' +
    '<rect x="4" y="1" width="6" height="10" rx="3"/><path d="M1.5 8.5C1.5 12 4 14 7 14s5.5-2 5.5-5.5M7 14v3M4 17h6"/></svg>';

  function creerBouton(id, titre) {
    const b = document.createElement('button');
    b.id = id;
    b.type = 'button';
    b.title = titre;
    b.innerHTML = SVG;
    return b;
  }
  const btnCall = creerBouton('microCall', 'Saisie vocale');
  send.parentNode.insertBefore(btnCall, send);
  const btnDisc = creerBouton('discMicro', 'Saisie vocale');
  discBar.insertBefore(btnDisc, discBar.firstChild);

  let etat = 'repos';       // 'repos' | 'demarrage' | 'ecoute' | 'arret'
  let courant = null;       // { champ, btn, type }
  let envoyerApres = false;
  let arretDemande = false;
  let derniereErreur = '';
  let timerHint = null;
  let texteAide = '';

  // ----- Enregistrement du micro (16 000 Hz, mono : ce que Whisper attend) -----
  let flux = null, ctx = null, source = null, proc = null, morceaux = [];

  async function demarrerAudio() {
    morceaux = [];
    flux = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    });
    ctx = new AudioContext({ sampleRate: 16000 });
    source = ctx.createMediaStreamSource(flux);
    proc = ctx.createScriptProcessor(4096, 1, 1);
    proc.onaudioprocess = (e) => { morceaux.push(new Float32Array(e.inputBuffer.getChannelData(0))); };
    source.connect(proc);
    proc.connect(ctx.destination);
  }

  async function arreterAudio() {
    try { if (proc) { proc.onaudioprocess = null; proc.disconnect(); } } catch (e) {}
    try { if (source) source.disconnect(); } catch (e) {}
    try { if (flux) flux.getTracks().forEach((t) => t.stop()); } catch (e) {}
    try { if (ctx) await ctx.close(); } catch (e) {}
    proc = null; source = null; flux = null; ctx = null;
    let n = 0;
    morceaux.forEach((m) => { n += m.length; });
    const audio = new Float32Array(n);
    let o = 0;
    morceaux.forEach((m) => { audio.set(m, o); o += m.length; });
    morceaux = [];
    return audio;
  }

  // ----- Messages -----
  function statut(type, texte, mal, duree) {
    clearTimeout(timerHint);
    if (type === 'disc') {
      discHint.textContent = texte;
      discHint.classList.toggle('mal', !!mal);
    } else {
      msg.placeholder = texte;
    }
    if (duree) timerHint = setTimeout(() => restaurer(type), duree);
  }
  function restaurer(type) {
    if (type === 'disc') {
      discHint.textContent = texteAide;
      discHint.classList.remove('mal');
    } else {
      msg.placeholder = 'Écris à Capri...';
    }
  }
  function adapter(type, t) { return type === 'disc' ? t.toUpperCase() : t; }

  function inserer(champ, texte) {
    texte = (texte || '').trim();
    if (!texte) return;
    let v = champ.value;
    if (!v.trim()) {
      v = '';
    } else if (!/\s$/.test(v)) {
      v += ' ';
    }
    champ.value = v + texte;
    champ.scrollTop = champ.scrollHeight;
  }

  function messageErreur(code) {
    if (code === 'VIDE') return "Je n'ai rien entendu, réessaie";
    if (code === 'MICRO') return 'Micro inaccessible (vérifie les réglages du micro de Windows)';
    if (code === 'MODULE') return "Module de voix manquant : relance l'installeur du micro";
    return 'Erreur micro : ' + String(code).slice(0, 70);
  }

  // ----- Déroulement -----
  async function demarrer(champ, btn, type) {
    if (etat !== 'repos') return;
    courant = { champ: champ, btn: btn, type: type };
    etat = 'demarrage';
    envoyerApres = false;
    arretDemande = false;
    derniereErreur = '';
    if (type === 'disc') texteAide = discHint.textContent;
    btn.classList.add('micro-actif');
    statut(type, adapter(type, '◉ Initialisation du micro...'));
    try {
      await demarrerAudio();
    } catch (e) {
      derniereErreur = 'MICRO';
      terminer();
      return;
    }
    ipcRenderer.send('micro-prechauffe');
    etat = 'ecoute';
    statut(type, adapter(type, "◉ Je t'écoute... réappuie sur le micro pour finir"));
    if (arretDemande) arreter(false);
  }

  async function arreter(envoi) {
    if (!courant || etat === 'repos') return;
    if (envoi) envoyerApres = true;
    if (etat === 'arret') return;
    if (etat === 'demarrage') { arretDemande = true; return; }
    etat = 'arret';
    const type = courant.type, champ = courant.champ;
    statut(type, adapter(type, '◼ Transcription... (la 1re fois : téléchargement du modèle, patiente)'));
    const audio = await arreterAudio();
    let pic = 0;
    for (let i = 0; i < audio.length; i += 8) { const v = Math.abs(audio[i]); if (v > pic) pic = v; }
    if (audio.length < 16000 * 0.5 || pic < 0.008) {
      derniereErreur = 'VIDE';
    } else {
      try {
        const r = await ipcRenderer.invoke('micro-transcrire', audio);
        if (r && r.texte) inserer(champ, r.texte);
        else if (r && r.erreur) derniereErreur = r.erreur;
        else derniereErreur = 'VIDE';
      } catch (e) {
        derniereErreur = String(e.message || e);
      }
    }
    terminer();
  }

  function terminer() {
    if (!courant) return;
    const c = courant;
    const envoi = (envoyerApres || ENVOI_AUTO) && !derniereErreur && c.champ.value.trim();
    c.btn.classList.remove('micro-actif');
    courant = null;
    etat = 'repos';
    arreterAudio();
    if (derniereErreur) {
      statut(c.type, adapter(c.type, messageErreur(derniereErreur)), true, 5000);
      return;
    }
    restaurer(c.type);
    if (envoi) {
      c.champ.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    } else {
      c.champ.focus();
    }
  }

  function basculer(champ, btn, type) {
    if (etat === 'repos') demarrer(champ, btn, type);
    else if (courant && courant.btn === btn) arreter(false);
  }
  btnCall.addEventListener('click', () => basculer(msg, btnCall, 'call'));
  btnDisc.addEventListener('click', () => basculer(discInput, btnDisc, 'disc'));

  // Entrée ou envoi pendant l'écoute : on coupe le micro, puis le message part tout seul
  [msg, discInput].forEach((ch) => {
    ch.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.shiftKey || etat === 'repos' || !courant || courant.champ !== ch) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      arreter(true);
    }, true);
  });
  send.addEventListener('click', (e) => {
    if (etat === 'repos' || !courant || courant.champ !== msg) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    arreter(true);
  }, true);
  if (discCompress) {
    discCompress.addEventListener('pointerdown', (e) => {
      if (etat === 'repos' || !courant || courant.champ !== discInput) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      arreter(true);
    }, true);
  }

  // Si la fenêtre ou le panneau disparaît (raccrocher, balade, fermeture), on coupe le micro
  setInterval(() => {
    if (courant && etat === 'ecoute' && courant.champ.getClientRects().length === 0) arreter(false);
  }, 500);
})();
