import { clsx } from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useTheme } from '../../context/ThemeContext'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  children: ReactNode
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  children,
  className,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const variantStyle: React.CSSProperties =
    variant === 'primary'
      ? {
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          color: '#fff',
          border: '1px solid rgba(99,102,241,0.4)',
        }
      : variant === 'danger'
      ? {
          background: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)',
          color: '#ef4444',
          border: '1px solid rgba(239,68,68,0.3)',
        }
      : variant === 'ghost'
      ? {
          background: 'transparent',
          color: isDark ? '#6b7280' : '#64748b',
          border: '1px solid transparent',
        }
      : {
          background: isDark ? '#1a2235' : '#f8fafc',
          color: isDark ? '#e2e8f0' : '#0f172a',
          border: `1px solid ${isDark ? '#1f2d45' : '#e2e8f0'}`,
        }

  return (
    <button
      className={clsx(
        'inline-flex items-center gap-2 font-medium rounded-lg transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      style={{ ...variantStyle, ...style }}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon && <span className="w-4 h-4 flex items-center">{icon}</span>
      )}
      {children}
    </button>
  )
}
