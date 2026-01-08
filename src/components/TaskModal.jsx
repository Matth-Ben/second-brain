import { useState, useEffect } from 'react'
import { X, Calendar as CalendarIcon, Briefcase, User, Trash2, Home, Heart, GraduationCap, DollarSign, PartyPopper, Lightbulb } from 'lucide-react'

// Categories configuration
const CATEGORIES = [
    { value: 'work', label: 'Travail', icon: Briefcase, color: 'text-blue-400' },
    { value: 'home', label: 'Maison', icon: Home, color: 'text-orange-400' },
    { value: 'health', label: 'Santé & Bien-être', icon: Heart, color: 'text-red-400' },
    { value: 'learning', label: 'Apprentissage', icon: GraduationCap, color: 'text-green-400' },
    { value: 'finance', label: 'Finances', icon: DollarSign, color: 'text-yellow-400' },
    { value: 'social', label: 'Social & Loisirs', icon: PartyPopper, color: 'text-pink-400' },
    { value: 'ideas', label: 'Idées / Vrac', icon: Lightbulb, color: 'text-purple-400' },
]

export default function TaskModal({ task, isOpen, onClose, onUpdate, onDelete }) {
    const [editedTask, setEditedTask] = useState(task)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        setEditedTask(task)
    }, [task])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const dropdown = document.getElementById('category-dropdown')
            const button = event.target.closest('button')

            if (dropdown && !dropdown.classList.contains('hidden')) {
                // Check if click is outside both dropdown and its trigger button
                if (!dropdown.contains(event.target) && (!button || !button.onclick)) {
                    dropdown.classList.add('hidden')
                }
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    if (!isOpen || !task || !editedTask) return null

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await onUpdate(editedTask)
            onClose()
        } catch (error) {
            console.error('Error saving task:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
            await onDelete(task.id)
            onClose()
        }
    }

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
            onClick={handleOverlayClick}
        >
            <div className="bg-dark-surface border border-dark-border rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-dark-border gap-4">
                    <input
                        type="text"
                        value={editedTask.title}
                        onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                        className="text-2xl font-bold bg-transparent border-none outline-none text-dark-text flex-1 focus:ring-0"
                        placeholder="Titre de la tâche"
                    />
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-dark-hover rounded-lg transition-colors text-dark-subtext hover:text-dark-text flex-shrink-0"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Status Toggle */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-dark-text">Statut de la tâche</span>
                        <button
                            onClick={() => setEditedTask({ ...editedTask, is_done: !editedTask.is_done })}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${editedTask.is_done ? 'bg-green-600' : 'bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${editedTask.is_done ? 'translate-x-7' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-dark-text mb-2">
                            Catégorie
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    const dropdown = document.getElementById('category-dropdown')
                                    dropdown.classList.toggle('hidden')
                                }}
                                className="input-field w-full text-dark-text flex items-center justify-between"
                            >
                                <span className="flex items-center gap-2">
                                    {(() => {
                                        const selectedCategory = CATEGORIES.find(cat => cat.value === editedTask.category) || CATEGORIES[0]
                                        const Icon = selectedCategory.icon
                                        return (
                                            <>
                                                <Icon size={16} className={selectedCategory.color} />
                                                <span>{selectedCategory.label}</span>
                                            </>
                                        )
                                    })()}
                                </span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div
                                id="category-dropdown"
                                className="hidden absolute z-10 w-full mt-1 bg-dark-surface border border-dark-border rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
                            >
                                {CATEGORIES.map((category) => {
                                    const Icon = category.icon
                                    return (
                                        <button
                                            key={category.value}
                                            type="button"
                                            onClick={() => {
                                                setEditedTask({ ...editedTask, category: category.value })
                                                document.getElementById('category-dropdown').classList.add('hidden')
                                            }}
                                            className="w-full flex items-center gap-2 px-4 py-3 hover:bg-dark-hover transition-colors text-left"
                                        >
                                            <Icon size={16} className={category.color} />
                                            <span className="text-dark-text">{category.label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-medium text-dark-text mb-2">
                            Date d'échéance
                        </label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-subtext" size={18} />
                            <input
                                type="date"
                                value={editedTask.due_date ? editedTask.due_date.split('T')[0] : ''}
                                onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value || null })}
                                className="input-field w-full pl-10 text-dark-text"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-dark-text mb-2">
                            Description
                        </label>
                        <textarea
                            value={editedTask.description || ''}
                            onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                            className="input-field w-full text-dark-text min-h-[150px] resize-y"
                            placeholder="Ajoutez une description pour cette tâche..."
                        />
                    </div>


                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-dark-border">
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <Trash2 size={18} />
                        Supprimer
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="btn-secondary"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !editedTask.title.trim()}
                            className="btn-primary"
                        >
                            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
