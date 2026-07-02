import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import Avatar from './Avatar'

const navItems = [
  { to: '/',        label: 'Dashboard', icon: '🎯' },
  { to: '/buy',     label: 'Buy Token', icon: '💰' },
  { to: '/withdraw',label: 'Withdraw',  icon: '💸' },
  { to: '/history', label: 'History',   icon: '📋' },
]

export default function Layout() {
  const { user, isAdmin } = useAuth()
  const { profile } = useProfile()
  const navigate = useNavigate()

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'User'

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass border-b border-white/5 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center font-bold text-sm">S</div>
          <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Spin & SIP Money
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button onClick={() => navigate('/admin')} className="text-xs text-yellow-400 border border-yellow-400/30 px-2 py-1 rounded">
              Admin
            </button>
          )}
          <button onClick={() => navigate('/profile')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Avatar src={profile?.avatar_url} name={displayName} size="sm" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 max-w-lg mx-auto w-full">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="glass border-t border-white/5 flex sticky bottom-0">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 text-xs transition-colors ${
                isActive ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'
              }`
            }
          >
            <span className="text-lg">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
