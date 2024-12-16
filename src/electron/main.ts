import { app, BrowserWindow } from 'electron';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { env } from './env.electron.js';

// Get the current file's directory path in ES module context
const __filename = fileURLToPath(import.meta.url);
const currentDir = dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // Use currentDir instead of __dirname
      preload: join(currentDir, 'preload.js')
    }
  });

  const isDev = env.NODE_ENV === 'development';
  const url = isDev ? 'http://localhost:3000' : env.DASHBOARD_URI;
  
  void win.loadURL(url).catch(err => {
    console.error('Failed to load URL:', err);
  });

  if (isDev) {
    console.log('isDev', isDev);
    win.webContents.openDevTools();
  } else {
    console.log('isNotDev', 'isDev', isDev);
  }
}

void app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});