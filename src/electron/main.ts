import { app, BrowserWindow } from 'electron';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { env } from '../env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js')
    }
  });

  // In development, load from localhost
  // In production, load from Vercel deployment
  const isDev = env.NODE_ENV === 'development';
  const url = isDev ? 'http://localhost:3000' : env.DASHBOARD_URI;
  
  void win.loadURL(url).catch(err => {
    console.error('Failed to load URL:', err);
  });

  // Open DevTools in development
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