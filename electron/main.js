import { app, BrowserWindow, Menu, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { autoUpdater } = require('electron-updater')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow

function createWindow() {
    // Cacher le menu par défaut
    Menu.setApplicationMenu(null)

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 600,
        backgroundColor: '#0a0a0a',
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        frame: false,
        titleBarStyle: 'hidden',
        title: 'Second Brain',
    })

    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
        mainWindow.loadURL('http://localhost:5173')
        mainWindow.webContents.openDevTools()
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    }

    // Vérifier les mises à jour après le chargement de la fenêtre
    mainWindow.webContents.on('did-finish-load', () => {
        if (app.isPackaged) {
            autoUpdater.checkForUpdates()
        }
    })
}

// Configuration de l'auto-updater
autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true

// Événements de l'auto-updater
autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...')
    mainWindow?.webContents.send('update-checking')
})

autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version)
    mainWindow?.webContents.send('update-available', info)
})

autoUpdater.on('update-not-available', () => {
    console.log('No updates available')
})

autoUpdater.on('download-progress', (progressObj) => {
    console.log(`Download progress: ${progressObj.percent}%`)
    mainWindow?.webContents.send('download-progress', progressObj.percent)
})

autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version)
    mainWindow?.webContents.send('update-downloaded', info)
})

autoUpdater.on('error', (error) => {
    console.error('Update error:', error)
})

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

// IPC handlers pour les contrôles de fenêtre
ipcMain.on('window-minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win.minimize()
})

ipcMain.on('window-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win.isMaximized()) {
        win.unmaximize()
    } else {
        win.maximize()
    }
})

ipcMain.on('window-close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win.close()
})

// IPC handler pour installer la mise à jour
ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
