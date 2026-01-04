import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, CheckCircle2, Circle, Briefcase, User, Calendar as CalendarIcon, MoreVertical, Trash2, ExternalLink, Download } from 'lucide-react'
import { generateGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar'

export default function Dashboard({ session }) {
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [newTaskCategory, setNewTaskCategory] = useState('work')
    const [newTaskDate, setNewTaskDate] = useState('')
    const [adding, setAdding] = useState(false)
    const [activeMenu, setActiveMenu] = useState(null)

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null)
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    useEffect(() => {
        fetchTasks()
    }, [])

    const fetchTasks = async () => {
        try {

            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', session.user.id)
                .order('is_done', { ascending: true })
                .order('created_at', { ascending: false })

            if (error) {

                throw error
            }

            setTasks(data || [])
        } catch (error) {

            alert('Erreur lors du chargement des tâches: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const addTask = async (e) => {
        e.preventDefault()
        if (!newTaskTitle.trim()) return

        setAdding(true)
        try {
            const { data, error } = await supabase
                .from('tasks')
                .insert([
                    {
                        user_id: session.user.id,
                        title: newTaskTitle,
                        category: newTaskCategory,
                        is_done: false,
                        due_date: newTaskDate || null,
                    },
                ])
                .select()

            if (error) throw error
            setTasks([...data, ...tasks])
            setNewTaskTitle('')
            setNewTaskDate('')
        } catch (error) {
            console.error('Error adding task:', error)
        } finally {
            setAdding(false)
        }
    }

    const updateTaskDate = async (task, newDate) => {
        try {
            const dateToSave = newDate || null
            const { error } = await supabase
                .from('tasks')
                .update({ due_date: dateToSave })
                .eq('id', task.id)

            if (error) throw error

            setTasks(
                tasks.map((t) =>
                    t.id === task.id ? { ...t, due_date: dateToSave } : t
                )
            )
        } catch (error) {
            console.error('Error updating task date:', error)
        }
    }


    const deleteTask = async (taskId) => {
        if (!confirm('Are you sure you want to delete this task?')) return

        console.log('Attempting delete for task:', taskId)
        console.log('Current user:', session.user.id)

        try {
            const { error, count } = await supabase
                .from('tasks')
                .delete({ count: 'exact' })
                .eq('id', taskId)

            if (error) throw error

            // If count is 0, it means the database found no rows to delete
            // This usually happens if RLS (security policy) prevents you from touching this row
            if (count === 0) {
                alert('Impossible de supprimer : Vous n\'avez pas la permission ou la tâche n\'existe plus (Problème de politique RLS ?)')
                return
            }

            setTasks(tasks.filter((t) => t.id !== taskId))
        } catch (error) {
            console.error('Error deleting task:', error)
            alert('Erreur lors de la suppression: ' + error.message)
        }
    }

    const toggleTask = async (task) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ is_done: !task.is_done })
                .eq('id', task.id)

            if (error) throw error

            setTasks(
                tasks.map((t) =>
                    t.id === task.id ? { ...t, is_done: !t.is_done } : t
                )
            )
        } catch (error) {
            console.error('Error updating task:', error)
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
        <div className="max-w-4xl mx-auto p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 text-dark-text">Dashboard</h1>
                <p className="text-dark-subtext">Manage your tasks and stay productive</p>
            </div>

            <div className="card mb-6">
                <form onSubmit={addTask} className="flex gap-3">
                    <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Add a new task..."
                        className="input-field flex-1 text-dark-text placeholder-dark-subtext"
                    />
                    <select
                        value={newTaskCategory}
                        onChange={(e) => setNewTaskCategory(e.target.value)}
                        className="input-field text-dark-text"
                    >
                        <option value="work">Work</option>
                        <option value="personal">Personal</option>
                    </select>
                    <input
                        type="date"
                        value={newTaskDate}
                        onChange={(e) => setNewTaskDate(e.target.value)}
                        className="input-field text-dark-text"
                    />
                    <button
                        type="submit"
                        disabled={adding}
                        className="btn-primary flex items-center gap-2"
                    >
                        {adding ? (
                            <div className="spinner"></div>
                        ) : (
                            <>
                                <Plus size={20} />
                                Add
                            </>
                        )}
                    </button>
                </form>
            </div>

            {tasks.length === 0 ? (
                <div className="card text-center py-12">
                    <div className="text-dark-subtext mb-2">
                        <Circle size={48} className="mx-auto mb-4 opacity-50" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-dark-text">No tasks yet</h3>
                    <p className="text-dark-subtext">
                        Add your first task to get started with your productivity journey
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            className="card flex items-center gap-4 hover:bg-dark-hover transition-colors cursor-pointer"
                            onClick={() => toggleTask(task)}
                        >
                            <button className="flex-shrink-0">
                                {task.is_done ? (
                                    <CheckCircle2 size={24} className="text-green-500" />
                                ) : (
                                    <Circle size={24} className="text-dark-subtext" />
                                )}
                            </button>

                            <div className="flex-1">
                                <p
                                    className={`font-medium ${task.is_done
                                        ? 'line-through text-dark-subtext'
                                        : 'text-dark-text'
                                        }`}
                                >
                                    {task.title}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                {task.due_date ? (
                                    <div className="flex items-center gap-2 mr-2">
                                        <div className="relative group">
                                            <input
                                                type="date"
                                                value={task.due_date.split('T')[0]}
                                                onChange={(e) => updateTaskDate(task, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="bg-transparent text-gray-400 border-none outline-none p-0 w-[110px] text-sm hover:text-white transition-colors cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Set to today's date when adding first time
                                            updateTaskDate(task, new Date().toISOString().split('T')[0]);
                                        }}
                                        className="text-gray-600 hover:text-gray-400 transition-colors mr-2"
                                        title="Add due date"
                                    >
                                        <CalendarIcon size={14} />
                                    </button>
                                )}
                                {task.category === 'work' ? (
                                    <span className="flex items-center gap-1 text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
                                        <Briefcase size={14} />
                                        Work
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full">
                                        <User size={14} />
                                        Personal
                                    </span>
                                )}

                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setActiveMenu(activeMenu === task.id ? null : task.id)
                                        }}
                                        className="p-1 hover:bg-dark-hover rounded-full text-dark-subtext hover:text-dark-text transition-colors"
                                    >
                                        <MoreVertical size={16} />
                                    </button>

                                    {activeMenu === task.id && (
                                        <div
                                            className="absolute right-0 top-full mt-1 w-48 bg-dark-surface border border-dark-border rounded-lg shadow-xl z-10 overflow-hidden"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {task.due_date && (
                                                <>
                                                    <a
                                                        href={generateGoogleCalendarUrl(task)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-dark-text hover:bg-dark-hover hover:text-dark-text transition-colors"
                                                        onClick={() => setActiveMenu(null)}
                                                    >
                                                        <ExternalLink size={14} />
                                                        Google Calendar
                                                    </a>
                                                    <button
                                                        onClick={() => {
                                                            downloadIcsFile(task)
                                                            setActiveMenu(null)
                                                        }}
                                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-dark-text hover:bg-dark-hover hover:text-dark-text transition-colors"
                                                    >
                                                        <Download size={14} />
                                                        Download .ics
                                                    </button>
                                                    <div className="h-px bg-dark-border my-1"></div>
                                                </>
                                            )}

                                            <button
                                                onClick={() => {
                                                    deleteTask(task.id)
                                                    setActiveMenu(null)
                                                }}
                                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                                Delete Task
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
