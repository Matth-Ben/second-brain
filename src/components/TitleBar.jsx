import { X, Minus, Square } from 'lucide-react'
import Logo from './Logo'

export default function TitleBar() {
    const handleMinimize = () => {
        if (window.electronAPI) {
            window.electronAPI.minimize()
        }
    }

    const handleMaximize = () => {
        if (window.electronAPI) {
            window.electronAPI.maximize()
        }
    }

    const handleClose = () => {
        if (window.electronAPI) {
            window.electronAPI.close()
        }
    }

    return (
        <div className="h-8 bg-dark-surface border-b border-dark-border flex items-center justify-between px-4 select-none" style={{ WebkitAppRegion: 'drag' }}>
            <div className="flex-1"></div>
            <div className="flex-1 flex justify-center items-center gap-2">
                <Logo className="w-5 h-5" />
                <h1 className="text-sm font-semibold text-white">Second Brain</h1>
            </div>
            <div className="flex-1 flex justify-end gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
                <button
                    onClick={handleMinimize}
                    className="w-8 h-8 flex items-center justify-center hover:bg-dark-hover rounded transition-colors"
                >
                    <Minus size={16} className="text-gray-400" />
                </button>
                <button
                    onClick={handleMaximize}
                    className="w-8 h-8 flex items-center justify-center hover:bg-dark-hover rounded transition-colors"
                >
                    <Square size={14} className="text-gray-400" />
                </button>
                <button
                    onClick={handleClose}
                    className="w-8 h-8 flex items-center justify-center hover:bg-red-600 rounded transition-colors"
                >
                    <X size={16} className="text-gray-400 hover:text-white" />
                </button>
            </div>
        </div>
    )
}
