import {
  Activity,
  AlertTriangle,
  Database,
  Layers,
  Monitor,
  Network,
  RefreshCw,
  Terminal,
  Wifi,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { GraphViewer } from '../components/GraphViewer'
import { AppLayout } from '../components/layout/AppLayout'
import { CardHeader } from '../components/ui/Card'
import { useTheme } from '../context/ThemeContext'
import { useApi, useLazyApi } from '../hooks/useApi'
import { api } from '../services/api'

/* ── Simulator scenarios — all backed by real TigerGraph data ── */
const SIM_SCENARIOS = [
  {
    id:          'sim-1',
    simLoad:     1,
    label:       'Small Office',
    icon:        Monitor,
    devices:     5,
    attacker:    'Script Kiddie',
    path:        'PC → Router → File Server → Accounts DB',
    color:       '#3b82f6',
  },
  {
    id:          'sim-2',
    simLoad:     2,
    label:       'Corporate APT',
    icon:        Network,
    devices:     12,
    attacker:    'APT-29 / FIN7',
    path:        'VPN → Firewall → AD Server → Finance DB',
    color:       '#f59e0b',
  },
  {
    id:          'sim-3',
    simLoad:     3,
    label:       'E-Commerce',
    icon:        Layers,
    devices:     10,
    attacker:    'Magecart',
    path:        'Web Server → API → Payment → Customer DB',
    color:       '#8b5cf6',
  },
  {
    id:          'sim-4',
    simLoad:     4,
    label:       'Hospital IoT',
    icon:        Activity,
    devices:     9,
    attacker:    'REvil Ransomware',
    path:        'MRI Scanner → Nurses Station → EHR → Patient Records',
    color:       '#ef4444',
  },
  {
    id:          'sim-5',
    simLoad:     5,
    label:       'Cloud / K8s',
    icon:        Zap,
    devices:     11,
    attacker:    'Supply-Chain APT',
    path:        'CI/CD → K8s → S3 Bucket → Secrets Manager',
    color:       '#10b981',
  },
  {
    id:          'sim-6',
    simLoad:     6,
    label:       'ICS / SCADA',
    icon:        Database,
    devices:     8,
    attacker:    'Sandworm (Nation-State)',
    path:        'Eng Laptop → HMI → PLC → SCADA Controller',
    color:       '#f97316',
  },
]

export function GraphPage() {
  const [activeId, setActiveId] = useState<string>('live')
  const [reloadKey, setReloadKey] = useState(0)
  const [simLoading, setSimLoading] = useState(false)
  const [simMsg, setSimMsg] = useState<string | null>(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const { execute: reloadCache } = useLazyApi(api.reloadCache)

  /* always fetch from TigerGraph Live — the simulator changes TigerGraph data */
  const { data: graph, loading, error } = useApi(
    () => api.getGraphData('live'),
    [reloadKey],
  )

  const handleReload = async () => {
    await reloadCache()
    setReloadKey((k) => k + 1)
  }

  /* Load a simulator scenario then immediately reload graph from TigerGraph */
  const handleSimLoad = async (scenarioNum: number, scenarioId: string) => {
    setSimLoading(true)
    setSimMsg(null)
    try {
      await api.loadSimulatorScenario(scenarioNum)
      await reloadCache()
      setActiveId(scenarioId)
      setReloadKey((k) => k + 1)
      setSimMsg(`✓ Scenario loaded into TigerGraph`)
    } catch (e) {
      setSimMsg(`✗ ${(e as Error).message}`)
    } finally {
      setSimLoading(false)
      setTimeout(() => setSimMsg(null), 4000)
    }
  }

  const activeSim = SIM_SCENARIOS.find((s) => s.id === activeId)

  return (
    <AppLayout title="Network Graph">
      <div className="space-y-4">

        {/* ── How it works banner ── */}
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{
            background: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          <Database className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-indigo-400 mb-0.5">
              All graphs are real TigerGraph data
            </p>
            <p className="text-xs" style={{ color: isDark ? '#6b7280' : '#64748b' }}>
              Click any scenario below → data is pushed live into{' '}
              <span className="text-indigo-400 font-mono">CyberShieldGraph</span> on TigerGraph Cloud
              → BFS pathfinding runs on the graph → attack path renders here.
              No mocks, no fakes.
            </p>
          </div>
        </div>

        {/* ── Scenario cards ── */}
        <div
          className="rounded-xl p-4"
          style={{
            background: isDark ? '#111827' : '#ffffff',
            border: `1px solid ${isDark ? '#1f2d45' : '#e2e8f0'}`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: isDark ? '#374151' : '#cbd5e1' }}
              >
                Network Scenarios — Live TigerGraph
              </p>
              <p className="text-[10px] mt-0.5 flex items-center gap-1.5"
                style={{ color: isDark ? '#4b5563' : '#94a3b8' }}
              >
                <Terminal className="w-3 h-3" />
                Each card pushes real data into TigerGraph via the Network Simulator
              </p>
            </div>

            {/* Reload button */}
            <button
              onClick={handleReload}
              disabled={loading || simLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
              style={{
                background: isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.08)',
                color: '#22c55e',
                border: '1px solid rgba(34,197,94,0.3)',
              }}
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh Graph
            </button>
          </div>

          {/* Simulator status message */}
          {simMsg && (
            <div
              className="mb-3 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2"
              style={
                simMsg.startsWith('✓')
                  ? { background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }
                  : { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }
              }
            >
              {simMsg.startsWith('✓')
                ? <Database className="w-3.5 h-3.5" />
                : <AlertTriangle className="w-3.5 h-3.5" />
              }
              {simMsg} — graph updated from TigerGraph
            </div>
          )}

          {/* Scenario grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Live (current TigerGraph data) */}
            <button
              onClick={() => { setActiveId('live'); handleReload() }}
              disabled={simLoading}
              className="text-left p-3 rounded-xl transition-all duration-150"
              style={
                activeId === 'live'
                  ? { background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.4)' }
                  : { background: isDark ? '#0d1117' : '#f8fafc', border: `1px solid ${isDark ? '#1f2d45' : '#e2e8f0'}` }
              }
            >
              <div className="flex items-center gap-2 mb-2">
                <Wifi className="w-3.5 h-3.5" style={{ color: activeId === 'live' ? '#818cf8' : '#6b7280' }} />
                <span className="text-xs font-semibold" style={{ color: activeId === 'live' ? '#818cf8' : (isDark ? '#e2e8f0' : '#0f172a') }}>
                  Live (Current)
                </span>
                <span
                  className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
                >
                  LIVE
                </span>
              </div>
              <p className="text-[10px]" style={{ color: isDark ? '#4b5563' : '#94a3b8' }}>
                Whatever is currently in TigerGraph
              </p>
            </button>

            {/* Simulator scenarios */}
            {SIM_SCENARIOS.map((sc) => {
              const Icon = sc.icon
              const isActive = activeId === sc.id
              return (
                <button
                  key={sc.id}
                  onClick={() => handleSimLoad(sc.simLoad, sc.id)}
                  disabled={simLoading}
                  className="text-left p-3 rounded-xl transition-all duration-150 disabled:opacity-60 disabled:cursor-wait"
                  style={
                    isActive
                      ? { background: `${sc.color}18`, border: `1px solid ${sc.color}55` }
                      : { background: isDark ? '#0d1117' : '#f8fafc', border: `1px solid ${isDark ? '#1f2d45' : '#e2e8f0'}` }
                  }
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isActive ? sc.color : '#6b7280' }} />
                    <span
                      className="text-xs font-semibold"
                      style={{ color: isActive ? sc.color : (isDark ? '#e2e8f0' : '#0f172a') }}
                    >
                      {sc.label}
                    </span>
                    <span
                      className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                      style={{ background: isDark ? '#1a2235' : '#f1f5f9', color: isDark ? '#4b5563' : '#94a3b8' }}
                    >
                      {sc.devices}n
                    </span>
                  </div>
                  <p
                    className="text-[10px] leading-relaxed"
                    style={{ color: isDark ? '#4b5563' : '#94a3b8' }}
                  >
                    {sc.attacker}
                  </p>
                  <p
                    className="text-[9px] mt-1 font-mono truncate"
                    style={{ color: isActive ? `${sc.color}bb` : (isDark ? '#374151' : '#cbd5e1') }}
                  >
                    {sc.path}
                  </p>
                  {simLoading && isActive && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" style={{ color: sc.color }} />
                      <span className="text-[9px]" style={{ color: sc.color }}>Pushing to TigerGraph…</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Nodes',    value: graph?.nodes.length ?? '—' },
            { label: 'Total Edges',    value: graph?.edges.length ?? '—' },
            { label: 'On Attack Path', value: graph?.nodes.filter((n) => n.on_attack_path).length ?? '—' },
            { label: 'Vulnerabilities',value: graph?.nodes.filter((n) => n.node_type === 'vulnerability').length ?? '—' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl p-4"
              style={{
                background: isDark ? '#111827' : '#ffffff',
                border: `1px solid ${isDark ? '#1f2d45' : '#e2e8f0'}`,
              }}
            >
              <p className="text-[10px] mb-1" style={{ color: isDark ? '#4b5563' : '#94a3b8' }}>{label}</p>
              <p className="text-xl font-bold" style={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>{value}</p>
              <p className="text-[9px] mt-0.5 font-mono" style={{ color: isDark ? '#1f2d45' : '#e2e8f0' }}>
                from TigerGraph
              </p>
            </div>
          ))}
        </div>

        {/* ── Graph canvas ── */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: isDark ? '#111827' : '#ffffff',
            border: `1px solid ${isDark ? '#1f2d45' : '#e2e8f0'}`,
          }}
        >
          <div className="px-5 pt-4 pb-3 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${isDark ? '#1f2d45' : '#e2e8f0'}` }}
          >
            <CardHeader
              title={activeSim ? `${activeSim.label} — Network Topology` : 'Network Topology (Live)'}
              subtitle="Red = predicted attack path · Yellow = vulnerable · BFS computed on TigerGraph data"
            />
            {activeSim && (
              <span
                className="text-[10px] font-mono px-2 py-1 rounded-lg flex-shrink-0"
                style={{ background: `${activeSim.color}18`, color: activeSim.color, border: `1px solid ${activeSim.color}40` }}
              >
                {activeSim.attacker}
              </span>
            )}
          </div>

          {(loading || simLoading) && (
            <div
              className="h-[520px] flex flex-col items-center justify-center gap-3 text-sm"
              style={{ color: isDark ? '#374151' : '#cbd5e1' }}
            >
              <span className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              {simLoading ? 'Pushing scenario to TigerGraph…' : 'Fetching graph from TigerGraph…'}
            </div>
          )}

          {error && !loading && !simLoading && (
            <div className="h-[520px] flex flex-col items-center justify-center gap-2 text-sm">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <span className="text-red-400">{error}</span>
              <span className="text-xs" style={{ color: isDark ? '#374151' : '#cbd5e1' }}>
                Make sure the FastAPI backend is running on port 8000
              </span>
            </div>
          )}

          {graph && !loading && !simLoading && (
            <GraphViewer data={graph} height={520} graphKey={`${activeId}-${reloadKey}`} />
          )}
        </div>

        {/* ── Attack path trace ── */}
        {graph && !loading && !simLoading && (() => {
          const pathNodes = graph.nodes.filter((n) => n.on_attack_path)
          if (pathNodes.length === 0) return null
          return (
            <div
              className="rounded-xl p-4"
              style={{
                background: isDark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.04)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <p className="text-xs font-semibold text-red-500 uppercase tracking-widest">
                  BFS Attack Path — Computed from TigerGraph
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {pathNodes.map((n, i) => (
                  <span key={n.id} className="flex items-center gap-2">
                    <span
                      className="px-3 py-1 rounded-lg text-xs font-medium"
                      style={
                        n.node_type === 'attacker'
                          ? { background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }
                          : i === pathNodes.length - 1
                          ? { background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }
                          : { background: 'rgba(239,68,68,0.08)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }
                      }
                    >
                      {n.label}
                    </span>
                    {i < pathNodes.length - 1 && (
                      <span className="text-red-700 text-sm">→</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )
        })()}
      </div>
    </AppLayout>
  )
}
