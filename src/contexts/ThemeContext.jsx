import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
    // Initialize state from local storage or default to 'system'
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'system'
        }
        return 'system'
    })
    const [user, setUser] = useState(null)

    // Listen for auth changes AND fetch initial settings
    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchUserTheme(session.user.id)
            }
        })

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchUserTheme(session.user.id)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchUserTheme = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('user_settings')
                .select('theme')
                .eq('user_id', userId)
                .single()

            if (data?.theme) {
                setTheme(data.theme)
            }
        } catch (error) {
            console.error('Error fetching theme:', error)
        }
    }

    const updateTheme = async (newTheme) => {
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)

        if (user) {
            try {
                const { error } = await supabase
                    .from('user_settings')
                    .upsert({
                        user_id: user.id,
                        theme: newTheme,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id' })

                if (error) throw error
            } catch (error) {
                console.error('Error saving theme:', error)
            }
        }
    }

    useEffect(() => {
        const root = window.document.documentElement

        // Remove old classes
        root.classList.remove('light', 'dark')

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light'
            root.classList.add(systemTheme)
        } else {
            root.classList.add(theme)
        }
    }, [theme])

    // Listen for system changes if mode is 'system'
    useEffect(() => {
        if (theme !== 'system') return

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

        const handleChange = () => {
            const root = window.document.documentElement
            root.classList.remove('light', 'dark')
            root.classList.add(mediaQuery.matches ? 'dark' : 'light')
        }

        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [theme])

    return (
        <ThemeContext.Provider value={{ theme, setTheme: updateTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    return useContext(ThemeContext)
}
