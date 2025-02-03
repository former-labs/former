import type { IntegrationCombined, LocalIntegrationData } from '@/types/connections';
import type { IElectronAPI } from '@/types/electron';
import { type IpcRendererEvent, contextBridge, ipcRenderer } from 'electron';

// Define the type for the callback function
type IpcCallback = (...args: unknown[]) => void;

contextBridge.exposeInMainWorld(
  'electron',
  {
    database: {
      connect: (integration: IntegrationCombined) => 
        ipcRenderer.invoke('database:connect', integration),
      disconnect: (connectionId: string) => 
        ipcRenderer.invoke('database:disconnect', connectionId),
      execute: (connectionId: string, query: string) => 
        ipcRenderer.invoke('database:execute', connectionId, query),
      cancelJob: (connectionId: string, jobId: string) => 
        ipcRenderer.invoke('database:cancelJob', connectionId, jobId),
      getJobResult: (connectionId: string, jobId: string) => 
        ipcRenderer.invoke('database:getJobResult', connectionId, jobId),
      getProjectsAndDatasets: (connectionId: string) => 
        ipcRenderer.invoke('database:getProjectsAndDatasets', connectionId),
      getTablesForDataset: (connectionId: string, datasetId: string, pageToken?: string) => 
        ipcRenderer.invoke('database:getTablesForDataset', connectionId, datasetId, pageToken),
    },
    send: (channel: string, data: unknown) => {
      const validChannels = ['toMain', 'open-external'];
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
    on: (channel: string, func: IpcCallback) => {
      const validChannels = ['send-token'];
      console.log('on', channel, func);
      if (validChannels.includes(channel)) {
        console.log('on', channel, func);
        ipcRenderer.on(channel, (_event: IpcRendererEvent, ...args) => func(...args));
      }
    },
    store: {
      getLocalIntegrations: () => ipcRenderer.invoke('store:getLocalIntegrations'),
      setLocalIntegrations: (integrations: LocalIntegrationData[]) => 
        ipcRenderer.invoke('store:setLocalIntegrations', integrations),
    },
  } as IElectronAPI
);
