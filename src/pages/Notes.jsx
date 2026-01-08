import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, FileText, Trash2, Star, ChevronLeft } from 'lucide-react'
import Editor from '../components/Editor'

const extractImageUrls = (html) => {
    if (!html) return []
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    return Array.from(doc.querySelectorAll('img')).map((img) => img.src)
}

export default function Notes({ session }) {
    const [notes, setNotes] = useState([])
    const [selectedNote, setSelectedNote] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    useEffect(() => {
        fetchNotes()
    }, [])

    const fetchNotes = async () => {
        try {

            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .eq('user_id', session.user.id)
                .order('is_favorite', { ascending: false })
                .order('updated_at', { ascending: false })

            if (error) {

                throw error
            }

            setNotes(data || [])
            if (data && data.length > 0) {
                selectNote(data[0])
            }
        } catch (error) {

            alert('Erreur lors du chargement des notes: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const selectNote = (note) => {
        setSelectedNote(note)
        setTitle(note.title)
        setContent(note.content || '')
    }

    const createNote = async () => {
        try {
            const { data, error } = await supabase
                .from('notes')
                .insert([
                    {
                        user_id: session.user.id,
                        title: 'Note sans titre',
                        content: '',
                    },
                ])
                .select()

            if (error) throw error
            setNotes([data[0], ...notes])
            selectNote(data[0])
        } catch (error) {

        }
    }

    const updateNote = async () => {
        if (!selectedNote) return

        setSaving(true)
        try {
            // Check for deleted images
            const oldImages = extractImageUrls(selectedNote.content)
            const newImages = extractImageUrls(content)
            const deletedImages = oldImages.filter((img) => !newImages.includes(img) && img.includes('note-images'))

            if (deletedImages.length > 0) {
                const pathsToDelete = deletedImages.map((url) => url.split('note-images/')[1]).filter(Boolean)
                if (pathsToDelete.length > 0) {
                    console.log('Deleting images from storage:', pathsToDelete)
                    await supabase.storage.from('note-images').remove(pathsToDelete)
                }
            }

            const { error } = await supabase
                .from('notes')
                .update({
                    title,
                    content,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', selectedNote.id)

            if (error) throw error

            setNotes(
                notes.map((n) =>
                    n.id === selectedNote.id
                        ? { ...n, title, content, updated_at: new Date().toISOString() }
                        : n
                )
            )

            // Update selectedNote to keep state in sync for next comparison
            setSelectedNote({ ...selectedNote, title, content, updated_at: new Date().toISOString() })
        } catch (error) {

        } finally {
            setSaving(false)
        }
    }

    const toggleFavorite = async (e) => {
        e.stopPropagation()
        if (!selectedNote) return

        const newStatus = !selectedNote.is_favorite

        try {
            const { error } = await supabase
                .from('notes')
                .update({ is_favorite: newStatus })
                .eq('id', selectedNote.id)

            if (error) throw error

            // Update local state
            const updatedNotes = notes.map(n =>
                n.id === selectedNote.id
                    ? { ...n, is_favorite: newStatus }
                    : n
            )

            // Re-sort notes
            updatedNotes.sort((a, b) => {
                if (a.is_favorite === b.is_favorite) {
                    return new Date(b.updated_at) - new Date(a.updated_at)
                }
                return a.is_favorite ? -1 : 1
            })

            setNotes(updatedNotes)
            setSelectedNote({ ...selectedNote, is_favorite: newStatus })
        } catch (error) {
            console.error('Error toggling favorite:', error)
        }
    }

    const handleDeleteClick = (e) => {
        e.stopPropagation()
        setShowDeleteModal(true)
    }

    const confirmDelete = async () => {
        if (!selectedNote) return

        try {
            // 1. Delete images first
            const images = extractImageUrls(selectedNote.content)
            const noteImages = images.filter((img) => img.includes('note-images'))

            if (noteImages.length > 0) {
                const pathsToDelete = noteImages.map((url) => url.split('note-images/')[1]).filter(Boolean)
                if (pathsToDelete.length > 0) {
                    await supabase.storage.from('note-images').remove(pathsToDelete)
                }
            }

            // 2. Delete note from DB
            const { error } = await supabase
                .from('notes')
                .delete()
                .eq('id', selectedNote.id)

            if (error) throw error

            // 3. Update local state
            const remainingNotes = notes.filter(n => n.id !== selectedNote.id)
            setNotes(remainingNotes)

            if (remainingNotes.length > 0) {
                selectNote(remainingNotes[0])
            } else {
                setSelectedNote(null)
                setTitle('')
                setContent('')
            }
            setShowDeleteModal(false)
        } catch (error) {
            console.error('Error deleting note:', error)
            alert('Error deleting note')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="spinner"></div>
            </div>
        )
    }

    return (
        <div className="flex h-full">
            <div className={`
                w-full md:w-64 border-r border-dark-border flex flex-col 
                ${selectedNote ? 'hidden md:flex' : 'flex'}
            `}>
                <div className="px-6 flex items-center h-20 text-xl font-bold border-b border-dark-border">
                    Mes notes
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {notes.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <FileText size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-sm">Aucune note pour le moment</p>
                        </div>
                    ) : (
                        notes.map((note) => (
                            <div
                                key={note.id}
                                onClick={() => selectNote(note)}
                                className={`p-4 rounded-lg cursor-pointer transition-colors ${selectedNote?.id === note.id
                                    ? 'bg-blue-600'
                                    : 'bg-dark-surface hover:bg-dark-hover'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    {note.is_favorite && (
                                        <Star size={14} className="text-yellow-400 fill-current shrink-0" />
                                    )}
                                    <h3 className={`font-medium truncate ${selectedNote?.id === note.id ? 'text-white' : 'text-dark-text'}`}>
                                        {note.title}
                                    </h3>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-4 border-b border-dark-border">
                    <button onClick={createNote} className="btn-primary w-full flex items-center justify-center gap-2">
                        <Plus size={20} />
                        Nouvelle note
                    </button>
                </div>
            </div>

            <div className={`flex-1 flex flex-col ${!selectedNote ? 'hidden md:flex' : 'flex'}`}>
                {selectedNote ? (
                    <>
                        <div className="flex items-center h-20 px-4 md:px-6 border-b border-dark-border gap-2">
                            <button
                                onClick={() => setSelectedNote(null)}
                                className="md:hidden p-2 text-dark-subtext hover:text-dark-text rounded-lg"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={updateNote}
                                className="flex-1 text-2xl font-bold bg-transparent border-none outline-none text-dark-text placeholder-dark-subtext min-w-0 mr-4"
                                placeholder="Titre de la note..."
                            />
                            <button
                                onClick={toggleFavorite}
                                className={`p-2 rounded-lg transition-colors mr-2 ${selectedNote.is_favorite
                                    ? 'text-yellow-400 hover:bg-yellow-400/10'
                                    : 'text-dark-subtext hover:text-yellow-400 hover:bg-yellow-400/10'
                                    }`}
                                title={selectedNote.is_favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                            >
                                <Star size={20} fill={selectedNote.is_favorite ? "currentColor" : "none"} />
                            </button>
                            <button
                                onClick={handleDeleteClick}
                                className="p-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Supprimer la note"
                            >
                                <Trash2 size={20} />
                            </button>

                        </div>

                        <div className="flex-1 flex flex-col min-h-0 bg-dark-bg">
                            {/* Editor Container */}
                            <Editor
                                key={selectedNote.id}
                                content={content}
                                onChange={setContent}
                                onBlur={updateNote}
                                userId={session.user.id}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-dark-subtext">
                        <div className="text-center">
                            <FileText size={64} className="mx-auto mb-4 opacity-50" />
                            <p>Sélectionnez une note ou créez-en une nouvelle</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-dark-surface border border-dark-border p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4">
                        <h3 className="text-xl font-bold text-dark-text mb-4">Supprimer la note ?</h3>
                        <p className="text-dark-subtext mb-6">
                            Êtes-vous sûr de vouloir supprimer <span className="text-dark-text font-medium">"{selectedNote?.title}"</span> ?
                            Cette action est irréversible.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
