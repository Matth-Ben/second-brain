import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),

    // Auto-update APIs
    onUpdateChecking: (callback) => ipcRenderer.on('update-checking', callback),
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (event, info) => callback(info)),
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, percent) => callback(percent)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (event, info) => callback(info)),
    installUpdate: () => ipcRenderer.send('install-update'),
})
