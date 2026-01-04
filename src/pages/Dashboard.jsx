import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, CheckCircle2, Circle, Briefcase, User } from 'lucide-react'

export default function Dashboard({ session }) {
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [newTaskCategory, setNewTaskCategory] = useState('work')
    const [adding, setAdding] = useState(false)

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
                    },
                ])
                .select()

            if (error) throw error
            setTasks([...data, ...tasks])
            setNewTaskTitle('')
        } catch (error) {
            console.error('Error adding task:', error)
        } finally {
            setAdding(false)
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
                <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                <p className="text-gray-400">Manage your tasks and stay productive</p>
            </div>

            <div className="card mb-6">
                <form onSubmit={addTask} className="flex gap-3">
                    <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Add a new task..."
                        className="input-field flex-1"
                    />
                    <select
                        value={newTaskCategory}
                        onChange={(e) => setNewTaskCategory(e.target.value)}
                        className="input-field"
                    >
                        <option value="work">Work</option>
                        <option value="personal">Personal</option>
                    </select>
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
                    <div className="text-gray-500 mb-2">
                        <Circle size={48} className="mx-auto mb-4 opacity-50" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No tasks yet</h3>
                    <p className="text-gray-400">
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
                                    <Circle size={24} className="text-gray-500" />
                                )}
                            </button>

                            <div className="flex-1">
                                <p
                                    className={`font-medium ${task.is_done
                                        ? 'line-through text-gray-500'
                                        : 'text-white'
                                        }`}
                                >
                                    {task.title}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
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
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
