import { app, BrowserWindow, ipcMain } from 'electron';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Integration } from '../types/connections.js';
import { database } from './database.js';
import { env } from './env.electron.js';
import storeUtils from './store.js';

// Get the current file's directory path in ES module context
const __filename = fileURLToPath(import.meta.url);
const currentDir = dirname(__filename);

// Set up remote debugging before app is ready
const isDev = env.NODE_ENV === 'development';
if (isDev) {
  app.commandLine.appendSwitch('remote-debugging-port', '9222');
}

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

  const url = isDev ? 'http://localhost:3000' : env.DASHBOARD_URI;
  
  if (isDev) {
    win.webContents.openDevTools();
  }

  void win.loadURL(url).catch(err => {
    console.error('Failed to load URL:', err);
  });
}

// Set up IPC handlers
ipcMain.handle('database:connect', async (_, config): Promise<{
  success: boolean;
  connectionId?: string;
  error?: string;
}> => {
  return await database.connect(config);
});

ipcMain.handle('database:disconnect', async (_, connectionId): Promise<void> => {
  await database.disconnect(connectionId);
});

ipcMain.handle('database:execute', async (_, connectionId, query): Promise<unknown[]> => {
  return await database.execute(connectionId, query);
});

ipcMain.handle('database:getMetadata', async (_, connectionId) => {
  return await database.getMetadata(connectionId);
});

// Add these IPC handlers before app.whenReady()
ipcMain.handle('store:getIntegrations', async (): Promise<Integration[]> => {
  return storeUtils.getIntegrations();
});

ipcMain.handle('store:setIntegrations', async (_, integrations): Promise<void> => {
  storeUtils.setIntegrations(integrations);
});

ipcMain.handle('store:getActiveIntegrationId', async (): Promise<string | null> => {
  return storeUtils.getActiveIntegrationId();
});

ipcMain.handle('store:setActiveIntegrationId', async (_, id): Promise<void> => {
  storeUtils.setActiveIntegrationId(id);
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