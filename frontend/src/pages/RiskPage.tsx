import { AppLayout } from '../components/layout/AppLayout'
import { RiskBadge } from '../components/ui/Badge'
import { Card, CardHeader } from '../components/ui/Card'
import { SkeletonCard } from '../components/ui/Skeleton'
import { useTheme } from '../context/ThemeContext'
import { useApi } from '../hooks/useApi'
import { api } from '../services/api'

export function RiskPage() {
  const { data, loading, error } = useApi(() => api.getRiskScore(), [])
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <AppLayout title="Risk Score">
      {data && (
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: 'Overall Risk',       value: `${data.overall_risk}%`, color: '#fbbf24' },
            { label: 'Highest Risk Device', value: data.highest_risk_device ?? '—', color: '#f87171' },
            { label: 'Devices Tracked',    value: data.devices.length,    color: '#60a5fa' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl p-5"
              style={{
                background: isDark ? '#111827' : '#ffffff',
                border: `1px solid ${isDark ? '#1f2d45' : '#e2e8f0'}`,
              }}
            >
              <p className="text-xs mb-1" style={{ color: isDark ? '#4b5563' : '#94a3b8' }}>{label}</p>
              <p className="text-2xl font-bold truncate" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader title="Device Risk Breakdown" subtitle="Sorted by risk score" />
        {loading && <div className="space-y-2"><SkeletonCard /><SkeletonCard /></div>}
        {error && <p className="text-sm text-red-400 py-4">{error}</p>}
        {data && (
          <div className="space-y-3">
            {data.devices.map((d) => (
              <div
                key={d.device_id}
                className="flex items-center gap-4 py-2.5"
                style={{ borderBottom: `1px solid ${isDark ? '#1a2235' : '#f1f5f9'}` }}
              >
                <div className="w-36 flex-shrink-0">
                  <p className="text-sm font-medium truncate" style={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>
                    {d.label}
                  </p>
                  <p className="text-xs" style={{ color: isDark ? '#4b5563' : '#94a3b8' }}>{d.device_type}</p>
                </div>
                <div className="flex-1">
                  <div
                    className="w-full h-1.5 rounded-full overflow-hidden"
                    style={{ background: isDark ? '#1a2235' : '#e2e8f0' }}
                  >
                    <div
                      className={`h-full rounded-full ${
                        d.risk_score >= 75 ? 'bg-red-500' : d.risk_score >= 45 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${d.risk_score}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs" style={{ color: isDark ? '#4b5563' : '#94a3b8' }}>
                    sev: {d.severity_sum}
                  </span>
                  <RiskBadge band={d.risk_band} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </AppLayout>
  )
}
