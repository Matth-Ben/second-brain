import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FileText, LogOut } from 'lucide-react'
import { supabase } from '../supabaseClient'

export default function Sidebar() {
    const handleLogout = async () => {
        await supabase.auth.signOut()
    }

    const navItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/notes', icon: FileText, label: 'Notes' },
    ]

    return (
        <aside className="w-64 bg-dark-surface border-r border-dark-border flex flex-col">
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:bg-dark-hover hover:text-white'
                            }`
                        }
                    >
                        <item.icon size={20} />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-dark-border">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-dark-hover hover:text-white transition-colors w-full"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    )
}
