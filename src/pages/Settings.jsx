import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { supabase } from '../supabaseClient'
import {
    Palette,
    User,
    Database,
    Info,
    LogOut,
    Download,
    RefreshCw
} from 'lucide-react'

export default function Settings({ session }) {
    const { theme, setTheme } = useTheme()
    const [activeTab, setActiveTab] = useState('appearance')
    const [isExporting, setIsExporting] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [notification, setNotification] = useState(null) // { type: 'success' | 'error', message: '' }

    // Pour la version, idéalement on l'importerait de package.json, 
    // mais pour l'instant on va utiliser une constante ou le récupérer via IPC si possible
    const [appVersion, setAppVersion] = useState('Loading...')

    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.getAppVersion().then(version => {
                setAppVersion(version)
            })

            // Listen for update results
            const cleanupNotAvailable = window.electronAPI.onUpdateNotAvailable(() => {
                showNotification('success', 'You are on the latest version.')
            })

            const cleanupError = window.electronAPI.onUpdateError((err) => {
                // Already handled by UpdateNotification component for global errors, 
                // but we can also handle it here if we want specific feedback for the manual check.
                console.log('Update check error in Settings:', err)
            })

            return () => {
                cleanupNotAvailable()
                cleanupError()
            }
        }
    }, [])

    const showNotification = (type, message) => {
        setNotification({ type, message })
        setTimeout(() => setNotification(null), 3000)
    }

    const handlePasswordChange = async (e) => {
        e.preventDefault()
        if (!newPassword || !confirmPassword) return

        if (newPassword !== confirmPassword) {
            showNotification('error', 'Passwords do not match!')
            return
        }

        if (newPassword.length < 6) {
            showNotification('error', 'Password must be at least 6 characters')
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword })
            if (error) throw error
            showNotification('success', 'Password updated successfully!')
            setNewPassword('')
            setConfirmPassword('')
        } catch (error) {
            showNotification('error', error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
    }

    const handleExportData = async () => {
        setIsExporting(true)
        try {
            // 1. Fetch data
            const { data: tasks } = await supabase.from('tasks').select('*')
            const { data: notes } = await supabase.from('notes').select('*')

            const backup = {
                exportDate: new Date().toISOString(),
                user: session.user.email,
                tasks,
                notes
            }

            // 2. Create blob link
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)

            // 3. Trigger download
            const a = document.createElement('a')
            a.href = url
            a.download = `second-brain-backup-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (error) {
            showNotification('error', 'Export failed')
        } finally {
            setIsExporting(false)
        }
    }

    const checkForUpdates = () => {
        if (window.electronAPI) {
            window.electronAPI.checkForUpdates() // Déclenche la vérification manuelle
            showNotification('success', 'Vérification en cours...')
        } else {
            showNotification('error', 'Fonctionnalité disponible uniquement sur l\'application bureau.')
        }
    }

    const tabs = [
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'account', label: 'Account', icon: User },
        { id: 'data', label: 'Data', icon: Database },
        { id: 'about', label: 'About', icon: Info },
    ]

    return (
        <div className="flex h-full bg-dark-bg text-gray-200">
            {/* Sidebar des Paramètres */}
            <div className="w-64 border-r border-dark-border p-4 bg-dark-surface/50">
                <h2 className="text-xl font-bold mb-6 text-white px-2">Settings</h2>
                <nav className="space-y-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === tab.id
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <tab.icon size={18} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Contenu */}
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-2xl mx-auto">

                    {/* APPARENCE */}
                    {activeTab === 'appearance' && (
                        <section className="space-y-6 animate-fade-in">
                            <h3 className="text-2xl font-bold text-white mb-6">Appearance</h3>

                            <div className="bg-dark-surface p-6 rounded-xl border border-dark-border">
                                <h4 className="font-medium text-white mb-4">Theme Preference</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <button
                                        onClick={() => setTheme('light')}
                                        className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${theme === 'light'
                                            ? 'border-blue-500 bg-blue-500/10 text-white'
                                            : 'border-dark-border hover:border-gray-500 text-gray-400'
                                            }`}
                                    >
                                        <div className="w-full h-20 bg-gray-200 rounded mb-2 opacity-50"></div>
                                        <span>Light</span>
                                    </button>

                                    <button
                                        onClick={() => setTheme('dark')}
                                        className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${theme === 'dark'
                                            ? 'border-blue-500 bg-blue-500/10 text-white'
                                            : 'border-dark-border hover:border-gray-500 text-gray-400'
                                            }`}
                                    >
                                        <div className="w-full h-20 bg-[#0a0a0a] rounded mb-2 border border-gray-700"></div>
                                        <span>Dark</span>
                                    </button>

                                    <button
                                        onClick={() => setTheme('system')}
                                        className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${theme === 'system'
                                            ? 'border-blue-500 bg-blue-500/10 text-white'
                                            : 'border-dark-border hover:border-gray-500 text-gray-400'
                                            }`}
                                    >
                                        <div className="w-full h-20 bg-gradient-to-r from-gray-200 to-[#0a0a0a] rounded mb-2 border border-gray-700"></div>
                                        <span>System</span>
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* COMPTE */}
                    {activeTab === 'account' && (
                        <section className="space-y-6 animate-fade-in">
                            <h3 className="text-2xl font-bold text-white mb-6">Account</h3>

                            <div className="bg-dark-surface p-6 rounded-xl border border-dark-border">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                                        {session?.user.email[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-medium text-white">Logged in as</h4>
                                        <p className="text-gray-400">{session?.user.email}</p>
                                    </div>
                                </div>

                                {/* Password Change Section */}
                                <div className="mb-6 pt-6 border-t border-dark-border">
                                    <h5 className="font-medium text-white mb-4">Change Password</h5>
                                    <form onSubmit={handlePasswordChange} className="space-y-3">
                                        <input
                                            type="password"
                                            placeholder="New Password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className={`w-full bg-dark-bg border rounded-lg px-3 py-2 text-white focus:outline-none transition-colors ${!confirmPassword
                                                ? 'border-dark-border focus:border-blue-500'
                                                : newPassword === confirmPassword
                                                    ? 'border-green-500 focus:border-green-500'
                                                    : 'border-red-500 focus:border-red-500'
                                                }`}
                                            minLength={6}
                                        />
                                        <input
                                            type="password"
                                            placeholder="Confirm New Password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className={`w-full bg-dark-bg border rounded-lg px-3 py-2 text-white focus:outline-none transition-colors ${!confirmPassword
                                                ? 'border-dark-border focus:border-blue-500'
                                                : newPassword === confirmPassword
                                                    ? 'border-green-500 focus:border-green-500'
                                                    : 'border-red-500 focus:border-red-500'
                                                }`}
                                            minLength={6}
                                        />
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                        >
                                            {loading ? 'Updating...' : 'Update Password'}
                                        </button>
                                    </form>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors w-full"
                                >
                                    <LogOut size={18} />
                                    Log out
                                </button>
                            </div>
                        </section>
                    )}

                    {/* DONNÉES */}
                    {activeTab === 'data' && (
                        <section className="space-y-6 animate-fade-in">
                            <h3 className="text-2xl font-bold text-white mb-6">Data Management</h3>

                            <div className="bg-dark-surface p-6 rounded-xl border border-dark-border">
                                <h4 className="font-medium text-white mb-2">Export Data</h4>
                                <p className="text-gray-400 text-sm mb-6">
                                    Download a JSON backup of all your tasks and notes.
                                </p>

                                <button
                                    onClick={handleExportData}
                                    disabled={isExporting}
                                    className="flex items-center gap-2 px-4 py-2 bg-dark-hover hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-600"
                                >
                                    {isExporting ? (
                                        <RefreshCw size={18} className="animate-spin" />
                                    ) : (
                                        <Download size={18} />
                                    )}
                                    {isExporting ? 'Exporting...' : 'Export to JSON'}
                                </button>
                            </div>
                        </section>
                    )}

                    {/* À PROPOS */}
                    {activeTab === 'about' && (
                        <section className="space-y-6 animate-fade-in">
                            <h3 className="text-2xl font-bold text-white mb-6">About</h3>

                            <div className="bg-dark-surface p-6 rounded-xl border border-dark-border text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                                    <Database size={32} className="text-white" />
                                </div>
                                <h4 className="text-xl font-bold text-white">Second Brain</h4>
                                <p className="text-gray-400 mb-6">v{appVersion}</p>

                                <button
                                    onClick={checkForUpdates}
                                    className="text-sm text-blue-400 hover:text-blue-300 underline"
                                >
                                    Check for updates
                                </button>

                                <p className="text-xs text-gray-500 mt-8">
                                    Built with Electron, React & Supabase.
                                </p>
                            </div>
                        </section>
                    )}

                </div>
            </div>

            {/* Global Notification Panel */}
            {notification && (
                <div className={`fixed top-12 right-6 px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-fade-in z-50 min-w-[300px] ${notification.type === 'success'
                    ? 'bg-dark-surface border-green-500/50 text-green-400'
                    : 'bg-dark-surface border-red-500/50 text-red-400'
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="font-medium">{notification.message}</span>
                </div>
            )}
        </div>
    )
}
