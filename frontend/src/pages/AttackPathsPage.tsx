import { useState } from 'react'
import { AttackInsightsPanel, AttackPathList } from '../components/AttackPathList'
import { AppLayout } from '../components/layout/AppLayout'
import { Card, CardHeader } from '../components/ui/Card'
import { SkeletonCard } from '../components/ui/Skeleton'
import { useTheme } from '../context/ThemeContext'
import { useApi } from '../hooks/useApi'
import { api } from '../services/api'

const ATTACKERS = ['All', 'Hacker1', 'Hacker2']

export function AttackPathsPage() {
  const [attacker, setAttacker] = useState('All')
  const [selected, setSelected] = useState(0)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const { data: paths, loading, error } = useApi(
    () => api.getAttackPaths(attacker === 'All' ? undefined : attacker),
    [attacker],
  )

  return (
    <AppLayout title="Attack Paths">
      <div className="flex items-center gap-3 mb-5">
        {ATTACKERS.map((a) => (
          <button
            key={a}
            onClick={() => { setAttacker(a); setSelected(0) }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={
              attacker === a
                ? { background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }
                : {
                    background: isDark ? '#111827' : '#ffffff',
                    color: isDark ? '#6b7280' : '#64748b',
                    border: `1px solid ${isDark ? '#1f2d45' : '#e2e8f0'}`,
                  }
            }
          >
            {a}
          </button>
        ))}
        <span className="text-xs ml-auto" style={{ color: isDark ? '#374151' : '#cbd5e1' }}>
          {paths?.length ?? 0} paths found
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Predicted Attack Paths" subtitle="Sorted by risk score" />
            {loading && <div className="space-y-2"><SkeletonCard /><SkeletonCard /></div>}
            {error && <p className="text-sm text-red-400 py-4">{error}</p>}
            {paths && paths.length > 0 && (
              <AttackPathList paths={paths} selected={selected} onSelect={setSelected} />
            )}
            {paths?.length === 0 && (
              <p className="text-sm py-8 text-center" style={{ color: isDark ? '#4b5563' : '#94a3b8' }}>
                No attack paths found
              </p>
            )}
          </Card>
        </div>
        <div>
          {paths?.[selected] && <AttackInsightsPanel path={paths[selected]} />}
        </div>
      </div>
    </AppLayout>
  )
}
