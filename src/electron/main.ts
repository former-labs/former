import { app, BrowserWindow, ipcMain, shell } from 'electron';
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
let mainWindow: BrowserWindow | null = null;

// Enhanced logging function
function log(...args: any[]) {
  const timestamp = new Date().toISOString();
  const message = `[FORMER ${timestamp}] ${args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : arg
  ).join(' ')}\n`;
  process.stdout.write(message);
}

// Add startup marker
process.stdout.write('\n\n=== FORMER APP STARTING ===\n\n');

log("🚀 Starting Former application");

// Set app name before any window creation or app startup logic
app.name = "Former";

if (electronSquirrelStartup) {
  app.quit();
}

// Set up remote debugging before app is ready
const isDev = env.NODE_ENV === 'development';
if (isDev) {
  app.commandLine.appendSwitch('remote-debugging-port', '9222');
}

// Clean up database connections when app is closing
app.on('before-quit', () => {
  void database.disconnectAll();
});

// Add logging for process arguments
log("📎 Process arguments:", process.argv);

void app.whenReady().then(() => {
  log("✅ Application ready");
  log("📍 Current directory:", currentDir);
  log("🔧 Development mode:", isDev);
  
  // Register protocol handler when app is ready
  const success = app.setAsDefaultProtocolClient('former');
  log('🔗 Protocol registration attempt');
  log('🔗 Protocol registration result:', success);
  log('🔗 Is default protocol client:', app.isDefaultProtocolClient('former'));
  
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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Former",
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

// Add handler for opening external URLs
ipcMain.on('open-external', (_event, url) => {
  log('🌐 Opening external URL:', url);
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
  event.preventDefault();
  console.log('Received open-url event:', { url, isMainWindowNull: mainWindow === null });
  const code = extractCodeFromUrl(url);
  console.log('Extracted code:', code);
  if (code && mainWindow) {
    console.log('Sending token to window');
    mainWindow.webContents.send('send-token', code);
  }
});

// Also handle the open-url event during launch
if (process.platform === 'darwin') {
  const openUrlOnLaunch = process.argv.find(arg => arg.startsWith('former://'));
  if (openUrlOnLaunch) {
    console.log('Found protocol URL in launch args:', openUrlOnLaunch);
    const code = extractCodeFromUrl(openUrlOnLaunch);
    if (code) {
      // Store the code to use after window is created
      app.on('ready', () => {
        if (mainWindow) {
          console.log('Sending stored token to window');
          mainWindow.webContents.send('send-token', code);
        }
      });
    }
  }
}

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
      const potentialUrl = commandLine[commandLine.length - 1];
      if (potentialUrl) {
        const code = extractCodeFromUrl(potentialUrl);
        if (code) {
          mainWindow.webContents.send('send-token', code);
        }
      }
    }
  });
}