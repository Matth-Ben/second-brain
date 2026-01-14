import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { X, Briefcase, Home, Heart, GraduationCap, DollarSign, PartyPopper, Lightbulb } from 'lucide-react'

// Categories configuration (same as Dashboard)
const CATEGORIES = [
    { value: 'work', label: 'Travail', icon: Briefcase, color: 'text-blue-400' },
    { value: 'home', label: 'Maison', icon: Home, color: 'text-orange-400' },
    { value: 'health', label: 'Santé & Bien-être', icon: Heart, color: 'text-red-400' },
    { value: 'learning', label: 'Apprentissage', icon: GraduationCap, color: 'text-green-400' },
    { value: 'finance', label: 'Finances', icon: DollarSign, color: 'text-yellow-400' },
    { value: 'social', label: 'Social & Loisirs', icon: PartyPopper, color: 'text-pink-400' },
    { value: 'ideas', label: 'Idées / Vrac', icon: Lightbulb, color: 'text-purple-400' },
]

export default function QuickEntry() {
    const [searchParams] = useSearchParams()
    const mode = searchParams.get('mode') || 'note'
    const autoRecord = searchParams.get('autoRecord') === 'true'

    const [content, setContent] = useState('')
    const [title, setTitle] = useState('')
    const [taskTitle, setTaskTitle] = useState('')
    const [category, setCategory] = useState('work')
    const [dueDate, setDueDate] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)

    const inputRef = useRef(null)
    const dropdownRef = useRef(null)


    // Auto-focus sur le champ principal
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus()
        }
    }, [])

    // Auto-start recording pour le mode vocal
    // DÉSACTIVÉ: L'API Web Speech ne fonctionne pas dans Electron sans configuration avancée
    // useEffect(() => {
    //     if (mode === 'voice' && autoRecord) {
    //         const timer = setTimeout(() => {
    //             console.log('Auto-starting voice recording...')
    //             startListening()
    //         }, 500)
    //         return () => clearTimeout(timer)
    //     }
    // }, [mode, autoRecord])

    // Afficher un message d'information pour le mode vocal
    useEffect(() => {
        if (mode === 'voice') {
            console.warn('⚠️ La reconnaissance vocale nécessite une configuration spéciale dans Electron')
            console.warn('Pour l\'instant, utilisez le mode Note classique ou tapez directement le texte')
        }
    }, [mode])



    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowCategoryDropdown(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Gestion des raccourcis clavier
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                handleSave()
            } else if (e.key === 'Escape') {
                e.preventDefault()
                handleClose()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [content, title, taskTitle, category, dueDate])

    const handleSave = async () => {
        if (isSaving) return

        // Validation
        if (mode === 'task' && !taskTitle.trim()) return
        if (mode === 'note' && !content.trim()) return

        setIsSaving(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                console.error('User not authenticated')
                alert('Vous devez être connecté')
                return
            }

            if (mode === 'task') {
                // Sauvegarder la tâche
                const { error } = await supabase.from('tasks').insert({
                    user_id: user.id,
                    title: taskTitle.trim(),
                    category: category,
                    due_date: dueDate || null,
                    is_done: false,
                    created_at: new Date().toISOString()
                })

                if (error) throw error
            } else {
                // Sauvegarder la note
                const noteTitle = title.trim() || 'Note rapide'
                const { error } = await supabase.from('notes').insert({
                    user_id: user.id,
                    title: noteTitle,
                    content: content.trim(),
                    created_at: new Date().toISOString()
                })

                if (error) throw error
            }

            handleClose()
        } catch (error) {
            console.error('Erreur de sauvegarde:', error)
            alert('Erreur lors de la sauvegarde: ' + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleClose = () => {
        window.close()
    }


    return (
        <div className="h-screen bg-dark-bg text-dark-text flex flex-col">
            {/* Custom Title Bar */}
            <div className="flex items-center justify-between p-4 border-b border-dark-border drag select-none">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <h1 className="text-sm font-medium">
                        {mode === 'task' && 'Nouvelle Tâche'}
                        {mode === 'note' && 'Nouvelle Note'}

                    </h1>
                </div>
                <button
                    onClick={handleClose}
                    className="p-1 hover:bg-dark-hover rounded no-drag transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-auto">
                {mode === 'task' && (
                    <div className="space-y-4">
                        <input
                            ref={inputRef}
                            type="text"
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            placeholder="Titre de la tâche..."
                            className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-dark-text placeholder-dark-subtext"
                        />

                        <div className="relative" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-dark-text flex items-center justify-between"
                            >
                                <span className="flex items-center gap-2">
                                    {(() => {
                                        const selectedCategory = CATEGORIES.find(cat => cat.value === category) || CATEGORIES[0]
                                        const Icon = selectedCategory.icon
                                        return (
                                            <>
                                                <Icon size={16} className={selectedCategory.color} />
                                                <span className="text-sm">{selectedCategory.label}</span>
                                            </>
                                        )
                                    })()}
                                </span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showCategoryDropdown && (
                                <div className="absolute z-10 w-full mt-1 bg-dark-surface border border-dark-border rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                                    {CATEGORIES.map((cat) => {
                                        const Icon = cat.icon
                                        return (
                                            <button
                                                key={cat.value}
                                                type="button"
                                                onClick={() => {
                                                    setCategory(cat.value)
                                                    setShowCategoryDropdown(false)
                                                }}
                                                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-dark-hover transition-colors text-left"
                                            >
                                                <Icon size={16} className={cat.color} />
                                                <span className="text-dark-text text-sm">{cat.label}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-dark-text"
                        />
                    </div>
                )}

                {mode === 'note' && (
                    <div className="space-y-4 h-full flex flex-col">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Titre de la note..."
                            className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-dark-text placeholder-dark-subtext"
                        />

                        {mode === 'voice' && (
                            <>
                                {isModelLoading && (
                                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-blue-200">
                                                🤖 Téléchargement du modèle IA Whisper...
                                            </span>
                                            <span className="text-sm font-mono text-blue-200">
                                                {modelProgress}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-dark-surface rounded-full h-2">
                                            <div
                                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${modelProgress}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-blue-300 mt-2">
                                            Premier téléchargement uniquement (~75 MB)
                                        </p>
                                    </div>
                                )}

                                {isProcessing && (
                                    <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-sm text-purple-200 flex items-center gap-2">
                                        <div className="spinner"></div>
                                        🤖 Transcription IA en cours...
                                    </div>
                                )}

                                {speechError && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-200">
                                        ❌ {speechError}
                                    </div>
                                )}

                                <div className={`flex items-center justify-between p-4 bg-dark-surface rounded-lg border border-dark-border ${isModelLoading ? 'opacity-50' : ''}`}>
                                    <span className="text-sm font-medium">
                                        {isListening ? '🎤 Enregistrement en cours...' : 'Prêt à enregistrer'}
                                    </span>
                                    <button
                                        onClick={toggleRecording}
                                        disabled={isModelLoading || isProcessing}
                                        className={`p-3 rounded-full transition-all ${isListening
                                            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                                            : 'bg-blue-500 hover:bg-blue-600'
                                            } disabled:bg-gray-600 disabled:cursor-not-allowed`}
                                    >
                                        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                                    </button>
                                </div>
                            </>
                        )}

                        <textarea
                            ref={mode === 'note' ? inputRef : null}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Écrivez votre note..."
                            className="flex-1 w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-dark-text placeholder-dark-subtext min-h-[300px]"
                        />
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-dark-border flex items-center justify-between bg-dark-surface">
                <div className="text-xs text-dark-subtext flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-dark-bg rounded text-xs border border-dark-border">Ctrl</kbd>
                        <span>+</span>
                        <kbd className="px-2 py-1 bg-dark-bg rounded text-xs border border-dark-border">Enter</kbd>
                        <span className="ml-1">Sauvegarder</span>
                    </div>
                    <span className="text-dark-border">•</span>
                    <div className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-dark-bg rounded text-xs border border-dark-border">Esc</kbd>
                        <span className="ml-1">Annuler</span>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving || (mode === 'task' ? !taskTitle.trim() : !content.trim())}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                >
                    {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
            </div>
        </div>
    )
}
