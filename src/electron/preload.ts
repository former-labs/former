import type { Integration } from '@/types/connections';
import { type IpcRendererEvent, contextBridge, ipcRenderer } from 'electron';

// Define the type for the callback function
type IpcCallback = (...args: unknown[]) => void;

contextBridge.exposeInMainWorld(
  'electron',
  {
    database: {
      connect: (config: unknown) => 
        ipcRenderer.invoke('database:connect', config),
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
  }
); 