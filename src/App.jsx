import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { StatusBar, Style } from '@capacitor/status-bar'
import { isMobile } from './utils/platform'
import { supabase } from './supabaseClient'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Notes from './pages/Notes'
import Planning from './pages/Planning'
import Settings from './pages/Settings'
import Sidebar from './components/Sidebar'
import MobileNav from './components/MobileNav'
import TitleBar from './components/TitleBar'
import UpdateNotification from './components/UpdateNotification'

function App() {
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setLoading(false)
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })

        return () => subscription.unsubscribe()
    }, [])

    useEffect(() => {
        if (isMobile) {
            StatusBar.setStyle({ style: Style.Dark })
            StatusBar.setBackgroundColor({ color: '#0a0a0a' })
        }
    }, [])

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-dark-bg">
                <div className="spinner"></div>
            </div>
        )
    }

    if (!session) {
        return <Auth />
    }

    return (
        <HashRouter>
            <div className="flex flex-col h-screen bg-dark-bg">
                <TitleBar />
                <div className="flex flex-1 overflow-hidden relative">
                    <div className="hidden md:block h-full">
                        <Sidebar />
                    </div>
                    <main className="flex-1 overflow-auto w-full pb-20 md:pb-0">
                        <Routes>
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/dashboard" element={<Dashboard session={session} />} />
                            <Route path="/notes" element={<Notes session={session} />} />
                            <Route path="/planning" element={<Planning session={session} />} />
                            <Route path="/settings" element={<Settings session={session} />} />
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </main>
                    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
                        <MobileNav />
                    </div>
                </div>
            </div>
            <UpdateNotification />
        </HashRouter>
    )
}

export default App
