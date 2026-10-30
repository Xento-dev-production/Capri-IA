// ===== capri_realiste.js (version 2) =====
// Clic droit : VERSION BASIQUE / RÉALISTE / PIXEL.
// En réaliste :
//  - elle ne marche jamais : des éclairs rouges filent en ligne droite, une petite explosion, et elle réapparaît
//  - à l'arrêt (et assise, et pour la tablette) : l'image 3 (perso_3_x3.png)
//  - quand on la tient : perso_6.png (elle pend par les cheveux)
//  - inactif longtemps : elle s'endort (personnage_rouge_9.png), puis, encore plus tard, plein écran
(function () {
  const fs = require('fs');
  const { fileURLToPath } = require('url');
  const { spawn } = require('child_process');
  const CLE_SAUVEGARDE = 'capri_version';

  // ---- Réglages (en millisecondes) : mets des petits chiffres pour tester ----
  const SOMMEIL_MS = 120000;       // inactif depuis 2 minutes : elle s'endort
  const PLEIN_ECRAN_MS = 360000;   // inactif depuis 6 minutes : images en plein écran
  const REVEIL_MS = 3000;          // dès que tu touches souris ou clavier : elle se réveille
  const CHANGE_PLEIN_MS = 9000;    // temps entre deux images en plein écran
  const ATTENTE_MIN = 2500;        // temps qu'elle reste immobile entre deux déplacements
  const ATTENTE_MAX = 6000;

  // ---- Images réduites (collées sur Capri) : [fichier, hauteur à l'écran en pixels] ----
  const IMAGES = {
    SIT2: ['perso_3_x3.png', 170],               // image 3 : à l'arrêt, elle regarde
    SIT:  ['personnage_rouge_2.png', 150],       // image 10 : assise en tailleur
    LIE2: ['personnage_rouge_9.png', 80],        // image 17 : elle dort
    ATTR: ['perso_6.png', 0],                    // quand on la tient
    JOY:   ['perso_4.png', 170],                 // image 4 : bras écartés, joie
    LIE1:  ['personnage_rouge_5_corrige.png', 110], // image 13 : allongée (sur les lignes)
    LIE3:  ['personnage_rouge_10.png', 100],        // image 18 : allongée
    LIE4:  ['personnage_rouge_11_corrige.png', 110], // image 19 : allongée
    LEAP:  ['personnage_rouge_6.png', 120],      // image 14 : prête à bondir
    CRAWL: ['personnage_rouge_7.png', 130],      // image 15 : prête à bondir
    Y_1:    ['perso_1.png', 0],                  // yeux (images 1, 5, 8, 16)
    Y_X:    ['perso_5.png', 0],
    Y_UP:   ['perso_8.png', 0],
    Y_NOIR: ['personnage_rouge_8.png', 0]
  };
  // ---- Quand elle s'assoit sur une fenêtre : image 3, image 10 ou image 17 ----
  const ASSISE_CHOIX = ['SIT'];
  let derniereAssise = '';
  // Assise sur le haut d'une fenêtre : ses jambes rentrent dans la fenêtre (la partie du bas est cachée).
  // Le chiffre = part de l'image cachée en bas (0.30 = 30 %). Plus grand = elle s'enfonce plus.
  const ENFONCE = { SIT2: 0.30, SIT: 0.32 };
  let cleCourante = '';
  // Allongée quand elle est sur une ligne d'une grande fenêtre (images 13, 18, 19)
  const LIGNE_COUCHEE = ['SIT'];
  // Quand elle réapparaît après les éclairs rouges : elle arrive prête à bondir (images 14 et 15)
  const ATTAQUE_CHOIX = ['SIT'];
  const ATTAQUE_MS = 750;
  // Joie (image 4) après une réinitialisation USB et au réveil
  const JOIE_MS = 4500;
  // Images dont un bord est coupé : on estompe le bord pour que ça ne se voie pas
  const MASQUE = { LIE1: 1, LIE3: 1, LIE4: 1 };
  // Les yeux en gros plan, à côté d'elle, selon son état
  const YEUX_ETAT = { ecrasee: 'Y_X', bug: 'Y_1', attrapee: 'Y_UP', tablette: 'Y_NOIR' };
  const YEUX_LARGEUR = 100;
  let forceK = '', forceFin = 0, joieFin = 0;
  // Fenêtre d'appel : portraits de Capri (image 12 par défaut, images 2, 11, 14, 15 quand elle répond)
  const PORTRAIT_IDLE = 'personnage_rouge_4.png';
  const PORTRAIT_REPONSE = ['perso_2.png', 'personnage_rouge_3.png', 'personnage_rouge_6.png', 'personnage_rouge_7.png'];
  // ---- Images plein écran (inactivité très longue) : toutes les autres ----
  const PLEIN = [
    'perso_1.png', 'perso_2.png', 'perso_4.png', 'perso_5.png', 'perso_6.png', 'perso_7.png', 'perso_8.png',
    'personnage_rouge_1.png', 'personnage_rouge_2.png', 'personnage_rouge_3.png', 'personnage_rouge_4.png',
    'personnage_rouge_5_corrige.png', 'personnage_rouge_6.png', 'personnage_rouge_7.png',
    'personnage_rouge_8.png', 'personnage_rouge_10.png', 'personnage_rouge_11_corrige.png'
  ];

  const sprite_ = document.getElementById('sprite');
  const walker_ = document.getElementById('walker');
  const cache = {};
  const pleinCache = {};
  let actif = false, promesse = null, dort = false, sommeilOk = false, pleinOn = false, dernierPlein = '';
  const orig = { src: '', h: '', w: '' };
  const mine = { h: null, w: null };

  // ---- Chargement d'une image : fond blanc retiré ; rogner = on coupe les bords vides ----
  async function charger(fichier, max, rogner) {
    const chemin = fileURLToPath(new URL(fichier, location.href));
    const buf = fs.readFileSync(chemin);
    const bmp = await createImageBitmap(new Blob([buf], { type: 'image/png' }));
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const W = Math.round(bmp.width * k), H = Math.round(bmp.height * k);
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d', { willReadFrequently: true });
    c.drawImage(bmp, 0, 0, W, H);
    const id = c.getImageData(0, 0, W, H), d = id.data;

    const blanc = (i) => d[i + 3] > 200 && d[i] > 240 && d[i + 1] > 240 && d[i + 2] > 240;
    const vu = new Uint8Array(W * H), pile = [];
    const pousser = (x, y) => {
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const p = y * W + x;
      if (vu[p] || !blanc(p * 4)) return;
      vu[p] = 1; pile.push(p);
    };
    for (let x = 0; x < W; x++) { pousser(x, 0); pousser(x, H - 1); }
    for (let y = 0; y < H; y++) { pousser(0, y); pousser(W - 1, y); }
    while (pile.length) {
      const p = pile.pop();
      d[p * 4 + 3] = 0;
      const x = p % W, y = (p - x) / W;
      pousser(x + 1, y); pousser(x - 1, y); pousser(x, y + 1); pousser(x, y - 1);
    }
    c.putImageData(id, 0, 0);

    let x0 = 0, y0 = 0, x1 = W - 1, y1 = H - 1;
    if (rogner) {
      x0 = W; y0 = H; x1 = -1; y1 = -1;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (d[(y * W + x) * 4 + 3] > 24) {
            if (x < x0) x0 = x; if (x > x1) x1 = x;
            if (y < y0) y0 = y; if (y > y1) y1 = y;
          }
        }
      }
      if (x1 < 0) { x0 = 0; y0 = 0; x1 = W - 1; y1 = H - 1; }
    }
    const ow = x1 - x0 + 1, oh = y1 - y0 + 1;
    const out = document.createElement('canvas');
    out.width = ow; out.height = oh;
    out.getContext('2d').drawImage(cv, x0, y0, ow, oh, 0, 0, ow, oh);
    const blob = await new Promise((r) => out.toBlob(r, 'image/png'));
    return { url: URL.createObjectURL(blob), ar: ow / oh };
  }

  function precharger() {
    if (!promesse) {
      promesse = Promise.all(Object.keys(IMAGES).map(async (k) => {
        try { cache[k] = await charger(IMAGES[k][0], 700, true); }
        catch (e) { console.warn('[Capri réaliste] image introuvable : ' + IMAGES[k][0]); }
      }));
    }
    return promesse;
  }
  async function imagePleine(f) {
    if (!pleinCache[f]) pleinCache[f] = charger(f, 1920, false);
    return pleinCache[f];
  }

  // ---- Quelle image réaliste pour quelle image d'origine ? ----
  function cle(base) {
    if (dort) return 'LIE2';
    if (base === 'capri_attrape.png') return 'ATTR';
    if (forceK && performance.now() < forceFin) return forceK;
    if (performance.now() < joieFin && /^capri7(_\d+)?\.png$/.test(base)) return 'JOY';
    if (base === 'capri8.png') {
      if (etat === 'reboot') return 'JOY';
      if (ligne) return LIGNE_COUCHEE[Math.floor(Math.random() * LIGNE_COUCHEE.length)];
                      // assise (sur un dossier, une fenêtre...) : elle choisit au hasard
      let c;
      do { c = ASSISE_CHOIX[Math.floor(Math.random() * ASSISE_CHOIX.length)]; } while (c === derniereAssise && ASSISE_CHOIX.length > 1);
      derniereAssise = c;
      return c;
    }
    if (/^capri\d+(_\d+)?\.png$/.test(base) || base.indexOf('capri_tab_') === 0) return 'SIT';
    return null;
  }

  function surSrc(s) {
    if (s.indexOf('blob:') !== 0) orig.src = s;
    if (sprite_.style.height !== mine.h || sprite_.style.width !== mine.w) {
      orig.h = sprite_.style.height; orig.w = sprite_.style.width;
    }
    const base = s.split('/').pop().split('?')[0];
    const k = cle(base);
    cleCourante = k || '';
    const im = k && cache[k];
    sprite_.style.translate = '';
    sprite_.style.webkitMaskImage = ''; sprite_.style.maskImage = '';
    if (!im) { mine.h = null; mine.w = null; return; }

    const H = k === 'ATTR' ? HAUTEUR_ATTRAPEE * ECHELLE : IMAGES[k][1];
    const Wd = H * im.ar;
    sprite_.src = im.url;
    sprite_.style.height = H + 'px';
    sprite_.style.width = Wd.toFixed(1) + 'px';
    mine.h = sprite_.style.height; mine.w = sprite_.style.width;
    if (MASQUE[k]) {
      const m = 'linear-gradient(to right, transparent 0%, #000 22%), linear-gradient(to top, transparent 0%, #000 18%)';
      sprite_.style.webkitMaskImage = m; sprite_.style.webkitMaskComposite = 'source-in';
      sprite_.style.maskImage = m; sprite_.style.maskComposite = 'intersect';
    }

    if (k === 'ATTR') {
      const wA = HAUTEUR_ATTRAPEE * ECHELLE * RATIO_ATTRAPEE;
      sprite_.style.translate = (PIVOT_X * wA - 0.5 * Wd).toFixed(1) + 'px 0px';
      walker_.style.transformOrigin = (PIVOT_X * wA).toFixed(1) + 'px ' + (PIVOT_Y * H).toFixed(1) + 'px';
    } else if (etat === 'tablette') {
      ax = tabCentreX - Wd / 2;
      majTransform(flipTablette);
    }
  }

  const obs = new MutationObserver(() => {
    if (!actif) return;
    const s = sprite_.getAttribute('src') || '';
    if (s.indexOf('blob:') === 0) return;
    surSrc(s);
  });
  obs.observe(sprite_, { attributes: true, attributeFilter: ['src'] });

  function restaurer() {
    sprite_.style.clipPath = '';
    sprite_.style.webkitMaskImage = ''; sprite_.style.maskImage = '';
    if (orig.src) sprite_.setAttribute('src', orig.src);
    sprite_.style.height = orig.h || '';
    sprite_.style.width = orig.w || '';
    sprite_.style.translate = '';
    mine.h = null; mine.w = null;
  }

  // ===== Déplacement : jamais de marche, des éclairs rouges en ligne droite, une explosion, et elle revient =====
  const mv = { t: 0, vol: false };
  const ROUGE = { couleur: '#ff2e63', halo: '#ff2e63', coeur: '#ffffff' };

  function deplacer(s) {
    const enLigne = etat === 'ligne' && ligne;
    const w = sprite_.offsetWidth, h = sprite_.offsetHeight;
    const minX = enLigne ? ligne.x1 : 0;
    const maxX = Math.max(minX, (enLigne ? ligne.x2 : window.innerWidth) - w);
    let cible = ax, essais = 0;
    while (Math.abs(cible - ax) < 120 && essais++ < 12) cible = alea(minX, maxX);
    if (Math.abs(cible - ax) < 120) { mv.t = performance.now() + 3000; return; }

    mv.vol = true;
    cancelAnimationFrame(raf);                 // on met la balade en pause pendant le trajet
    walker_.style.visibility = 'hidden';
    const yc = window.innerHeight - ay - h * 0.5;
    const x0 = ax + w / 2, x1 = cible + w / 2;
    const n = Math.max(4, Math.min(10, Math.round(Math.abs(x1 - x0) / 90)));

    particules(x0, yc, { couleurs: ['#ff2e63', '#ffffff'], n: 10, vmin: 80, vmax: 300, tailleMin: 2, tailleMax: 4,
      angleMin: -Math.PI, angleMax: Math.PI, duree: 340 });
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        if (s !== session) return;
        const a = x0 + (x1 - x0) * i / n, b = x0 + (x1 - x0) * (i + 1) / n;
        eclair(a, yc + alea(-16, 16), b, yc + alea(-16, 16), Object.assign({
          epaisseur: 2.6, duree: 260, descente: 60, rugosite: 0.55, pas: 5, branches: 0.04, echelleBr: 0.4
        }, ROUGE));
      }, i * 55);
    }

    setTimeout(() => {
      // Petite explosion d'éclairs à l'arrivée
      if (s === session) {
        for (let k = 0; k < 8; k++) {
          const ang = (Math.PI * 2 * k) / 8 + alea(-0.3, 0.3), len = alea(40, 110);
          eclair(x1, yc, x1 + Math.cos(ang) * len, yc + Math.sin(ang) * len, Object.assign({
            epaisseur: 2, duree: 300, descente: 40, rugosite: 0.5, pas: 4, branches: 0, echelleBr: 0
          }, ROUGE));
        }
        particules(x1, yc, { couleurs: ['#ff2e63', '#ffffff', '#fb116e'], n: 16, vmin: 100, vmax: 380,
          tailleMin: 2, tailleMax: 5, angleMin: -Math.PI, angleMax: Math.PI, duree: 420 });
      }
      setTimeout(() => {
        walker_.style.visibility = 'visible';
        mv.vol = false;
        mv.t = performance.now() + alea(ATTENTE_MIN, ATTENTE_MAX);
        // Si quelque chose a pris le relais pendant le trajet, on ne touche à rien
        if (s !== session || (etat !== 'marche' && etat !== 'ligne')) return;
        ax = cible;
        adir = x1 > x0 ? -1 : 1;                  // elle bondit dans le sens du trajet
        forceK = ATTAQUE_CHOIX[Math.floor(Math.random() * ATTAQUE_CHOIX.length)];
        forceFin = performance.now() + ATTAQUE_MS;
        surSrc(orig.src || 'capri7.png');
        ax = borner(cible, 0, Math.max(0, window.innerWidth - sprite_.offsetWidth));
        setTimeout(() => {
          forceK = '';
          if (actif && s === session && (etat === 'marche' || etat === 'ligne')) surSrc(orig.src || 'capri7.png');
        }, ATTAQUE_MS);
        majTransform(adir * SENS_MARCHE);
        walker_.animate([{ filter: 'brightness(3)' }, { filter: 'none' }], { duration: 260 });
        raf = requestAnimationFrame(boucle);
      }, 140);
    }, n * 55 + 200);
  }

  // Les yeux : un gros plan qui apparaît à côté d'elle (écrasée, bug, attrapée, tablette)
  const yeux = document.createElement('img');
  yeux.style.cssText = 'position:fixed;left:0;top:0;z-index:90;pointer-events:none;display:none;' +
    'filter:drop-shadow(0 0 6px #00ffa3);';
  document.body.appendChild(yeux);
  let yeuxCle = '';
  function majYeux() {
    const k = enAnim ? YEUX_ETAT[etat] : null;
    const im = k && cache[k];
    if (!im) { if (yeux.style.display !== 'none') yeux.style.display = 'none'; return; }
    if (yeuxCle !== k) {
      yeuxCle = k;
      yeux.src = im.url;
      yeux.style.width = YEUX_LARGEUR + 'px';
      yeux.style.height = (YEUX_LARGEUR / im.ar) + 'px';
    }
    const r = walker_.getBoundingClientRect();
    let x = r.left - YEUX_LARGEUR - 10;
    if (x < 6) x = r.right + 10;
    yeux.style.transform = 'translate(' + x.toFixed(0) + 'px,' + Math.max(6, r.top + 10).toFixed(0) + 'px)';
    yeux.style.display = 'block';
  }

  // Assise sur une fenêtre : elle s'enfonce de façon à ce que ses jambes soient dans la fenêtre
  function majAssise() {
    const f = ENFONCE[cleCourante];
    if (enAnim && etat === 'assise' && fenetre && f) {
      const h = sprite_.offsetHeight;
      const clip = 'inset(0 0 ' + (f * 100).toFixed(0) + '% 0)';
      if (sprite_.style.clipPath !== clip) sprite_.style.clipPath = clip;
      cibleAy = window.innerHeight - bordAssise(fenetre, h) - f * h;
    } else if (sprite_.style.clipPath) {
      sprite_.style.clipPath = '';
    }
  }

  let axFixe = null;
  function boucleMoi(now) {
    if (!actif) { return; }
    requestAnimationFrame(boucleMoi);
    // un petit coup de sécurité : si le sommeil a été interrompu par autre chose
    if (dort && sommeilOk && etat !== 'dort') { dort = false; sommeilOk = false; arreterZ(); masquerPlein(); }
    majYeux();
    majAssise();
    if (!enAnim || mv.vol) { axFixe = null; return; }
    if (etat === 'marche' || etat === 'ligne') {
      if (axFixe === null) { axFixe = ax; mv.t = now + alea(ATTENTE_MIN, ATTENTE_MAX); }
      ax = axFixe;                              // elle ne glisse jamais : elle reste sur place
      if (now > mv.t) { deplacer(session); axFixe = null; }
    } else {
      axFixe = null;
    }
  }

  // ===== Sommeil et plein écran =====
  let timerZ = null;
  function lancerZ() {
    arreterZ();
    timerZ = setInterval(() => {
      if (!dort || pleinOn) return;
      const r = walker_.getBoundingClientRect();
      const el = document.createElement('div');
      el.textContent = ['z', 'Z', 'Z'][Math.floor(Math.random() * 3)];
      const c = Math.random() < 0.5 ? '#27e6ff' : '#00ffa3';
      el.style.cssText = 'position:fixed;left:' + (r.left + r.width * 0.8).toFixed(0) + 'px;top:' + (r.top - 6).toFixed(0) +
        'px;z-index:90;pointer-events:none;font:bold ' + Math.floor(alea(14, 24)) + 'px Consolas,monospace;color:' + c +
        ';text-shadow:0 0 6px ' + c;
      document.body.appendChild(el);
      el.animate([
        { opacity: 0, transform: 'translate(0,0)' },
        { opacity: 1, transform: 'translate(8px,-24px)', offset: 0.3 },
        { opacity: 0, transform: 'translate(' + alea(10, 26).toFixed(0) + 'px,-70px)' }
      ], { duration: 2200, easing: 'ease-out' }).onfinish = () => el.remove();
    }, 1100);
  }
  function arreterZ() { clearInterval(timerZ); timerZ = null; }

  async function dormir() {
    if (dort) return;
    dort = true; sommeilOk = false;
    const s = ++session;                        // annule tout ce qu'elle était en train de faire
    cancelAnimationFrame(raf);
    frappes();
    await wait(200);
    if (!dort || s !== session) return;
    sprite_.getAnimations().forEach((a) => a.cancel());
    walker_.getAnimations().forEach((a) => a.cancel());
    sprite_.style.transform = '';
    walker_.style.visibility = 'visible';
    walker_.style.opacity = 1;
    walker_.style.transformOrigin = '';
    walker_.style.pointerEvents = '';
    cacherBulle();
    ligne = null; ipcRenderer.send('ligne-finie');
    fenetre = null; fermeeEnAttente = false; lignePerdue = false;
    etat = 'dort'; pose = 'dort'; sommeilOk = true;
    ay = 0; cibleAy = 0; rot = 0; phi = 0; omega = 0;
    surSrc(orig.src || 'capri7.png');
    ax = borner(ax, 0, Math.max(0, window.innerWidth - sprite_.offsetWidth));
    majTransform(1);
    lancerZ();
  }

  // Plein écran : l'image entière (sans couper les bords), pour dire qu'elle est là
  const plein = document.createElement('div');
  plein.style.cssText = 'position:fixed;inset:0;z-index:80;display:none;pointer-events:none;background:rgba(0,0,0,0.6);';
  const pleinImg = document.createElement('img');
  pleinImg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;-webkit-user-drag:none;';
  const pleinTxt = document.createElement('div');
  pleinTxt.textContent = '◼ CAPRI EST LÀ...';
  pleinTxt.style.cssText = 'position:absolute;left:0;right:0;bottom:18px;text-align:center;font:13px Consolas,monospace;' +
    'letter-spacing:6px;color:#00ffa3;text-shadow:0 0 8px #00ffa3;';
  plein.appendChild(pleinImg); plein.appendChild(pleinTxt);
  document.body.appendChild(plein);

  async function afficherPlein() {
    if (pleinOn) return;
    pleinOn = true;
    plein.style.display = 'block';
    plein.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600 });
    flashBlanc(300, 0.25, '#fb116e');
    glitchEcran(500);
    while (pleinOn) {
      let f;
      do { f = PLEIN[Math.floor(Math.random() * PLEIN.length)]; } while (f === dernierPlein && PLEIN.length > 1);
      dernierPlein = f;
      let im = null;
      try { im = await imagePleine(f); } catch (e) { delete pleinCache[f]; }
      if (!pleinOn) break;
      if (im) { pleinImg.src = im.url; glitchEcran(220); }
      await wait(CHANGE_PLEIN_MS);
    }
  }
  function masquerPlein() {
    pleinOn = false;
    plein.style.display = 'none';
  }

  function reveil() {
    if (!dort && !pleinOn) return;
    const etaitDort = dort;
    dort = false;
    arreterZ();
    masquerPlein();
    if (etaitDort && enAnim) { joieFin = performance.now() + JOIE_MS + 1500; retourAuSol(); }     // elle revient par un éclair, au sol
  }

  // ---- Détection d'inactivité (Windows) : un petit PowerShell donne le temps sans clavier ni souris ----
  const SCRIPT_IDLE = String.raw`
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class CapriIdle {
  [StructLayout(LayoutKind.Sequential)] struct LII { public uint cbSize; public uint dwTime; }
  [DllImport("user32.dll")] static extern bool GetLastInputInfo(ref LII p);
  public static long Ms() {
    LII l = new LII();
    l.cbSize = (uint)Marshal.SizeOf(typeof(LII));
    GetLastInputInfo(ref l);
    return (long)unchecked((uint)Environment.TickCount - l.dwTime);
  }
}
"@
while ($true) {
  [Console]::Out.WriteLine([CapriIdle]::Ms())
  [Console]::Out.Flush()
  Start-Sleep -Seconds 2
}
`;
  function surInactif(ms) {
    if (!actif || !enAnim) {                    // plus de balade : on remet tout à zéro
      if (dort || pleinOn) { dort = false; arreterZ(); masquerPlein(); walker_.style.visibility = 'visible'; }
      return;
    }
    if (ms < REVEIL_MS) { reveil(); return; }
    if (!dort && ms >= SOMMEIL_MS && !occupee()) dormir();
    if (dort && etat === 'dort' && !pleinOn && ms >= PLEIN_ECRAN_MS) afficherPlein();
  }
  try {
    const enc = Buffer.from(SCRIPT_IDLE, 'utf16le').toString('base64');
    const ps = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', enc],
      { windowsHide: true });
    let tampon = '';
    ps.stdout.setEncoding('utf8');
    ps.stdout.on('data', (chunk) => {
      tampon += chunk;
      let i;
      while ((i = tampon.indexOf('\n')) >= 0) {
        const v = parseInt(tampon.slice(0, i), 10);
        tampon = tampon.slice(i + 1);
        if (!isNaN(v)) surInactif(v);
      }
    });
    ps.on('error', () => {});
    window.addEventListener('beforeunload', () => { try { ps.kill(); } catch (e) {} });
  } catch (e) {}

  async function activer(on) {
    if (on) {
      await precharger();
      if (actif) return;
      actif = true;
      surSrc(sprite_.getAttribute('src') || '');
      requestAnimationFrame(boucleMoi);
      chargerPortraits().then(() => { if (actif) majPortrait(true); });
    } else {
      if (!actif) return;
      actif = false;
      if (dort || pleinOn) { dort = false; arreterZ(); masquerPlein(); }
      walker_.style.visibility = 'visible';
      restaurer();
      yeux.style.display = 'none';
      const pe = document.getElementById('portrait');
      if (pe) pe.style.setProperty('--img', "url('capri.jpg')");
    }
    majBoutons();
  }

  // ---- Fenêtre d'appel : portraits réalistes ----
  const portraitCache = {};
  let portraitPret = false, dernierPortrait = '';
  async function chargerPortraits() {
    if (portraitPret) return;
    try {
      for (const f of [PORTRAIT_IDLE].concat(PORTRAIT_REPONSE)) {
        if (!portraitCache[f]) portraitCache[f] = (await charger(f, 900, false)).url;
      }
      portraitPret = true;
    } catch (e) { console.warn('[Capri réaliste] portrait introuvable'); }
  }
  function majPortrait(repos) {
    const el = document.getElementById('portrait');
    if (!el || !actif || !portraitPret) return;
    let f = PORTRAIT_IDLE;
    if (!repos) {
      do { f = PORTRAIT_REPONSE[Math.floor(Math.random() * PORTRAIT_REPONSE.length)]; }
      while (f === dernierPortrait && PORTRAIT_REPONSE.length > 1);
    }
    dernierPortrait = f;
    el.style.setProperty('--img', "url('" + portraitCache[f] + "')");
  }
  const changerImageOrig = window.changerImage;
  window.changerImage = function () {
    if (actif && portraitPret) majPortrait(false);
    else if (typeof changerImageOrig === 'function') changerImageOrig.apply(this, arguments);
  };

  // ---- Le pixel : on refait les 5 clics sur le prénom, comme à la main ----
  function pixelClics() {
    const nom = document.querySelector('#capriBox .nom');
    if (!nom) return;
    for (let i = 0; i < 5; i++) nom.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }

  // ---- Les trois boutons du clic droit ----
  const menuIn = document.querySelector('#menu .in');
  const boutons = {};
  [['basique', 'VERSION BASIQUE'], ['realiste', 'VERSION RÉALISTE'], ['pixel', 'VERSION PIXEL']].forEach(([v, t]) => {
    const b = document.createElement('button');
    b.textContent = t;
    b.addEventListener('click', () => choisir(v));
    menuIn.appendChild(b);
    boutons[v] = { b, t };
  });
  function majBoutons() {
    boutons.basique.b.textContent = boutons.basique.t + (actif ? '' : '  ●');
    boutons.realiste.b.textContent = boutons.realiste.t + (actif ? '  ●' : '');
  }
  majBoutons();

  async function choisir(v) {
    fermerMenu();
    if (v === 'pixel') {
      if (enAnim) desanimer();
      await wait(350);
      pixelClics();
      return;
    }
    try { localStorage.setItem(CLE_SAUVEGARDE, v); } catch (e) {}
    if (enAnim) {
      frappes();
      await wait(200);
      await activer(v === 'realiste');
      walker_.animate([{ filter: 'brightness(3)' }, { filter: 'none' }], { duration: 300 });
    } else {
      await activer(v === 'realiste');
      animer();
    }
  }

  try { if (localStorage.getItem(CLE_SAUVEGARDE) === 'realiste') activer(true); } catch (e) {}
})();
