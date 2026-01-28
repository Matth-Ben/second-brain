import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, CheckCircle2, Circle, Briefcase, User, Calendar as CalendarIcon, MoreVertical, Trash2, ExternalLink, Download, Home, Heart, GraduationCap, DollarSign, PartyPopper, Lightbulb, ChevronRight, ChevronDown, Archive } from 'lucide-react'
import { generateGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar'
import { useIsMobile } from '../utils/platform'
import TaskModal from '../components/TaskModal'

// Categories configuration (same as TaskModal)
const CATEGORIES = [
    { value: 'work', label: 'Travail', icon: Briefcase, color: 'text-blue-400' },
    { value: 'home', label: 'Maison', icon: Home, color: 'text-orange-400' },
    { value: 'health', label: 'Santé & Bien-être', icon: Heart, color: 'text-red-400' },
    { value: 'learning', label: 'Apprentissage', icon: GraduationCap, color: 'text-green-400' },
    { value: 'finance', label: 'Finances', icon: DollarSign, color: 'text-yellow-400' },
    { value: 'social', label: 'Social & Loisirs', icon: PartyPopper, color: 'text-pink-400' },
    { value: 'ideas', label: 'Idées / Vrac', icon: Lightbulb, color: 'text-purple-400' },
]

export default function Dashboard({ session }) {
    const isMobile = useIsMobile()
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [newTaskCategory, setNewTaskCategory] = useState('work')
    const [newTaskDate, setNewTaskDate] = useState('')
    const [adding, setAdding] = useState(false)
    const [activeMenu, setActiveMenu] = useState(null)
    const [selectedTask, setSelectedTask] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [showCompleted, setShowCompleted] = useState(false)

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Close task menu
            setActiveMenu(null)

            // Close category dropdown
            const dropdown = document.getElementById('new-task-category-dropdown')
            const button = event.target.closest('button')

            if (dropdown && !dropdown.classList.contains('hidden')) {
                // Check if click is outside both dropdown and its trigger button
                if (!dropdown.contains(event.target) && (!button || !button.onclick)) {
                    dropdown.classList.add('hidden')
                }
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
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

    const openTaskModal = (task) => {
        setSelectedTask(task)
        setIsModalOpen(true)
    }

    const handleUpdateTask = async (updatedTask) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({
                    title: updatedTask.title,
                    category: updatedTask.category,
                    due_date: updatedTask.due_date,
                    description: updatedTask.description,
                    is_done: updatedTask.is_done
                })
                .eq('id', updatedTask.id)

            if (error) throw error

            setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t))
            await fetchTasks() // Refresh to get latest data
        } catch (error) {
            console.error('Error updating task:', error)
            alert('Erreur lors de la mise à jour: ' + error.message)
        }
    }

    const handleDeleteTask = async (taskId) => {
        await deleteTask(taskId)
    }


    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="spinner"></div>
            </div>
        )
    }

    // Get today's date in YYYY-MM-DD format
    const getTodayDate = () => {
        const today = new Date()
        return today.toISOString().split('T')[0]
    }

    const todayDate = getTodayDate()

    // 1. Tasks for Today (Active AND Completed)
    const todayTasks = tasks.filter(task => {
        if (!task.due_date) return false
        const taskDate = task.due_date.split('T')[0]
        return taskDate === todayDate
    })

    // 2. Active Tasks (globally, for other lists)
    const activeTasks = tasks.filter(task => !task.is_done)

    // 3. Completed Tasks (Archive) - Exclude today's completed tasks
    const completedTasks = tasks.filter(task => {
        if (!task.is_done) return false
        // If it has a date and it matches today, exclude it (it stays in Today view)
        if (task.due_date) {
            const taskDate = task.due_date.split('T')[0]
            if (taskDate === todayDate) return false
        }
        return true
    })

    // 4. Tasks without date (Active only)
    const tasksWithoutDate = activeTasks.filter(task => !task.due_date)

    // 5. Other tasks (Active only, not today, with date)
    const otherTasks = activeTasks.filter(task => {
        if (!task.due_date) return false // Exclude tasks without date
        const taskDate = task.due_date.split('T')[0]
        return taskDate !== todayDate // Exclude today's tasks
    })

    // Check if all today's tasks are done
    const allTodayTasksDone = todayTasks.length > 0 && todayTasks.every(t => t.is_done)


    return (
        <div className="h-full flex flex-col">
            {/* Mobile Header */}
            <div className={`md:hidden sticky top-0 z-10 bg-dark-bg/95 backdrop-blur-md border-b border-dark-border px-4 flex items-center h-16 ${isMobile ? 'pt-[calc(0.5rem+env(safe-area-inset-top))]' : ''}`}>
                <h1 className="text-xl font-bold text-dark-text">Dashboard</h1>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
                    {/* Desktop Header */}
                    <div className="mb-8 hidden md:block">
                        <h1 className="text-3xl font-bold mb-2 text-dark-text">Dashboard</h1>
                        <p className="text-dark-subtext">Gérez vos tâches et restez productif</p>
                    </div>

                    <div className="card mb-6">
                        <form onSubmit={addTask} className="flex flex-wrap gap-3">
                            <input
                                type="text"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="Ajouter une nouvelle tâche..."
                                className="input-field flex-1 min-w-[200px] text-dark-text placeholder-dark-subtext h-10"
                            />
                            <div className="relative flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const dropdown = document.getElementById('new-task-category-dropdown')
                                        dropdown.classList.toggle('hidden')
                                    }}
                                    className="input-field text-dark-text flex items-center justify-between w-48 h-10"
                                >
                                    <span className="flex items-center gap-2">
                                        {(() => {
                                            const selectedCategory = CATEGORIES.find(cat => cat.value === newTaskCategory) || CATEGORIES[0]
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
                                <div
                                    id="new-task-category-dropdown"
                                    className="hidden absolute z-10 w-full mt-1 bg-dark-surface border border-dark-border rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
                                >
                                    {CATEGORIES.map((category) => {
                                        const Icon = category.icon
                                        return (
                                            <button
                                                key={category.value}
                                                type="button"
                                                onClick={() => {
                                                    setNewTaskCategory(category.value)
                                                    document.getElementById('new-task-category-dropdown').classList.add('hidden')
                                                }}
                                                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-dark-hover transition-colors text-left"
                                            >
                                                <Icon size={16} className={category.color} />
                                                <span className="text-dark-text text-sm">{category.label}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                            <input
                                type="date"
                                value={newTaskDate}
                                onChange={(e) => setNewTaskDate(e.target.value)}
                                className="input-field text-dark-text w-40 flex-shrink-0 h-10"
                            />
                            <button
                                type="submit"
                                disabled={adding}
                                className="btn-primary flex items-center gap-2 h-10 px-4 flex-shrink-0"
                            >
                                {adding ? (
                                    <div className="spinner"></div>
                                ) : (
                                    <>
                                        <Plus size={20} />
                                        Ajouter
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Daily Tasks Section */}
                    {todayTasks.length > 0 && (
                        <div className="card mb-6 md:mb-6 overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-dark-text flex items-center gap-2">
                                    <CalendarIcon size={20} className="text-blue-400" />
                                    Tâches du jour ({todayTasks.length})
                                </h2>
                            </div>

                            {/* All Done Message */}
                            {allTodayTasksDone && (
                                <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3 animate-fadeIn">
                                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                        <PartyPopper size={16} className="text-green-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-green-400 text-sm">Bravo !</p>
                                        <p className="text-xs text-green-500/80">Toutes les tâches du jour sont terminées.</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                {todayTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="flex items-center gap-3 p-3 bg-dark-surface rounded-lg hover:bg-dark-hover transition-colors cursor-pointer border border-dark-border mb-2 md:mb-0"
                                        onClick={() => openTaskModal(task)}
                                    >
                                        <button className="flex-shrink-0" onClick={(e) => { e.stopPropagation(); toggleTask(task); }}>
                                            {task.is_done ? (
                                                <CheckCircle2 size={20} className="text-green-500" />
                                            ) : (
                                                <Circle size={20} className="text-dark-subtext" />
                                            )}
                                        </button>
                                        <p className={`flex-1 text-sm min-w-0 break-words ${task.is_done ? 'line-through text-dark-subtext' : 'text-dark-text'}`}>
                                            {task.title}
                                        </p>
                                        {task.category === 'work' ? (
                                            <span className="flex items-center gap-1 text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full text-xs">
                                                <Briefcase size={12} />
                                                Travail
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full text-xs">
                                                <User size={12} />
                                                Personnel
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No Date Tasks Section */}
                    {tasksWithoutDate.length > 0 && (
                        <div className="card mb-6 md:mb-6 overflow-hidden">
                            <h2 className="text-xl font-semibold mb-4 text-dark-text flex items-center gap-2">
                                <Lightbulb size={20} className="text-yellow-400" />
                                À planifier ({tasksWithoutDate.length})
                            </h2>

                            <div className="space-y-2">
                                {tasksWithoutDate.map((task) => (
                                    <div
                                        key={task.id}
                                        className="flex items-center gap-3 p-3 bg-dark-surface rounded-lg hover:bg-dark-hover transition-colors cursor-pointer border border-dark-border"
                                        onClick={() => openTaskModal(task)}
                                    >
                                        <button className="flex-shrink-0">
                                            {task.is_done ? (
                                                <CheckCircle2 size={20} className="text-green-500" />
                                            ) : (
                                                <Circle size={20} className="text-dark-subtext" />
                                            )}
                                        </button>
                                        <p className={`flex-1 text-sm min-w-0 break-words ${task.is_done ? 'line-through text-dark-subtext' : 'text-dark-text'}`}>
                                            {task.title}
                                        </p>
                                        {task.category === 'work' ? (
                                            <span className="flex items-center gap-1 text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full text-xs">
                                                <Briefcase size={12} />
                                                Work
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full text-xs">
                                                <User size={12} />
                                                Personal
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {otherTasks.length === 0 && activeTasks.length === 0 ? (
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
                            {otherTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="card hover:bg-dark-hover transition-colors cursor-pointer mb-2 md:mb-0"
                                    onClick={() => openTaskModal(task)}
                                >
                                    {/* Mobile Layout - Stacked */}
                                    <div className="md:hidden">
                                        <div className="flex items-start gap-3 mb-2">
                                            <button className="flex-shrink-0 mt-0.5" onClick={(e) => { e.stopPropagation(); toggleTask(task); }}>
                                                {task.is_done ? (
                                                    <CheckCircle2 size={20} className="text-green-500" />
                                                ) : (
                                                    <Circle size={20} className="text-dark-subtext" />
                                                )}
                                            </button>
                                            <p className={`flex-1 min-w-0 break-words ${task.is_done ? 'line-through text-dark-subtext' : 'text-dark-text'}`}>
                                                {task.title}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 ml-8">
                                            <div className="flex items-center gap-2 text-sm flex-wrap">
                                                {task.due_date && (
                                                    <span className="text-xs text-dark-subtext">
                                                        {new Date(task.due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                )}
                                                {task.category === 'work' ? (
                                                    <span className="flex items-center gap-1 text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full text-xs">
                                                        <Briefcase size={12} />
                                                        Work
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full text-xs">
                                                        <User size={12} />
                                                        Personal
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Desktop Layout - Horizontal */}
                                    <div className="hidden md:flex items-center gap-4">
                                        <button className="flex-shrink-0" onClick={(e) => { e.stopPropagation(); toggleTask(task); }}>
                                            {task.is_done ? (
                                                <CheckCircle2 size={24} className="text-green-500" />
                                            ) : (
                                                <Circle size={24} className="text-dark-subtext" />
                                            )}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <p
                                                className={`font-medium break-words ${task.is_done
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
                                                                    Google Agenda
                                                                </a>
                                                                <button
                                                                    onClick={() => {
                                                                        downloadIcsFile(task)
                                                                        setActiveMenu(null)
                                                                    }}
                                                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-dark-text hover:bg-dark-hover hover:text-dark-text transition-colors"
                                                                >
                                                                    <Download size={14} />
                                                                    Télécharger .ics
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
                                                            Supprimer la tâche
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Completed Tasks Archive */}
                    {completedTasks.length > 0 && (
                        <div className="mt-8 border-t border-dark-border pt-6">
                            <button
                                onClick={() => setShowCompleted(!showCompleted)}
                                className="flex items-center gap-2 text-dark-subtext hover:text-dark-text transition-colors w-full group"
                            >
                                {showCompleted ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                <span className="font-medium">Tâches terminées ({completedTasks.length})</span>
                                <div className="h-px bg-dark-border flex-1 ml-2 group-hover:bg-dark-subtext transition-colors"></div>
                            </button>

                            {showCompleted && (
                                <div className="space-y-2 mt-4 animate-fadeIn">
                                    {completedTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="flex items-center gap-3 p-3 bg-dark-surface/50 rounded-lg hover:bg-dark-surface transition-colors cursor-pointer border border-dark-border/50"
                                            onClick={() => openTaskModal(task)}
                                        >
                                            <button className="flex-shrink-0" onClick={(e) => { e.stopPropagation(); toggleTask(task); }}>
                                                <CheckCircle2 size={20} className="text-green-500/70 hover:text-green-500 transition-colors" />
                                            </button>
                                            <p className="flex-1 text-sm min-w-0 break-words line-through text-dark-subtext">
                                                {task.title}
                                            </p>
                                            {task.category === 'work' ? (
                                                <span className="flex items-center gap-1 text-blue-400/70 bg-blue-500/5 px-2 py-0.5 rounded-full text-xs grayscale-[0.3]">
                                                    <Briefcase size={12} />
                                                    Travail
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-purple-400/70 bg-purple-500/5 px-2 py-0.5 rounded-full text-xs grayscale-[0.3]">
                                                    <User size={12} />
                                                    Personnel
                                                </span>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteTask(task.id);
                                                }}
                                                className="p-1 hover:bg-red-500/10 text-dark-subtext hover:text-red-500 rounded transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Task Details Modal */}
                    <TaskModal
                        task={selectedTask}
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onUpdate={handleUpdateTask}
                        onDelete={handleDeleteTask}
                    />
                </div>
            </div>
        </div>
    )
}
