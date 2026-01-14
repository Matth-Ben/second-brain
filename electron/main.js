import { app, BrowserWindow, Menu, ipcMain, systemPreferences, globalShortcut } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { autoUpdater } = require('electron-updater')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow
let quickEntryWindow = null

function openQuickEntryWindow(mode) {
    // Si la fenêtre existe déjà, la focus
    if (quickEntryWindow && !quickEntryWindow.isDestroyed()) {
        quickEntryWindow.focus()
        return
    }

    // Créer la nouvelle fenêtre
    const windowHeight = mode === 'task' ? 400 : 600 // Plus grand pour les notes
    quickEntryWindow = new BrowserWindow({
        width: 600,
        height: windowHeight,
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: true,
        backgroundColor: '#0a0a0a',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs'),
        }
    })

    // Construire l'URL selon le mode
    let url = `http://localhost:5173/#/quick-entry?mode=${mode}`

    if (mode === 'voice') {
        url += '&autoRecord=true'
    }

    console.log('Loading Quick Entry:', url)
    quickEntryWindow.loadURL(url)

    // Gérer les permissions pour la reconnaissance vocale
    quickEntryWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
        const allowedPermissions = ['media', 'microphone', 'audioCapture']
        if (allowedPermissions.includes(permission)) {
            callback(true) // Autoriser
        } else {
            callback(false)
        }
    })

    // Ouvrir DevTools pour déboguer (à retirer en production)
    if (process.env.NODE_ENV === 'development') {
        quickEntryWindow.webContents.openDevTools({ mode: 'detach' })
    }

    // Nettoyer la référence à la fermeture
    quickEntryWindow.on('closed', () => {
        quickEntryWindow = null
    })
}

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
            preload: path.join(__dirname, 'preload.cjs'),
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
        } else {
            // SIMULATION POUR LE MODE DEV
            console.log('Mode Dev : Simulation de mise à jour dans 5s...')
            setTimeout(() => {
                console.log('Simulating update check...')
                mainWindow?.webContents.send('update-checking')

                setTimeout(() => {
                    mainWindow?.webContents.send('update-available', { version: '9.9.9' })

                    // Simulate download
                    let progress = 0
                    const interval = setInterval(() => {
                        progress += 10
                        mainWindow?.webContents.send('download-progress', progress)
                        if (progress >= 100) {
                            clearInterval(interval)
                            mainWindow?.webContents.send('update-downloaded', { version: '9.9.9' })
                        }
                    }, 500)
                }, 2000)
            }, 5000)
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

autoUpdater.on('update-not-available', (info) => {
    console.log('No updates available')
    mainWindow?.webContents.send('update-not-available', info)
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
    mainWindow?.webContents.send('update-error', error.message)
})

// IPC handlers pour les contrôles de fenêtre
ipcMain.on('window-minimize', (event) => {
    console.log('Received window-minimize event')
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
        console.log('Minimizing window...')
        win.minimize()
    } else {
        console.error('Window not found!')
    }
})

ipcMain.on('window-maximize', (event) => {
    console.log('Received window-maximize event')
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
        if (win.isMaximized()) {
            console.log('Unmaximizing window...')
            win.unmaximize()
        } else {
            console.log('Maximizing window...')
            win.maximize()
        }
    } else {
        console.error('Window not found!')
    }
})

ipcMain.on('window-close', (event) => {
    console.log('Received window-close event')
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
        console.log('Closing window...')
        win.close()
    } else {
        console.error('Window not found!')
    }
})

// IPC handler pour installer la mise à jour
ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall()
})

// IPC handler pour vérifier les mises à jour manuellement
ipcMain.on('check-for-updates', () => {
    console.log('Manual update check requested')
    if (app.isPackaged) {
        autoUpdater.checkForUpdates()
    } else {
        console.log('Dev mode: skipping actual check')
        mainWindow?.webContents.send('update-error', 'Cannot check updates in dev mode')
    }
})

ipcMain.handle('get-app-version', () => {
    return app.getVersion()
})

app.whenReady().then(async () => {
    // Request microphone permission on macOS
    if (process.platform === 'darwin') {
        try {
            const microphoneStatus = systemPreferences.getMediaAccessStatus('microphone')
            console.log('Microphone access status:', microphoneStatus)

            if (microphoneStatus !== 'granted') {
                await systemPreferences.askForMediaAccess('microphone')
            }
        } catch (error) {
            console.error('Error requesting microphone access:', error)
        }
    }

    createWindow()

    // Enregistrer les raccourcis globaux pour Quick Capture
    globalShortcut.register('CommandOrControl+Shift+T', () => {
        console.log('Quick Capture: Task')
        openQuickEntryWindow('task')
    })

    globalShortcut.register('CommandOrControl+Shift+N', () => {
        console.log('Quick Capture: Note')
        openQuickEntryWindow('note')
    })




    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// Nettoyer les raccourcis globaux à la fermeture
app.on('will-quit', () => {
    globalShortcut.unregisterAll()
})
