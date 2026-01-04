import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FileText, LogOut, Settings } from 'lucide-react'
import { supabase } from '../supabaseClient'

export default function Sidebar() {
    const handleLogout = async () => {
        await supabase.auth.signOut()
    }

    const navItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/notes', icon: FileText, label: 'Notes' },
        { to: '/settings', icon: Settings, label: 'Settings' },
    ]

    return (
        <aside className="w-20 md:w-64 bg-dark-surface border-r border-dark-border flex flex-col">
            <nav className="flex-1 p-2 md:p-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center justify-center md:justify-start gap-3 px-3 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-blue-600 text-white'
                                : 'text-dark-subtext hover:bg-dark-hover hover:text-dark-text'
                            }`
                        }
                        title={item.label}
                    >
                        <item.icon size={24} className="shrink-0" />
                        <span className="font-medium hidden md:block">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-2 md:p-4 border-t border-dark-border">
                <button
                    onClick={handleLogout}
                    className="flex items-center justify-center md:justify-start gap-3 px-3 py-3 rounded-lg text-dark-subtext hover:bg-dark-hover hover:text-dark-text transition-colors w-full"
                    title="Logout"
                >
                    <LogOut size={24} className="shrink-0" />
                    <span className="font-medium hidden md:block">Logout</span>
                </button>
            </div>
        </aside>
    )
}
