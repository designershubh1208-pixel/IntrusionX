import { ArrowLeft, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { api } from '../../services/api'
import type { HealthStatus } from '../../types'
import { ThemeToggle } from '../ui/ThemeToggle'

export function Topbar({ title }: { title: string }) {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const navigate = useNavigate()
  const { theme } = useTheme()

  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth(null))
    const id = setInterval(() => {
      api.health().then(setHealth).catch(() => setHealth(null))
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  const isDark = theme === 'dark'

  return (
    <header
      className="h-14 flex items-center justify-between px-5 sticky top-0 z-20 backdrop-blur-sm"
      style={{
        background: isDark ? 'rgba(13,17,23,0.85)' : 'rgba(255,255,255,0.9)',
        borderBottom: `1px solid ${isDark ? '#1f2d45' : '#e2e8f0'}`,
      }}
    >
      {/* Left — back button + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          title="Back to home"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
          style={{
            color: isDark ? '#8b9ab5' : '#64748b',
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            border: `1px solid ${isDark ? '#1f2d45' : '#e2e8f0'}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = isDark ? '#e2e8f0' : '#0f172a'
            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = isDark ? '#8b9ab5' : '#64748b'
            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
          }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Home
        </button>

        <span style={{ color: isDark ? '#1f2d45' : '#e2e8f0' }}>|</span>

        <h1
          className="text-sm font-semibold"
          style={{ color: isDark ? '#e2e8f0' : '#0f172a' }}
        >
          {title}
        </h1>
      </div>

      {/* Right — status + theme toggle + refresh */}
      <div className="flex items-center gap-4">
        {health ? (
          <div className="flex items-center gap-1.5 text-xs text-emerald-500">
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Connected · {health.graph}</span>
          </div>
        ) : (
          <div
            className="flex items-center gap-1.5 text-xs"
            style={{ color: isDark ? '#4b5563' : '#94a3b8' }}
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Connecting…</span>
          </div>
        )}

        {health?.ai_available && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            AI Active
          </div>
        )}

        <ThemeToggle />

        <button
          onClick={() => window.location.reload()}
          title="Refresh"
          className="transition-colors"
          style={{ color: isDark ? '#4b5563' : '#94a3b8' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = isDark ? '#e2e8f0' : '#0f172a' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = isDark ? '#4b5563' : '#94a3b8' }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  )
}
