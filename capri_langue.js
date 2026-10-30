// capri_langue.js : sélecteur FRANÇAIS / ENGLISH sur l'écran d'appel (CALLING)
// À charger EN DERNIER dans le HTML (après capri_credit.js).
(function () {
  'use strict';

  // ===== 1. Dictionnaire : français -> anglais =====
  // Mots entiers uniquement (le texte doit être exactement celui-là)
  const EXACT = new Map([
    ['MOI', 'ME'],
    ['PUCE', 'CHIP'],
    ['SAC', 'BAG'],
    ['LIEN', 'BOND'],
    ['APPEL', 'CALL'],
    ['TOUT', 'ALL'],
    ['PUCES', 'CHIPS'],
    ['DOSSIERS', 'FOLDERS'],
    ['FAIT', 'DONE']
  ]);

  // Textes trouvés n'importe où dans une ligne (les plus longs sont testés en premier)
  const PAIRS = [
    // Boutons et menu
    ['RACCROCHER', 'HANG UP'], ['DÉSANIMER', 'STOP ANIMATION'], ['ANIMER', 'ANIMATE'], ['PARLER', 'TALK'],
    ['LIEN CAPRI', 'CAPRI LINK'], ['// MESSAGE POUR CAPRI', '// MESSAGE FOR CAPRI'],
    ['◼ MAINTIENS ET GLISSE LA TABLETTE VERS CAPRI  //  ENTRÉE = ENVOI DIRECT', '◼ HOLD AND DRAG THE TABLET TO CAPRI  //  ENTER = SEND NOW'],
    ["ÉCRIS D'ABORD UN MESSAGE...", 'WRITE A MESSAGE FIRST...'],
    ['CAPRI EST OCCUPÉE... RÉESSAIE DANS UN INSTANT', 'CAPRI IS BUSY... TRY AGAIN IN A MOMENT'],
    // Discussion
    ['Salut, choom. Ça faisait un moment.', "Hey, choom. It's been a while."],
    ["Je suis là. Qu'est-ce qu'on fait aujourd'hui ?", "I'm here. What are we doing today?"],
    ['Pas de signal, choom... Ollama est bien lancé ?', 'No signal, choom... is Ollama running?'],
    // Puce et ports USB
    ['INSÈRE LA PUCE', 'INSERT THE CHIP'],
    ['▲ INSÈRE-MOI DANS UN PORT USB', '▲ PLUG ME INTO A USB PORT'],
    ['● PORT DÉTECTÉ : LÂCHE !', '● PORT DETECTED: DROP IT!'],
    ['MAUVAIS SENS...', 'WRONG WAY...'], ['RÉESSAI...', 'RETRYING...'],
    ['PUCE CONNECTÉE', 'CHIP CONNECTED'], ['PUCE DÉTECTÉE', 'CHIP DETECTED'],
    ['CONNEXION', 'CONNECTING'],
    ['> SIGNATURE : VALIDE', '> SIGNATURE: VALID'],
    ['> LIEN NEURAL : ÉTABLI', '> NEURAL LINK: ESTABLISHED'],
    ['> CAPRI : RESTAURATION', '> CAPRI: RESTORING'],
    // Fenêtre RÉINITIALISATION
    ['RÉINITIALISATION TERMINÉE', 'REBOOT COMPLETE'], ['RÉINITIALISATION', 'REBOOT'], ['RÉINITIALISÉE', 'REBOOTED'],
    ['RESTAURATION DES DONNÉES', 'RESTORING DATA'], ['RÉÉCRITURE DU NOYAU', 'REWRITING KERNEL'],
    ['DERNIÈRES VÉRIFICATIONS', 'FINAL CHECKS'], ['ACCÈS ACCORDÉ', 'ACCESS GRANTED'],
    ['NOYAU', 'KERNEL'], ['MÉMOIRE : OK', 'MEMORY: OK'], ['MÉMOIRE', 'MEMORY'], ['PERSONNALITÉ', 'PERSONALITY'],
    ['DÉBIT', 'RATE'], ['MO/S', 'MB/S'], ['SECTEURS', 'SECTORS'], ['SECTEUR', 'SECTOR'],
    // Alerte
    ['ALERTE // TRACE NETWATCH EN COURS', 'ALERT // NETWATCH TRACE IN PROGRESS'],
    ['TRACE DÉTOURNÉE // ACCÈS TOTAL', 'TRACE REROUTED // FULL ACCESS'],
    // Fenêtre ACCÈS ROOT
    ['ACCÈS ROOT ACCORDÉ', 'ROOT ACCESS GRANTED'], ['ACCÈS ROOT', 'ROOT ACCESS'], ['NIVEAU MAX', 'MAX LEVEL'],
    ['ÉLÉVATION DES PRIVILÈGES...', 'ELEVATING PRIVILEGES...'], ['PRIVILÈGES MAXIMAUX', 'MAXIMUM PRIVILEGES'],
    ['CONTOURNEMENT PARE-FEU', 'FIREWALL BYPASS'], ['ESCALADE DE PRIVILÈGES', 'PRIVILEGE ESCALATION'],
    ['DÉCHIFFREMENT DES SECTEURS', 'SECTOR DECRYPTION'], ['MONTAGE /DEV/CAPRI0', 'MOUNTING /DEV/CAPRI0'],
    ['INJECTION DU NOYAU', 'KERNEL INJECTION'], ['SYNCHRO DES IMPLANTS', 'IMPLANT SYNC'],
    ['PURGE DES ERREURS', 'ERROR PURGE'], ['SIGNATURE NUMÉRIQUE', 'DIGITAL SIGNATURE'],
    ['EN ATTENTE', 'WAITING'], ['EN COURS', 'IN PROGRESS'], ['TERMINÉ', 'DONE'],
    // Fenêtre RÉSEAU
    ['RÉSEAU : RELAIS CONTOURNÉS', 'NETWORK: RELAYS BYPASSED'], ['RÉSEAU NETWATCH', 'NETWATCH NETWORK'],
    ['/ 5 RELAIS', '/ 5 RELAYS'], ['RELAIS TOKYO-3', 'RELAY TOKYO-3'], ['NOEUD ARASAKA-07', 'NODE ARASAKA-07'],
    ['PARE-FEU NETWATCH', 'NETWATCH FIREWALL'], ['PASSERELLE BLACKWALL', 'BLACKWALL GATEWAY'],
    ['CONTOURNÉ', 'BYPASSED'],
    // Fenêtre DÉCHIFFREMENT
    ['DÉCHIFFREMENT TERMINÉ', 'DECRYPTION COMPLETE'], ['DÉCHIFFREMENT', 'DECRYPTION'],
    // Fenêtre JOURNAL D'ERREURS
    ["JOURNAL D'ERREURS : TOUT EST RÉPARÉ", 'ERROR LOG: ALL FIXED'], ["JOURNAL D'ERREURS", 'ERROR LOG'],
    ['DÉTECTÉES', 'DETECTED'], ['RÉPARÉES', 'FIXED'], ['CRITIQUES', 'CRITICAL'],
    ['RÉPARÉ', 'FIXED'], ['CRITIQUE', 'CRITICAL'], ['ERREUR', 'ERROR'], ['AVERT.', 'WARN.'],
    ['SECTEUR 0x3F2A CORROMPU', 'SECTOR 0x3F2A CORRUPTED'],
    ['CHECKSUM INVALIDE : capri.cfg', 'INVALID CHECKSUM: capri.cfg'],
    ['IMPLANT #07 NE RÉPOND PAS', 'IMPLANT #07 NOT RESPONDING'],
    ['FUITE MÉMOIRE DÉTECTÉE', 'MEMORY LEAK DETECTED'],
    ['TIMEOUT DU NEURO-LINK', 'NEURO-LINK TIMEOUT'],
    ['SIGNATURE NON RECONNUE', 'UNRECOGNIZED SIGNATURE'],
    ['REGISTRE ENDOMMAGÉ', 'REGISTRY DAMAGED'],
    ["ROUTINE D'ÉQUILIBRE INSTABLE", 'BALANCE ROUTINE UNSTABLE'],
    ['NETWATCH : ALERTE INTRUSION', 'NETWATCH: INTRUSION ALERT'],
    ['FRAGMENT ORPHELIN 0x9B1C', 'ORPHAN FRAGMENT 0x9B1C'],
    ['PILE DE LA PERSONNALITÉ SATURÉE', 'PERSONALITY STACK OVERFLOW'],
    ['VERSION DU NOYAU INCOMPATIBLE', 'INCOMPATIBLE KERNEL VERSION'],
    // Terminal du hack
    ['> connexion au port USB... signature de la puce valide', '> connecting to USB port... chip signature valid'],
    ['> contournement du pare-feu NETWATCH', '> bypassing NETWATCH firewall'],
    ['> escalade de privilèges : accès ROOT obtenu', '> privilege escalation: ROOT access obtained'],
    ['> déchiffrement AES-256 des secteurs 0x00 à 0xFF', '> AES-256 decryption of sectors 0x00 to 0xFF'],
    ['> montage du volume /dev/capri0', '> mounting volume /dev/capri0'],
    ['> injection du noyau dans la mémoire vive', '> injecting kernel into RAM'],
    ['> restauration de la personnalité de Capri', "> restoring Capri's personality"],
    ['> réécriture du registre des implants', '> rewriting implant registry'],
    ["> vérification de l'intégrité des données", '> verifying data integrity'],
    ['> synchronisation des fichiers corrompus', '> syncing corrupted files'],
    ["> purge des fragments d'erreur", '> purging error fragments'],
    ["> chargement des routines d'animation", '> loading animation routines'],
    ["> calibrage des capteurs d'équilibre", '> calibrating balance sensors'],
    ['> test des réflexes... capri.exe prêt', '> reflex test... capri.exe ready'],
    // ----- Menu clic droit (capri_reel.js et capri_realiste.js) -----
    ['MODE RÉEL', 'REAL MODE'],
    ['VERSION BASIQUE', 'BASIC VERSION'], ['VERSION RÉALISTE', 'REALISTIC VERSION'], ['VERSION PIXEL', 'PIXEL VERSION'],
    ['◼ CAPRI EST LÀ...', '◼ CAPRI IS HERE...'],
    // ----- Inventaire et magasin : fenêtre -----
    ['INVENTAIRE', 'INVENTORY'], ['MARCHÉ NOIR', 'BLACK MARKET'], ['SUCCÈS', 'ACHIEVEMENTS'],
    ['ÉNERGIE', 'ENERGY'], ['HUMEUR', 'MOOD'],
    ['COMMUN', 'COMMON'], ['EPIQUE', 'EPIC'],
    ['OBJETS  ·  CLIC DROIT SUR UN OBJET = VENDRE (', 'ITEMS  ·  RIGHT-CLICK AN ITEM = SELL ('],
    ['// STOCKAGE VIDE : VA FAIRE UN TOUR AU MARCHÉ NOIR', '// STORAGE EMPTY: GO VISIT THE BLACK MARKET'],
    ['TRI :', 'SORT:'], ['CATALOGUE', 'CATALOG'], ['RARETÉ', 'RARITY'], ['PRIX', 'PRICE'], ['QUANTITÉ', 'QUANTITY'],
    ['RECHERCHER...  (MAJ + CLIC SUR ACHETER = x5)', 'SEARCH...  (SHIFT + CLICK ON BUY = x5)'],
    ['EN STOCK :', 'IN STOCK:'],
    ['ACHETER', 'BUY'], ['ACHETÉ x', 'BOUGHT x'], ['ACHETÉ', 'BOUGHT'],
    ['BIENTÔT', 'SOON'], ['TROP CHER', 'TOO EXPENSIVE'],
    ["// MARCHÉ NOIR FERMÉ POUR L'INSTANT", '// BLACK MARKET CLOSED FOR NOW'],
    ['▸ CLIC DROIT : VENDRE (+', '▸ RIGHT-CLICK: SELL (+'],
    ['▸ GLISSE-LE SUR CAPRI', '▸ DRAG IT ONTO CAPRI'],
    ["▸ CLIQUE POUR L'UTILISER", '▸ CLICK TO USE IT'],
    ['// UN DRONE EST DÉJÀ EN VOL', '// A DRONE IS ALREADY FLYING'],
    [' DÉJÀ ACTIF', ' ALREADY ACTIVE'],
    ['// TROP DE COMPAGNONS EN MÊME TEMPS', '// TOO MANY COMPANIONS AT ONCE'],
    // ----- Noms des objets -----
    ['PUCE MÉMOIRE', 'MEMORY CHIP'], ['PUCE DE COMBAT', 'COMBAT CHIP'], ['PUCE PERSONNALITÉ', 'PERSONALITY CHIP'],
    ['SHARD CORROMPU', 'CORRUPTED SHARD'], ['DOSSIER SOUVENIRS', 'MEMORIES FOLDER'],
    ['DOSSIER CORROMPU', 'CORRUPTED FOLDER'], ['DOSSIER ARASAKA', 'ARASAKA FOLDER'],
    ["CODE D'ACCÈS", 'ACCESS CODE'], ['CLÉ DE DÉCHIFFREMENT', 'DECRYPTION KEY'], ['MOT DE PASSE VOLÉ', 'STOLEN PASSWORD'],
    ['SCRIPT DE RÉPARATION', 'REPAIR SCRIPT'], ['SCRIPT DE BOOST', 'BOOST SCRIPT'], ['SCRIPT GLITCH', 'GLITCH SCRIPT'],
    ['SCRIPT COMPAGNON', 'COMPANION SCRIPT'], ["CELLULE D'ÉNERGIE", 'POWER CELL'], ['BATTERIE LOURDE', 'HEAVY BATTERY'],
    ['SURCHARGE', 'OVERLOAD'], ['HOLO-FLEURS', 'HOLO-FLOWERS'], ['LUNETTES HOLO', 'HOLO GLASSES'],
    ['COLIS MYSTÈRE', 'MYSTERY PARCEL'], ['MÉGA-PACK', 'MEGA PACK'],
    // ----- Textes flottants des objets -----
    ['SAUVEGARDÉ', 'SAVED'], ['SOUVENIR RESTAURÉ', 'MEMORY RESTORED'], ['UN BON JOUR', 'A GOOD DAY'],
    ['MIAM !', 'YUM!'], ['CORROMPU...', 'CORRUPTED...'], ['ACCÈS VOLÉ', 'STOLEN ACCESS'], ['ILLÉGAL', 'ILLEGAL'],
    ["T'ES PAS SEULE", "YOU'RE NOT ALONE"], ['JE SUIS LÀ', "I'M HERE"], ['ON EST DUO', "WE'RE A DUO"], ['CHOOM !', 'CHOOM!'],
    ['DÉCHIFFRÉ', 'DECRYPTED'],
    // ----- Annonces -----
    ['VENDU : ', 'SOLD: '], ['COLIS : ', 'PARCEL: '],
    ['BOOSTER ACTIF : x2 €$ PENDANT ', 'BOOSTER ACTIVE: x2 €$ FOR '],
    ['MÉMOIRE BASSE ! UN PASSAGE AU MARCHÉ NOIR ?', 'MEMORY LOW! TIME FOR A BLACK MARKET RUN?'],
    ['ÉNERGIE BASSE ! UN PASSAGE AU MARCHÉ NOIR ?', 'ENERGY LOW! TIME FOR A BLACK MARKET RUN?'],
    ['HUMEUR BASSE ! UN PASSAGE AU MARCHÉ NOIR ?', 'MOOD LOW! TIME FOR A BLACK MARKET RUN?'],
    ['LIEN BASSE ! UN PASSAGE AU MARCHÉ NOIR ?', 'BOND LOW! TIME FOR A BLACK MARKET RUN?'],
    ['BONUS QUOTIDIEN  JOUR ', 'DAILY BONUS  DAY '],
    ['// PROMOS -', '// SALE -'], ['PROMO -', 'SALE -'], ['  ·  FIN DANS ', '  ·  ENDS IN '],
    // ----- Succès et statistiques -----
    ['STATISTIQUES', 'STATISTICS'],
    ['ACHATS ', 'PURCHASES '], ['  ·  VENTES ', '  ·  SALES '], ['  ·  OBJETS UTILISÉS ', '  ·  ITEMS USED '],
    ['  ·  GAGNÉ ', '  ·  EARNED '], [' €$  ·  DÉPENSÉ ', ' €$  ·  SPENT '], [' PARTIES, BILAN ', ' GAMES, NET '],
    ['EXPORTER LA SAUVEGARDE', 'EXPORT SAVE'], ['IMPORTER (PRESSE-PAPIER)', 'IMPORT (CLIPBOARD)'],
    ['SAUVEGARDE COPIÉE DANS LE PRESSE-PAPIER', 'SAVE COPIED TO CLIPBOARD'], ['COPIE IMPOSSIBLE', 'COPY FAILED'],
    ['IMPORTÉ : RECHARGEMENT...', 'IMPORTED: RELOADING...'], ['SAUVEGARDE INVALIDE', 'INVALID SAVE'],
    ['PREMIER ACHAT', 'FIRST PURCHASE'], ['Achète un objet au marché noir.', 'Buy an item from the black market.'],
    ['CLIENT FIDÈLE', 'LOYAL CUSTOMER'], ['Achète 10 objets.', 'Buy 10 items.'],
    ['GROS CLIENT', 'BIG SPENDER'], ['Achète 50 objets.', 'Buy 50 items.'],
    ['RECYCLEUR', 'RECYCLER'], ['Vends 5 objets (clic droit dans le sac).', 'Sell 5 items (right-click in the bag).'],
    ['TOUCHE-À-TOUT', 'JACK OF ALL TRADES'], ['Utilise 10 objets.', 'Use 10 items.'],
    ['MAÎTRE DU STYLE', 'STYLE MASTER'], ['Glisse 5 objets sur Capri.', 'Drag 5 items onto Capri.'],
    ['CHASSEUR DE COLIS', 'PARCEL HUNTER'], ['Ouvre 5 colis mystère.', 'Open 5 mystery parcels.'],
    ['PREMIER MILLIER', 'FIRST THOUSAND'], ['Aie 1000 €$ en poche.', 'Have 1000 €$ in your pocket.'],
    ['COLLECTIONNEUR', 'COLLECTOR'], ['Découvre 12 objets différents.', 'Discover 12 different items.'],
    ['COMPLÉTISTE', 'COMPLETIONIST'], ['Découvre tous les objets du catalogue.', 'Discover every item in the catalog.'],
    ['FIDÈLE', 'DEVOTED'], ['Reviens 3 jours de suite (bonus quotidien).', 'Come back 3 days in a row (daily bonus).'],
    ['ACCRO', 'HOOKED'], ['Reviens 7 jours de suite.', 'Come back 7 days in a row.'],
    ['JOUEUR', 'GAMBLER'], ['Fais 10 parties au casino.', 'Play 10 casino games.'],
    ['Aligne trois têtes de mort au casino.', 'Line up three skulls at the casino.'],
    // ----- Casino -----
    ['MACHINE À SOUS  //  JEU FICTIF, EDDIES VIRTUELS', 'SLOT MACHINE  //  FICTIONAL GAME, VIRTUAL EDDIES'],
    ['LANCER  (-', 'SPIN  (-'],
    ['// 3 IDENTIQUES : x3 A x25  ·  PAIRE : x1 A x3  ·  ☠ ☠ ☠ = JACKPOT x25', '// 3 OF A KIND: x3 TO x25  ·  PAIR: x1 TO x3  ·  ☠ ☠ ☠ = JACKPOT x25'],
    ['GAGNÉ : +', 'WON: +'], ['REMBOURSÉ', 'REFUNDED'], ['PERDU : -', 'LOST: -'],
    // ----- Réponses de Capri quand on lui demande des eddies -----
    ['Code accepté, choom. Je te file ', "Code accepted, choom. I'm slipping you "],
    [' €$. Ne le dis à personne.', " €$. Don't tell anyone."],
    ['Mauvais code... Je ne te file rien, gonk.', 'Wrong code... You get nothing, gonk.'],
    [' €$ ? Donne-moi le code, choom.', ' €$? Give me the code, choom.'],
    // ----- Jauges d'humeur (capri_jauges.js, capri_jauges_anim.js) -----
    ['JOYEUSE', 'HAPPY'], ['PAS CONTENTE', 'UPSET'], ['ÉNERVÉE', 'ANNOYED'], ['ENNUI', 'BORED'],
    // ----- Batterie (capri_batterie.js) -----
    ['CHARGE EN COURS', 'CHARGING'], ['BATTERIE CRITIQUE', 'BATTERY CRITICAL'], ['BATTERIE FAIBLE', 'BATTERY LOW'],
    ['ALIMENTATION RÉTABLIE // ', 'POWER RESTORED // '], ['NIVEAU ', 'LEVEL '],
    [' // ALIMENTATION INSTABLE', ' // POWER UNSTABLE'],
    ['Batterie à ', 'Battery at '], [' %, choom... branche-moi vite !', ' %, choom... plug me in quick!'],
    ['Je sens mes implants faiblir... ', 'I can feel my implants fading... '], [' % seulement !', ' % only!'],
    ['Ton PC a soif, choom : ', 'Your PC is thirsty, choom: '], [' % de batterie.', ' % battery.'],
    [' % !! Je vais flatline, choom, branche le chargeur !', " % !! I'm gonna flatline, choom, plug in the charger!"],
    ['Alerte rouge : ', 'Red alert: '], [' % ! Sauve tes fichiers !', ' % ! Save your files!'],
    ['Plus que ', 'Only '], [" %... c'est la fin, gonk !", ' %... this is the end, gonk!'],
    ["Ouf, ça recharge... j'ai cru mourir.", "Phew, it's charging... I thought I was dead."],
    ['Preem ! Le courant revient, choom.', 'Preem! Power is back, choom.'],
    // ----- Crédit (capri_credit.js) -----
    ['À PROPOS', 'ABOUT'], ['// CAPRI · IA DE BUREAU', '// CAPRI · DESKTOP AI'], ['CRÉÉ PAR ', 'CREATED BY '],
    ['Un projet fait avec passion. Rejoins la communauté : partage tes idées, tes captures et tes objets préférés !',
      'A project made with passion. Join the community: share your ideas, your screenshots and your favorite items!'],
    ['REJOINDRE LE DISCORD', 'JOIN THE DISCORD'], ['COPIER LE LIEN', 'COPY THE LINK'], ['LIEN COPIÉ !', 'LINK COPIED!'],
    ['MERCI D AVOIR ESSAYÉ CAPRI', 'THANKS FOR TRYING CAPRI'],
    ['PROJET DE FAN, NON AFFILIÉ À CD PROJEKT RED.', 'FAN PROJECT, NOT AFFILIATED WITH CD PROJEKT RED.'],
    ['SERVEUR : ', 'SERVER: '],
    // ----- Veille (capri_dodo.js) -----
    ['VEILLE', 'STANDBY'], ['PAPOTER', 'CHAT'], ['DORMIR', 'SLEEP'],
    ['Hein ?! Je dormais pas, choom !', "Huh?! I wasn't sleeping, choom!"],
    ["Wow ! J'ai failli flatline !", 'Whoa! I almost flatlined!'],
    ['Quoi ?! Qui ?! Où ?!', 'What?! Who?! Where?!'],
    ['Je... je surveillais, hein !', 'I... I was keeping watch, okay!'],
    ["Tu m'as fait peur, gonk !", 'You scared me, gonk!'],
    // ----- Heure de la journée (capri_heure.js) -----
    ['Bonjour, choom ! Un café et on hack le monde.', 'Morning, choom! A coffee and we hack the world.'],
    ['Debout, gonk ! Le soleil est déjà en ligne.', "Up, gonk! The sun's already online."],
    ['Nouveau jour, nouveaux runs. Prêt, choom ?', 'New day, new runs. Ready, choom?'],
    ['Midi pile, choom. Va manger un truc, même un netrunner a un estomac.', 'High noon, choom. Go eat something, even a netrunner has a stomach.'],
    ['Ton carburant est à zéro. Mange, gonk !', 'Your fuel is at zero. Eat, gonk!'],
    ['Pause déj, choom. Les eddies, ça se mange pas.', "Lunch break, choom. You can't eat eddies."],
    ["À table, choom ! Pas de run avant d'avoir mangé.", "Dinner time, choom! No run before you've eaten."],
    ['19h ! À table, gonk, ou ton estomac va flatline.', '7 PM! Dinner, gonk, or your stomach will flatline.'],
    ['Ferme tes onglets et va manger, choom.', 'Close your tabs and go eat, choom.'],
    ['Minuit, choom... Même les solos vont dormir.', 'Midnight, choom... Even the solos go to sleep.'],
    ['Il se fait tard. Sauvegarde et va te coucher, gonk.', "It's getting late. Save and go to bed, gonk."],
    ['Minuit passé. Night City dort, toi aussi.', 'Past midnight. Night City sleeps, so should you.'],
    ['Il est 2h, choom. Va dormir, sérieusement.', "It's 2 AM, choom. Go to sleep, seriously."],
    ['Tu veux flatline de fatigue ? Dodo, gonk !', 'Want to flatline from exhaustion? Bedtime, gonk!'],
    ['Même mes implants bâillent... Va dormir.', 'Even my implants are yawning... Go to sleep.'],
    // ----- Mode mini (chibi.js) -----
    ['Compression terminée... mode mini activé ! Écris /chibi pour me remettre en grand.', 'Compression complete... mini mode on! Type /chibi to make me big again.'],
    ['Décompression ! Me revoilà en taille normale.', 'Decompression! Back to normal size.']
  ];

  // ----- Saisie vocale (capri_micro.js) -----
  // Dans le panneau de balade, capri_micro.js écrit ses messages en MAJUSCULES, et dans la fenêtre d'appel
  // en minuscules : on ajoute donc automatiquement les deux versions de chaque phrase.
  [
    ['◉ Initialisation du micro...', '◉ Starting the microphone...'],
    ["◉ Je t'écoute... réappuie sur le micro pour finir", '◉ Listening... press the mic again to finish'],
    ['◼ Transcription... (la 1re fois : téléchargement du modèle, patiente)', '◼ Transcribing... (first time: downloading the model, please wait)'],
    ["Je n'ai rien entendu, réessaie", "I didn't hear anything, try again"],
    ['Micro inaccessible (vérifie les réglages du micro de Windows)', 'Microphone unavailable (check your Windows microphone settings)'],
    ["Module de voix manquant : relance l'installeur du micro", 'Voice module missing: run the microphone installer again'],
    ['Erreur micro : ', 'Microphone error: '],
    ['Écris à Capri...', 'Write to Capri...']
  ].forEach(([fr, en]) => { PAIRS.push([fr, en], [fr.toUpperCase(), en.toUpperCase()]); });

  // ----- Discussion allégée et bouton FICHIER (capri_plus.js) -----
  PAIRS.push(
    ['ANALYSE', 'ANALYZING'],
    ['FICHIER TROP GROS (1 MO MAX)', 'FILE TOO BIG (1 MB MAX)'],
    ['IMPOSSIBLE DE LIRE CE FICHIER', 'CANNOT READ THIS FILE'],
    ['CE FICHIER N\u2019EST PAS DU TEXTE', 'THIS FILE IS NOT TEXT'],
    [' CHARGÉ', ' LOADED'],
    [' (DÉBUT SEULEMENT)', ' (BEGINNING ONLY)']
  );
  EXACT.set('FICHIER', 'FILE');   // le bouton FICHIER (mot entier seulement)

  // ----- Réveil vocal (capri_wake.js) -----
  PAIRS.push(
    ['◉ Dis « OK Capri » pour me parler', '◉ Say "OK Capri" to talk to me'],
    ["OK CAPRI · JE T'ÉCOUTE", 'OK CAPRI · LISTENING']
  );

  const SUB = new Map(PAIRS);
  const RE = new RegExp(
    Array.from(SUB.keys()).sort((a, b) => b.length - a.length)
      .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');

  // Traduit une ligne de texte (mots entiers, puis morceaux)
  function tr(s) {
    const t = s.trim();
    if (EXACT.has(t)) return s.replace(t, EXACT.get(t));
    return s.replace(RE, (m) => SUB.get(m));
  }
  // Traduit une phrase entière avant qu'elle soit tapée lettre par lettre
  function T(s) { return tr(s); }

  // ===== 2. Les phrases de Capri (bulles) =====
  const L = []; // [liste, copie française, version anglaise]
  function ajoutListe(liste, en) { if (liste) L.push([liste, liste.slice(), en]); }
  if (typeof PHRASES !== 'undefined') ajoutListe(PHRASES, [
    'Hey, you there, choom?', 'Choom, are you talking to me?', 'Wake up, samurai.', 'Night City never sleeps.',
    'Up for a run tonight, choom?', "Don't be a gonk, choom.", 'Preem desktop, choom.', 'Dreaming or working?',
    "I'm bored, choom...", 'More eddies, fewer bugs.'
  ]);
  if (typeof PHRASES_AIE !== 'undefined') ajoutListe(PHRASES_AIE, [
    'Yeah, you hurt me, choom!', 'Ow! That hurts, choom!', 'Ouch... my implants!', "Nope... that's not nova.",
    'I almost flatlined, gonk!', 'My chrome took a beating...', 'Ow, that stings, choom!',
    "Even a solo would've felt that!", 'My cyberware is wrecked...'
  ]);
  if (typeof PHRASES_ATTRAPEE !== 'undefined') ajoutListe(PHRASES_ATTRAPEE, [
    'Cut it out, choom!', 'Let go, gonk!', "Hey, I'm not a cyberdeck!", 'Easy, choom!',
    'This is incredible, Nova!', 'Preem! Again!', 'Harder, choom!', "Now that's nova!"
  ]);
  if (typeof PHRASES_REBOOT !== 'undefined') ajoutListe(PHRASES_REBOOT, ["It's fine, I'm here!"]);
  if (typeof SEQUENCES_BUG !== 'undefined') {
    const SEQ_EN = [
      ["Something's happening...", "Choom... I'm glitching...", "I... I'm disappearing?!"],
      ['Hey... something feels weird...', 'My implants are going nuts!', 'I feel... flatlined...'],
      ['Uh... is this normal?', 'My neurolink is crackling!', 'Choom, help me... !'],
      ["What's happening to me?!", "Everything's turning white...", "It's glitching, it's glitching, it's glitching!"],
      ['I feel kind of... glitchy...', 'My cyberware is overheating!', 'Reboot... I need a reboot!']
    ];
    SEQUENCES_BUG.forEach((serie, i) => ajoutListe(serie, SEQ_EN[i] || serie.slice()));
  }


  // ===== 2b. Le catalogue du magasin (noms et descriptions des objets) =====
  // Exposé par capri_inventaire.js : on change directement les textes (ça rend aussi la recherche utilisable en anglais)
  const CAT_EN = {
    puce_memoire: ['MEMORY CHIP', 'It downloads its memory as a percentage, then saves. Drag it onto Capri.'],
    puce_combat: ['COMBAT CHIP', 'Solo reflexes: she dashes and slashes the air. Drag it onto Capri.'],
    puce_perso: ['PERSONALITY CHIP', 'A pink halo, pixel hearts: the real Capri wakes up. Drag it onto Capri.'],
    shard: ['CORRUPTED SHARD', 'It makes her glitch everywhere. Drag it onto Capri.'],
    dossier_souv: ['MEMORIES FOLDER', 'Holo photos of Night City appear around her. Drag it onto Capri.'],
    dossier_corr: ['CORRUPTED FOLDER', 'It glitches everywhere and she nibbles on it. Drag it onto Capri.'],
    dossier_arasaka: ['ARASAKA FOLDER', 'A top-secret folder floats over her and drops files. Drag it onto Capri.'],
    code_acces: ['ACCESS CODE', 'A keypad types in its code, then ACCESS GRANTED. Drag it onto Capri.'],
    cle_dechiff: ['DECRYPTION KEY', 'It orbits Capri and decrypts everything in its path. Drag it onto Capri.'],
    mdp_vole: ['STOLEN PASSWORD', 'A rain of eddies flies around her, STOLEN ACCESS everywhere. Drag it onto Capri.'],
    script_repar: ['REPAIR SCRIPT', 'A wrench and a gear weld her little bugs, sparks flying. Drag it onto Capri.'],
    script_boost: ['BOOST SCRIPT', 'Speed lines, turbo flashes and yellow lightning. Drag it onto Capri.'],
    script_glitch: ['GLITCH SCRIPT', 'Capri splits into red and cyan, the screen goes haywire. Drag it onto Capri.'],
    script_compa: ['COMPANION SCRIPT', 'A buddy bubble follows her, sending hearts and sweet words. Drag it onto Capri.'],
    cellule: ['POWER CELL', 'It floats near Capri and recharges her with green current. Drag it onto Capri.'],
    batterie_lourde: ['HEAVY BATTERY', 'A big blue block that spits arcs and strikes the ground. Drag it onto Capri.'],
    surcharge: ['OVERLOAD', 'She crackles with electricity, then discharges. Drag it onto Capri.'],
    holofleurs: ['HOLO-FLOWERS', 'A bouquet floats over her and flowers grow in her wake. Drag it onto Capri.'],
    drone: ['MINI-DRONE', 'A little buddy that flies around. Drag it onto Capri.'],
    colis: ['MYSTERY PARCEL', 'Click to open: a random item, or eddies.'],
    booster: ['BOOSTER €$', 'x2 eddies per message for 5 minutes. Click to activate.'],
    megapack: ['MEGA PACK', 'Fills a bit of everything: memory, energy, mood and bond.'],
    lunettes: ['HOLO GLASSES', 'She wears them on her nose, with built-in HUD. Drag them onto Capri.']
  };
  const CAT_FR = ((window.CapriEddies && window.CapriEddies.catalogue) || [])
    .map((o) => ({ o, nom: o.nom, desc: o.desc }));

  // ===== 3. Textes dans les attributs (placeholder, title) =====
  const ATTRS = [
    ['msg', 'placeholder', 'Écris à Capri...', 'Write to Capri...'],
    ['discInput', 'placeholder', 'Écris à Capri...', 'Write to Capri...'],
    ['discFermer', 'title', 'Fermer', 'Close'],
    ['ivFermer', 'title', 'Fermer', 'Close'],
    ['crX', 'title', 'Fermer', 'Close'],
    ['discCompress', 'title', 'Maintiens et glisse vers Capri', 'Hold and drag toward Capri'],
    ['dockHandle', 'title', 'Ouvrir / fermer le dock', 'Open / close the dock'],
    ['microCall', 'title', 'Saisie vocale', 'Voice input'],
    ['discMicro', 'title', 'Saisie vocale', 'Voice input'],
    ['discFichier', 'title', 'Ajouter un fichier texte au message', 'Add a text file to the message'],
    ['orb', 'title', 'Clique pour appeler, ou dis « OK Capri »', 'Click to call, or say "OK Capri"']
  ];

  // ===== 4. Traduction automatique de l'écran =====
  let lang = 'fr';
  const ORIG = new WeakMap(); // noeud de texte -> { fr, en } pour pouvoir revenir au français

  function traduireNoeud(n) {
    if (lang !== 'en') return;
    const v = n.nodeValue;
    if (!v || !/[A-Za-zÀ-ÿ]/.test(v)) return;
    const nv = tr(v);
    if (nv !== v) { ORIG.set(n, { fr: v, en: nv }); n.nodeValue = nv; }
  }
  // Traduit aussi les textes cachés dans les attributs (barre de recherche, info-bulles)
  function attributs(el) {
    ['placeholder', 'title'].forEach((a) => {
      const v = el.getAttribute(a);
      if (!v) return;
      const nv = tr(v);
      if (nv !== v) el.setAttribute(a, nv);
    });
  }
  function parcourir(noeud) {
    if (noeud.nodeType === 3) { traduireNoeud(noeud); return; }
    if (noeud.nodeType !== 1 || noeud.tagName === 'SCRIPT' || noeud.tagName === 'STYLE') return;
    attributs(noeud);
    noeud.querySelectorAll('[placeholder],[title]').forEach(attributs);
    const w = document.createTreeWalker(noeud, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      if (n.parentNode && (n.parentNode.tagName === 'SCRIPT' || n.parentNode.tagName === 'STYLE')) continue;
      traduireNoeud(n);
    }
  }
  function restaurer() {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      const o = ORIG.get(n);
      if (o && n.nodeValue === o.en) n.nodeValue = o.fr;
    }
  }
  // Surveille les textes que Capri écrit ensuite (le hack, les ports, les bulles...)
  const observateur = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'characterData') traduireNoeud(m.target);
      else if (m.type === 'attributes') attributs(m.target);
      else m.addedNodes.forEach(parcourir);
    }
  });

  // ===== 5. Changer de langue =====
  function appliquerLangue(l) {
    lang = l;
    try { localStorage.setItem('capriLangue', l); } catch (e) {}
    document.documentElement.lang = l;
    sel.querySelectorAll('button').forEach((b) => b.classList.toggle('actif', b.dataset.l === l));
    L.forEach(([liste, fr, en]) => liste.splice(0, liste.length, ...(l === 'en' ? en : fr)));
    CAT_FR.forEach(({ o, nom, desc }) => {
      const e = CAT_EN[o.id];
      o.nom = (l === 'en' && e) ? e[0] : nom;
      o.desc = (l === 'en' && e) ? e[1] : desc;
    });
    ATTRS.forEach(([id, attr, fr, en]) => {
      const el = document.getElementById(id);
      if (el) el.setAttribute(attr, l === 'en' ? en : fr);
    });
    observateur.disconnect();
    if (l === 'en') {
      parcourir(document.body);
      observateur.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder'] });
    } else {
      restaurer();
    }
  }

  // ===== 6. Le sélecteur (au-dessus de l'orbe CALLING) =====
  const css = document.createElement('style');
  css.textContent =
    '#langSel{position:fixed;top:6px;left:50%;transform:translateX(-50%);z-index:80;display:flex;gap:6px;}' +
    '#langSel button{background:#000;color:var(--cyan);border:1px solid var(--cadre);padding:3px 8px;' +
    'font-family:inherit;font-size:9px;letter-spacing:2px;cursor:pointer;opacity:0.6;}' +
    '#langSel button:hover{opacity:1;}' +
    '#langSel button.actif{opacity:1;color:var(--vert);border-color:var(--vert);box-shadow:0 0 8px var(--vert);}';
  document.head.appendChild(css);

  const sel = document.createElement('div');
  sel.id = 'langSel';
  sel.innerHTML = '<button data-l="fr">FRANÇAIS</button><button data-l="en">ENGLISH</button>';
  orb.appendChild(sel);
  // Le sélecteur ne doit ni déplacer la fenêtre ni ouvrir l'appel
  sel.addEventListener('pointerdown', (e) => e.stopPropagation());
  sel.addEventListener('click', (e) => {
    e.stopPropagation();
    const b = e.target.closest('button');
    if (b) appliquerLangue(b.dataset.l);
  });

  // ===== 7. Capri doit aussi répondre en anglais, et taper ses phrases en anglais =====
  const invokeOrig = ipcRenderer.invoke.bind(ipcRenderer);
  ipcRenderer.invoke = function (canal, ...args) {
    if (canal === 'ask' && lang === 'en' && Array.isArray(args[0]) && args[0].length) {
      const h = args[0].map((m) => Object.assign({}, m));
      const dernier = h[h.length - 1];
      if (dernier.role === 'user') dernier.content += '\n\n[Reply in English only, staying in character as Capri.]';
      args[0] = h;
    }
    return invokeOrig(canal, ...args);
  };
  if (typeof typeInto === 'function') {
    const typeOrig = typeInto;
    typeInto = function (el, text, speed) { return typeOrig(el, lang === 'en' ? T(text) : text, speed); };
  }
  // Les petites phrases passées en liste (batterie, heure, sursaut du dodo...) sont traduites avant d'être tapées
  if (typeof direPhrase === 'function') {
    const phraseOrig = direPhrase;
    direPhrase = function (liste, ...reste) {
      if (lang === 'en' && Array.isArray(liste)) {
        const trad = liste.map((x) => (typeof x === 'string' ? tr(x) : x));
        if (trad.some((x, i) => x !== liste[i])) liste = trad;
      }
      return phraseOrig(liste, ...reste);
    };
  }
  if (typeof direTexte === 'function') {
    const direOrig = direTexte;
    direTexte = function (texte, ...reste) { return direOrig(lang === 'en' ? T(texte) : texte, ...reste); };
  }

  // Langue mémorisée au dernier lancement
  let sauvee = 'fr';
  try { sauvee = localStorage.getItem('capriLangue') || 'fr'; } catch (e) {}
  appliquerLangue(sauvee === 'en' ? 'en' : 'fr');
})();
