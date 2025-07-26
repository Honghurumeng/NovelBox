const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  storage: {
    selectDirectory: () => ipcRenderer.invoke('storage:selectDirectory'),
    getCurrentPath: () => ipcRenderer.invoke('storage:getCurrentPath'),
    resetToDefault: () => ipcRenderer.invoke('storage:resetToDefault'),
    saveNovels: (novelsData) => ipcRenderer.invoke('storage:saveNovels', novelsData),
    loadNovels: () => ipcRenderer.invoke('storage:loadNovels')
  },
  ai: {
    fetchModels: (providerType, baseUrl, apiKey) => ipcRenderer.invoke('ai:fetchModels', providerType, baseUrl, apiKey)
  }
});