const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.invoke('window-minimize'),
  hide: () => ipcRenderer.invoke('window-hide'),
  close: () => ipcRenderer.invoke('window-close'),
  togglePin: (shouldPin) => ipcRenderer.invoke('window-toggle-pin', shouldPin),
  getPinned: () => ipcRenderer.invoke('window-get-pinned')
});
