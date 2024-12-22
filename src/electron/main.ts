import { app, BrowserWindow, ipcMain, shell } from 'electron';
import electronSquirrelStartup from 'electron-squirrel-startup';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { Integration } from '../types/connections.js';
import { database } from './database.js';
import { env } from './env.electron.js';
import storeUtils from './store.js';

const __filename = fileURLToPath(import.meta.url);
const currentDir = dirname(__filename);
let mainWindow: BrowserWindow | null = null;

if (electronSquirrelStartup) {
  app.quit();
}

// Set up remote debugging before app is ready
const isDev = env.NODE_ENV === 'development';
if (isDev) {
  app.commandLine.appendSwitch('remote-debugging-port', '9222');
}

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('yerve', process.execPath, [join(currentDir, '..', process.argv[1])]);
  } else {
    app.setAsDefaultProtocolClient('yerve');
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // Use currentDir instead of __dirname
      preload: join(currentDir, 'preload.js')
    }
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  void mainWindow.loadURL(env.DASHBOARD_URI).catch(err => {
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

ipcMain.handle('database:getProjectsAndDatasets', async (_, connectionId) => {
  return await database.getProjectsAndDatasets(connectionId);
});

ipcMain.handle('database:getTablesForDataset', async (_, connectionId, datasetId, pageToken) => {
  return await database.getTablesForDataset(connectionId, datasetId, pageToken);
});

// Add handler for opening external URLs
ipcMain.on('open-external', (_event, url) => {
  console.log('open-external', url);
  void shell.openExternal(url);
});

// Add helper function to extract code from URL
function extractCodeFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('code');
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
}

// Unix machines - Linux, MacOS
app.on('open-url', (event, url) => {
  console.log('open-url', url);
  const code = extractCodeFromUrl(url);
  if (code) {
    mainWindow?.webContents.send('send-token', code);
  }
});

// Windows
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();

      // On Windows, the URL will be in commandLine array
      const url = commandLine[commandLine.length - 1];
      const code = extractCodeFromUrl(url);
      if (code) {
        mainWindow.webContents.send('send-token', code);
      }
    }
  });
}

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