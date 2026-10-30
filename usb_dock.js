// ===== Dock USB pour l'orbe et la fenêtre de discussion =====
// Une bande transparente en haut de l'écran : la poignée DOCK au milieu fait glisser les ports USB
// (comme pendant la balade). Remplace l'ancienne petite fenêtre des ports, toujours visible.
const { app, BrowserWindow, screen, ipcMain } = require('electron');

const HTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
:root{--vert:#00ffa3;--rouge:#ff2e63;--cadre:#ff4d5a;--cyan:#27e6ff}
html,body{margin:0;background:transparent;overflow:hidden;font-family:Consolas,"Courier New",monospace}
@keyframes alerte{50%{background:var(--rouge)}}
.ports{position:absolute;top:0;right:0;display:flex;gap:14px;transform:scale(1.25);transform-origin:top right;
  translate:0 -260%;transition:translate .6s cubic-bezier(.2,.9,.25,1.08)}
body.ouvert .ports{translate:0 0}
.port{--c:8px;position:relative;width:66px;height:24px;background:var(--cadre);padding:2px;box-sizing:border-box;
  clip-path:polygon(0 0,100% 0,100% calc(100% - var(--c)),calc(100% - var(--c)) 100%,0 100%);
  animation:alerte 1.6s steps(2,start) infinite}
.port-in{position:relative;height:100%;background:#000}
.port-in::after{content:"";position:absolute;left:8px;right:8px;top:50%;height:4px;margin-top:-2px;background:#3a4558}
#h{position:absolute;top:0;left:50%;width:132px;height:16px;margin-left:-66px;cursor:pointer;transition:height .18s}
#h:hover{height:24px}
.dh-c{height:100%;background:var(--cadre);padding:0 2px 2px;box-sizing:border-box;
  clip-path:polygon(0 0,100% 0,90% 100%,10% 100%);animation:alerte 1.6s steps(2,start) infinite}
.dh-in{height:100%;background:#000;display:flex;align-items:center;justify-content:center;gap:8px;
  clip-path:polygon(0 0,100% 0,89% 100%,11% 100%);font-size:8px;letter-spacing:3px;color:var(--cyan);
  text-shadow:0 0 6px rgba(39,230,255,.6)}
.dh-in svg{transition:transform .45s;flex-shrink:0}
#h:hover .dh-c,body.ouvert .dh-c{background:var(--vert);animation:none}
body.ouvert .dh-in svg{transform:rotate(180deg)}
</style></head><body>
<div class="ports"><div class="port"><div class="port-in"></div></div><div class="port"><div class="port-in"></div></div></div>
<div id="h"><div class="dh-c"><div class="dh-in">
<svg width="14" height="8" viewBox="0 0 14 8" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 1l6 6 6-6"/></svg>DOCK
</div></div></div>
<script>
const { ipcRenderer } = require('electron');
const h = document.getElementById('h');
h.addEventListener('mouseenter', () => ipcRenderer.send('usb-souris', true));
h.addEventListener('mouseleave', () => ipcRenderer.send('usb-souris', false));
h.addEventListener('click', () => document.body.classList.toggle('ouvert'));
</script></body></html>`;

// etat() renvoie { win, modeActuel, debutAnim } depuis main.js
module.exports = function (etat) {
  let usbWin = null;

  // La souris est sur la poignée : la bande capte les clics. Sinon, les clics la traversent.
  ipcMain.on('usb-souris', (e, capte) => {
    if (usbWin && !usbWin.isDestroyed()) usbWin.setIgnoreMouseEvents(!capte, { forward: true });
  });

  app.whenReady().then(() => {
    const wa = screen.getPrimaryDisplay().workArea;
    usbWin = new BrowserWindow({
      x: wa.x, y: wa.y, width: wa.width, height: 44,
      transparent: true, frame: false, alwaysOnTop: true, resizable: false,
      hasShadow: false, skipTaskbar: true, focusable: false, show: false,
      webPreferences: { nodeIntegration: true, contextIsolation: false }
    });
    usbWin.setIgnoreMouseEvents(true, { forward: true });
    usbWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(HTML));
    usbWin.once('ready-to-show', () => usbWin.showInactive());

    // Visible avec l'orbe et la fenêtre de discussion ; pendant la balade, c'est le dock de la page
    setInterval(() => {
      const { win, modeActuel, debutAnim } = etat();
      if (!usbWin || usbWin.isDestroyed() || !win || win.isDestroyed()) return;
      const enBalade = modeActuel === 'anim' && Date.now() - debutAnim > 400;
      const voulu = !enBalade && win.isVisible();
      if (voulu && !usbWin.isVisible()) usbWin.showInactive();
      else if (!voulu && usbWin.isVisible()) usbWin.hide();
    }, 120);
  });
};
