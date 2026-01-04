import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, FileText } from 'lucide-react'
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

    useEffect(() => {
        fetchNotes()
    }, [])

    const fetchNotes = async () => {
        try {

            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .eq('user_id', session.user.id)
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
                        title: 'Untitled Note',
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="spinner"></div>
            </div>
        )
    }

    return (
        <div className="flex h-full">
            <div className="w-[30%] border-r border-dark-border flex flex-col">
                <div className="p-4 border-b border-dark-border">
                    <button onClick={createNote} className="btn-primary w-full flex items-center justify-center gap-2">
                        <Plus size={20} />
                        New Note
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {notes.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <FileText size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-sm">No notes yet</p>
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
                                <h3 className="font-medium truncate">{note.title}</h3>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col">
                {selectedNote ? (
                    <>
                        <div className="p-6 border-b border-dark-border">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={updateNote}
                                className="text-2xl font-bold bg-transparent border-none outline-none w-full text-white placeholder-gray-500"
                                placeholder="Note title..."
                            />

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
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <FileText size={64} className="mx-auto mb-4 opacity-50" />
                            <p>Select a note or create a new one</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
