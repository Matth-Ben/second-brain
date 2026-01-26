import { Trash2 } from 'lucide-react'

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[10010] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-dark-surface border border-dark-border rounded-lg p-6 shadow-2xl max-w-sm w-full mx-4">
                <h3 className="text-xl font-bold text-dark-text mb-2">{title}</h3>
                <p className="text-dark-subtext mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-dark-text hover:bg-dark-hover rounded-lg transition-colors border border-dark-border"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Trash2 size={18} />
                        Supprimer
                    </button>
                </div>
            </div>
        </div>
    )
}
