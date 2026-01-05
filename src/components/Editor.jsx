import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
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
    Image as ImageIcon,
    CheckSquare
} from 'lucide-react'

const lowlight = createLowlight(common)

const MenuBar = ({ editor, onImageUpload, isUploading }) => {
    if (!editor) {
        return null
    }

    return (
        <div className="flex flex-wrap gap-1 p-2 border-b border-dark-border bg-dark-surface sticky top-0 z-10">
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={`p-1.5 rounded transition-colors ${editor.isActive('bold') ? 'bg-blue-600 text-white' : 'text-dark-subtext hover:bg-dark-hover hover:text-dark-text'}`}
                title="Bold"
            >
                <Bold size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={`p-1.5 rounded transition-colors ${editor.isActive('italic') ? 'bg-blue-600 text-white' : 'text-dark-subtext hover:bg-dark-hover hover:text-dark-text'}`}
                title="Italic"
            >
                <Italic size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                disabled={!editor.can().chain().focus().toggleStrike().run()}
                className={`p-1.5 rounded transition-colors ${editor.isActive('strike') ? 'bg-blue-600 text-white' : 'text-dark-subtext hover:bg-dark-hover hover:text-dark-text'}`}
                title="Strike"
            >
                <Strikethrough size={16} />
            </button>

            <div className="w-px bg-dark-border mx-1 self-stretch"></div>

            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`p-1.5 rounded transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-600 text-white' : 'text-dark-subtext hover:bg-dark-hover hover:text-dark-text'}`}
                title="Heading 1"
            >
                <Heading1 size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-1.5 rounded transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-600 text-white' : 'text-dark-subtext hover:bg-dark-hover hover:text-dark-text'}`}
                title="Heading 2"
            >
                <Heading2 size={16} />
            </button>

            <div className="w-px bg-dark-border mx-1 self-stretch"></div>

            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-1.5 rounded transition-colors ${editor.isActive('bulletList') ? 'bg-blue-600 text-white' : 'text-dark-subtext hover:bg-dark-hover hover:text-dark-text'}`}
                title="Bullet List"
            >
                <List size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-1.5 rounded transition-colors ${editor.isActive('orderedList') ? 'bg-blue-600 text-white' : 'text-dark-subtext hover:bg-dark-hover hover:text-dark-text'}`}
                title="Ordered List"
            >
                <ListOrdered size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                className={`p-1.5 rounded transition-colors ${editor.isActive('taskList') ? 'bg-blue-600 text-white' : 'text-dark-subtext hover:bg-dark-hover hover:text-dark-text'}`}
                title="Task List"
            >
                <CheckSquare size={16} />
            </button>

            <div className="w-px bg-dark-border mx-1 self-stretch"></div>

            <button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`p-1.5 rounded transition-colors ${editor.isActive('blockquote') ? 'bg-blue-600 text-white' : 'text-dark-subtext hover:bg-dark-hover hover:text-dark-text'}`}
                title="Quote"
            >
                <Quote size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`p-1.5 rounded transition-colors ${editor.isActive('codeBlock') ? 'bg-blue-600 text-white' : 'text-dark-subtext hover:bg-dark-hover hover:text-dark-text'}`}
                title="Code Block"
            >
                <Code size={16} />
            </button>
            <button
                onClick={onImageUpload}
                disabled={isUploading}
                className={`p-1.5 rounded transition-colors ${isUploading ? 'text-gray-500 cursor-not-allowed' : 'text-dark-subtext hover:bg-dark-hover hover:text-dark-text'}`}
                title="Add Image"
            >
                {isUploading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
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
            StarterKit.configure({
                codeBlock: false,
            }),
            CodeBlockLowlight.configure({
                lowlight,
                HTMLAttributes: {
                    spellcheck: 'false',
                },
            }),
            Placeholder.configure({
                placeholder: 'Start writing...',
                emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-dark-subtext before:float-left before:h-0 before:pointer-events-none',
            }),
            Image,
            TaskList.configure({
                HTMLAttributes: {
                    class: 'task-list',
                },
            }),
            TaskItem.configure({
                nested: true,
                HTMLAttributes: {
                    class: 'task-item',
                },
            }),
        ],
        content: content,
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[200px] text-dark-text',
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
