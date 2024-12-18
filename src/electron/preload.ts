import type { Integration } from '@/types/connections';
import type { IElectronAPI } from '@/types/electron';
import { type IpcRendererEvent, contextBridge, ipcRenderer } from 'electron';
// import { env } from './env.electron';

// Define the type for the callback function
type IpcCallback = (...args: unknown[]) => void;

contextBridge.exposeInMainWorld(
  'electron',
  {
    // debug: {
    //   // A convenient debug object that we can access in the JS console
    //   // >>> window.electron.debug
    //   env: {
    //     NODE_ENV: env.NODE_ENV,
    //   },
    // },
    database: {
      connect: (integration: Integration) => 
        ipcRenderer.invoke('database:connect', integration),
      disconnect: (connectionId: string) => 
        ipcRenderer.invoke('database:disconnect', connectionId),
      execute: (connectionId: string, query: string) => 
        ipcRenderer.invoke('database:execute', connectionId, query),
      getMetadata: (connectionId: string) => 
        ipcRenderer.invoke('database:getMetadata', connectionId),
    },
    send: (channel: string, data: unknown) => {
      const validChannels = ['toMain'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel: string, func: IpcCallback) => {
      const validChannels = ['fromMain'];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (_event: IpcRendererEvent, ...args) => func(...args));
      }
    },
    store: {
      getIntegrations: () => ipcRenderer.invoke('store:getIntegrations'),
      setIntegrations: (integrations: Integration[]) => 
        ipcRenderer.invoke('store:setIntegrations', integrations),
      getActiveIntegrationId: () => 
        ipcRenderer.invoke('store:getActiveIntegrationId'),
      setActiveIntegrationId: (id: string | null) => 
        ipcRenderer.invoke('store:setActiveIntegrationId', id),
    },
  } as IElectronAPI
);
