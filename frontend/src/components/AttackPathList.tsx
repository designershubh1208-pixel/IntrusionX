import { ChevronRight } from 'lucide-react'
import type { AttackPath } from '../types'
import { useTheme } from '../context/ThemeContext'
import { RiskBadge } from './ui/Badge'
import { Card } from './ui/Card'

interface Props {
  paths: AttackPath[]
  selected?: number
  onSelect: (i: number) => void
}

function RiskBar({ score }: { score: number }) {
  const color = score >= 75 ? 'bg-red-500' : score >= 45 ? 'bg-amber-500' : 'bg-emerald-500'
  const { theme } = useTheme()
  return (
    <div
      className="w-full h-1 rounded-full overflow-hidden"
      style={{ background: theme === 'dark' ? '#1a2235' : '#e2e8f0' }}
    >
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }} />
    </div>
  )
}

export function AttackPathList({ paths, selected, onSelect }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="space-y-2">
      {paths.map((p, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className="w-full text-left rounded-xl p-4 transition-all duration-150"
          style={{
            background: selected === i
              ? isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.06)'
              : isDark ? '#111827' : '#ffffff',
            border: `1px solid ${selected === i
              ? 'rgba(99,102,241,0.35)'
              : isDark ? '#1f2d45' : '#e2e8f0'}`,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <RiskBadge band={p.risk_band} />
              <span className="text-xs" style={{ color: isDark ? '#4b5563' : '#94a3b8' }}>
                {p.risk_score}/100
              </span>
            </div>
            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: isDark ? '#4b5563' : '#94a3b8' }}
            >
              <span>{p.hop_count} hops</span>
              <span>·</span>
              <span>{p.vuln_count} vulns</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <RiskBar score={p.risk_score} />
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {p.path.map((node, j) => (
              <span key={j} className="flex items-center gap-1">
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={
                    j === 0
                      ? { color: '#f87171', background: 'rgba(239,68,68,0.1)' }
                      : j === p.path.length - 1
                      ? { color: '#a78bfa', background: 'rgba(139,92,246,0.1)' }
                      : { color: isDark ? '#94a3b8' : '#64748b', background: isDark ? '#1a2235' : '#f1f5f9' }
                  }
                >
                  {node}
                </span>
                {j < p.path.length - 1 && (
                  <span className="text-xs" style={{ color: isDark ? '#374151' : '#cbd5e1' }}>→</span>
                )}
              </span>
            ))}
          </div>
        </button>
      ))}
    </div>
  )
}

export function AttackInsightsPanel({ path }: { path: AttackPath }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p
            className="text-xs uppercase tracking-widest font-semibold"
            style={{ color: isDark ? '#4b5563' : '#94a3b8' }}
          >
            Risk Score
          </p>
          <RiskBadge band={path.risk_band} />
        </div>
        <div>
          <div className="flex items-end gap-2 mb-1">
            <span
              className="text-3xl font-bold"
              style={{ color: isDark ? '#e2e8f0' : '#0f172a' }}
            >
              {path.risk_score}
            </span>
            <span className="text-sm mb-1" style={{ color: isDark ? '#4b5563' : '#94a3b8' }}>/100</span>
          </div>
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ background: isDark ? '#1a2235' : '#e2e8f0' }}
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                path.risk_score >= 75 ? 'bg-red-500' : path.risk_score >= 45 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${path.risk_score}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1">
          {[
            { label: 'Vulnerabilities', value: path.vuln_count, color: '#f59e0b' },
            { label: 'Severity Sum', value: path.vuln_severity_sum, color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-lg p-3"
              style={{ background: isDark ? '#0d1117' : '#f8fafc', border: `1px solid ${isDark ? '#1f2d45' : '#e2e8f0'}` }}
            >
              <p className="text-xs mb-1" style={{ color: isDark ? '#4b5563' : '#94a3b8' }}>{label}</p>
              <p className="text-lg font-semibold" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs mb-2" style={{ color: isDark ? '#4b5563' : '#94a3b8' }}>Predicted Next Step</p>
          <p
            className="text-sm rounded-lg p-3"
            style={{
              color: isDark ? '#e2e8f0' : '#0f172a',
              background: isDark ? '#0d1117' : '#f8fafc',
              border: `1px solid ${isDark ? '#1f2d45' : '#e2e8f0'}`,
            }}
          >
            {path.path.length >= 3
              ? `Pivot from ${path.path[1]} toward ${path.path[2]}`
              : `Escalate on ${path.path[1] ?? 'entry device'}`}
          </p>
        </div>
      </div>
    </Card>
  )
}
