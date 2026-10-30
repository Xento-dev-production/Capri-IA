// ===== Capri regarde vraiment ton écran =====
// REMPLACE capri_ecran.js : dans index.html, remplace la ligne capri_ecran.js par capri_vue.js
// (même place : après capri_wake.js, avant capri_langue.js).
//
// Comment ça marche :
//  1. De temps en temps, quand Capri se balade, on prend une capture de ton écran principal (réduite).
//  2. On l'envoie à Ollama, sur TON PC, avec un modèle qui comprend les images (par exemple gemma3:4b).
//  3. Le modèle écrit une petite remarque dans le style de Capri : elle s'assoit et la dit dans une bulle.
//  4. La capture est supprimée tout de suite. Rien n'est enregistré, rien ne quitte ton PC.
//  5. Seule une courte phrase "ce que tu fais" est gardée dans un journal (pour le futur "journal du jour").
// Si aucun modèle qui voit n'est installé, Capri retombe sur l'ancienne méthode (le nom de la fenêtre active).
(function () {
  'use strict';
  const { ipcRenderer } = require('electron');
  const { execFile } = require('child_process');
  const http = require('http');
  const fs = require('fs');
  const os = require('os');
  const path = require('path');

  // ===== Réglages =====
  const ACTIF = true;              // false = Capri ne regarde plus ton écran
  const TEST_RAPIDE = false;       // true = une remarque toutes les 30 secondes (pour tester), puis remets false
  const MODELE_VISION = '';        // vide = trouvé automatiquement. Sinon écris le nom exact, par exemple 'gemma3:4b'
  const OLLAMA_PORT = 11434;       // le port d'Ollama (11434 par défaut)
  const KEEP_ALIVE = '2m';         // le modèle reste en mémoire 2 minutes après l'analyse, puis il est déchargé
  const PREMIERE_ATTENTE = 120;    // secondes avant la première remarque après le début de la balade
  const DELAI_MIN = 5;             // minutes minimum entre deux remarques
  const DELAI_MAX = 10;            // minutes maximum entre deux remarques
  const MEME_FENETRE = 5;          // minutes avant de re-commenter exactement la même fenêtre
  const LARGEUR_CAPTURE = 896;     // largeur de la capture envoyée au modèle (plus petit = plus rapide)
  const DELAI_MAX_MODELE = 180;    // secondes maximum d'attente de la réponse du modèle
  // Si le nom de la fenêtre contient un de ces mots, aucune analyse (vie privée)
  const MOTS_INTERDITS = ['password', 'mot de passe', 'banque', 'bank', 'paypal', 'incognito', 'navigation privée', 'private browsing'];
  // Programmes ignorés
  const PROGRAMMES_IGNORES = ['electron', 'capri', 'explorer', 'searchhost', 'shellexperiencehost', 'lockapp', 'applicationframehost'];
  // La personnalité de Capri (utilisée seulement pour la vue écran)
  const PERSONNALITE =
    'You are Capri, a sarcastic but friendly cyberpunk AI companion living on the user\'s desktop, in the spirit of Cyberpunk: Edgerunners. ' +
    'You sometimes say choom, gonk, preem, nova, eddies or flatline, but not in every sentence. You never break character. Keep it short.';

  if (!ACTIF) return;

  // ----- Capture d'écran + fenêtre active, avec PowerShell (rien à installer) -----
  function scriptPowerShell(fichier, sansImage) {
    return `
$sans = ${sansImage ? 1 : 0}
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class CapriV {
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint p);
}
"@
[void][CapriV]::SetProcessDPIAware()
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$h = [CapriV]::GetForegroundWindow()
$sb = New-Object System.Text.StringBuilder 256
[void][CapriV]::GetWindowText($h, $sb, 256)
$p = 0
[void][CapriV]::GetWindowThreadProcessId($h, [ref]$p)
$n = ''
try { $n = (Get-Process -Id $p).ProcessName } catch {}
if ($sans -eq 0) {
  $r = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
  $bmp = New-Object System.Drawing.Bitmap $r.Width, $r.Height
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CopyFromScreen($r.Left, $r.Top, 0, 0, $bmp.Size)
  $g.Dispose()
  $w = ${LARGEUR_CAPTURE}
  $hh = [int]($r.Height * $w / $r.Width)
  $petit = New-Object System.Drawing.Bitmap $w, $hh
  $g2 = [System.Drawing.Graphics]::FromImage($petit)
  $g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g2.DrawImage($bmp, 0, 0, $w, $hh)
  $g2.Dispose()
  $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $ep = New-Object System.Drawing.Imaging.EncoderParameters 1
  $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]70)
  $petit.Save('${fichier.replace(/'/g, "''")}', $enc, $ep)
  $bmp.Dispose()
  $petit.Dispose()
}
Write-Output ($n + '|' + $sb.ToString())
`;
  }

  // Renvoie { prog, titre, image } (image = capture en base64, ou null)
  function capturer(avecImage) {
    return new Promise((resolve) => {
      const fichier = path.join(os.tmpdir(), 'capri_vue_' + Date.now() + '.jpg');
      const b64 = Buffer.from(scriptPowerShell(fichier, !avecImage), 'utf16le').toString('base64');
      execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', b64],
        { windowsHide: true, timeout: 20000, encoding: 'utf8' },
        (err, sortie) => {
          let image = null;
          try {
            if (avecImage && fs.existsSync(fichier)) image = fs.readFileSync(fichier).toString('base64');
          } catch (e) {}
          try { fs.unlinkSync(fichier); } catch (e) {}      // la capture est supprimée tout de suite
          if (err || !sortie) { resolve(null); return; }
          const ligne = String(sortie).trim().split(/\r?\n/).pop();
          const i = ligne.indexOf('|');
          if (i < 0) { resolve(null); return; }
          resolve({ prog: ligne.slice(0, i).trim(), titre: ligne.slice(i + 1).trim(), image: image });
        });
    });
  }

  // ----- Parler à Ollama directement (sur ton PC) -----
  function appelOllama(methode, chemin, corps, delaiMs) {
    return new Promise((resolve, reject) => {
      const data = corps ? JSON.stringify(corps) : null;
      const req = http.request({
        hostname: '127.0.0.1', port: OLLAMA_PORT, path: chemin, method: methode,
        headers: data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}
      }, (res) => {
        let s = '';
        res.setEncoding('utf8');
        res.on('data', (c) => { s += c; });
        res.on('end', () => {
          try { resolve(JSON.parse(s)); } catch (e) { reject(new Error('réponse illisible')); }
        });
      });
      req.on('error', reject);
      req.setTimeout(delaiMs, () => req.destroy(new Error('trop long')));
      if (data) req.write(data);
      req.end();
    });
  }

  // Cherche un modèle qui comprend les images parmi ceux installés
  let modeleVision = '';
  let prochaineRecherche = 0;
  async function trouverModele() {
    if (MODELE_VISION) return MODELE_VISION;
    if (modeleVision) return modeleVision;
    if (Date.now() < prochaineRecherche) return '';
    prochaineRecherche = Date.now() + 10 * 60000;          // on ne cherche pas plus d'une fois toutes les 10 minutes
    try {
      const liste = await appelOllama('GET', '/api/tags', null, 5000);
      const noms = ((liste && liste.models) || []).map((m) => m.name || m.model).filter(Boolean);
      for (const nom of noms) {
        let vision = null;
        try {
          const info = await appelOllama('POST', '/api/show', { model: nom, name: nom }, 8000);
          if (info && Array.isArray(info.capabilities)) vision = info.capabilities.indexOf('vision') >= 0;
        } catch (e) {}
        if (vision === null) vision = /llava|vision|[-:]vl|minicpm-v|moondream|bakllava|gemma3:(4|12|27)b/i.test(nom);
        if (vision) { modeleVision = nom; break; }
      }
    } catch (e) {
      console.warn('Vue écran : Ollama ne répond pas', e.message);
    }
    if (!modeleVision) console.warn('Vue écran : aucun modèle qui voit les images (essaie : ollama pull gemma3:4b)');
    return modeleVision;
  }

  // ----- Quand Capri peut-elle parler ? Seulement quand elle marche tranquillement -----
  function pret() {
    return typeof enAnim !== 'undefined' && enAnim && etat === 'marche' && !bulleActive &&
      !(typeof tabActif !== 'undefined' && tabActif) && !document.querySelector('.micro-actif');
  }

  function nettoyer(t) {
    t = String(t || '').replace(/[\r\n]+/g, ' ').replace(/^["«“'\s]+|["»”'\s]+$/g, '').trim();
    if (t.length > 150) {
      const coupe = t.slice(0, 150);
      const fin = Math.max(coupe.lastIndexOf('.'), coupe.lastIndexOf('!'), coupe.lastIndexOf('?'));
      t = fin > 40 ? coupe.slice(0, fin + 1) : coupe.replace(/\s+\S*$/, '') + '...';
    }
    return t;
  }

  let derniereRemarque = '';

  // Le modèle qui voit regarde la capture
  async function regarder(modele, f) {
    const anglais = document.documentElement.lang === 'en';
    const consigne =
      'This is a screenshot of my screen. Ignore the small anime-style girl walking on it: that is you, Capri. ' +
      'Reply with exactly two lines.\n' +
      'ACTIVITY: what I am doing, 8 words max, neutral, in English.\n' +
      'SAY: one short spontaneous remark about what I am doing, 15 words max, in ' + (anglais ? 'English' : 'French') +
      ', no emojis, no quotes.\n' +
      'Program: ' + f.prog + ', window title: ' + f.titre + '.' +
      (derniereRemarque ? ' Do not repeat your last remark: "' + derniereRemarque + '".' : '');
    const rep = await appelOllama('POST', '/api/chat', {
      model: modele,
      stream: false,
      keep_alive: KEEP_ALIVE,
      options: { temperature: 0.8, num_predict: 90 },
      messages: [
        { role: 'system', content: PERSONNALITE },
        { role: 'user', content: consigne, images: [f.image] }
      ]
    }, DELAI_MAX_MODELE * 1000);
    if (!rep || rep.error || !rep.message) throw new Error((rep && rep.error) || 'pas de réponse');
    const brut = String(rep.message.content || '');
    const act = /ACTIVITY\s*:\s*(.+)/i.exec(brut);
    const dit = /SAY\s*:\s*([\s\S]+)/i.exec(brut);
    const texte = nettoyer(dit ? dit[1] : brut.replace(/ACTIVITY\s*:.*$/im, ''));
    return { activite: act ? act[1].trim().slice(0, 80) : '', texte: texte.length >= 4 ? texte : null };
  }

  // Méthode de secours (aucun modèle qui voit) : seulement le nom de la fenêtre, via le modèle habituel de Capri
  async function remarqueTitre(f) {
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

  // ----- Petit voyant "je regarde" pendant la capture (bas gauche de l'écran) -----
  function voyantScan() {
    const el = document.createElement('div');
    el.textContent = '◉ SCAN';
    el.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:120;pointer-events:none;padding:5px 10px;' +
      'background:#000;color:#27e6ff;border:1px solid #27e6ff;font-size:11px;letter-spacing:3px;' +
      'font-family:Consolas,"Courier New",monospace;box-shadow:0 0 10px #27e6ff;';
    document.body.appendChild(el);
    el.animate([{ opacity: 1 }, { opacity: 0.3 }, { opacity: 1 }], { duration: 700, iterations: 4 }).onfinish = () => el.remove();
  }

  // ----- Le journal (gardé pour le futur "journal du jour") -----
  // Stocké sur ton PC (localStorage) : [{ t, prog, titre, quoi, dit }], 7 jours maximum
  function noter(f, activite, dit) {
    try {
      let liste = JSON.parse(localStorage.getItem('capriJournal') || '[]');
      liste.push({ t: Date.now(), prog: f.prog, titre: f.titre.slice(0, 80), quoi: activite || '', dit: dit || '' });
      const limite = Date.now() - 7 * 24 * 3600 * 1000;
      liste = liste.filter((e) => e.t >= limite).slice(-400);
      localStorage.setItem('capriJournal', JSON.stringify(liste));
    } catch (e) {}
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
    if (TEST_RAPIDE) return 30;
    return (DELAI_MIN + Math.random() * (DELAI_MAX - DELAI_MIN)) * 60;
  }

  async function verifier() {
    if (enCours || !pret()) { planifier(20); return; }
    enCours = true;
    try {
      const modele = await trouverModele();
      if (modele) voyantScan();
      const f = await capturer(!!modele);
      if (!f || !f.titre || PROGRAMMES_IGNORES.indexOf(f.prog.toLowerCase()) >= 0) { planifier(60); return; }
      const bas = (f.prog + ' ' + f.titre).toLowerCase();
      if (MOTS_INTERDITS.some((m) => bas.indexOf(m) >= 0)) { planifier(60); return; }   // la capture est déjà supprimée
      const cle = f.prog.toLowerCase() + '|' + f.titre.toLowerCase();
      if (cle === derniere.cle && Date.now() - derniere.t < MEME_FENETRE * 60000) { planifier(prochainDelai()); return; }

      let texte = null, activite = '';
      if (modele && f.image) {
        try {
          const r = await regarder(modele, f);
          texte = r.texte; activite = r.activite;
        } catch (err) {
          console.warn('Vue écran : le modèle n\'a pas répondu', err.message);
          modeleVision = '';                                   // on cherchera à nouveau plus tard
          planifier(300);
          return;
        }
      } else {
        texte = await remarqueTitre(f);
      }
      f.image = null;
      if (!texte || !pret()) { planifier(30); return; }        // l'état de Capri a pu changer pendant l'attente
      derniere = { cle: cle, t: Date.now() };
      derniereRemarque = texte;
      noter(f, activite, texte);
      direRemarque(texte);
      planifier(prochainDelai());
    } catch (err) {
      console.warn('Vue écran : erreur', err);
      planifier(60);
    } finally {
      enCours = false;
    }
  }

  planifier(TEST_RAPIDE ? 20 : PREMIERE_ATTENTE);
})();
