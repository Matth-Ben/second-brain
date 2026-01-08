import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { ChevronLeft, ChevronRight, Briefcase, User, CheckCircle2, Calendar as CalendarIcon } from 'lucide-react'
import TaskModal from '../components/TaskModal'

export default function Planning({ session }) {
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [hoveredTask, setHoveredTask] = useState(null)
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
    const [selectedTask, setSelectedTask] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        fetchTasks()
    }, [])

    const fetchTasks = async () => {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', session.user.id)
                .not('due_date', 'is', null)
                .order('due_date', { ascending: true })

            if (error) throw error
            setTasks(data || [])
        } catch (error) {
            console.error('Error fetching tasks:', error)
            alert('Erreur lors du chargement des tâches: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    // Get calendar data
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const daysInMonth = lastDayOfMonth.getDate()
    const startingDayOfWeek = firstDayOfMonth.getDay()

    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]

    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

    // Navigate months
    const previousMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1))
    }

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1))
    }

    const goToToday = () => {
        setCurrentDate(new Date())
    }

    // Get tasks for a specific date
    const getTasksForDate = (day) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        return tasks.filter(task => {
            if (!task.due_date) return false
            const taskDate = task.due_date.split('T')[0]
            return taskDate === dateStr
        })
    }

    // Check if date is today
    const isToday = (day) => {
        const today = new Date()
        return day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
    }

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    // Handle task hover
    const handleTaskHover = (taskId, event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        setTooltipPosition({
            x: rect.left,
            y: rect.bottom + 4
        })
        setHoveredTask(taskId)
    }

    const openTaskModal = (task) => {
        setSelectedTask(task)
        setIsModalOpen(true)
        setHoveredTask(null) // Close tooltip when opening modal
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
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId)

            if (error) throw error

            setTasks(tasks.filter(t => t.id !== taskId))
        } catch (error) {
            console.error('Error deleting task:', error)
            alert('Erreur lors de la suppression: ' + error.message)
        }
    }

    // Generate calendar days
    const calendarDays = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="spinner"></div>
            </div>
        )
    }

    const hoveredTaskData = tasks.find(t => t.id === hoveredTask)

    return (
        <div className="max-w-7xl mx-auto p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 text-dark-text">Planning</h1>
                <p className="text-dark-subtext">Visualisez vos tâches dans un calendrier</p>
            </div>

            {/* Calendar Header */}
            <div className="card mb-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-dark-text">
                        {monthNames[month]} {year}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={goToToday}
                            className="px-4 py-2 text-sm bg-dark-surface hover:bg-dark-hover text-dark-text rounded-lg transition-colors border border-dark-border"
                        >
                            Aujourd'hui
                        </button>
                        <button
                            onClick={previousMonth}
                            className="p-2 hover:bg-dark-hover rounded-lg transition-colors text-dark-text"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={nextMonth}
                            className="p-2 hover:bg-dark-hover rounded-lg transition-colors text-dark-text"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Day names header */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {dayNames.map(day => (
                        <div
                            key={day}
                            className="text-center text-sm font-semibold text-dark-subtext py-2"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, index) => {
                        if (day === null) {
                            return <div key={`empty-${index}`} className="aspect-square"></div>
                        }

                        const dayTasks = getTasksForDate(day)
                        const today = isToday(day)

                        return (
                            <div
                                key={day}
                                className={`aspect-square border rounded-lg p-2 transition-colors ${today
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-dark-border bg-dark-surface hover:bg-dark-hover'
                                    }`}
                            >
                                <div className={`text-sm font-semibold mb-1 ${today ? 'text-blue-400' : 'text-dark-text'
                                    }`}>
                                    {day}
                                </div>
                                <div className="space-y-1 overflow-y-auto max-h-24">
                                    {dayTasks.map(task => (
                                        <div
                                            key={task.id}
                                            onMouseEnter={(e) => handleTaskHover(task.id, e)}
                                            onMouseLeave={() => setHoveredTask(null)}
                                            onClick={() => openTaskModal(task)}
                                            className={`text-xs p-1 rounded flex items-center gap-1 cursor-pointer transition-all ${task.category === 'work'
                                                    ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                                                    : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                                                }`}
                                        >
                                            {task.is_done && (
                                                <CheckCircle2 size={10} className="flex-shrink-0 text-green-500" />
                                            )}
                                            {task.category === 'work' ? (
                                                <Briefcase size={10} className="flex-shrink-0" />
                                            ) : (
                                                <User size={10} className="flex-shrink-0" />
                                            )}
                                            <span className={`truncate ${task.is_done ? 'line-through opacity-60' : ''}`}>
                                                {task.title}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Tooltip - Rendered at root level with fixed positioning */}
            {
                hoveredTask && hoveredTaskData && (
                    <div
                        className="fixed z-[9999] w-64 bg-dark-bg border border-dark-border rounded-lg shadow-2xl p-3 animate-fadeIn pointer-events-none"
                        style={{
                            left: `${tooltipPosition.x}px`,
                            top: `${tooltipPosition.y}px`,
                        }}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-semibold text-dark-text pr-2">
                                {hoveredTaskData.title}
                            </h4>
                            {hoveredTaskData.is_done && (
                                <CheckCircle2 size={16} className="flex-shrink-0 text-green-500" />
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs">
                                {hoveredTaskData.category === 'work' ? (
                                    <span className="flex items-center gap-1 text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">
                                        <Briefcase size={12} />
                                        Professionnel
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">
                                        <User size={12} />
                                        Personnel
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-dark-subtext">
                                <CalendarIcon size={12} />
                                <span>{formatDate(hoveredTaskData.due_date)}</span>
                            </div>

                            <div className="text-xs">
                                <span className={`font-medium ${hoveredTaskData.is_done
                                    ? 'text-green-500'
                                    : 'text-yellow-500'
                                    }`}>
                                    {hoveredTaskData.is_done ? '✓ Complétée' : '○ En cours'}
                                </span>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Legend */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4 text-dark-text">Légende</h3>
                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-blue-500/20 border border-blue-500/50"></div>
                        <span className="text-sm text-dark-text">Tâches professionnelles</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-purple-500/20 border border-purple-500/50"></div>
                        <span className="text-sm text-dark-text">Tâches personnelles</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-green-500" />
                        <span className="text-sm text-dark-text">Tâche complétée</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-500/10"></div>
                        <span className="text-sm text-dark-text">Aujourd'hui</span>
                    </div>
                </div>
            </div>

            {/* Task Details Modal */}
            <TaskModal
                task={selectedTask}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUpdate={handleUpdateTask}
                onDelete={handleDeleteTask}
            />
        </div >
    )
}


