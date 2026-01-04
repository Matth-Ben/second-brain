import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import {
    Bold,
    Italic,
    Strikethrough,
    Code,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Quote
} from 'lucide-react'

const MenuBar = ({ editor }) => {
    if (!editor) {
        return null
    }

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
        </div>
    )
}

export default function Editor({ content, onChange, onBlur }) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Start writing...',
                emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-gray-500 before:float-left before:h-0 before:pointer-events-none',
            }),
        ],
        content: content,
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[200px] text-gray-300',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
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
            <MenuBar editor={editor} />
            <div className="flex-1 overflow-y-auto p-4">
                <EditorContent editor={editor} className="h-full" />
            </div>
        </div>
    )
}
