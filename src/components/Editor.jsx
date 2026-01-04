import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import { supabase } from '../supabaseClient'
import { v4 as uuidv4 } from 'uuid'
import { useRef, useState } from 'react'
import {
    Bold,
    Italic,
    Strikethrough,
    Code,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Quote,
    Image as ImageIcon
} from 'lucide-react'

const MenuBar = ({ editor, onImageUpload, isUploading }) => {
    if (!editor) {
        return null
    }

    // const addImage = () => {
    //     const url = window.prompt('URL')

    //     if (url) {
    //         editor.chain().focus().setImage({ src: url }).run()
    //     }
    // }

    return (
        <div className="flex flex-wrap gap-1 p-2 border-b border-dark-border bg-dark-surface sticky top-0 z-10">
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={`p-1.5 rounded transition-colors ${editor.isActive('bold') ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                title="Bold"
            >
                <Bold size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={`p-1.5 rounded transition-colors ${editor.isActive('italic') ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                title="Italic"
            >
                <Italic size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                disabled={!editor.can().chain().focus().toggleStrike().run()}
                className={`p-1.5 rounded transition-colors ${editor.isActive('strike') ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                title="Strike"
            >
                <Strikethrough size={16} />
            </button>

            <div className="w-px bg-gray-700 mx-1 self-stretch"></div>

            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`p-1.5 rounded transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                title="Heading 1"
            >
                <Heading1 size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-1.5 rounded transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                title="Heading 2"
            >
                <Heading2 size={16} />
            </button>

            <div className="w-px bg-gray-700 mx-1 self-stretch"></div>

            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-1.5 rounded transition-colors ${editor.isActive('bulletList') ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                title="Bullet List"
            >
                <List size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-1.5 rounded transition-colors ${editor.isActive('orderedList') ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                title="Ordered List"
            >
                <ListOrdered size={16} />
            </button>

            <div className="w-px bg-gray-700 mx-1 self-stretch"></div>

            <button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`p-1.5 rounded transition-colors ${editor.isActive('blockquote') ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                title="Quote"
            >
                <Quote size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`p-1.5 rounded transition-colors ${editor.isActive('codeBlock') ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                title="Code Block"
            >
                <Code size={16} />
            </button>
            <button
                onClick={onImageUpload}
                disabled={isUploading}
                className={`p-1.5 rounded transition-colors ${isUploading ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                title="Add Image"
            >
                {isUploading ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <ImageIcon size={16} />
                )}
            </button>
        </div>
    )
}

export default function Editor({ content, onChange, onBlur, userId }) {
    const fileInputRef = useRef(null)
    const [isUploading, setIsUploading] = useState(false)
    // Force re-render on editor updates (selection changes)
    const [, forceUpdate] = useState(0)

    const uploadImage = async (file) => {
        if (!file || !userId) return

        setIsUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${userId}/${uuidv4()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('note-images')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('note-images')
                .getPublicUrl(filePath)

            return publicUrl
        } catch (error) {
            console.error('Error uploading image:', error)
            alert('Error uploading image')
            return null
        } finally {
            setIsUploading(false)
        }
    }

    const handleFileSelect = async (e) => {
        const file = e.target.files[0]
        if (file) {
            const url = await uploadImage(file)
            if (url) {
                editor?.chain().focus().setImage({ src: url }).run()
            }
        }
        e.target.value = ''
    }
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Start writing...',
                emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-gray-500 before:float-left before:h-0 before:pointer-events-none',
            }),
            Image,
        ],
        content: content,
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[200px] text-gray-300',
            },
            handleDrop: (view, event, slice, moved) => {
                if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
                    const file = event.dataTransfer.files[0]
                    if (file.type.startsWith('image/')) {
                        event.preventDefault()
                        uploadImage(file).then(url => {
                            if (url) {
                                const { schema } = view.state
                                const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
                                const node = schema.nodes.image.create({ src: url })
                                const transaction = view.state.tr.insert(coordinates.pos, node)
                                view.dispatch(transaction)
                            }
                        })
                        return true
                    }
                }
                return false
            }
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        onSelectionUpdate: ({ editor }) => {
            forceUpdate((n) => n + 1)
        },
        onTransaction: ({ editor }) => {
            forceUpdate((n) => n + 1)
        },
        onBlur: ({ editor }) => {
            if (onBlur) onBlur(editor.getHTML())
        },
    })

    // Update content if it changes externally (e.g. switching notes)
    // But be careful not to trigger loops or reset while typing
    // Typically Tiptap handles this by not resetting if content matches, 
    // but a key-based remount in the parent is safer for note switching.

    return (
        <div className="flex flex-col h-full bg-transparent">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
            />
            <MenuBar
                editor={editor}
                onImageUpload={() => fileInputRef.current?.click()}
                isUploading={isUploading}
            />
            <div className="flex-1 overflow-y-auto p-4">
                <EditorContent editor={editor} className="h-full" />
            </div>
        </div>
    )
}
