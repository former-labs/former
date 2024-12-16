import { app, BrowserWindow } from 'electron';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

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
  const isDev = process.env.NODE_ENV === 'development';
  const url = isDev ? 'http://localhost:3000' : 'http://localhost:3000';
  
  void win.loadURL(url).catch(err => {
    console.error('Failed to load URL:', err);
  });

  // Open DevTools in development
  if (isDev) {
    win.webContents.openDevTools();
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