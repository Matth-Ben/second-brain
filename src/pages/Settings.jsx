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
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    ArrowLeft
} from 'lucide-react'

import { isElectron, useIsMobile } from '../utils/platform'

export default function Settings({ session }) {
    const isMobile = useIsMobile()
    const { theme, setTheme } = useTheme()
    const [activeTab, setActiveTab] = useState('appearance')
    const [mobileView, setMobileView] = useState('list') // 'list' | 'detail'
    const [isExporting, setIsExporting] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [notification, setNotification] = useState(null) // { type: 'success' | 'error', message: '' }

    // Pour la version, idéalement on l'importerait de package.json, 
    // mais pour l'instant on va utiliser une constante ou le récupérer via IPC si possible
    const [appVersion, setAppVersion] = useState('Loading...')

    useEffect(() => {
        if (isElectron) {
            window.electronAPI.getAppVersion().then(version => {
                setAppVersion(version)
            })

            // Listen for update results
            const cleanupNotAvailable = window.electronAPI.onUpdateNotAvailable(() => {
                showNotification('success', 'Vous utilisez la dernière version.')
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
        } else if (isMobile) {
            // TODO: Use @capacitor/app to get real version
            setAppVersion('1.2.0 (Mobile)')
        } else {
            setAppVersion('1.2.0 (Web)')
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
            showNotification('error', 'Les mots de passe ne correspondent pas !')
            return
        }

        if (newPassword.length < 6) {
            showNotification('error', 'Le mot de passe doit contenir au moins 6 caractères')
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword })
            if (error) throw error
            showNotification('success', 'Mot de passe mis à jour avec succès !')
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
            showNotification('error', 'Échec de l\'exportation')
        } finally {
            setIsExporting(false)
        }
    }

    const checkForUpdates = () => {
        if (isElectron) {
            window.electronAPI.checkForUpdates() // Déclenche la vérification manuelle
            showNotification('success', 'Vérification en cours...')
        } else {
            showNotification('info', 'Les mises à jour sont gérées par le store sur mobile.')
        }
    }

    const tabs = [
        { id: 'appearance', label: 'Apparence', icon: Palette },
        { id: 'account', label: 'Compte', icon: User },
        { id: 'data', label: 'Données', icon: Database },
        { id: 'about', label: 'À propos', icon: Info },
    ]

    return (
        <div className="flex h-full bg-dark-bg text-gray-200 relative overflow-hidden">
            {/* Mobile Header - Consistent with other pages */}
            {isMobile && mobileView === 'list' && (
                <div className={`fixed top-0 left-0 right-0 z-20 bg-dark-bg/95 backdrop-blur-md border-b border-dark-border px-4 flex items-center h-16 ${isMobile ? 'pt-[calc(0.5rem+env(safe-area-inset-top))]' : ''}`}>
                    <h1 className="text-xl font-bold text-dark-text">Paramètres</h1>
                </div>
            )}

            {/* Sidebar / Mobile List View */}
            <div className={`
                flex-col bg-dark-surface/50 border-r border-dark-border transition-all duration-300
                ${isMobile ? (mobileView === 'list' ? 'w-full flex z-10' : 'hidden') : 'w-64 flex'}
                h-full
            `}>
                {/* Desktop Title Only */}
                {!isMobile && (
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-dark-text px-2">Paramètres</h2>
                    </div>
                )}

                <nav className={`space-y-2 px-4 flex-1 overflow-y-auto ${isMobile ? 'pt-20' : ''}`}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id)
                                if (isMobile) setMobileView('detail')
                            }}
                            className={`w-full flex items-center justify-between p-4 md:px-3 md:py-2 rounded-xl md:rounded-lg transition-all
                                ${activeTab === tab.id && !isMobile
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                    : 'bg-dark-surface/50 md:bg-transparent text-dark-subtext hover:bg-dark-hover hover:text-dark-text border border-dark-border/50 md:border-transparent'
                                }`}
                        >
                            <div className="flex items-center gap-4 md:gap-3">
                                <tab.icon size={isMobile ? 22 : 18} />
                                <span className="text-lg md:text-sm font-medium">{tab.label}</span>
                            </div>
                            {isMobile && <ChevronRight size={20} className="text-dark-subtext" />}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content / Mobile Detail View */}
            <div className={`
                flex-1 bg-dark-bg overflow-y-auto
                ${isMobile
                    ? `fixed inset-0 z-50 transition-transform duration-300 ${mobileView === 'detail' ? 'translate-x-0' : 'translate-x-full'}`
                    : 'static block'}
            `}>
                {/* Mobile Header with Back Button */}
                {isMobile && (
                    <div className="sticky top-0 z-20 bg-dark-bg/95 backdrop-blur-md border-b border-dark-border px-4 py-3 flex items-center gap-4 pt-[calc(1rem+var(--safe-area-top))]">
                        <button
                            onClick={() => setMobileView('list')}
                            className="p-2 -ml-2 rounded-full hover:bg-dark-hover text-dark-text active:scale-95 transition-transform"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <h2 className="text-xl font-bold text-dark-text">
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h2>
                    </div>
                )}

                <div className={`max-w-2xl mx-auto ${isMobile ? 'p-4 pb-24' : 'p-8'}`}>
                    {/* APPARENCE */}
                    {activeTab === 'appearance' && (
                        <section className="space-y-6 animate-fade-in">
                            {!isMobile && <h3 className="text-2xl font-bold text-dark-text mb-6">Apparence</h3>}

                            <div className="bg-dark-surface p-6 rounded-xl border border-dark-border">
                                <h4 className="font-medium text-dark-text mb-4">Préférence de thème</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <button
                                        onClick={() => setTheme('light')}
                                        className={`p-4 rounded-lg border-2 flex md:flex-col items-center gap-4 md:gap-2 transition-all ${theme === 'light'
                                            ? 'border-blue-500 bg-blue-500/10 text-dark-text'
                                            : 'border-dark-border hover:border-dark-subtext text-dark-subtext hover:text-dark-text hover:bg-dark-hover'
                                            }`}
                                    >
                                        <div className="w-12 h-12 md:w-full md:h-20 bg-gray-200 rounded opacity-50 border border-gray-300 flex-shrink-0"></div>
                                        <span className="font-medium">Clair</span>
                                    </button>

                                    <button
                                        onClick={() => setTheme('dark')}
                                        className={`p-4 rounded-lg border-2 flex md:flex-col items-center gap-4 md:gap-2 transition-all ${theme === 'dark'
                                            ? 'border-blue-500 bg-blue-500/10 text-dark-text'
                                            : 'border-dark-border hover:border-dark-subtext text-dark-subtext hover:text-dark-text hover:bg-dark-hover'
                                            }`}
                                    >
                                        <div className="w-12 h-12 md:w-full md:h-20 bg-[#0a0a0a] rounded border border-gray-700 flex-shrink-0"></div>
                                        <span className="font-medium">Sombre</span>
                                    </button>

                                    <button
                                        onClick={() => setTheme('system')}
                                        className={`p-4 rounded-lg border-2 flex md:flex-col items-center gap-4 md:gap-2 transition-all ${theme === 'system'
                                            ? 'border-blue-500 bg-blue-500/10 text-dark-text'
                                            : 'border-dark-border hover:border-dark-subtext text-dark-subtext hover:text-dark-text hover:bg-dark-hover'
                                            }`}
                                    >
                                        <div className="w-12 h-12 md:w-full md:h-20 bg-gradient-to-r from-gray-200 to-[#0a0a0a] rounded border border-gray-400 flex-shrink-0"></div>
                                        <span className="font-medium">Système</span>
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* COMPTE */}
                    {activeTab === 'account' && (
                        <section className="space-y-6 animate-fade-in">
                            {!isMobile && <h3 className="text-2xl font-bold text-dark-text mb-6">Compte</h3>}

                            <div className="bg-dark-surface p-6 rounded-xl border border-dark-border">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                                        {session?.user.email[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-lg font-medium text-dark-text">Connecté en tant que</h4>
                                        <p className="text-dark-subtext truncate">{session?.user.email}</p>
                                    </div>
                                </div>

                                {/* Password Change Section */}
                                <div className="mb-6 pt-6 border-t border-dark-border">
                                    <h5 className="font-medium text-dark-text mb-4">Changer le mot de passe</h5>
                                    <form onSubmit={handlePasswordChange} className="space-y-3">
                                        <input
                                            type="password"
                                            placeholder="Nouveau mot de passe"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className={`w-full bg-dark-bg border rounded-lg px-3 py-2 text-dark-text focus:outline-none transition-colors ${!confirmPassword
                                                ? 'border-dark-border focus:border-blue-500'
                                                : newPassword === confirmPassword
                                                    ? 'border-green-500 focus:border-green-500'
                                                    : 'border-red-500 focus:border-red-500'
                                                }`}
                                            minLength={6}
                                        />
                                        <input
                                            type="password"
                                            placeholder="Confirmer le mot de passe"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className={`w-full bg-dark-bg border rounded-lg px-3 py-2 text-dark-text focus:outline-none transition-colors ${!confirmPassword
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
                                            className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                        >
                                            {loading ? 'Mise à jour...' : 'Mettre à jour'}
                                        </button>
                                    </form>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center justify-center md:justify-start gap-2 px-4 py-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors w-full"
                                >
                                    <LogOut size={18} />
                                    Se déconnecter
                                </button>
                            </div>
                        </section>
                    )}

                    {/* DONNÉES */}
                    {activeTab === 'data' && (
                        <section className="space-y-6 animate-fade-in">
                            {!isMobile && <h3 className="text-2xl font-bold text-dark-text mb-6">Gestion des données</h3>}

                            <div className="bg-dark-surface p-6 rounded-xl border border-dark-border">
                                <h4 className="font-medium text-dark-text mb-2">Exporter les données</h4>
                                <p className="text-dark-subtext text-sm mb-6">
                                    Téléchargez une sauvegarde JSON de toutes vos tâches et notes.
                                </p>

                                <button
                                    onClick={handleExportData}
                                    disabled={isExporting}
                                    className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-dark-hover hover:bg-gray-600 text-dark-text rounded-lg transition-colors border border-dark-border"
                                >
                                    {isExporting ? (
                                        <RefreshCw size={18} className="animate-spin" />
                                    ) : (
                                        <Download size={18} />
                                    )}
                                    {isExporting ? 'Exportation...' : 'Exporter en JSON'}
                                </button>
                            </div>
                        </section>
                    )}

                    {/* À PROPOS */}
                    {activeTab === 'about' && (
                        <section className="space-y-6 animate-fade-in">
                            {!isMobile && <h3 className="text-2xl font-bold text-dark-text mb-6">À propos</h3>}

                            <div className="bg-dark-surface p-6 rounded-xl border border-dark-border text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                                    <Database size={32} className="text-white" />
                                </div>
                                <h4 className="text-xl font-bold text-dark-text">Second Brain</h4>
                                <p className="text-dark-subtext mb-6">v{appVersion}</p>

                                <button
                                    onClick={checkForUpdates}
                                    className="text-sm text-blue-500 hover:text-blue-400 underline"
                                >
                                    Vérifier les mises à jour
                                </button>

                                <p className="text-xs text-dark-subtext mt-8">
                                    Créé avec Electron, React & Supabase.
                                </p>
                            </div>
                        </section>
                    )}

                </div>
            </div>

            {/* Global Notification Panel */}
            {notification && (
                <div className={`fixed top-12 right-6 left-6 md:left-auto px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-fade-in z-[60] min-w-0 md:min-w-[300px] ${notification.type === 'success'
                    ? 'bg-dark-surface border-green-500/50 text-green-400'
                    : 'bg-dark-surface border-red-500/50 text-red-400'
                    }`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="font-medium truncate">{notification.message}</span>
                </div>
            )}
        </div>
    )
}
