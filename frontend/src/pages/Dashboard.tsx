import { Activity, Database, GitBranch, Layers, Monitor, Network, ShieldAlert, TrendingUp, Wifi } from 'lucide-react'
import { useState } from 'react'
import { AttackInsightsPanel, AttackPathList } from '../components/AttackPathList'
import { GraphViewer } from '../components/GraphViewer'
import { AppLayout } from '../components/layout/AppLayout'
import { Card, CardHeader } from '../components/ui/Card'
import { SkeletonCard } from '../components/ui/Skeleton'
import { useTheme } from '../context/ThemeContext'
import { useApi } from '../hooks/useApi'
import { api } from '../services/api'

const SCENARIOS = [
  { id: 'live',      label: 'Live',       icon: Wifi },
  { id: 'corporate', label: 'Enterprise', icon: Monitor },
  { id: 'hospital',  label: 'Healthcare', icon: Database },
  { id: 'cloud',     label: 'Cloud',      icon: Layers },
  { id: 'ics',       label: 'ICS',        icon: Network },
]

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof Activity; label: string; value: string | number; sub?: string; color: string
}) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <div
      className="rounded-xl p-5 transition-colors duration-200"
      style={{
        background: isDark ? '#111827' : '#ffffff',
        border: `1px solid ${isDark ? '#1f2d45' : '#e2e8f0'}`,
        boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs mb-1" style={{ color: isDark ? '#4b5563' : '#94a3b8' }}>{label}</p>
          <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          {sub && <p className="text-xs mt-0.5" style={{ color: isDark ? '#374151' : '#cbd5e1' }}>{sub}</p>}
        </div>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: isDark ? '#0d1117' : '#f8fafc', border: `1px solid ${isDark ? '#1f2d45' : '#e2e8f0'}` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
    </div>
  )
}

export function Dashboard() {
  const { data: paths, loading: pathsLoading } = useApi(() => api.getAttackPaths(), [])
  const { data: risk } = useApi(() => api.getRiskScore(), [])
  const [selected, setSelected] = useState(0)
  const [graphScenario, setGraphScenario] = useState('live')
  const { data: graph, loading: graphLoading } = useApi(() => api.getGraphData(graphScenario), [graphScenario])
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const topPath = paths?.[selected] ?? null

  return (
    <AppLayout title="Dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={ShieldAlert} label="Attack Paths"    value={paths?.length ?? '—'}               sub="Detected"          color="#f87171" />
        <StatCard icon={Activity}    label="Overall Risk"    value={risk ? `${risk.overall_risk}%` : '—'} sub="Avg across devices" color="#fbbf24" />
        <StatCard icon={GitBranch}   label="Graph Nodes"     value={graph?.nodes.length ?? '—'}           sub="Devices + vulns"   color="#60a5fa" />
        <StatCard icon={TrendingUp}  label="Top Risk Device" value={risk?.highest_risk_device ?? '—'}                             color="#a78bfa" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Graph */}
        <div className="xl:col-span-2">
          <div
            className="rounded-xl overflow-hidden transition-colors duration-200"
            style={{
              background: isDark ? '#111827' : '#ffffff',
              border: `1px solid ${isDark ? '#1f2d45' : '#e2e8f0'}`,
            }}
          >
            <div className="px-5 pt-4 pb-3" style={{ borderBottom: `1px solid ${isDark ? '#1f2d45' : '#e2e8f0'}` }}>
              <CardHeader title="Network Graph" subtitle="Red = attack path · Yellow = vulnerable" />
              {/* Scenario mini-tabs */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {SCENARIOS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setGraphScenario(id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                    style={
                      graphScenario === id
                        ? { background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }
                        : { background: isDark ? '#0d1117' : '#f8fafc', color: isDark ? '#4b5563' : '#94a3b8', border: `1px solid ${isDark ? '#1f2d45' : '#e2e8f0'}` }
                    }
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {graphLoading ? (
              <div
                className="h-[520px] flex flex-col items-center justify-center gap-3 text-sm"
                style={{ color: isDark ? '#374151' : '#cbd5e1' }}
              >
                <span className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                Loading graph…
              </div>
            ) : graph ? (
              <GraphViewer data={graph} height={520} graphKey={graphScenario} />
            ) : (
              <div
                className="h-[520px] flex items-center justify-center text-sm"
                style={{ color: isDark ? '#374151' : '#cbd5e1' }}
              >
                Failed to load graph
              </div>
            )}
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {topPath && <AttackInsightsPanel path={topPath} />}
          <Card>
            <CardHeader title="Top Attack Paths" subtitle="Ranked by risk score" />
            {pathsLoading ? (
              <div className="space-y-2"><SkeletonCard /><SkeletonCard /></div>
            ) : paths && paths.length > 0 ? (
              <AttackPathList paths={paths.slice(0, 5)} selected={selected} onSelect={setSelected} />
            ) : (
              <p className="text-sm py-4 text-center" style={{ color: isDark ? '#4b5563' : '#94a3b8' }}>
                No attack paths found
              </p>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
