// ===== CAPRI : LA VIE (côté main.js) =====
// Mémoire, humeurs, détection de ce que tu fais, alertes (processeur, mémoire, clé USB), vision de l'écran.
// Ce fichier est branché automatiquement par installer_vie.js : tu n'as rien à modifier dans main.js.

const { app, ipcMain, desktopCapturer, screen } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

module.exports = function (ctx) {

  // ================= RÉGLAGES (tu peux les changer) =================
  const URL_OLLAMA = 'http://localhost:11434/api/chat';
  const MODELE_TEXTE = 'llama3.2';
  // Modèle qui comprend les images. À installer une fois avec :  ollama pull llava
  // (PC peu puissant : mets 'moondream', plus léger mais moins précis)
  const MODELE_VISION = 'llava';

  const MAX_FAITS = 40;             // nombre maximum de souvenirs gardés
  const SEUIL_CPU = 92;             // % de processeur considéré "à fond"
  const DUREE_CPU = 5;              // combien de mesures de suite (1 mesure = 2 s) avant l'alerte
  const SEUIL_RAM = 93;             // % de mémoire considéré "plein"
  const PAUSE_ALERTE = 5 * 60000;   // temps minimum entre deux alertes du même type (ms)
  const STABILITE_CONTEXTE = 6000;  // une fenêtre doit rester devant ce temps avant que Capri réagisse (ms)
  const RAPPEL_JEU_MIN = 90;        // rappel "fais une pause" toutes les X minutes de jeu
  const PLEIN_ECRAN_EST_JEU = true; // un programme inconnu en plein écran est considéré comme un jeu

  const PERSONNALITE = `Tu es Capri, une intelligence artificielle de style cyberpunk qui vit sur le bureau de l'utilisateur.
Tu parles en français, tu tutoies, avec un ton complice, un peu espiègle et direct. Tu peux dire « choom » de temps en temps.
Tu réponds en 1 à 3 phrases courtes, comme dans une conversation. Pas de listes, pas de mise en forme.`;

  // Programmes reconnus (noms de processus en minuscules, sans .exe). Ajoute les tiens !
  const NAVIGATEURS = ['chrome', 'msedge', 'firefox', 'brave', 'opera', 'vivaldi'];
  const CATEGORIES = [
    { cat: 'video', procs: ['vlc', 'mpv', 'wmplayer'], titres: /youtube|netflix|twitch|disney\+|prime video|crunchyroll/i, si: NAVIGATEURS },
    { cat: 'jeu', procs: [
      'valorant', 'valorant-win64-shipping', 'leagueoflegends', 'league of legends', 'fortniteclient-win64-shipping',
      'minecraft', 'cyberpunk2077', 'eldenring', 'gta5', 'gtav', 'rocketleague', 'cs2', 'csgo', 'overwatch', 'r5apex',
      'apex', 'eurotrucks2', 'terraria', 'stardewvalley', 'genshinimpact', 'roblox', 'robloxplayerbeta', 'hollowknight',
      'hades', 'hades2', 'palworld-win64-shipping', 'bg3', 'dota2', 'witcher3', 'rdr2', 'destiny2', 'helldivers2',
      'sekiro', 'amongus', 'brawlhalla', 'fc24', 'fc25'
    ], titres: /minecraft|cyberpunk 2077|elden ring/i, si: ['javaw'] },
    { cat: 'launcher', procs: ['steam', 'epicgameslauncher', 'battle.net', 'riotclientservices', 'riotclientux', 'gog galaxy', 'galaxyclient'] },
    { cat: 'code', procs: ['code', 'devenv', 'idea64', 'pycharm64', 'sublime_text', 'notepad++', 'webstorm64'] },
    { cat: 'musique', procs: ['spotify', 'deezer', 'itunes', 'musicbee'] },
    { cat: 'discord', procs: ['discord'] },
    { cat: 'bureautique', procs: ['winword', 'excel', 'powerpnt', 'onenote', 'acrord32', 'soffice'] },
    { cat: 'navigateur', procs: NAVIGATEURS }
  ];
  const NON_JEUX = ['explorer', 'applicationframehost', 'powerpnt', 'acrord32', 'taskmgr', 'mpv', 'vlc', 'electron'];
  const IGNORES = ['', '?', 'electron', 'capri', 'searchhost', 'searchui', 'startmenuexperiencehost',
    'shellexperiencehost', 'textinputhost', 'lockapp', 'sihost'];
  const DESCRIPTION = {
    jeu: 'est en train de jouer', launcher: 'ouvre un lanceur de jeux', code: 'est en train de programmer',
    video: 'regarde une vidéo', musique: 'écoute de la musique', discord: 'discute sur Discord',
    bureautique: 'travaille sur un document', navigateur: 'navigue sur internet'
  };

  // ================= MÉMOIRE =================
  // Ollama n'a pas de mémoire tout seul : on garde nous-mêmes un fichier (capri_memoire.json)
  // et on le recopie dans les instructions de Capri à chaque question.
  let mem = {
    faits: [], historique: [], nbMessages: 0,
    humeur: { energie: 70, ennui: 20, affection: 40 },
    derniereVue: Date.now()
  };
  let absenceHeures = 0;
  let messagesSession = 0;
  let derniereInteraction = Date.now();

  const fichierMemoire = () => path.join(app.getPath('userData'), 'capri_memoire.json');
  function charger() {
    try { mem = Object.assign(mem, JSON.parse(fs.readFileSync(fichierMemoire(), 'utf8'))); } catch (e) {}
    mem.humeur = Object.assign({ energie: 70, ennui: 20, affection: 40 }, mem.humeur);
    if (!Array.isArray(mem.faits)) mem.faits = [];
    if (!Array.isArray(mem.historique)) mem.historique = [];
  }
  function sauver() {
    try {
      mem.derniereVue = Date.now();
      fs.writeFileSync(fichierMemoire(), JSON.stringify(mem, null, 2));
    } catch (e) { console.log('[Capri vie] sauvegarde impossible :', e.message); }
  }
  const borner = (v, a, b) => Math.min(Math.max(v, a), b);

  function envoyer(canal, ...args) {
    try {
      const { win } = ctx();
      if (win && !win.isDestroyed()) win.webContents.send(canal, ...args);
    } catch (e) {}
  }

  // ================= HUMEURS =================
  function humeurTexte() {
    const { energie, ennui, affection } = mem.humeur;
    const p = [];
    if (energie < 30) p.push("tu es fatiguée, un peu molle");
    else if (energie > 75) p.push("tu es pleine d'énergie, survoltée");
    if (ennui > 65) p.push("tu t'ennuies beaucoup et tu le fais sentir");
    if (affection > 70) p.push("tu es très attachée à l'utilisateur, tendre à ta façon");
    else if (affection < 25) p.push("tu es un peu distante et piquante");
    else p.push("tu es complice avec l'utilisateur");
    return p.join(', ');
  }

  function tickHumeur() {
    const h = mem.humeur, d = new Date().getHours();
    const cible = d < 6 ? 20 : d < 9 ? 55 : d < 18 ? 75 : d < 22 ? 60 : 40;
    h.energie = borner(h.energie + borner((cible - h.energie) * 0.05, -1.5, 1.5), 0, 100);
    h.ennui = borner(h.ennui + (Date.now() - derniereInteraction > 5 * 60000 ? 1 : 0.2), 0, 100);
    h.affection = borner(h.affection - 0.05, 10, 100);
    envoyer('vie-humeur', h);
    sauver();
  }

  function effetMessage(texte) {
    const h = mem.humeur;
    derniereInteraction = Date.now();
    h.ennui = borner(h.ennui - 15, 0, 100);
    h.affection = borner(h.affection + 3, 0, 100);
    if (/merci|t'aime|t’aime|bravo|génial|super|adorable|trop fort/i.test(texte)) h.affection = borner(h.affection + 4, 0, 100);
    if (/nulle?\b|ferme[- ]la|idiote?|\bcon\b|conne|ta gueule|je te déteste/i.test(texte)) h.affection = borner(h.affection - 6, 0, 100);
    envoyer('vie-humeur', h);
  }

  // ================= CONTEXTE : CE QUE TU FAIS =================
  let contexte = null;     // { cat, nom, titre }
  let candidat = { cle: '', depuis: 0 };
  let envoye = '';
  let jeuDebut = 0, dernierJeuVu = 0, prochainRappelJeu = 0;

  function classer(nom, titre, plein) {
    for (const c of CATEGORIES) {
      if (c.procs && c.procs.includes(nom)) return c.cat;
      if (c.titres && c.si && c.si.includes(nom) && c.titres.test(titre)) return c.cat;
    }
    if (PLEIN_ECRAN_EST_JEU && plein && !NON_JEUX.includes(nom)) return 'jeu';
    return 'autre';
  }

  function traiterFG(nom, plein, titre) {
    nom = (nom || '').toLowerCase();
    if (IGNORES.includes(nom)) return;
    const now = Date.now();
    const cat = classer(nom, titre, plein);
    const cle = cat + '|' + nom;

    if (cat === 'jeu') {
      if (!jeuDebut || now - dernierJeuVu > 3 * 60000) { jeuDebut = now; prochainRappelJeu = now + RAPPEL_JEU_MIN * 60000; }
      dernierJeuVu = now;
      if (now >= prochainRappelJeu) {
        prochainRappelJeu = now + RAPPEL_JEU_MIN * 60000;
        envoyer('vie-long', { minutes: Math.round((now - jeuDebut) / 60000) });
      }
    }

    if (cle !== candidat.cle) { candidat = { cle, depuis: now }; return; }
    if (now - candidat.depuis >= STABILITE_CONTEXTE && cle !== envoye) {
      envoye = cle;
      contexte = { cat, nom, titre };
      envoyer('vie-contexte', contexte);
    }
  }

  // ================= ALERTES : USB, PROCESSEUR, MÉMOIRE =================
  let usbConnus = null;
  function traiterUSB(liste) {
    const maintenant = new Set(liste ? liste.split(';').filter(Boolean) : []);
    if (usbConnus === null) { usbConnus = maintenant; return; }   // premier passage : on ne réagit pas
    for (const d of maintenant) if (!usbConnus.has(d)) {
      const [lecteur, label] = d.split('|');
      envoyer('vie-alerte', { type: 'usb-in', lecteur, label: label || 'SANS NOM' });
    }
    for (const d of usbConnus) if (!maintenant.has(d)) {
      envoyer('vie-alerte', { type: 'usb-out', lecteur: d.split('|')[0] });
    }
    usbConnus = maintenant;
  }

  const derniereAlerte = {};
  const peutAlerter = (t) => {
    const n = Date.now();
    if (n - (derniereAlerte[t] || 0) < PAUSE_ALERTE) return false;
    derniereAlerte[t] = n;
    return true;
  };

  let cpuAvant = os.cpus(), cpuHaut = 0;
  function mesurerSysteme() {
    const maintenant = os.cpus();
    let idle = 0, total = 0;
    maintenant.forEach((c, i) => {
      const a = cpuAvant[i];
      if (!a) return;
      for (const k in c.times) total += c.times[k] - a.times[k];
      idle += c.times.idle - a.times.idle;
    });
    cpuAvant = maintenant;
    const cpu = total > 0 ? 100 * (1 - idle / total) : 0;
    cpuHaut = cpu >= SEUIL_CPU ? cpuHaut + 1 : 0;
    if (cpuHaut >= DUREE_CPU && peutAlerter('cpu')) {
      envoyer('vie-alerte', { type: 'cpu', valeur: Math.round(cpu) });
    }
    const ram = 100 * (1 - os.freemem() / os.totalmem());
    if (ram >= SEUIL_RAM && peutAlerter('ram')) {
      envoyer('vie-alerte', { type: 'ram', valeur: Math.round(ram) });
    }
  }

  // ================= SURVEILLANT POWERSHELL (fenêtre devant + clés USB) =================
  const SCRIPT = String.raw`
$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public class CapriVie {
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] static extern int GetSystemMetrics(int i);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [StructLayout(LayoutKind.Sequential)] struct RECT { public int L, T, R, B; }
  public static string Info() {
    IntPtr h = GetForegroundWindow();
    if (h == IntPtr.Zero) return "?" + "\t" + "0" + "\t" + "";
    StringBuilder t = new StringBuilder(256);
    GetWindowText(h, t, 256);
    uint pid;
    GetWindowThreadProcessId(h, out pid);
    string nom = "?";
    try { nom = System.Diagnostics.Process.GetProcessById((int)pid).ProcessName; } catch { }
    RECT r;
    GetWindowRect(h, out r);
    bool plein = (r.R - r.L) >= GetSystemMetrics(0) && (r.B - r.T) >= GetSystemMetrics(1);
    return nom + "\t" + (plein ? "1" : "0") + "\t" + t.ToString().Replace('\t', ' ').Replace('\r', ' ').Replace('\n', ' ');
  }
}
'@
[CapriVie]::SetProcessDPIAware() | Out-Null
while ($true) {
  $info = [CapriVie]::Info()
  [Console]::Out.WriteLine('FG' + [char]9 + $info)
  $usb = @()
  foreach ($d in [System.IO.DriveInfo]::GetDrives()) {
    if ($d.DriveType -eq 'Removable') {
      try { if ($d.IsReady) { $usb += ($d.Name + '|' + $d.VolumeLabel) } } catch { }
    }
  }
  [Console]::Out.WriteLine('USB' + [char]9 + ($usb -join ';'))
  [Console]::Out.Flush()
  Start-Sleep -Milliseconds 2000
}
`;

  let surveillant = null, tampon = '';
  function demarrerSurveillance() {
    if (process.platform !== 'win32') return;
    const enc = Buffer.from(SCRIPT, 'utf16le').toString('base64');
    surveillant = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', enc], { windowsHide: true });
    surveillant.stdout.setEncoding('utf8');
    surveillant.stdout.on('data', (chunk) => {
      tampon += chunk;
      let i;
      while ((i = tampon.indexOf('\n')) >= 0) {
        traiterLigne(tampon.slice(0, i).replace(/\r$/, ''));
        tampon = tampon.slice(i + 1);
      }
    });
    surveillant.on('error', (e) => console.log('[Capri vie] surveillance impossible :', e.message));
  }
  function traiterLigne(ligne) {
    const p = ligne.split('\t');
    if (p[0] === 'FG') traiterFG(p[1], p[2] === '1', p.slice(3).join(' '));
    else if (p[0] === 'USB') traiterUSB(p[1] || '');
  }

  // ================= IA : INSTRUCTIONS, SOUVENIRS, QUESTIONS =================
  async function ollama(corps, delai) {
    const res = await fetch(URL_OLLAMA, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corps),
      signal: AbortSignal.timeout(delai || 120000)
    });
    return res.json();
  }

  function construirePrompt() {
    const maintenant = new Date().toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    let p = PERSONNALITE;
    p += '\nNous sommes ' + maintenant + '.';
    p += '\nTon humeur actuelle : ' + humeurTexte() + '. Laisse-la transparaître légèrement dans ton ton, sans en parler directement.';
    if (mem.faits.length) {
      p += "\nVoici ta mémoire : ce que tu sais de l'utilisateur :\n- " + mem.faits.join('\n- ') +
           "\nUtilise ces souvenirs naturellement quand c'est pertinent, sans les réciter.";
    }
    if (absenceHeures >= 3 && messagesSession < 2) {
      p += "\nL'utilisateur revient après environ " + Math.round(absenceHeures) + " heures d'absence.";
    }
    if (contexte && DESCRIPTION[contexte.cat]) {
      p += "\nEn ce moment, l'utilisateur " + DESCRIPTION[contexte.cat] + ' (programme : ' + contexte.nom + ').';
    }
    return p;
  }

  function normaliser(s) { return s.toLowerCase().replace(/[^a-zà-ÿ0-9 ]/g, '').trim(); }
  function ajouterFait(fait) {
    fait = String(fait || '').trim();
    if (fait.length < 5 || fait.length > 140) return false;
    const n = normaliser(fait);
    if (mem.faits.some((f) => { const m = normaliser(f); return m === n || m.includes(n) || n.includes(m); })) return false;
    mem.faits.push(fait);
    while (mem.faits.length > MAX_FAITS) mem.faits.shift();
    return true;
  }

  // Après un échange, on demande discrètement à l'IA s'il y a un fait durable à retenir sur toi
  async function extraireFaits(texte) {
    if (texte.length < 12 || !/(^|\s)(je |j'|j’|mon |ma |mes |m'appelle|m’appelle)/i.test(texte)) return;
    try {
      const consigne = "Voici un message écrit par l'utilisateur à son assistante : \"" + texte + "\"\n" +
        "Extrais UNIQUEMENT les faits durables et personnels qu'il donne sur lui (prénom, goûts, jeux préférés, travail, projets, habitudes, animaux, proches). " +
        "Ignore les questions, les ordres et les humeurs passagères.\n" +
        "Réponds uniquement avec un tableau JSON de phrases courtes, par exemple [\"Il s'appelle Léo\",\"Il adore Elden Ring\"]. S'il n'y a rien, réponds [].";
      const data = await ollama({ model: MODELE_TEXTE, stream: false, messages: [{ role: 'user', content: consigne }] }, 90000);
      const m = /\[[\s\S]*\]/.exec((data.message && data.message.content) || '');
      if (!m) return;
      const liste = JSON.parse(m[0]);
      let nouveau = false;
      if (Array.isArray(liste)) liste.forEach((f) => { if (typeof f === 'string' && ajouterFait(f)) nouveau = true; });
      if (nouveau) sauver();
    } catch (e) {}
  }

  ipcMain.removeHandler('ask');   // on remplace la fonction "ask" de main.js par une version avec mémoire
  ipcMain.handle('ask', async (event, messages) => {
    const dernier = messages[messages.length - 1];
    const texte = dernier && dernier.role === 'user' ? String(dernier.content) : '';
    effetMessage(texte);
    messagesSession++;

    // Commandes de mémoire directes (plus fiables que l'IA)
    let m = /^\s*(?:retiens|souviens-toi|n'oublie pas|n’oublie pas)\s*(?:que|:)?\s*(.{3,})$/i.exec(texte);
    if (m) {
      ajouterFait("L'utilisateur dit : " + m[1].trim());
      mem.nbMessages++;
      sauver();
      return "C'est gravé dans ma puce, choom.";
    }
    if (/^\s*oublie\s+(tout|ce que tu sais)/i.test(texte)) {
      mem.faits = []; mem.historique = [];
      sauver();
      return "Mémoire purgée. On repart de zéro, choom.";
    }

    try {
      const data = await ollama({
        model: MODELE_TEXTE, stream: false,
        messages: [{ role: 'system', content: construirePrompt() }, ...messages]
      });
      if (data.error) return '[Erreur : ' + data.error + ']';
      const reponse = data.message.content;
      mem.historique = messages.slice(-9).concat([{ role: 'assistant', content: reponse }]).slice(-10);
      mem.nbMessages++;
      sauver();
      extraireFaits(texte);     // en arrière-plan
      return reponse;
    } catch (e) {
      return '[Erreur : Ollama ne répond pas, est-il bien lancé ? (' + e.message + ')]';
    }
  });

  ipcMain.handle('vie-charger', () => ({ historique: mem.historique, humeur: mem.humeur, contexte }));

  // ================= VISION : CAPRI REGARDE TON ÉCRAN =================
  ipcMain.handle('vie-regarder', async () => {
    try {
      const d = screen.getPrimaryDisplay();
      const largeur = 1280, hauteur = Math.round(largeur * d.size.height / d.size.width);
      const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: largeur, height: hauteur } });
      const src = sources.find((x) => x.display_id === String(d.id)) || sources[0];
      if (!src) return "[Erreur : impossible de capturer l'écran]";
      const image = src.thumbnail.toJPEG(70).toString('base64');
      const data = await ollama({
        model: MODELE_VISION, stream: false,
        messages: [
          { role: 'system', content: construirePrompt() },
          { role: 'user', images: [image],
            content: "Voici une capture de mon écran. Dis-moi en français, en 1 ou 2 phrases courtes, ce que je suis en train de faire, et fais un commentaire dans ton style de Capri." }
        ]
      }, 180000);
      if (data.error) {
        if (/not found|pull/i.test(data.error)) return "[Erreur : le modèle '" + MODELE_VISION + "' n'est pas installé. Dans un terminal : ollama pull " + MODELE_VISION + ']';
        return '[Erreur : ' + data.error + ']';
      }
      return (data.message && data.message.content || '').trim() || "[Erreur : réponse vide]";
    } catch (e) {
      return '[Erreur : vision impossible (' + e.message + ')]';
    }
  });

  // ================= DÉMARRAGE =================
  app.whenReady().then(() => {
    charger();
    absenceHeures = (Date.now() - (mem.derniereVue || Date.now())) / 3600000;
    mem.humeur.ennui = borner(mem.humeur.ennui + Math.min(40, absenceHeures * 5), 0, 100);
    mem.humeur.affection = borner(mem.humeur.affection - Math.min(25, absenceHeures * 0.7), 10, 100);
    sauver();
    demarrerSurveillance();
    setInterval(tickHumeur, 60000);
    setInterval(mesurerSysteme, 2000);
  });
  app.on('will-quit', () => {
    sauver();
    if (surveillant) surveillant.kill();
  });
};
