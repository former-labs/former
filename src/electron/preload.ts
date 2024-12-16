import { type IpcRendererEvent, contextBridge, ipcRenderer } from 'electron';

// Define the type for the callback function
type IpcCallback = (...args: unknown[]) => void;

contextBridge.exposeInMainWorld(
  'electron',
  {
    send: (channel: string, data: unknown) => {
      // whitelist channels
      const validChannels = ['toMain'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel: string, func: IpcCallback) => {
      const validChannels = ['fromMain'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender` 
        ipcRenderer.on(channel, (_event: IpcRendererEvent, ...args) => func(...args));
      }
    }
  }
); 