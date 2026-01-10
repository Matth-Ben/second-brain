import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { ChevronLeft, ChevronRight, Briefcase, User, CheckCircle2, Calendar as CalendarIcon } from 'lucide-react'
import { useIsMobile } from '../utils/platform'
import TaskModal from '../components/TaskModal'

export default function Planning({ session }) {
    const isMobile = useIsMobile()
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [hoveredTask, setHoveredTask] = useState(null)
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
    const [selectedTask, setSelectedTask] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // New states for Apple Calendar-style interface
    const [viewMode, setViewMode] = useState('month') // 'month' | 'week'
    const [selectedDate, setSelectedDate] = useState(null)
    const [showDayDetail, setShowDayDetail] = useState(false)

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

    // Generate calendar days for month view
    const calendarDays = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day)
    }

    // Get current week days (Monday to Sunday)
    const getCurrentWeekDays = () => {
        const today = new Date(currentDate)
        const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.
        const monday = new Date(today)

        // Adjust to get Monday (if Sunday, go back 6 days, otherwise go back currentDay - 1)
        const daysToMonday = currentDay === 0 ? 6 : currentDay - 1
        monday.setDate(today.getDate() - daysToMonday)

        const weekDays = []
        for (let i = 0; i < 7; i++) {
            const day = new Date(monday)
            day.setDate(monday.getDate() + i)
            weekDays.push(day)
        }
        return weekDays
    }

    const weekDays = getCurrentWeekDays()

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="spinner"></div>
            </div>
        )
    }

    const hoveredTaskData = tasks.find(t => t.id === hoveredTask)

    // Get tasks for selected date
    const selectedDateTasks = selectedDate ? tasks.filter(task => {
        if (!task.due_date) return false
        const taskDate = new Date(task.due_date)
        return taskDate.getDate() === selectedDate.getDate() &&
            taskDate.getMonth() === selectedDate.getMonth() &&
            taskDate.getFullYear() === selectedDate.getFullYear()
    }) : []

    // Day Detail View Component (for mobile full screen or desktop sidebar)
    const DayDetailView = () => {
        if (!selectedDate) return null

        const formattedDate = selectedDate.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })

        return (
            <div className={`${isMobile
                ? 'fixed inset-0 z-50 bg-dark-bg'
                : 'hidden md:block md:w-80 border-l border-dark-border'
                }`}>
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-dark-border">
                    {isMobile && (
                        <button
                            onClick={() => {
                                setShowDayDetail(false)
                                setSelectedDate(null)
                            }}
                            className="p-2 hover:bg-dark-hover rounded-lg transition-colors text-dark-text"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-dark-text capitalize">
                            {formattedDate}
                        </h3>
                        <p className="text-sm text-dark-subtext">
                            {selectedDateTasks.length} tâche{selectedDateTasks.length > 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {/* Tasks List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {selectedDateTasks.length === 0 ? (
                        <div className="text-center py-12">
                            <CalendarIcon size={48} className="mx-auto text-dark-subtext mb-4" />
                            <p className="text-dark-subtext mb-6">Aucune tâche pour ce jour</p>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    console.log('Button clicked, selectedDate:', selectedDate)
                                    setSelectedTask({
                                        title: '',
                                        description: '',
                                        due_date: selectedDate.toISOString().split('T')[0],
                                        is_done: false,
                                        category: 'work'
                                    })
                                    setIsModalOpen(true)
                                }}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                + Nouvelle tâche
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {selectedDateTasks.map(task => (
                                <div
                                    key={task.id}
                                    onClick={() => openTaskModal(task)}
                                    className="p-3 bg-dark-surface border border-dark-border rounded-lg hover:bg-dark-hover transition-colors cursor-pointer"
                                >
                                    <div className="flex items-start gap-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                // Toggle task completion would go here
                                            }}
                                            className="flex-shrink-0 mt-0.5"
                                        >
                                            {task.is_done ? (
                                                <CheckCircle2 size={20} className="text-green-500" />
                                            ) : (
                                                <div className="w-5 h-5 border-2 border-dark-border rounded-full"></div>
                                            )}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-medium ${task.is_done ? 'line-through text-dark-subtext' : 'text-dark-text'}`}>
                                                {task.title}
                                            </p>
                                            {task.description && (
                                                <p className="text-sm text-dark-subtext mt-1 line-clamp-2">
                                                    {task.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 mt-2">
                                                {task.category === 'work' ? (
                                                    <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">
                                                        <Briefcase size={12} />
                                                        Work
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">
                                                        <User size={12} />
                                                        Personal
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Add new task button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    console.log('Add task button clicked, selectedDate:', selectedDate)
                                    setSelectedTask({
                                        title: '',
                                        description: '',
                                        due_date: selectedDate.toISOString().split('T')[0],
                                        is_done: false,
                                        category: 'work'
                                    })
                                    setIsModalOpen(true)
                                }}
                                className="w-full p-3 text-dark-subtext hover:text-dark-text hover:bg-dark-hover rounded-lg transition-colors border border-dashed border-dark-border"
                            >
                                + Nouvelle tâche
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // Week View Component - Vertical list of days
    const WeekView = () => {
        return (
            <div className="space-y-4">
                {weekDays.map((date, index) => {
                    const dayTasks = tasks.filter(task => {
                        if (!task.due_date) return false
                        const taskDate = new Date(task.due_date)
                        return taskDate.toDateString() === date.toDateString()
                    })

                    const isToday = date.toDateString() === new Date().toDateString()
                    const dayName = dayNames[date.getDay()]
                    const formattedDate = date.toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long'
                    })

                    return (
                        <div
                            key={index}
                            className={`card ${isToday ? 'border-2 border-blue-500' : ''}`}
                        >
                            {/* Day Header */}
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-dark-border">
                                <div>
                                    <h3 className={`text-lg font-bold ${isToday ? 'text-blue-400' : 'text-dark-text'}`}>
                                        {dayName}
                                    </h3>
                                    <p className="text-sm text-dark-subtext">{formattedDate}</p>
                                </div>
                                <span className="text-sm text-dark-subtext">
                                    {dayTasks.length} tâche{dayTasks.length > 1 ? 's' : ''}
                                </span>
                            </div>

                            {/* Tasks List */}
                            <div className="space-y-2">
                                {dayTasks.map(task => (
                                    <div
                                        key={task.id}
                                        onClick={() => openTaskModal(task)}
                                        className="p-3 bg-dark-surface border border-dark-border rounded-lg hover:bg-dark-hover transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-start gap-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    // Toggle task completion
                                                }}
                                                className="flex-shrink-0 mt-0.5"
                                            >
                                                {task.is_done ? (
                                                    <CheckCircle2 size={20} className="text-green-500" />
                                                ) : (
                                                    <div className="w-5 h-5 border-2 border-dark-border rounded-full"></div>
                                                )}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-medium ${task.is_done ? 'line-through text-dark-subtext' : 'text-dark-text'}`}>
                                                    {task.title}
                                                </p>
                                                {task.description && (
                                                    <p className="text-sm text-dark-subtext mt-1 line-clamp-2">
                                                        {task.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2 mt-2">
                                                    {task.category === 'work' ? (
                                                        <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">
                                                            <Briefcase size={12} />
                                                            Work
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">
                                                            <User size={12} />
                                                            Personal
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Add new task area - Apple Calendar style */}
                                <div
                                    onClick={() => {
                                        // Create new task with this date
                                        setSelectedTask({
                                            title: '',
                                            description: '',
                                            due_date: date.toISOString().split('T')[0],
                                            is_done: false,
                                            category: 'work'
                                        })
                                        setIsModalOpen(true)
                                    }}
                                    className="p-3 text-dark-subtext hover:text-dark-text hover:bg-dark-hover rounded-lg transition-colors cursor-pointer border border-dashed border-dark-border"
                                >
                                    + Nouvelle tâche
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            {/* Mobile Header - Only show when not in day detail view */}
            {(!isMobile || !showDayDetail) && (
                <div className={`md:hidden sticky top-0 z-10 bg-dark-bg/95 backdrop-blur-md border-b border-dark-border px-4 flex items-center h-16 ${isMobile ? 'pt-[calc(0.5rem+env(safe-area-inset-top))]' : ''}`}>
                    <h1 className="text-xl font-bold text-dark-text">Planning</h1>
                </div>
            )}

            {/* Mobile: Show either calendar or day detail */}
            {isMobile && showDayDetail ? (
                <DayDetailView />
            ) : (
                <div className="flex-1 flex overflow-hidden">
                    {/* Calendar Section */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="max-w-6xl mx-auto p-4 md:p-8 pb-4 md:pb-8">
                            {/* Desktop Header */}
                            <div className="mb-8 hidden md:block">
                                <h1 className="text-3xl font-bold mb-2 text-dark-text">Planning</h1>
                                <p className="text-dark-subtext">Visualisez vos tâches dans le calendrier</p>
                            </div>

                            {/* Calendar Header */}
                            <div className="card mb-6">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                                    {/* View Mode Selector */}
                                    <div className="flex items-center gap-2 bg-dark-surface rounded-lg p-1 border border-dark-border">
                                        <button
                                            onClick={() => setViewMode('month')}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'month'
                                                ? 'bg-blue-600 text-white'
                                                : 'text-dark-subtext hover:text-dark-text'
                                                }`}
                                        >
                                            Mois
                                        </button>
                                        <button
                                            onClick={() => setViewMode('week')}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'week'
                                                ? 'bg-blue-600 text-white'
                                                : 'text-dark-subtext hover:text-dark-text'
                                                }`}
                                        >
                                            Semaine
                                        </button>
                                    </div>

                                    {/* Month/Week Title and Navigation */}
                                    <div className="flex items-center gap-3 flex-1 justify-center md:justify-end">
                                        <h2 className="text-xl md:text-2xl font-bold text-dark-text">
                                            {monthNames[month]} {year}
                                        </h2>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={goToToday}
                                                className="px-3 md:px-4 py-2 text-xs md:text-sm bg-dark-surface hover:bg-dark-hover text-dark-text rounded-lg transition-colors border border-dark-border"
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
                                </div>

                                {/* Conditional View: Month or Week */}
                                {viewMode === 'month' ? (
                                    <>
                                        {/* Day names header */}
                                        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
                                            {dayNames.map((day, index) => (
                                                <div
                                                    key={day}
                                                    className="text-center text-xs md:text-sm font-semibold text-dark-subtext py-2"
                                                >
                                                    {/* Show initials on mobile, full names on desktop */}
                                                    <span className="md:hidden">{day.charAt(0)}</span>
                                                    <span className="hidden md:inline">{day}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Calendar grid */}
                                        <div className="grid grid-cols-7 gap-1 md:gap-2">
                                            {calendarDays.map((day, index) => {
                                                if (day === null) {
                                                    return <div key={`empty-${index}`} className="aspect-square"></div>
                                                }

                                                const dayTasks = getTasksForDate(day)
                                                const today = isToday(day)
                                                const isSelected = selectedDate &&
                                                    selectedDate.getDate() === day &&
                                                    selectedDate.getMonth() === month &&
                                                    selectedDate.getFullYear() === year

                                                return (
                                                    <div
                                                        key={day}
                                                        onClick={() => {
                                                            const clickedDate = new Date(year, month, day)
                                                            setSelectedDate(clickedDate)
                                                            if (isMobile) {
                                                                setShowDayDetail(true)
                                                            }
                                                        }}
                                                        className={`aspect-square border rounded-lg p-1 md:p-2 transition-all cursor-pointer ${isSelected
                                                            ? 'border-blue-500 bg-blue-500/20 ring-2 ring-blue-500/50'
                                                            : today
                                                                ? 'border-blue-500 bg-blue-500/10'
                                                                : 'border-dark-border bg-dark-surface hover:bg-dark-hover'
                                                            }`}
                                                    >
                                                        <div className={`text-xs md:text-sm font-semibold mb-1 ${isSelected ? 'text-blue-400' : today ? 'text-blue-400' : 'text-dark-text'
                                                            }`}>
                                                            {day}
                                                        </div>

                                                        {/* Task count badge */}
                                                        {dayTasks.length > 0 && (
                                                            <div className="flex flex-wrap gap-0.5 md:gap-1">
                                                                {/* Show dots on mobile, small task indicators on desktop */}
                                                                <div className="md:hidden flex items-center justify-center w-full">
                                                                    <span className="text-[10px] bg-blue-500 text-white rounded-full px-1.5 py-0.5 font-medium">
                                                                        {dayTasks.length}
                                                                    </span>
                                                                </div>
                                                                {/* Desktop: show up to 3 task indicators */}
                                                                <div className="hidden md:flex flex-col gap-0.5 w-full">
                                                                    {dayTasks.slice(0, 3).map(task => (
                                                                        <div
                                                                            key={task.id}
                                                                            className={`text-[10px] px-1 py-0.5 rounded truncate ${task.category === 'work'
                                                                                ? 'bg-blue-500/20 text-blue-300'
                                                                                : 'bg-purple-500/20 text-purple-300'
                                                                                }`}
                                                                        >
                                                                            {task.is_done && '✓ '}{task.title}
                                                                        </div>
                                                                    ))}
                                                                    {dayTasks.length > 3 && (
                                                                        <div className="text-[10px] text-dark-subtext">
                                                                            +{dayTasks.length - 3}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    /* Week View */
                                    <WeekView />
                                )}
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
                            <div className="card mt-6">
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
                        </div>
                    </div>

                    {/* Desktop: Day Detail Sidebar */}
                    {!isMobile && selectedDate && <DayDetailView />}
                </div>
            )}

            {/* Task Details Modal - Always rendered */}
            <TaskModal
                task={selectedTask}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUpdate={handleUpdateTask}
                onDelete={handleDeleteTask}
            />
        </div>
    )
}
