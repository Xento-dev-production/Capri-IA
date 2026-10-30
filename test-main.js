const { app, BrowserWindow } = require('electron');

app.whenReady().then(() => {
  const win = new BrowserWindow({ width: 520, height: 660, autoHideMenuBar: true });
  win.loadFile('test-voix.html');
});

app.on('window-all-closed', () => app.quit());