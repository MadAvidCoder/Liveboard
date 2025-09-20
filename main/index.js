const { app, BrowserWindow, Tray, Menu, screen } = require('electron');
const path = require('path');

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
    resizable: false,
    fullscreenable: true,
    skipTaskbar: true,
    alwaysOnTop: false,
    focusable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadURL('http://localhost:3000'); // or your HTML file

  win.once('ready-to-show', () => {
    win.show();
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
      label: 'Show Wallpaper',
      click: () => {
        if (win) win.show();
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
  tray.setToolTip('My Wallpaper App');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (win) win.show();
  });
});

app.on('window-all-closed', () => {
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});