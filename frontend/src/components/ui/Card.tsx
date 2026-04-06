import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTheme } from '../../context/ThemeContext'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: boolean
}

export function Card({ children, className, padding = true }: CardProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div
      className={clsx('rounded-xl transition-colors duration-200', padding && 'p-5', className)}
      style={{
        background: isDark ? '#111827' : '#ffffff',
        border: `1px solid ${isDark ? '#1f2d45' : '#e2e8f0'}`,
        boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3
          className="text-sm font-semibold"
          style={{ color: isDark ? '#e2e8f0' : '#0f172a' }}
        >
          {title}
        </h3>
        {subtitle && (
          <p
            className="text-xs mt-0.5"
            style={{ color: isDark ? '#4b5563' : '#94a3b8' }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
