// ===== Capri regarde ce que tu fais (Roblox, YouTube, VS Code...) et en parle =====
// À charger APRÈS capri_wake.js (et avant capri_langue.js) dans index.html.
//
// Comment ça marche :
//  - De temps en temps, quand Capri se balade, on lit le NOM de la fenêtre que tu utilises (Windows seulement).
//  - On le donne à Ollama, qui écrit une petite remarque dans le style de Capri.
//  - Capri s'assoit et le dit dans une bulle.
// Important : ce n'est PAS une capture d'écran. Capri connaît le nom du programme et le titre de la fenêtre,
// pas l'image. Tout reste sur ton PC (le texte va seulement à ton Ollama).
(function () {
  'use strict';
  const { ipcRenderer } = require('electron');
  const { execFile } = require('child_process');

  // ===== Réglages =====
  const ACTIF = true;            // false = Capri ne commente plus ton écran
  const TEST_RAPIDE = false;     // true = une remarque toutes les 20 secondes (pour tester), puis remets false
  const PREMIERE_ATTENTE = 90;   // secondes avant la première remarque après le début de la balade
  const DELAI_MIN = 3;           // minutes minimum entre deux remarques
  const DELAI_MAX = 7;           // minutes maximum entre deux remarques
  const MEME_FENETRE = 20;       // minutes avant de re-commenter exactement la même fenêtre
  // Si le nom de la fenêtre contient un de ces mots, Capri ne dit rien (vie privée)
  const MOTS_INTERDITS = ['password', 'mot de passe', 'banque', 'bank', 'paypal', 'incognito', 'navigation privée', 'private browsing'];
  // Programmes que Capri ignore
  const PROGRAMMES_IGNORES = ['electron', 'capri', 'explorer', 'searchhost', 'shellexperiencehost', 'lockapp', 'applicationframehost'];

  if (!ACTIF) return;

  // ----- Lire la fenêtre active avec PowerShell (rien à installer) -----
  const SCRIPT = [
    '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8',
    'Add-Type @"',
    'using System;',
    'using System.Runtime.InteropServices;',
    'using System.Text;',
    'public class CapriW {',
    '  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();',
    '  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);',
    '  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint p);',
    '}',
    '"@',
    '$h = [CapriW]::GetForegroundWindow()',
    '$sb = New-Object System.Text.StringBuilder 256',
    '[void][CapriW]::GetWindowText($h, $sb, 256)',
    '$p = 0',
    '[void][CapriW]::GetWindowThreadProcessId($h, [ref]$p)',
    '$n = (Get-Process -Id $p).ProcessName',
    'Write-Output ($n + "|" + $sb.ToString())'
  ].join('\n');
  const SCRIPT_B64 = Buffer.from(SCRIPT, 'utf16le').toString('base64');

  function lireFenetre() {
    return new Promise((resolve) => {
      execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', SCRIPT_B64],
        { windowsHide: true, timeout: 10000, encoding: 'utf8' },
        (err, sortie) => {
          if (err || !sortie) { resolve(null); return; }
          const ligne = String(sortie).trim().split(/\r?\n/).pop();
          const i = ligne.indexOf('|');
          if (i < 0) { resolve(null); return; }
          resolve({ prog: ligne.slice(0, i).trim(), titre: ligne.slice(i + 1).trim() });
        });
    });
  }

  // ----- Quand Capri peut-elle parler ? Seulement quand elle marche tranquillement -----
  function pret() {
    return typeof enAnim !== 'undefined' && enAnim && etat === 'marche' && !bulleActive &&
      !(typeof tabActif !== 'undefined' && tabActif) && !document.querySelector('.micro-actif');
  }

  // ----- Demander la remarque à Ollama -----
  function nettoyer(t) {
    t = String(t || '').replace(/[\r\n]+/g, ' ').replace(/^["«“'\s]+|["»”'\s]+$/g, '').trim();
    if (t.length > 150) {
      const coupe = t.slice(0, 150);
      const fin = Math.max(coupe.lastIndexOf('.'), coupe.lastIndexOf('!'), coupe.lastIndexOf('?'));
      t = fin > 40 ? coupe.slice(0, fin + 1) : coupe.replace(/\s+\S*$/, '') + '...';
    }
    return t;
  }

  async function demanderRemarque(f) {
    const anglais = document.documentElement.lang === 'en';
    const consigne = '[SCREEN CONTEXT: the user is currently using the program "' + f.prog + '" with the window title "' + f.titre +
      '". As Capri, say ONE short spontaneous remark (15 words max) about what they are doing, like a friend looking over their shoulder. ' +
      'If it is a game (for example Roblox), talk about that game. No quotes, no emojis. ' +
      (anglais ? 'Reply in English.' : 'Reply in French.') + ']';
    const reponse = await ipcRenderer.invoke('ask', [{ role: 'user', content: consigne }]);
    if (!reponse || String(reponse).startsWith('[Erreur')) return null;
    const t = nettoyer(reponse);
    return t.length >= 4 ? t : null;
  }

  // ----- Capri s'assoit et le dit -----
  function direRemarque(texte) {
    const copie = PHRASES.slice();
    PHRASES.splice(0, PHRASES.length, texte);   // pendant un instant, sa seule phrase possible est la remarque
    etat = 'transition';
    parlerAssise(session);
    setTimeout(() => { PHRASES.splice(0, PHRASES.length, ...copie); }, 5000);
  }

  // ----- La boucle -----
  let derniere = { cle: '', t: 0 };
  let enCours = false;

  function planifier(secondes) { setTimeout(verifier, secondes * 1000); }
  function prochainDelai() {
    if (TEST_RAPIDE) return 20;
    return (DELAI_MIN + Math.random() * (DELAI_MAX - DELAI_MIN)) * 60;
  }

  async function verifier() {
    if (enCours) { planifier(20); return; }
    if (!pret()) { planifier(20); return; }
    enCours = true;
    try {
      const f = await lireFenetre();
      if (!f || !f.titre || PROGRAMMES_IGNORES.indexOf(f.prog.toLowerCase()) >= 0) { planifier(60); return; }
      const bas = (f.prog + ' ' + f.titre).toLowerCase();
      if (MOTS_INTERDITS.some((m) => bas.indexOf(m) >= 0)) { planifier(60); return; }
      const cle = f.prog.toLowerCase() + '|' + f.titre.toLowerCase();
      if (cle === derniere.cle && Date.now() - derniere.t < MEME_FENETRE * 60000) { planifier(prochainDelai()); return; }

      const texte = await demanderRemarque(f);
      if (!texte || !pret()) { planifier(30); return; }   // l'état de Capri a pu changer pendant l'attente
      derniere = { cle: cle, t: Date.now() };
      direRemarque(texte);
      planifier(prochainDelai());
    } catch (err) {
      console.warn('Capri regarde ton écran : erreur', err);
      planifier(60);
    } finally {
      enCours = false;
    }
  }

  planifier(TEST_RAPIDE ? 20 : PREMIERE_ATTENTE);
})();
