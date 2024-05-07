// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

export const api = {
  // Invocations always return a promise, even if the main process handler is
  // synchronous.
  getRandomString: (length: number): Promise<number> => {
    return ipcRenderer.invoke("get-random-number", length);
  },
};

contextBridge.exposeInMainWorld("api", api);

export type API = typeof api;
