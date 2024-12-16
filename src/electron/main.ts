import { app, BrowserWindow, ipcMain } from 'electron';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { database } from './database.js';
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
  
  // Add remote debugging port for the renderer process
  if (isDev) {
    win.webContents.openDevTools();
    app.commandLine.appendSwitch('remote-debugging-port', '9222');
  }

  void win.loadURL(url).catch(err => {
    console.error('Failed to load URL:', err);
  });
}

// Set up IPC handlers
ipcMain.handle('database:connect', async (_, config) => {
  return await database.connect(config);
});

ipcMain.handle('database:disconnect', async (_, connectionId) => {
  return await database.disconnect(connectionId);
});

ipcMain.handle('database:execute', async (_, connectionId, query) => {
  return await database.execute(connectionId, query);
});

ipcMain.handle('database:getMetadata', async (_, connectionId) => {
  return await database.getMetadata(connectionId);
});

// Clean up database connections when app is closing
app.on('before-quit', () => {
  void database.disconnectAll();
});

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