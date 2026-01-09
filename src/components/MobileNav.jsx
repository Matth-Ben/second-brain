import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FileText, Calendar, Settings } from 'lucide-react'

export default function MobileNav() {
    const navItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/notes', icon: FileText, label: 'Notes' },
        { to: '/planning', icon: Calendar, label: 'Planning' },
        { to: '/settings', icon: Settings, label: 'Paramètres' },
    ]

    return (
        <nav className="bg-dark-surface border-t border-dark-border px-6 py-2 flex justify-between items-center pb-[calc(0.5rem+var(--safe-area-bottom))]">
            {navItems.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                        `flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isActive
                            ? 'text-blue-500'
                            : 'text-dark-subtext'
                        }`
                    }
                >
                    <item.icon size={24} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                </NavLink>
            ))}
        </nav>
    )
}
