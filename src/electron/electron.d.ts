export interface IElectronAPI {
  send: (channel: string, data: unknown) => void;
  receive: (channel: string, func: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}

declare module 'dotenv' {
    export function config(options?: {
        path?: string;
        encoding?: string;
        debug?: boolean;
        override?: boolean;
    }): void;
} 