const { app, BrowserWindow,ipcMain, dialog  } = require('electron');
const path = require('path');

const Store = require("electron-store")
Store.initRenderer()

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false, 
    },
    autoHideMenuBar: true,
  });

  process.env.IS_DEV = isDev ? "true" : "false";

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, 'ui_dist', 'index.html'));
  }

}

ipcMain.handle("dialog:openModel", async () => {
  const result = await dialog.showOpenDialog({
      filters: [{ name: 'ONNX Models', extensions: ['onnx'] }],
      properties: ['openFile']
  });
  return result;
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
