import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Notes from './pages/Notes'
import Settings from './pages/Settings'
import Sidebar from './components/Sidebar'
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
            <TitleBar />
            <div className="flex h-[calc(100vh-2rem)] bg-dark-bg">
                <Sidebar />
                <main className="flex-1 overflow-auto">
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard session={session} />} />
                        <Route path="/notes" element={<Notes session={session} />} />
                        <Route path="/settings" element={<Settings session={session} />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </main>
            </div>
            <UpdateNotification />
        </HashRouter>
    )
}

export default App
