import { clsx } from 'clsx'
import { useTheme } from '../../context/ThemeContext'

export function Skeleton({ className }: { className?: string }) {
  const { theme } = useTheme()
  return (
    <div
      className={clsx('animate-pulse rounded', className)}
      style={{ background: theme === 'dark' ? '#1a2235' : '#e2e8f0' }}
    />
  )
}

export function SkeletonCard() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <div
      className="rounded-xl p-5 space-y-3"
      style={{
        background: isDark ? '#111827' : '#ffffff',
        border: `1px solid ${isDark ? '#1f2d45' : '#e2e8f0'}`,
      }}
    >
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-8 w-24 mt-2" />
    </div>
  )
}
