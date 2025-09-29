const { app, BrowserWindow, Tray, Menu, screen } = require('electron');
const path = require('path');
const AutoLaunch = require('auto-launch');

let tray = null;
let win = null;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    frame: false,
    transparent: false,
    kiosk: true,
    resizable: false,
    fullscreenable: true,
    skipTaskbar: true,
    alwaysOnBottom: true,
    alwaysOnTop: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  // DEV ONLY
  win.loadURL('http://localhost:3000');
  
  // PRODUCTION ONLY
  // win.loadFile(path.join(app.getAppPath(), 'build', 'index.html'));

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Window failed to load:', errorDescription);
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  win.on('minimize', (event) => {
    event.preventDefault();
    win.restore();
  });

  win.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      win.hide();
    }
    return false;
  });
}

app.whenReady().then(() => {
  createWindow();

  tray = new Tray(path.join(__dirname, '../tray_icon.png'));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Liveboard',
      click: () => {
        if (win) win.show();
      }
    },
    {
      label: 'Show Desktop Background',
      click: () => {
        if (win) win.hide();
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Liveboard');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (win) win.show();
  });

  tray.on('click', () => {
    if (tray) tray.popUpContextMenu();
  });
});

const liveboardAutoLauncher = new AutoLaunch({
  name: 'Liveboard',
  path: process.execPath,
});

liveboardAutoLauncher.isEnabled()
  .then((isEnabled) => {
    if (!isEnabled) {
      liveboardAutoLauncher.enable();
    }
  })
  .catch((err) => {
    console.error('Auto-launch error:', err);
  });

app.on('window-all-closed', () => {
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});