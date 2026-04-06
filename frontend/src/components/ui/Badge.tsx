import { clsx } from 'clsx'

interface BadgeProps {
  label: string
  variant?: 'high' | 'medium' | 'low' | 'info' | 'neutral'
  size?: 'sm' | 'md'
}

const variants = {
  high:    'bg-red-500/15 text-red-500 border border-red-500/30',
  medium:  'bg-amber-500/15 text-amber-500 border border-amber-500/30',
  low:     'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30',
  info:    'bg-blue-500/15 text-blue-500 border border-blue-500/30',
  neutral: 'bg-slate-500/10 text-slate-500 border border-slate-400/20',
}

export function Badge({ label, variant = 'neutral', size = 'sm' }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-semibold rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        variants[variant],
      )}
    >
      {label}
    </span>
  )
}

export function RiskBadge({ band }: { band: string }) {
  const v = band === 'HIGH' ? 'high' : band === 'MEDIUM' ? 'medium' : 'low'
  return <Badge label={band} variant={v} />
}
