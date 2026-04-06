import { clsx } from 'clsx'
import {
  Activity,
  Brain,
  GitBranch,
  LayoutDashboard,
  Play,
  Shield,
  ShieldAlert,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

const nav = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/graph',        icon: GitBranch,       label: 'Network Graph' },
  { to: '/attack-paths', icon: ShieldAlert,     label: 'Attack Paths' },
  { to: '/risk',         icon: Activity,        label: 'Risk Score' },
  { to: '/simulate',     icon: Play,            label: 'Simulation' },
  { to: '/ai-defense',   icon: Brain,           label: 'AI Defense' },
]

export function Sidebar() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-56 flex flex-col z-30 transition-colors duration-200"
      style={{
        background: isDark ? '#0d1117' : '#ffffff',
        borderRight: `1px solid ${isDark ? '#1f2d45' : '#e2e8f0'}`,
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-5 py-5"
        style={{ borderBottom: `1px solid ${isDark ? '#1f2d45' : '#e2e8f0'}` }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
        >
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <p
            className="text-sm font-semibold leading-none"
            style={{ color: isDark ? '#e2e8f0' : '#0f172a' }}
          >
            IntrusionX
          </p>
          <p
            className="text-[10px] mt-0.5"
            style={{ color: isDark ? '#4b5563' : '#94a3b8' }}
          >
            AI Threat Intelligence
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p
          className="px-2 text-[10px] font-semibold uppercase tracking-widest mb-2"
          style={{ color: isDark ? '#374151' : '#cbd5e1' }}
        >
          Platform
        </p>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                isActive ? 'nav-active' : 'nav-inactive',
              )
            }
            style={({ isActive }) =>
              isActive
                ? {
                    background: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)',
                    color: '#818cf8',
                    border: `1px solid ${isDark ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.2)'}`,
                  }
                : {
                    color: isDark ? '#6b7280' : '#64748b',
                    border: '1px solid transparent',
                  }
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: isActive ? '#818cf8' : isDark ? '#6b7280' : '#94a3b8' }}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div
        className="px-4 py-4"
        style={{ borderTop: `1px solid ${isDark ? '#1f2d45' : '#e2e8f0'}` }}
      >
        <p
          className="text-[10px]"
          style={{ color: isDark ? '#374151' : '#cbd5e1' }}
        >
          v2.0.0 · TigerGraph Cloud
        </p>
      </div>
    </aside>
  )
}
