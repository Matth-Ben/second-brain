const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    // Window controls
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),

    // Auto-update APIs
    onUpdateChecking: (callback) => {
        ipcRenderer.on('update-checking', callback)
        return () => ipcRenderer.removeListener('update-checking', callback)
    },
    onUpdateAvailable: (callback) => {
        const listener = (event, info) => callback(info)
        ipcRenderer.on('update-available', listener)
        return () => ipcRenderer.removeListener('update-available', listener)
    },
    onUpdateNotAvailable: (callback) => {
        const listener = (event, info) => callback(info)
        ipcRenderer.on('update-not-available', listener)
        return () => ipcRenderer.removeListener('update-not-available', listener)
    },
    onDownloadProgress: (callback) => {
        const listener = (event, percent) => callback(percent)
        ipcRenderer.on('download-progress', listener)
        return () => ipcRenderer.removeListener('download-progress', listener)
    },
    onUpdateDownloaded: (callback) => {
        const listener = (event, info) => callback(info)
        ipcRenderer.on('update-downloaded', listener)
        return () => ipcRenderer.removeListener('update-downloaded', listener)
    },
    onUpdateError: (callback) => {
        const listener = (event, error) => callback(error)
        ipcRenderer.on('update-error', listener)
        return () => ipcRenderer.removeListener('update-error', listener)
    },
    installUpdate: () => ipcRenderer.send('install-update'),
    checkForUpdates: () => ipcRenderer.send('check-for-updates'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
})

console.log('Preload script loaded successfully!')
console.log('electronAPI exposed:', !!window.electronAPI)

