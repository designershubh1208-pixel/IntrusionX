import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative w-14 h-7 rounded-full transition-all duration-300 flex items-center px-1 flex-shrink-0"
      style={{
        background: theme === 'dark'
          ? 'linear-gradient(135deg, #1e3a5f, #1f2d45)'
          : 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
        border: theme === 'dark' ? '1px solid #2d3f5e' : '1px solid #93c5fd',
        boxShadow: theme === 'dark'
          ? 'inset 0 1px 3px rgba(0,0,0,0.4)'
          : 'inset 0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      {/* Track icons */}
      <Moon className="absolute left-1.5 w-3 h-3 text-slate-400 opacity-60" />
      <Sun className="absolute right-1.5 w-3 h-3 text-amber-500 opacity-60" />

      {/* Thumb */}
      <span
        className="relative z-10 w-5 h-5 rounded-full flex items-center justify-center shadow-md transition-all duration-300"
        style={{
          transform: theme === 'dark' ? 'translateX(0)' : 'translateX(28px)',
          background: theme === 'dark'
            ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
            : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
          boxShadow: theme === 'dark'
            ? '0 0 8px rgba(99,102,241,0.6)'
            : '0 0 8px rgba(251,191,36,0.6)',
        }}
      >
        {theme === 'dark'
          ? <Moon className="w-2.5 h-2.5 text-white" />
          : <Sun className="w-2.5 h-2.5 text-white" />
        }
      </span>
    </button>
  )
}
