import { Activity, ArrowRight, Brain, GitBranch, Shield, ShieldAlert, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { useTheme } from '../context/ThemeContext'

/* ── Animated grid background ─────────────────────────────────────────────── */
function GridBackground({ isDark }: { isDark: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          opacity: isDark ? 0.04 : 0.06,
          backgroundImage: `linear-gradient(${isDark ? '#6366f1' : '#4f46e5'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? '#6366f1' : '#4f46e5'} 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
      <div className={`absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[120px] ${isDark ? 'bg-indigo-600/10' : 'bg-indigo-400/12'}`} />
      <div className={`absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full blur-[120px] ${isDark ? 'bg-violet-600/10' : 'bg-violet-400/10'}`} />
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[100px] ${isDark ? 'bg-blue-900/10' : 'bg-blue-300/10'}`} />
    </div>
  )
}

/* ── Animated terminal card ───────────────────────────────────────────────── */
const terminalLines = [
  { delay: 0,    type: 'cmd',     text: '$ cybershield scan --target network.json' },
  { delay: 600,  type: 'info',    text: '  Connecting to TigerGraph Cloud...' },
  { delay: 1200, type: 'success', text: '  ✓ Graph loaded — 15 nodes, 22 edges' },
  { delay: 1800, type: 'warn',    text: '  ⚠ Attack path detected: HIGH RISK' },
  { delay: 2400, type: 'path',    text: '  Hacker1 → Laptop1 → Server1 → Database1' },
  { delay: 3000, type: 'info',    text: '  Running AI analysis...' },
  { delay: 3600, type: 'success', text: '  ✓ Recommendations generated (3 actions)' },
  { delay: 4200, type: 'alert',   text: '  [CRITICAL] Patch CVE-2024-XYZ immediately' },
]

const lineColorsDark: Record<string, string> = {
  cmd:     '#cbd5e1',
  info:    '#64748b',
  success: '#34d399',
  warn:    '#fbbf24',
  path:    '#818cf8',
  alert:   '#f87171',
}
const lineColorsLight: Record<string, string> = {
  cmd:     '#1e293b',
  info:    '#64748b',
  success: '#059669',
  warn:    '#d97706',
  path:    '#4f46e5',
  alert:   '#dc2626',
}

function TerminalCard({ isDark }: { isDark: boolean }) {
  const [visible, setVisible] = useState(0)
  const [cursor, setCursor] = useState(true)
  const colors = isDark ? lineColorsDark : lineColorsLight

  useEffect(() => {
    const timers = terminalLines.map((l, i) =>
      setTimeout(() => setVisible(i + 1), l.delay),
    )
    const cursorTimer = setInterval(() => setCursor((c) => !c), 530)
    return () => { timers.forEach(clearTimeout); clearInterval(cursorTimer) }
  }, [])

  return (
    <div
      className="relative rounded-2xl overflow-hidden transition-all duration-300"
      style={
        isDark
          ? {
              background: 'rgba(15,23,42,0.7)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 0 0 1px rgba(99,102,241,0.15), 0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
            }
          : {
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(99,102,241,0.15)',
              boxShadow: '0 0 0 1px rgba(99,102,241,0.1), 0 24px 48px rgba(79,70,229,0.12), 0 4px 16px rgba(0,0,0,0.06)',
            }
      }
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(99,102,241,0.1)' }}
      >
        <span className="w-3 h-3 rounded-full bg-red-500/80" />
        <span className="w-3 h-3 rounded-full bg-amber-500/80" />
        <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
        <span
          className="ml-3 text-xs font-mono"
          style={{ color: isDark ? '#64748b' : '#94a3b8' }}
        >
          IntrusionX — threat-scan
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-500 font-mono">LIVE</span>
        </span>
      </div>

      {/* Terminal body */}
      <div
        className="px-5 py-4 font-mono text-xs space-y-1.5 min-h-[240px]"
        style={{ background: isDark ? 'transparent' : 'rgba(248,250,252,0.5)' }}
      >
        {terminalLines.slice(0, visible).map((l, i) => (
          <div key={i} style={{ color: colors[l.type], lineHeight: '1.6' }}>
            {l.text}
          </div>
        ))}
        {visible > 0 && visible < terminalLines.length && (
          <span style={{ opacity: cursor ? 1 : 0, color: isDark ? '#818cf8' : '#4f46e5' }}>▋</span>
        )}
      </div>

      {/* Bottom status bar */}
      <div
        className="flex items-center gap-4 px-5 py-2.5"
        style={{
          borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(99,102,241,0.08)',
          background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(248,250,252,0.8)',
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <span className="text-[10px] text-red-500 font-mono">2 CRITICAL</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="text-[10px] text-amber-500 font-mono">3 WARNINGS</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] text-emerald-600 font-mono">TigerGraph CONNECTED</span>
        </div>
      </div>

      {/* Glow accent */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)' }}
      />
    </div>
  )
}

/* ── Stat pill ────────────────────────────────────────────────────────────── */
function StatPill({ value, label, isDark }: { value: string; label: string; isDark: boolean }) {
  return (
    <div
      className="flex flex-col items-center px-6 py-3 rounded-xl transition-colors duration-200"
      style={
        isDark
          ? { border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }
          : { border: '1px solid rgba(99,102,241,0.15)', background: 'rgba(99,102,241,0.04)' }
      }
    >
      <span
        className="text-xl font-bold"
        style={{ color: isDark ? '#ffffff' : '#0f172a' }}
      >
        {value}
      </span>
      <span
        className="text-xs mt-0.5"
        style={{ color: isDark ? '#64748b' : '#64748b' }}
      >
        {label}
      </span>
    </div>
  )
}

/* ── Feature card ─────────────────────────────────────────────────────────── */
const features = [
  { icon: GitBranch,   title: 'Graph Intelligence',    desc: 'Model your entire network as a live graph — every device, connection, and vulnerability mapped in real-time.' },
  { icon: ShieldAlert, title: 'Attack Path Prediction', desc: 'Enumerate all possible attacker routes from entry point to critical assets before they are exploited.' },
  { icon: Activity,    title: 'Dynamic Risk Scoring',   desc: 'Quantify threat severity across every node using vulnerability data, hop count, and asset criticality.' },
  { icon: Brain,       title: 'AI-Powered Defense',     desc: 'Get actionable remediation recommendations from GPT-4o trained on cybersecurity best practices.' },
]

/* ── Main landing ─────────────────────────────────────────────────────────── */
export function Landing() {
  const navigate = useNavigate()
  const heroRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #0B0F1A 0%, #0F172A 50%, #0B0F1A 100%)'
          : 'linear-gradient(135deg, #f0f4ff 0%, #eef2ff 50%, #f5f3ff 100%)',
        color: isDark ? '#e2e8f0' : '#0f172a',
      }}
    >
      <GridBackground isDark={isDark} />

      {/* ── Navbar ── */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 max-w-7xl mx-auto w-full">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              boxShadow: isDark ? '0 0 20px rgba(99,102,241,0.4)' : '0 0 16px rgba(99,102,241,0.25)',
            }}
          >
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span
            className="text-sm font-bold tracking-tight"
            style={{ color: isDark ? '#e2e8f0' : '#0f172a' }}
          >
            IntrusionX <span className="text-indigo-500">AI</span>
          </span>
        </div>

        {/* Nav links */}
        <div
          className="hidden md:flex items-center gap-8 text-sm"
          style={{ color: isDark ? '#94a3b8' : '#64748b' }}
        >
          {['Features', 'Architecture', 'Demo'].map((item) => (
            <button
              key={item}
              className="transition-colors hover:text-indigo-500"
            >
              {item}
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
            style={
              isDark
                ? { color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }
                : { color: '#4f46e5', border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.06)' }
            }
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.12)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.06)'
            }}
          >
            Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative z-10 flex-1 flex items-center px-8 py-16 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">

          {/* Left — copy */}
          <div>
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium mb-8"
              style={
                isDark
                  ? { background: '#1F2937', border: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 0 20px rgba(99,102,241,0.1)' }
                  : { background: '#eef2ff', border: '1px solid rgba(99,102,241,0.25)', boxShadow: '0 0 16px rgba(99,102,241,0.08)' }
              }
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span style={{ color: isDark ? '#cbd5e1' : '#4f46e5' }}>Powered by TigerGraph + OpenAI</span>
              <span
                className="px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)' }}
              >
                v2.0
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl xl:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
              <span style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Predict attacks</span>
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, #4F46E5, #6366F1, #8B5CF6)' }}
              >
                before they strike
              </span>
            </h1>

            <p
              className="text-lg leading-relaxed max-w-lg mb-10"
              style={{ color: isDark ? '#9CA3AF' : '#475569' }}
            >
              IntrusionX maps your network as a graph, detects every possible attack path,
              scores risk in real-time, and generates AI-powered defense strategies — before
              attackers exploit them.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 mb-12">
              <button
                onClick={() => navigate('/dashboard')}
                className="group flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                  boxShadow: isDark
                    ? '0 0 30px rgba(99,102,241,0.35), 0 4px 16px rgba(0,0,0,0.3)'
                    : '0 0 20px rgba(99,102,241,0.3), 0 4px 12px rgba(79,70,229,0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = isDark
                    ? '0 0 40px rgba(99,102,241,0.55), 0 8px 24px rgba(0,0,0,0.4)'
                    : '0 0 30px rgba(99,102,241,0.45), 0 8px 20px rgba(79,70,229,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = isDark
                    ? '0 0 30px rgba(99,102,241,0.35), 0 4px 16px rgba(0,0,0,0.3)'
                    : '0 0 20px rgba(99,102,241,0.3), 0 4px 12px rgba(79,70,229,0.2)'
                }}
              >
                <Zap className="w-4 h-4" />
                Launch Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/graph')}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={
                  isDark
                    ? { color: '#cbd5e1', background: '#111827', border: '1px solid #374151' }
                    : { color: '#4f46e5', background: '#eef2ff', border: '1px solid rgba(99,102,241,0.25)' }
                }
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? '#1a2235' : '#e0e7ff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark ? '#111827' : '#eef2ff'
                }}
              >
                <GitBranch className="w-4 h-4" />
                View Network Graph
              </button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-3">
              <StatPill value="3"   label="Attack Paths"    isDark={isDark} />
              <StatPill value="5"   label="Vulnerabilities" isDark={isDark} />
              <StatPill value="92%" label="Risk Score"       isDark={isDark} />
              <StatPill value="AI"  label="Defense Ready"    isDark={isDark} />
            </div>
          </div>

          {/* Right — terminal */}
          <div className="relative">
            <div
              className="absolute inset-0 rounded-3xl scale-110 blur-[60px]"
              style={{ background: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.08)' }}
            />
            <TerminalCard isDark={isDark} />

            {/* Floating badge top-right */}
            <div
              className="absolute -top-3 -right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={
                isDark
                  ? { background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(239,68,68,0.4)', boxShadow: '0 0 16px rgba(239,68,68,0.2)' }
                  : { background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 4px 12px rgba(239,68,68,0.15)' }
              }
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-red-500">THREAT DETECTED</span>
            </div>

            {/* Floating badge bottom-left */}
            <div
              className="absolute -bottom-3 -left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={
                isDark
                  ? { background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(34,197,94,0.4)', boxShadow: '0 0 16px rgba(34,197,94,0.2)' }
                  : { background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(34,197,94,0.3)', boxShadow: '0 4px 12px rgba(34,197,94,0.15)' }
              }
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-600">Graph Connected</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10 px-8 pb-24 max-w-7xl mx-auto w-full">
        {/* Section label */}
        <div className="flex items-center gap-3 mb-10">
          <div
            className="h-px flex-1"
            style={{ background: isDark ? 'linear-gradient(to right, transparent, rgba(255,255,255,0.06))' : 'linear-gradient(to right, transparent, rgba(99,102,241,0.15))' }}
          />
          <span
            className="text-xs font-semibold uppercase tracking-widest px-3"
            style={{ color: isDark ? '#4b5563' : '#94a3b8' }}
          >
            Core Capabilities
          </span>
          <div
            className="h-px flex-1"
            style={{ background: isDark ? 'linear-gradient(to left, transparent, rgba(255,255,255,0.06))' : 'linear-gradient(to left, transparent, rgba(99,102,241,0.15))' }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className="group relative p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 cursor-default"
              style={
                isDark
                  ? { background: 'rgba(17,24,39,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)' }
                  : { background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(99,102,241,0.1)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }
              }
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'
                e.currentTarget.style.boxShadow = isDark ? '0 0 30px rgba(99,102,241,0.08)' : '0 8px 24px rgba(99,102,241,0.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.1)'
                e.currentTarget.style.boxShadow = isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              {/* Top accent line on hover */}
              <div
                className="absolute top-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(90deg, transparent, #6366f1, transparent)' }}
              />

              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{
                  background: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.08)',
                  border: '1px solid rgba(99,102,241,0.2)',
                }}
              >
                <Icon className="w-5 h-5 text-indigo-500" />
              </div>

              <h3
                className="text-sm font-semibold mb-2"
                style={{ color: isDark ? '#e2e8f0' : '#0f172a' }}
              >
                {title}
              </h3>
              <p
                className="text-xs leading-relaxed"
                style={{ color: isDark ? '#9CA3AF' : '#64748b' }}
              >
                {desc}
              </p>

              <span
                className="absolute top-5 right-5 text-[10px] font-mono"
                style={{ color: isDark ? '#374151' : '#cbd5e1' }}
              >
                0{i + 1}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="relative z-10 px-8 py-6 max-w-7xl mx-auto w-full"
        style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(99,102,241,0.1)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" />
            <span
              className="text-xs"
              style={{ color: isDark ? '#374151' : '#94a3b8' }}
            >
              IntrusionX · v2.0.0 · TigerGraph Cloud
            </span>
          </div>
          <span
            className="text-xs"
            style={{ color: isDark ? '#1f2937' : '#cbd5e1' }}
          >
            Built for IIT Delhi Hackathon
          </span>
        </div>
      </footer>
    </div>
  )
}
