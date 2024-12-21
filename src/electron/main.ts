import { app, BrowserWindow, ipcMain } from 'electron';
import electronSquirrelStartup from 'electron-squirrel-startup';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { Integration } from '../types/connections.js';
import type { IElectronAPI } from '../types/electron.js';
import { database } from './database.js';
import { env } from './env.electron.js';
import storeUtils from './store.js';

const __filename = fileURLToPath(import.meta.url);
const currentDir = dirname(__filename);

if (electronSquirrelStartup) {
  app.quit();
}

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

  if (isDev) {
    win.webContents.openDevTools();
  }

  void win.loadURL(env.DASHBOARD_URI).catch(err => {
    console.error('Failed to load URL:', err);
  });
}

// Helper function to wrap IPC handlers and add _ to first parameter
const ipcHandler = <T extends unknown[], R>(
  channel: string,
  handler: (...args: T) => Promise<R>
) => {
  ipcMain.handle(channel, async (_, ...args: T) => {
    return await handler(...args);
  });
};

// Set up IPC handlers
ipcHandler('database:connect', (async (config: Integration) => {
  return await database.connect(config);
}) as IElectronAPI['database']['connect']);

ipcHandler('database:disconnect', (async (connectionId: string) => {
  await database.disconnect(connectionId);
}) as IElectronAPI['database']['disconnect']);

ipcHandler('database:execute', (async (connectionId: string, query: string) => {
  return await database.execute(connectionId, query);
}) as IElectronAPI['database']['execute']);

ipcHandler('store:getIntegrations', (async () => {
  return storeUtils.getIntegrations();
}) as IElectronAPI['store']['getIntegrations']);

ipcHandler('store:setIntegrations', (async (integrations: Integration[]) => {
  storeUtils.setIntegrations(integrations);
}) as IElectronAPI['store']['setIntegrations']);

ipcHandler('store:getActiveIntegrationId', (async () => {
  return storeUtils.getActiveIntegrationId();
}) as IElectronAPI['store']['getActiveIntegrationId']);

ipcHandler('store:setActiveIntegrationId', (async (id: string | null) => {
  storeUtils.setActiveIntegrationId(id);
}) as IElectronAPI['store']['setActiveIntegrationId']);

ipcHandler('database:getProjectsAndDatasets', (async (connectionId: string) => {
  return database.getProjectsAndDatasets(connectionId);
}) as IElectronAPI['database']['getProjectsAndDatasets']);

ipcHandler('database:getTablesForDataset', (async (connectionId: string, datasetId: string, pageToken?: string) => {
  return database.getTablesForDataset(connectionId, datasetId, pageToken);
}) as IElectronAPI['database']['getTablesForDataset']);

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