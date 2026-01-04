import { useState, useEffect } from 'react'
import { Download, RefreshCw } from 'lucide-react'

export default function UpdateNotification() {
    const [updateState, setUpdateState] = useState(null) // null | 'checking' | 'downloading' | 'ready'
    const [downloadProgress, setDownloadProgress] = useState(0)
    const [updateInfo, setUpdateInfo] = useState(null)

    useEffect(() => {
        if (!window.electronAPI) return

        // Écouter les événements de mise à jour
        window.electronAPI.onUpdateChecking(() => {
            setUpdateState('checking')
        })

        window.electronAPI.onUpdateAvailable((info) => {
            setUpdateState('downloading')
            setUpdateInfo(info)
        })

        window.electronAPI.onDownloadProgress((percent) => {
            setDownloadProgress(Math.round(percent))
        })

        window.electronAPI.onUpdateDownloaded((info) => {
            setUpdateState('ready')
            setUpdateInfo(info)
        })
    }, [])

    const handleInstall = () => {
        window.electronAPI.installUpdate()
    }

    if (!updateState) return null

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
            <div className="bg-dark-surface border border-dark-border rounded-lg shadow-2xl p-4 min-w-[320px] max-w-md">
                {updateState === 'checking' && (
                    <div className="flex items-center gap-3">
                        <RefreshCw size={20} className="text-blue-500 animate-spin" />
                        <p className="text-sm text-gray-300">Recherche de mises à jour...</p>
                    </div>
                )}

                {updateState === 'downloading' && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Download size={20} className="text-blue-500" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-white">Mise à jour disponible</p>
                                <p className="text-xs text-gray-400">Version {updateInfo?.version}</p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>Téléchargement...</span>
                                <span>{downloadProgress}%</span>
                            </div>
                            <div className="w-full bg-dark-hover rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-blue-600 h-full transition-all duration-300 ease-out"
                                    style={{ width: `${downloadProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {updateState === 'ready' && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                <RefreshCw size={20} className="text-green-500" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-white">Mise à jour prête !</p>
                                <p className="text-xs text-gray-400">Version {updateInfo?.version}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleInstall}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={16} />
                            Redémarrer pour installer
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
