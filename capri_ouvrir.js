// ===== capri_ouvrir.js (V3 : une seule fenêtre lecteur) : Capri ouvre des sites, lance de la musique, en français ET en anglais =====
// Exemples :  "ouvre Spotify"  /  "mets la musique Blinding Lights"  /  "mets High Forever"
//             "open Spotify"  /  "play In Love With Myself"  /  "search pasta recipe"
// NOUVEAU : les 3 musiques de ton dossier (High Forever, I Really Want to Stay at Your House,
//           In Love With Myself) s'ouvrent dans une petite fenêtre lecteur et se lancent toutes seules.
// NOUVEAU : un petit bouton « ? » (à côté de la croix du panneau, et à côté de ▶ dans l'appel) affiche la liste
//           des COMMANDES SPÉCIFIQUES, en français ou en anglais selon le bouton FRANÇAIS / ENGLISH.
// À charger EN DERNIER dans le fichier HTML, après capri_vue.js :  <script src="capri_ouvrir.js"></script>
(function () {
  const { ipcRenderer, shell } = require('electron');
  const https = require('https');

  // Plateforme utilisée quand tu ne la précises pas : 'youtube' (lance la vidéo directement) ou 'spotify' (page de recherche)
  const PLATEFORME_MUSIQUE = 'youtube';

  // ===== Tes musiques locales (les fichiers .mp4 doivent être dans le dossier de Capri) =====
  // "cherche" = les mots qui déclenchent la musique (on accepte aussi les erreurs d'écoute comme "hide forever").
  // Pour en ajouter une : copie un bloc, change le fichier, le titre et les mots.
  const PISTES = [
    { fichier: 'musique_high_forever.mp4', titre: 'High Forever',
      cherche: /\b(high|hide|hi|ai)\s+forever\b|^forever$|hoffstadt/ },
    { fichier: 'musique_stay_at_your_house.mp4', titre: 'I Really Want to Stay at Your House',
      cherche: /really want to stay|stay at (your |my |the )?(house|home)|stay at your|your house|rosa walton/ },
    { fichier: 'musique_in_love_with_myself.mp4', titre: 'In Love With Myself',
      cherche: /love with myself|\bmyself\b|in love with me/ }
  ];

  // Sites connus : ajoute une ligne pour en ajouter un (nom sans espace, en minuscules)
  const SITES = {
    spotify: 'https://open.spotify.com', musique: 'https://open.spotify.com', music: 'https://open.spotify.com',
    youtube: 'https://www.youtube.com', google: 'https://www.google.com',
    gmail: 'https://mail.google.com', mail: 'https://mail.google.com',
    drive: 'https://drive.google.com', googledrive: 'https://drive.google.com',
    maps: 'https://www.google.com/maps', googlemaps: 'https://www.google.com/maps',
    netflix: 'https://www.netflix.com', twitch: 'https://www.twitch.tv',
    discord: 'https://discord.com/app', twitter: 'https://x.com', x: 'https://x.com',
    facebook: 'https://www.facebook.com', instagram: 'https://www.instagram.com',
    tiktok: 'https://www.tiktok.com', reddit: 'https://www.reddit.com',
    github: 'https://github.com', chatgpt: 'https://chatgpt.com',
    amazon: 'https://www.amazon.fr', wikipedia: 'https://fr.wikipedia.org',
    deezer: 'https://www.deezer.com', soundcloud: 'https://soundcloud.com',
    primevideo: 'https://www.primevideo.com', disney: 'https://www.disneyplus.com',
    disneyplus: 'https://www.disneyplus.com', whatsapp: 'https://web.whatsapp.com',
    linkedin: 'https://www.linkedin.com', pinterest: 'https://www.pinterest.fr'
  };

  const norm = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, ' ').replace(/[^a-z0-9. ]+/g, ' ').replace(/\s+/g, ' ').trim();

  // Langue choisie avec les boutons FRANÇAIS / ENGLISH (capri_langue.js la mémorise)
  function langueUI() {
    try { return localStorage.getItem('capriLangue') === 'en' ? 'en' : 'fr'; } catch (e) { return 'fr'; }
  }

  const nomAffiche = (p) => ({ spotify: 'Spotify', youtube: 'YouTube', deezer: 'Deezer' }[p] || p);

  // Chemin d'un fichier du dossier de Capri (à côté du HTML)
  function cheminFichier(f) {
    try { return require('url').fileURLToPath(new URL(f, location.href)); } catch (e) { return null; }
  }
  function existe(f) {
    try { const p = cheminFichier(f); return p ? require('fs').existsSync(p) : true; } catch (e) { return true; }
  }

  // Cherche l'identifiant de la première vidéo YouTube (pour la lancer directement)
  function premiereVideo(q) {
    return new Promise((res) => {
      const req = https.get({
        host: 'www.youtube.com', path: '/results?search_query=' + encodeURIComponent(q),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
          'Accept-Language': 'fr-FR,fr;q=0.9', 'Cookie': 'CONSENT=YES+1; SOCS=CAI'
        }
      }, (r) => {
        let corps = '';
        r.setEncoding('utf8');
        r.on('data', (d) => { corps += d; if (corps.length > 1500000) r.destroy(); });
        const fin = () => { const m = corps.match(/"videoId":"([\w-]{11})"/); res(m ? m[1] : null); };
        r.on('end', fin); r.on('close', fin);
      });
      req.setTimeout(4500, () => { req.destroy(); res(null); });
      req.on('error', () => res(null));
    });
  }

  const ouvrir = (url) => shell.openExternal(url);

  // ===== Le lecteur : UNE seule petite fenêtre (capri_lecteur.html, style cyberpunk) =====
  // Correctif "deux pages" :
  //  1. window.open utilise toujours le même nom de fenêtre : une 2e demande réutilise la fenêtre au lieu d'en ouvrir une autre.
  //  2. Le plan B (ouvrir le .mp4 dans le lecteur de l'ordinateur) ne se déclenche plus que si le lecteur
  //     cyberpunk n'a vraiment pas démarré (il envoie un signal de vie dans localStorage toutes les 0,5 s).
  //  3. Une même commande reçue deux fois en moins de 3 secondes n'est exécutée qu'une fois.
  let lecteur = null;
  let derniereLecture = { cle: '', t: 0 };
  const lecteurVivant = () => {
    try { return Date.now() - Number(localStorage.getItem('capriLecteurVivant') || 0) < 2000; } catch (e) { return false; }
  };
  async function lire(piste, en) {
    const maintenant = Date.now();
    if (derniereLecture.cle === piste.fichier && maintenant - derniereLecture.t < 3000) return;   // doublon
    derniereLecture = { cle: piste.fichier, t: maintenant };

    const url = 'capri_lecteur.html?f=' + encodeURIComponent(piste.fichier) +
      '&t=' + encodeURIComponent(piste.titre) + '&l=' + (en ? 'en' : 'fr') + '&n=' + maintenant;
    let w = null;
    try {
      if (lecteur && !lecteur.closed) { lecteur.location.href = url; w = lecteur; }   // lecteur déjà ouvert : on change juste de titre
      else w = window.open(url, 'capri_lecteur', 'width=760,height=560,autoHideMenuBar=true');
    } catch (e) { w = null; }
    if (w) { lecteur = w; try { w.focus(); } catch (e) {} return; }

    // Electron n'a pas rendu de référence : on laisse 2 secondes au lecteur cyberpunk pour dire qu'il est vivant
    for (let i = 0; i < 8; i++) {
      await new Promise((r) => setTimeout(r, 250));
      if (lecteurVivant()) return;
    }
    const p = cheminFichier(piste.fichier);     // vraiment rien : plan B
    if (p) shell.openPath(p);
  }
  function arreter() {
    let ferme = false;
    try { if (lecteur && !lecteur.closed) { lecteur.close(); ferme = true; } } catch (e) {}
    lecteur = null;
    if (!ferme && lecteurVivant()) {            // on n'a plus la référence, mais le lecteur tourne : on lui demande de se fermer
      try { localStorage.setItem('capriLecteurFermer', String(Date.now())); ferme = true; } catch (e) {}
    }
    return ferme;
  }

  // Joue / cherche une musique en ligne. Renvoie la phrase de Capri.
  async function musique(q, plateforme, en) {
    if (!q) {
      const p = plateforme === 'youtube' ? 'youtube' : 'spotify';
      ouvrir(SITES[p]);
      return en ? 'You got it, choom. Opening ' + nomAffiche(p) + '.' : "Ça roule, choom. J'ouvre " + nomAffiche(p) + '.';
    }
    if (plateforme === 'spotify') {
      ouvrir('https://open.spotify.com/search/' + encodeURIComponent(q));
      return en ? 'Preem. Searching "' + q + '" on Spotify: click the first result to play it.'
                : 'Preem. Je cherche « ' + q + ' » sur Spotify : clique sur le premier titre pour le lancer.';
    }
    if (plateforme === 'deezer') {
      ouvrir('https://www.deezer.com/search/' + encodeURIComponent(q));
      return en ? 'Searching "' + q + '" on Deezer, choom.' : 'Je cherche « ' + q + ' » sur Deezer, choom.';
    }
    const id = await premiereVideo(q);
    if (id) {
      ouvrir('https://www.youtube.com/watch?v=' + id);
      return en ? 'On it, choom. Playing "' + q + '" on YouTube.' : "C'est parti, choom. Je lance « " + q + ' » sur YouTube.';
    }
    ouvrir('https://www.youtube.com/results?search_query=' + encodeURIComponent(q));
    return en ? 'Here are the YouTube results for "' + q + '".' : 'Je te montre les résultats pour « ' + q + ' » sur YouTube.';
  }

  async function jouerPiste(piste, en) {
    if (!existe(piste.fichier)) {                // le fichier n'est pas dans le dossier : on se rabat sur YouTube
      const rep = await musique(piste.titre + ' Cyberpunk Edgerunners', PLATEFORME_MUSIQUE, en);
      return (en ? "I can't find the file in my folder, so: " : 'Je ne trouve pas le fichier dans mon dossier, alors : ') + rep;
    }
    lire(piste, en);                              // (sans attendre : la réponse de Capri part tout de suite)
    return en ? 'You got it, choom. Playing "' + piste.titre + '".' : 'Ça roule, choom. Je lance « ' + piste.titre + ' ».';
  }

  // Analyse la phrase. Renvoie la réponse de Capri, ou null si ce n'est pas une commande.
  async function traiter(brut) {
    // capri_langue.js ajoute une consigne "Reply in English" au message : on l'enlève avant d'analyser
    let t = norm(String(brut).replace(/\n*\[Reply in English only[^\]]*\]/i, ''));
    // Enlève "ok capri eh", "hey capri", etc. au début
    t = t.replace(/^((ok|okay|hey|salut|dis|yo|hi|hello)\s+)?capri\s*(eh|oh|ah|euh|hein)?\s*/, '').trim();
    // Enlève "peux-tu", "can you"... au début, et la politesse à la fin
    t = t.replace(/^(peux tu|tu peux|pourrais tu|tu pourrais|est ce que tu peux|can you|could you|would you|will you|please|s il te plait|stp)\s+/, '').trim();
    t = t.replace(/\s+(s il te plait|stp|please|merci|thanks|thank you)$/, '').trim();
    if (!t) return null;

    // Capri répond en anglais si le bouton ENGLISH est choisi, ou si la commande est dite en anglais
    const en = langueUI() === 'en' || /^(play|put on|listen to|start|open|launch|go to|take me to|search|look up|stop|pause|turn off|close|i want to|i d like to)\b/.test(t);

    // 0. Arrêter la musique du lecteur
    if (/^(arrete|coupe|stop|ferme|eteins|pause|turn off|close)\s+(la\s+|le\s+|the\s+)?(musique|son|lecteur|video|clip|chanson|music|song|player|track)$/.test(t)) {
      return arreter()
        ? (en ? 'Music off, choom.' : 'Musique coupée, choom.')
        : (en ? "Nothing is playing in my player, choom." : "Il n'y a rien en cours dans mon lecteur, choom.");
    }

    // "... sur spotify / youtube / deezer" à la fin  ("on spotify" en anglais)
    let plateforme = null;
    const mp = t.match(/\s(?:sur|dans|avec|via|on|in|with|using)\s+(spotify|youtube|you tube|deezer)$/);
    if (mp) { plateforme = mp[1].replace(' ', ''); t = t.slice(0, mp.index).trim(); }

    // 1. Une de tes musiques locales ("mets High Forever", "play In Love With Myself"...)
    const verbeLecture = /^(?:mets|met|mettre|joue|jouer|passe|ecoute|ecouter|balance|lance|lancer|demarre|ouvre|je veux (?:ecouter|entendre)|je voudrais (?:ecouter|entendre)|j aimerais (?:ecouter|entendre)|play|put on|listen to|start|open|launch|i want to (?:listen to|hear)|i d like to (?:listen to|hear))\s+(.+)$/;
    const ml = t.match(verbeLecture);
    if (ml && !plateforme) {
      const piste = PISTES.find((p) => p.cherche.test(ml[1]));
      if (piste) return jouerPiste(piste, en);
    }

    // 2. Musique en ligne
    const verbeMusique = /^(?:mets|met|mettre|joue|jouer|passe|ecoute|ecouter|balance|play|put on|listen to)\b/.test(t);
    const lanceMusique = /^(?:lance|lancer|start|launch)\s+(?:moi\s+)?(?:la\s+|le\s+|de la\s+|the\s+|some\s+)?(?:musique|chanson|titre|morceau|clip|music|song|track)\b/.test(t);
    if (verbeMusique || lanceMusique) {
      let reste = t.replace(/^(?:mets|met|mettre|joue|jouer|passe|ecoute|ecouter|balance|lance|lancer|play|put on|listen to|start|launch)\s*/, '');
      reste = reste.replace(/^(?:moi\s+)?(?:(?:de la|du|des|un|une|la|le|the|some|a)\s+)?(?:musique|chanson|titre|morceau|clip|son|music|song|track|video)(?:\s+(?:de|d|qui s appelle|intitule|by|called|named))?\s*/, '').trim();
      reste = reste.replace(/^moi\s+/, '').trim();
      if (/^(de la musique|musique|la musique|music|some music|the music)$/.test(reste)) reste = '';
      return musique(reste, plateforme || PLATEFORME_MUSIQUE, en);
    }

    // 3. Ouvrir un site
    const mo = t.match(/^(ouvre|ouvrir|lance|demarre|affiche|va sur|vas sur|va a|aller sur|emmene moi sur|open|launch|go to|take me to)\s+(moi\s+)?((le site|le|la|l|les|un|une|the|my|a)\s+)?((?:application|appli|app|site web|site|website)\s+)?(.+)$/);
    if (mo) {
      const cible = mo[6].trim();
      const cle = cible.replace(/[\s.]+/g, '');
      if (SITES[cle]) {
        ouvrir(SITES[cle]);
        return en ? 'You got it, choom. Opening ' + cible + '.' : "Ça roule, choom. J'ouvre " + cible + '.';
      }
      if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/.test(cible)) {   // ressemble à une adresse (exemple.fr)
        ouvrir('https://' + cible);
        return en ? 'Opening ' + cible + ', choom.' : "J'ouvre " + cible + ', choom.';
      }
      ouvrir('https://www.google.com/search?q=' + encodeURIComponent(cible));
      return en ? "I don't know \"" + cible + '", so I\'m searching it on Google.'
                : 'Je ne connais pas « ' + cible + ' », alors je le cherche sur Google.';
    }

    // 4. Recherche Google
    const mr = t.match(/^(cherche|recherche|google|search for|search|look up)\s+(sur google\s+|on google\s+)?(.+)$/);
    if (mr) {
      ouvrir('https://www.google.com/search?q=' + encodeURIComponent(mr[3]));
      return en ? 'Searching "' + mr[3] + '" on Google, choom.' : 'Je cherche « ' + mr[3] + ' » sur Google, choom.';
    }
    return null;
  }

  // ===== Le petit bouton « ? » : la liste des COMMANDES SPÉCIFIQUES (français / anglais) =====
  // Il apparaît dans le panneau de discussion de la balade (à côté de la croix) et dans la fenêtre d'appel (à côté de ▶).
  // Pour changer un texte ou ajouter une commande : modifie la liste AIDE juste en dessous.
  const AIDE = {
    fr: {
      titre: 'COMMANDES SPÉCIFIQUES',
      bouton: 'Commandes spécifiques',
      blocs: [
        { t: 'MUSIQUE : TES TITRES', l: [
          ['« Mets High Forever »', 'ouvre le lecteur, la musique se lance'],
          ['« Joue I Really Want to Stay at Your House »', 'idem'],
          ['« Mets In Love With Myself »', 'idem'],
          ['« Arrête la musique »', 'ferme le lecteur']
        ] },
        { t: 'MUSIQUE EN LIGNE', l: [
          ['« Mets la musique + le nom »', 'lance la vidéo sur YouTube'],
          ['« Mets + le nom sur Spotify »', 'ouvre la recherche Spotify']
        ] },
        { t: 'OUVRIR UN SITE', l: [
          ['« Ouvre Spotify »', 'ton compte Spotify (aussi YouTube, Netflix, Gmail...)'],
          ['« Cherche + un sujet »', 'recherche sur Google']
        ] }
      ],
      note: 'Dis « OK Capri » puis la commande, ou écris-la. Exemple : « peux-tu jouer cette musique » + le titre : une page s\'ouvre et la musique se lance.'
    },
    en: {
      titre: 'SPECIFIC COMMANDS',
      bouton: 'Specific commands',
      blocs: [
        { t: 'MUSIC: YOUR TRACKS', l: [
          ['"Play High Forever"', 'opens the player, the music starts'],
          ['"Play I Really Want to Stay at Your House"', 'same'],
          ['"Play In Love With Myself"', 'same'],
          ['"Stop the music"', 'closes the player']
        ] },
        { t: 'ONLINE MUSIC', l: [
          ['"Play music + the name"', 'plays the video on YouTube'],
          ['"Play + the name on Spotify"', 'opens the Spotify search']
        ] },
        { t: 'OPEN A WEBSITE', l: [
          ['"Open Spotify"', 'your Spotify account (also YouTube, Netflix, Gmail...)'],
          ['"Search + a topic"', 'search on Google']
        ] }
      ],
      note: 'Say "OK Capri" then the command, or type it. Example: "can you play this music" + the title: a page opens and the music starts.'
    }
  };

  const css = document.createElement('style');
  css.textContent =
    '.cmdBtn{flex-shrink:0;height:28px;width:28px;padding:0;background:#000;color:var(--vert);border:1px solid var(--vert);' +
    'cursor:pointer;font-family:inherit;font-size:15px;display:flex;align-items:center;justify-content:center;}' +
    '.cmdBtn:hover,.cmdBtn.actif{background:rgba(0,255,163,0.2);box-shadow:0 0 7px rgba(0,255,163,0.5);}' +
    '#cmdBtnCall{height:auto;width:30px;align-self:stretch;}' +
    '.cmdListe{display:none;margin-top:10px;padding:8px 10px;box-sizing:border-box;max-height:220px;overflow-y:auto;' +
    'border:1px solid rgba(0,255,163,0.35);background:rgba(0,255,163,0.05);font-size:11px;line-height:1.45;user-select:text;}' +
    '.cmdListe.ouvert{display:block;}' +
    '.cmdListe::-webkit-scrollbar{width:6px;}.cmdListe::-webkit-scrollbar-track{background:#000;}' +
    '.cmdListe::-webkit-scrollbar-thumb{background:var(--vert);}' +
    '.cmdListe .ct{color:var(--rouge);letter-spacing:2px;font-size:11px;margin-bottom:6px;text-shadow:0 0 6px rgba(255,46,99,0.6);}' +
    '.cmdListe .cb{color:var(--cyan);letter-spacing:2px;font-size:10px;margin:8px 0 3px;}' +
    '.cmdListe .cl{margin-bottom:3px;}' +
    '.cmdListe .c1{color:var(--vert);text-shadow:0 0 5px rgba(0,255,163,0.45);}' +
    '.cmdListe .c2{color:#9fb4ad;display:block;font-size:10px;}' +
    '.cmdListe .cn{margin-top:8px;color:#9fb4ad;font-size:10px;border-top:1px dashed rgba(0,255,163,0.3);padding-top:6px;}';
  document.head.appendChild(css);

  function div(cls, texte) {
    const d = document.createElement('div');
    d.className = cls;
    d.textContent = texte;
    return d;
  }
  function remplirListe(el) {
    const A = AIDE[langueUI()];
    el.textContent = '';
    el.appendChild(div('ct', '◼ ' + A.titre));
    A.blocs.forEach((b) => {
      el.appendChild(div('cb', b.t));
      b.l.forEach(([cmd, desc]) => {
        const ligne = div('cl', '');
        const a = document.createElement('span'); a.className = 'c1'; a.textContent = cmd;
        const d = document.createElement('span'); d.className = 'c2'; d.textContent = desc;
        ligne.appendChild(a); ligne.appendChild(d);
        el.appendChild(ligne);
      });
    });
    el.appendChild(div('cn', A.note));
  }

  const widgets = [];   // [bouton, liste]
  function creerBouton(id) {
    const b = document.createElement('button');
    b.id = id; b.type = 'button'; b.className = 'cmdBtn'; b.textContent = '?';
    const l = document.createElement('div');
    l.className = 'cmdListe';
    b.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      remplirListe(l);
      b.classList.toggle('actif', l.classList.toggle('ouvert'));
    });
    b.addEventListener('pointerdown', (e) => e.stopPropagation());
    widgets.push([b, l]);
    return [b, l];
  }
  function majTextes() {
    widgets.forEach(([b, l]) => {
      b.title = AIDE[langueUI()].bouton;
      if (l.classList.contains('ouvert')) remplirListe(l);
    });
  }

  // Panneau de discussion de la balade : le bouton à côté de la croix, la liste sous le texte d'aide
  const barre = document.getElementById('discBar');
  const aide = document.getElementById('discHint');
  if (barre && aide) {
    const [b, l] = creerBouton('cmdBtnDisc');
    barre.insertBefore(b, barre.firstChild);
    aide.parentNode.insertBefore(l, aide.nextSibling);
  }
  // Fenêtre d'appel : le bouton à côté de ▶, la liste au-dessus de la zone d'écriture
  const rangee = document.getElementById('inputrow');
  const envoyer = document.getElementById('send');
  if (rangee && envoyer) {
    const [b, l] = creerBouton('cmdBtnCall');
    rangee.insertBefore(b, envoyer);
    rangee.parentNode.insertBefore(l, rangee);
  }
  majTextes();
  // Quand on change de langue (boutons FRANÇAIS / ENGLISH), les textes suivent
  document.addEventListener('click', (e) => {
    if (e.target && e.target.closest && e.target.closest('#langSel')) setTimeout(majTextes, 80);
  }, true);

  // On se place devant l'envoi à l'IA : si c'est une commande, Capri la fait, sinon ça part vers Ollama comme avant
  const original = ipcRenderer.invoke.bind(ipcRenderer);
  ipcRenderer.invoke = async function (canal, ...args) {
    if (canal === 'ask' && Array.isArray(args[0])) {
      const h = args[0];
      const dernier = h[h.length - 1];
      if (dernier && dernier.role === 'user') {
        try {
          const rep = await traiter(dernier.content);
          if (rep) return rep;
        } catch (e) { console.warn('capri_ouvrir :', e); }
      }
    }
    return original(canal, ...args);
  };
})();
