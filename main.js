const { app, BrowserWindow, screen, ipcMain, globalShortcut, desktopCapturer } = require('electron');
const { spawn } = require('child_process');
 
// Les touches : tu peux les changer ici
const TOUCHE_MASQUER = 'numsub';              // moins du pavé numérique
const TOUCHE_QUITTER = 'CommandOrControl+Alt+Q'; // ferme complètement Capri
 
// Réglages du déplacement de l'orbe
const DELAI_INACTIVITE = 30000; // temps sans clic avant qu'elle parte se balader (ms)
const VITESSE_MIN = 0.6;        // vitesse la plus lente (pixels par tick)
const VITESSE_MAX = 1.8;        // vitesse la plus rapide
const PAUSE_MIN = 1000;         // pause entre deux trajets (ms)
const PAUSE_MAX = 5000;
 
// Réglages de la détection des fenêtres (mode balade)
const DELAI_STABILITE = 600;    // la fenêtre doit rester ouverte ce temps avant que Capri réagisse (ms)
const DELAI_APRES_ANIM = 2000;  // pas de réaction juste après avoir cliqué sur Animer (ms)
// Programmes ignorés (noms de processus, en minuscules, sans .exe)
const PROCESSUS_IGNORES = [
  'searchhost', 'searchui', 'startmenuexperiencehost', 'shellexperiencehost',
  'textinputhost', 'lockapp', 'sihost'
];
// Capri réagit aussi quand une fenêtre déjà ouverte (cachée, réduite ou en arrière-plan) revient devant
const DELAI_REAPPARITION = 1500; // une fenêtre absente/réduite plus longtemps que ça compte comme "réapparue" (ms)
// Si true : Capri réagit à CHAQUE changement de fenêtre au premier plan (ex. un navigateur déjà ouvert
// qu'on remet devant). Ça inclut aussi les Alt+Tab, donc elle bougera souvent.
const REAGIR_AU_PREMIER_PLAN = false;
// Taille à partir de laquelle une fenêtre est "grande" (part de l'écran de travail, de 0 à 1).
// Petite fenêtre (dossier, fichier...) : Capri s'assoit dessus.
// Grande fenêtre (navigateur, VS Code...) : Capri reste au sol et fait des escapades sur les lignes de la fenêtre.
const SEUIL_GRANDE_FENETRE = 0.4;
// Détection des lignes sur lesquelles Capri peut marcher (texte, bords de barres et de boutons...)
const MIN_LIGNE = 170;          // longueur minimale d'une ligne (pixels)
const SEUIL_CONTRASTE = 32;     // contraste minimal pour compter un bord (0 à 255)
// Affiche dans le terminal (VS Code) ce que Capri détecte ou ignore, pour comprendre les bugs
const DEBUG = true;
const journal = (...a) => { if (DEBUG) console.log('[Capri]', ...a); };
 
// La personnalité de Capri : tu peux modifier ce texte comme tu veux
const PERSONNALITE = `Tu es Capri, une intelligence artificielle de style cyberpunk qui vit sur le bureau de l'utilisateur.
Tu parles en français, tu tutoies, avec un ton complice, un peu espiègle et direct. Tu peux dire « choom » de temps en temps.
Tu réponds en 1 à 3 phrases courtes, comme dans une conversation. Pas de listes, pas de mise en forme.`;
 
let win;
let modeActuel = 'orb';
const SIZES = {
  orb: { w: 160, h: 190 },
  call: { w: 360, h: 620 }
};
 
let attente = null;
let errance = null;
let cible = null;
let pauseJusqua = 0;
let vitesse = 0.5;
let vx = 0, vy = 0;
let px = 0, py = 0; // position exacte (avec décimales)
let debutAnim = 0;  // moment où le mode balade a commencé
let deplacement = null;  // le déplacement à la souris en cours (orbe ou fenêtre d'appel)
let epinglee = false;    // vrai dès qu'on a déplacé l'orbe à la main : elle ne se balade plus toute seule
 
const borner = (v, min, max) => Math.min(Math.max(v, min), max);
 
function place(mode, cx) {
  const avant = modeActuel; // mode précédent (pour savoir si on revient de la balade)
  modeActuel = mode;
  const b = win.getBounds();
  const zone = screen.getDisplayMatching(b).workArea;
  arreterErrance();
 
  if (mode !== 'anim') { suivi = null; suiviLigne = null; } // plus de fenêtre à suivre hors balade
 
  if (mode === 'anim') {
    debutAnim = Date.now();
    suivi = null;
    suiviLigne = null;
    // Toute la zone de l'écran (au-dessus de la barre Windows)
    win.setBounds({ x: zone.x, y: zone.y, width: zone.width, height: zone.height });
    win.setIgnoreMouseEvents(true, { forward: true }); // les clics passent à travers
    return;
  }
 
  win.setIgnoreMouseEvents(false);
  const s = SIZES[mode];
  // cx : position de Capri quand on revient de la balade
  const voulu = cx !== undefined ? b.x + cx - s.w / 2 : b.x;
  // Garde la fenêtre là où elle est, mais l'empêche de sortir de l'écran
  const x = borner(voulu, zone.x, zone.x + zone.width - s.w);
  // En revenant de la balade, la fenêtre se met en bas de l'écran (là où Capri marchait)
  const y = avant === 'anim'
    ? zone.y + zone.height - s.h
    : borner(b.y, zone.y, zone.y + zone.height - s.h);
  win.setBounds({ x, y, width: s.w, height: s.h });
  px = x;
  py = y;
 
  if (mode === 'orb' && !epinglee) {
    // Elle attend un peu, puis commence à se balader
    // (sauf si on l'a déplacée à la main : alors elle reste où on l'a posée)
    attente = setTimeout(demarrerErrance, DELAI_INACTIVITE);
  }
}
 
function demarrerErrance() {
  if (errance) return;
  pauseJusqua = 0;
  errance = setInterval(() => {
    if (!win || win.isDestroyed() || !win.isVisible()) return;
 
    const s = SIZES.orb;
    const zone = screen.getDisplayMatching(win.getBounds()).workArea;
 
    // Vitesse souhaitée : 0 pendant les pauses
    let wx = 0, wy = 0;
 
    if (Date.now() >= pauseJusqua) {
      // Nouvelle destination et nouvelle vitesse au hasard
      if (!cible) {
        cible = {
          x: zone.x + Math.random() * (zone.width - s.w),
          y: zone.y + Math.random() * (zone.height - s.h)
        };
        vitesse = VITESSE_MIN + Math.random() * (VITESSE_MAX - VITESSE_MIN);
      }
 
      const dx = cible.x - px;
      const dy = cible.y - py;
      const dist = Math.hypot(dx, dy);
 
      if (dist < 10) {
        // Arrivée : pause aléatoire
        cible = null;
        pauseJusqua = Date.now() + PAUSE_MIN + Math.random() * (PAUSE_MAX - PAUSE_MIN);
      } else {
        const frein = Math.min(1, dist / 80); // ralentit en arrivant
        wx = (dx / dist) * vitesse * frein;
        wy = (dy / dist) * vitesse * frein;
      }
    }
 
    // La vitesse change progressivement : démarrages doux, trajectoires courbes
    vx += (wx - vx) * 0.03;
    vy += (wy - vy) * 0.03;
    px = borner(px + vx, zone.x, zone.x + zone.width - s.w);
    py = borner(py + vy, zone.y, zone.y + zone.height - s.h);
 
    win.setBounds({
      x: Math.round(px),
      y: Math.round(py),
      width: s.w,
      height: s.h
    });
  }, 16);
}
 
function arreterErrance() {
  clearTimeout(attente);
  clearInterval(errance);
  attente = null;
  errance = null;
  cible = null;
  vx = 0;
  vy = 0;
}
 
// ===== Déplacer la fenêtre à la souris (orbe et fenêtre d'appel) =====
// La page prévient quand on appuie (drag-start) et quand on relâche (drag-stop).
// Entre les deux, la fenêtre suit la souris. Pendant la balade, ça ne fait rien.
ipcMain.on('drag-start', () => {
  if (!win || win.isDestroyed() || modeActuel === 'anim') return;
  clearInterval(deplacement);
  const depart = screen.getCursorScreenPoint();
  const b = win.getBounds();
  let bouge = false;
 
  deplacement = setInterval(() => {
    if (!win || win.isDestroyed() || modeActuel === 'anim') {
      clearInterval(deplacement);
      deplacement = null;
      return;
    }
    const c = screen.getCursorScreenPoint();
    const dx = c.x - depart.x;
    const dy = c.y - depart.y;
    if (!bouge) {
      if (Math.hypot(dx, dy) < 5) return; // simple clic : on ne bouge rien
      bouge = true;
      if (modeActuel === 'orb') {
        epinglee = true;   // elle reste là où on la lâchera
        arreterErrance();
      }
    }
    const s = SIZES[modeActuel];
    px = Math.round(b.x + dx);
    py = Math.round(b.y + dy);
    win.setBounds({ x: px, y: py, width: s.w, height: s.h });
  }, 8);
});
 
ipcMain.on('drag-stop', () => {
  clearInterval(deplacement);
  deplacement = null;
});
 
// ===== Détection des fenêtres ouvertes (Windows) =====
// Un petit PowerShell tourne en arrière-plan et liste les fenêtres visibles
// toutes les ~120 ms. Quand une NOUVELLE fenêtre apparaît pendant la balade,
// on prévient la page : Capri disparaît et revient assise sur cette fenêtre.
 
const SCRIPT_SURVEILLANCE = String.raw`
$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
public class CapriWin {
  delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc p, IntPtr l);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] static extern int GetWindowLong(IntPtr h, int i);
  [DllImport("user32.dll")] static extern IntPtr GetWindow(IntPtr h, uint c);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  public static string Premier() { return GetForegroundWindow().ToInt64().ToString(); }
  [DllImport("dwmapi.dll")] static extern int DwmGetWindowAttribute(IntPtr h, int a, out int v, int sz);
  [StructLayout(LayoutKind.Sequential)] struct RECT { public int L, T, R, B; }
  static Dictionary<uint, string> noms = new Dictionary<uint, string>();
  public static string Scan() {
    StringBuilder sb = new StringBuilder();
    EnumWindows(delegate(IntPtr h, IntPtr l) {
      if (!IsWindowVisible(h)) return true;
      if (GetWindow(h, 4) != IntPtr.Zero) return true;
      int ex = GetWindowLong(h, -20);
      if ((ex & 0x80) != 0) return true;
      if ((ex & 0x08000000) != 0) return true;
      int cloaked = 0;
      DwmGetWindowAttribute(h, 14, out cloaked, 4);
      if (cloaked != 0) return true;
      StringBuilder t = new StringBuilder(256);
      GetWindowText(h, t, 256);
      if (t.Length == 0) return true;
      StringBuilder c = new StringBuilder(256);
      GetClassName(h, c, 256);
      string cl = c.ToString();
      if (cl == "Progman" || cl == "WorkerW" || cl == "Shell_TrayWnd" || cl == "Shell_SecondaryTrayWnd") return true;
      RECT r;
      GetWindowRect(h, out r);
      bool ic = IsIconic(h);
      if (!ic && ((r.R - r.L) < 250 || (r.B - r.T) < 150)) return true;
      uint pid;
      GetWindowThreadProcessId(h, out pid);
      string nom;
      if (!noms.TryGetValue(pid, out nom)) {
        try { nom = System.Diagnostics.Process.GetProcessById((int)pid).ProcessName; } catch { nom = "?"; }
        noms[pid] = nom;
      }
      string titre = t.ToString().Replace('\t', ' ').Replace('\r', ' ').Replace('\n', ' ');
      sb.Append(h.ToInt64()).Append('\t').Append(r.L).Append('\t').Append(r.T).Append('\t')
        .Append(r.R).Append('\t').Append(r.B).Append('\t').Append(ic ? "1" : "0").Append('\t')
        .Append(pid).Append('\t').Append(nom).Append('\t').Append(titre).Append('\n');
      return true;
    }, IntPtr.Zero);
    return sb.ToString();
  }
}
"@
[CapriWin]::SetProcessDPIAware() | Out-Null
while ($true) {
  [Console]::Out.Write(([CapriWin]::Scan()) + "FG" + [char]9 + [CapriWin]::Premier() + [char]10 + "END" + [char]10)
  [Console]::Out.Flush()
  Start-Sleep -Milliseconds 120
}
`;
 
let surveillant = null;
let tampon = '';
let scanEnCours = new Map();
let derniereScan = new Map();
let baselineFaite = false;
const connues = new Set();   // toutes les fenêtres déjà vues (ne redéclenchent jamais)
let suivi = null;            // fenêtre sur laquelle Capri est assise
let suiviManque = 0;
let dernierRect = '';
 
function demarrerSurveillance() {
  if (process.platform !== 'win32') return;
  const enc = Buffer.from(SCRIPT_SURVEILLANCE, 'utf16le').toString('base64');
  surveillant = spawn('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', enc
  ], { windowsHide: true });
  surveillant.stdout.setEncoding('utf8');
  surveillant.stdout.on('data', (chunk) => {
    tampon += chunk;
    let i;
    while ((i = tampon.indexOf('\n')) >= 0) {
      traiterLigne(tampon.slice(0, i));
      tampon = tampon.slice(i + 1);
    }
  });
  surveillant.on('error', (e) => console.log('Surveillance impossible :', e.message));
}
 
function traiterLigne(ligne) {
  ligne = ligne.replace(/\r$/, '');
  if (ligne === 'END') { finScan(); return; }
  if (ligne.startsWith('FG\t')) { fgEnCours = ligne.slice(3); return; }
  const p = ligne.split('\t');
  if (p.length < 9) return;
  scanEnCours.set(p[0], {
    l: +p[1], t: +p[2], r: +p[3], b: +p[4],
    iconic: p[5] === '1', pid: +p[6], nom: p[7].toLowerCase(), titre: p[8]
  });
}
 
// Convertit le rectangle d'une fenêtre (pixels écran) en coordonnées de la page de Capri
function rectPage(f) {
  if (!win || win.isDestroyed()) return null;
  const a = screen.screenToDipPoint({ x: f.l, y: f.t });
  const b = screen.screenToDipPoint({ x: f.r, y: f.b });
  const zone = win.getBounds(); // en mode balade = tout l'écran de travail
  const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
  if (cx < zone.x || cx > zone.x + zone.width || cy < zone.y || cy > zone.y + zone.height) return null;
  return { x: a.x - zone.x, y: a.y - zone.y, w: b.x - a.x, h: b.y - a.y };
}
 
let fgEnCours = '';
let fgPrecedent = '';
const dernierVisible = new Map(); // dernière fois qu'on a vu chaque fenêtre visible (non réduite)
 
function ignoree(f) {
  return f.pid === process.pid || PROCESSUS_IGNORES.includes(f.nom);
}
 
// Une fenêtre est "grande" si elle prend une bonne part de l'écran de travail
function estGrande(r) {
  const z = win.getBounds();
  return r.w * r.h >= SEUIL_GRANDE_FENETRE * z.width * z.height;
}
 
function finScan() {
  derniereScan = scanEnCours;
  scanEnCours = new Map();
  const maintenant = Date.now();
  const fg = fgEnCours;
 
  // Premier passage : tout ce qui est déjà ouvert est "connu" et ne déclenche rien
  if (!baselineFaite) {
    for (const [h, f] of derniereScan) {
      connues.add(h);
      if (!f.iconic) dernierVisible.set(h, maintenant);
    }
    fgPrecedent = fg;
    baselineFaite = true;
    return;
  }
 
  const actif = win && !win.isDestroyed() && modeActuel === 'anim' &&
                maintenant - debutAnim > DELAI_APRES_ANIM;
 
  for (const [h, f] of derniereScan) {
    const visible = !f.iconic;
    const avant = dernierVisible.get(h);
    let raison = null;
    if (!connues.has(h)) {
      connues.add(h);
      raison = 'nouvelle fenêtre';
    } else if (visible && avant !== undefined && maintenant - avant > DELAI_REAPPARITION) {
      raison = 'fenêtre réapparue';
    }
    if (visible) dernierVisible.set(h, maintenant);
    if (!raison || !actif || !visible) continue;
    if (ignoree(f)) { journal('ignorée (programme exclu) :', f.nom, '-', f.titre); continue; }
    journal(raison + ' :', f.nom, '-', f.titre);
    setTimeout(() => annoncer(h), DELAI_STABILITE);
  }
 
  // Option : une fenêtre déjà ouverte revient au premier plan
  if (REAGIR_AU_PREMIER_PLAN && actif && fg && fg !== fgPrecedent) {
    const f = derniereScan.get(fg);
    if (f && !f.iconic && fg !== suivi && !ignoree(f)) {
      journal('premier plan :', f.nom, '-', f.titre);
      setTimeout(() => { if (fgEnCours === fg) annoncer(fg); }, DELAI_STABILITE);
    }
  }
  fgPrecedent = fg;
 
  if (connues.size > 5000) connues.clear();
  if (dernierVisible.size > 5000) dernierVisible.clear();
 
  suivreFenetre();
  verifierLigne();
}
 
// La fenêtre est restée ouverte assez longtemps : Capri vient s'y asseoir
function annoncer(h) {
  if (modeActuel !== 'anim' || !win || win.isDestroyed()) return;
  if (suivi === h) return; // elle est déjà assise sur cette fenêtre
  const f = derniereScan.get(h);
  if (!f || f.iconic) { journal('abandon : la fenêtre a disparu avant', DELAI_STABILITE, 'ms'); return; }
  const r = rectPage(f);
  if (!r) { journal('abandon : la fenêtre est sur un autre écran'); return; }
  if (estGrande(r)) {
    journal('grande fenêtre (Capri reste au sol, escapades possibles) :', f.nom, '-', f.titre);
    suivi = null;
    win.webContents.send('fenetre-grande');
    return;
  }
  suivi = h;
  suiviManque = 0;
  dernierRect = [f.l, f.t, f.r, f.b].join(',');
  win.webContents.send('fenetre-ouverte', r);
}
 
// Capri suit sa fenêtre : si elle bouge, Capri bouge ; si elle se ferme, Capri redescend
function suivreFenetre() {
  if (suivi === null) return;
  if (modeActuel !== 'anim' || !win || win.isDestroyed()) { suivi = null; return; }
  const f = derniereScan.get(suivi);
  if (!f || f.iconic) {
    if (++suiviManque >= 3) {
      suivi = null;
      win.webContents.send('fenetre-fermee');
    }
    return;
  }
  suiviManque = 0;
  const clef = [f.l, f.t, f.r, f.b].join(',');
  if (clef !== dernierRect) {
    dernierRect = clef;
    const r = rectPage(f);
    if (r) win.webContents.send('fenetre-bouge', r);
  }
}
 
// ===== Escapades : Capri marche sur les lignes d'une grande fenêtre =====
 
let suiviLigne = null; // { hwnd, clef } : la fenêtre dont Capri parcourt les lignes
 
// La grande fenêtre au premier plan, si Capri peut y faire une escapade
function fenetreEscapade() {
  if (modeActuel !== 'anim' || !win || win.isDestroyed()) return null;
  const f = derniereScan.get(fgEnCours);
  if (!f || f.iconic || ignoree(f)) return null;
  const r = rectPage(f);
  if (!r || !estGrande(r)) return null;
  return f;
}
 
// Si la fenêtre bouge, se ferme ou perd le premier plan, Capri doit quitter sa ligne
function verifierLigne() {
  if (!suiviLigne) return;
  if (modeActuel !== 'anim' || !win || win.isDestroyed()) { suiviLigne = null; return; }
  const f = derniereScan.get(suiviLigne.hwnd);
  const clef = f && !f.iconic ? [f.l, f.t, f.r, f.b].join(',') : null;
  if (!f || f.iconic || clef !== suiviLigne.clef || fgEnCours !== suiviLigne.hwnd) {
    journal('la fenêtre a changé : Capri quitte sa ligne');
    suiviLigne = null;
    win.webContents.send('ligne-perdue');
  }
}
 
// Cherche les lignes horizontales de l'image : endroits où beaucoup de pixels
// changent de couleur d'une rangée à l'autre (haut des lettres, bords de barres, de boutons...)
function detecterLignes(buf, W, x0, y0, x1, y1, ps) {
  const w = x1 - x0, h = y1 - y0;
  if (w < 100 || h < 100) return [];
  const lum = new Uint8Array(w * h);
  let somme = 0;
  for (let y = 0; y < h; y++) {
    let o = ((y0 + y) * W + x0) * 4;
    const k = y * w;
    for (let x = 0; x < w; x++, o += 4) {
      const v = (buf[o + 2] * 77 + buf[o + 1] * 150 + buf[o] * 29) >> 8;
      lum[k + x] = v;
      somme += v;
    }
  }
  if (somme === 0) return []; // capture noire : rien à analyser
 
  const trou = Math.round(14 * ps);        // trou toléré entre deux lettres
  const minLen = Math.round(MIN_LIGNE * ps);
  const brutes = [];
  for (let y = 1; y < h; y++) {
    const k = y * w, kp = k - w;
    let debut = -1, dernier = -1, n = 0;
    const clore = () => {
      const len = dernier - debut + 1;
      if (debut >= 0 && len >= minLen && n >= len * 0.3) brutes.push({ x1: debut, x2: dernier, y, n });
    };
    for (let x = 0; x < w; x++) {
      const d = lum[k + x] - lum[kp + x];
      if (d >= SEUIL_CONTRASTE || d <= -SEUIL_CONTRASTE) {
        if (debut >= 0 && x - dernier > trou) { clore(); debut = -1; }
        if (debut < 0) { debut = x; n = 0; }
        dernier = x;
        n++;
      }
    }
    clore();
  }
 
  // Une même ligne apparaît sur plusieurs rangées voisines : on garde la meilleure
  brutes.sort((a, b) => b.n - a.n);
  const gardees = [];
  const dy = Math.round(8 * ps);
  for (const b of brutes) {
    let doublon = false;
    for (const g of gardees) {
      if (Math.abs(g.y - b.y) > dy) continue;
      const recouvre = Math.min(g.x2, b.x2) - Math.max(g.x1, b.x1);
      if (recouvre > 0.5 * Math.min(g.x2 - g.x1, b.x2 - b.x1)) { doublon = true; break; }
    }
    if (!doublon) {
      gardees.push(b);
      if (gardees.length >= 150) break;
    }
  }
  return gardees;
}
 
// Prend une capture de l'écran (Capri est invisible à ce moment-là) et en tire les lignes,
// converties en coordonnées de la page de Capri
async function capturerLignes(f) {
  const zone = win.getBounds();
  const d = screen.getDisplayMatching(zone);
  const sf = d.scaleFactor;
  const largeur = Math.round(d.bounds.width * sf);
  const hauteur = Math.round(d.bounds.height * sf);
  const sources = await desktopCapturer.getSources({
    types: ['screen'], thumbnailSize: { width: largeur, height: hauteur }
  });
  const src = sources.find((x) => x.display_id === String(d.id)) || sources[0];
  if (!src) return [];
  const img = src.thumbnail;
  const { width: W, height: H } = img.getSize();
  if (!W || !H) return [];
  const buf = img.toBitmap();
  const o = screen.dipToScreenPoint({ x: d.bounds.x, y: d.bounds.y });
  const k = W / largeur;
  const x0 = Math.max(0, Math.round((f.l - o.x) * k));
  const y0 = Math.max(0, Math.round((f.t - o.y) * k));
  const x1 = Math.min(W, Math.round((f.r - o.x) * k));
  const y1 = Math.min(H, Math.round((f.b - o.y) * k));
  const brutes = detecterLignes(buf, W, x0, y0, x1, y1, sf * k);
  return brutes.map((b) => {
    const a = screen.screenToDipPoint({ x: o.x + (x0 + b.x1) / k, y: o.y + (y0 + b.y) / k });
    const c = screen.screenToDipPoint({ x: o.x + (x0 + b.x2) / k, y: o.y + (y0 + b.y) / k });
    return { x1: a.x - zone.x, x2: c.x - zone.x, y: a.y - zone.y };
  });
}
 
ipcMain.handle('escapade-possible', () => !!fenetreEscapade());
 
ipcMain.handle('lignes', async () => {
  const f = fenetreEscapade();
  if (!f) return [];
  try {
    const lignes = await capturerLignes(f);
    journal('lignes détectées :', lignes.length, '(' + f.nom + ')');
    if (lignes.length) {
      suiviLigne = { hwnd: fgEnCours, clef: [f.l, f.t, f.r, f.b].join(',') };
    }
    return lignes;
  } catch (e) {
    journal('capture impossible :', e.message);
    return [];
  }
});
 
ipcMain.on('ligne-finie', () => { suiviLigne = null; });

// ===== CAPRI-ASSISE-FENETRE : la liste des fenêtres (de la plus devant à la plus derrière) =====
ipcMain.handle('fenetres-sol', () => {
  if (modeActuel !== 'anim' || !win || win.isDestroyed()) return [];
  const liste = [];
  for (const [h, f] of derniereScan) {
    if (f.iconic || ignoree(f)) continue;
    const r = rectPage(f);
    if (!r) continue;
    liste.push({ id: h, x: r.x, y: r.y, w: r.w, h: r.h });
  }
  return liste;
});

// Capri vient de se poser sur une fenêtre : main.js la suit (si elle bouge ou se ferme, Capri suit)
ipcMain.on('assise-sur', (event, h) => {
  if (modeActuel !== 'anim' || !win || win.isDestroyed()) return;
  const f = derniereScan.get(h);
  if (!f || f.iconic) return;
  suivi = h;
  suiviManque = 0;
  suiviLigne = null;
  dernierRect = [f.l, f.t, f.r, f.b].join(',');
  const r = rectPage(f);
  if (r) win.webContents.send('fenetre-bouge', r);
});

 
// Clic droit sur le portrait : on dit à la page d'afficher son menu cyberpunk
function montrerMenu(point) {
  if (modeActuel !== 'call') return;
  const b = win.getBounds();
  win.webContents.send('menu-at', point.x - b.x, point.y - b.y);
}
 
function createWindow() {
  const { x, y, width, height } = screen.getPrimaryDisplay().workArea;
  win = new BrowserWindow({
    x: x + width - SIZES.orb.w - 20,
    y: y + height - SIZES.orb.h - 20,
    width: SIZES.orb.w,
    height: SIZES.orb.h,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
   // Reste au-dessus de tout, y compris des fenêtres en plein écran
  win.setAlwaysOnTop(true, 'screen-saver');
  setInterval(() => {
    if (win && !win.isDestroyed() && win.isVisible()) {
      win.setAlwaysOnTop(true, 'screen-saver');
      win.moveTop();
    }
  }, 1000);
  // Clic droit sur une zone "drag" : Windows voudrait afficher son menu système,
  // on le remplace par notre menu (seulement pendant l'appel)
  win.on('system-context-menu', (event, point) => {
    event.preventDefault();
    montrerMenu(point);
  });
 
  win.loadFile('index.html');
  place('orb'); // lance le compte à rebours avant la balade
}
 
ipcMain.on('mode', (event, mode, cx) => place(mode, cx));
 
// Active ou désactive le "clic à travers" (utile pendant la balade)
ipcMain.on('clickthrough', (event, ignorer) => {
  if (ignorer) win.setIgnoreMouseEvents(true, { forward: true });
  else win.setIgnoreMouseEvents(false);
});
 
// Envoie la conversation à l'IA (Ollama) et renvoie la réponse
ipcMain.handle('ask', async (event, messages) => {
  try {
    const res = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
        stream: false,
        messages: [{ role: 'system', content: PERSONNALITE }, ...messages]
      })
    });
    const data = await res.json();
    if (data.error) return '[Erreur : ' + data.error + ']';
    return data.message.content;
  } catch (e) {
    return '[Erreur : Ollama ne répond pas, est-il bien lancé ? (' + e.message + ')]';
  }
});
 
app.whenReady().then(() => {
  createWindow();
  demarrerSurveillance();
 
  // Un appui : Capri disparaît. Un deuxième appui : elle revient.
    // Lance Capri automatiquement à l'ouverture de session Windows
  app.setLoginItemSettings({ openAtLogin: true, path: process.execPath, args: [app.getAppPath()] });
  globalShortcut.register(TOUCHE_MASQUER, () => {
    if (win.isVisible()) {
      win.hide();
    } else {
      win.showInactive(); // revient sans voler le focus à ton jeu
    }
  });
 
  // Fermer complètement Capri
  globalShortcut.register(TOUCHE_QUITTER, () => app.quit());
});
 
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (surveillant) surveillant.kill();
});
app.on('window-all-closed', () => app.quit());
 // ===== Ports USB : petite fenêtre à part, toujours tout en haut à droite de l'écran =====
// (visible avec l'orbe et avec la fenêtre de discussion ; pendant la balade, ce sont ceux de la page)
const HTML_USB = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
:root{--rouge:#ff2e63;--cadre:#ff4d5a}
html,body{margin:0;background:transparent;overflow:hidden}
.ports{position:absolute;top:0;right:0;display:flex;gap:14px;transform:scale(1.25);transform-origin:top right}
.port{--c:8px;position:relative;width:66px;height:24px;background:var(--cadre);padding:2px;box-sizing:border-box;
  clip-path:polygon(0 0,100% 0,100% calc(100% - var(--c)),calc(100% - var(--c)) 100%,0 100%);
  animation:alerte 1.6s steps(2,start) infinite}
.port-in{position:relative;height:100%;background:#000}
.port-in::after{content:"";position:absolute;left:8px;right:8px;top:50%;height:4px;margin-top:-2px;background:#3a4558}
@keyframes alerte{50%{background:var(--rouge)}}
</style></head><body><div class="ports"><div class="port"><div class="port-in"></div></div><div class="port"><div class="port-in"></div></div></div></body></html>`;

let usbWin = null;
function creerUsbWin() {
  const wa = screen.getPrimaryDisplay().workArea;
  const L = 190, H = 36;
  usbWin = new BrowserWindow({
    x: wa.x + wa.width - L, y: wa.y, width: L, height: H,
    transparent: true, frame: false, alwaysOnTop: true, resizable: false,
    hasShadow: false, skipTaskbar: true, focusable: false, show: false
  });
  usbWin.setIgnoreMouseEvents(true);
  usbWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(HTML_USB));
  usbWin.once('ready-to-show', () => usbWin.showInactive());
  setInterval(() => {
    if (!usbWin || usbWin.isDestroyed() || !win || win.isDestroyed()) return;
    const enBalade = modeActuel === 'anim' && Date.now() - debutAnim > 400;
    const voulu = !enBalade && win.isVisible();
    if (voulu && !usbWin.isVisible()) usbWin.showInactive();
    else if (!voulu && usbWin.isVisible()) usbWin.hide();
  }, 120);
}
require('./usb_dock.js')(() => ({ win, modeActuel, debutAnim }));
   require('./capri_vie_main.js')(() => ({ win }));
require('./capri_memoire_main.js')();
require('./capri_micro_main.js')();
