import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, Trophy, User, Shield, Sun, Moon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/new-round', icon: PlusCircle, label: 'New Round' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaders' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function Layout() {
  const { profile, signOut } = useAuth()
  const { theme, toggle } = useTheme()
  const location = useLocation()

  const isCommissioner = profile?.role === 'commissioner' || profile?.role === 'admin'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="bg-green-700 dark:bg-green-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">Golfing with the Boyz</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="p-2 rounded-full hover:bg-green-600 dark:hover:bg-green-800 transition"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {isCommissioner && (
            <NavLink
              to="/admin"
              className={`p-2 rounded-full transition ${
                location.pathname === '/admin' ? 'bg-green-600' : 'hover:bg-green-600 dark:hover:bg-green-800'
              }`}
            >
              <Shield size={18} />
            </NavLink>
          )}
          <button
            onClick={signOut}
            className="text-sm bg-green-600 dark:bg-green-800 px-3 py-1.5 rounded-lg hover:bg-green-500 transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around py-2 z-50 safe-area-pb">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition text-xs ${
                isActive
                  ? 'text-green-700 dark:text-green-400 font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-green-600'
              }`
            }
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
