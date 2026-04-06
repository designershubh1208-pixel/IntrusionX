import { AlertTriangle, CheckCircle, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import type { SimulationResult } from '../types'
import { Button } from './ui/Button'
import { Card, CardHeader } from './ui/Card'

interface Props {
  attackerId: string
  onSimulate: (attackerId: string) => Promise<SimulationResult | null>
  loading: boolean
}

const ACTION_META: Record<string, { bg: string; border: string; text: string }> = {
  'Initial Access':       { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   text: '#f87171' },
  'Lateral Movement':     { bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  text: '#fbbf24' },
  'Privilege Escalation': { bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.25)',  text: '#fb923c' },
  'Data Staging':         { bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.25)',  text: '#a78bfa' },
}

export function SimulationPanel({ attackerId, onSimulate, loading }: Props) {
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [visibleSteps, setVisibleSteps] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const run = async () => {
    setResult(null)
    setVisibleSteps(0)
    const res = await onSimulate(attackerId)
    if (!res) return
    setResult(res)
    let i = 0
    timerRef.current = setInterval(() => {
      i++
      setVisibleSteps(i)
      if (i >= res.steps.length) clearInterval(timerRef.current!)
    }, 600)
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  return (
    <Card>
      <CardHeader
        title="Attack Simulation"
        subtitle="Step-by-step attacker movement"
        action={
          <Button onClick={run} loading={loading} icon={<Play className="w-3.5 h-3.5" />} size="sm">
            Simulate
          </Button>
        }
      />

      {!result && !loading && (
        <div
          className="flex flex-col items-center justify-center py-10 gap-2"
          style={{ color: isDark ? '#374151' : '#cbd5e1' }}
        >
          <Play className="w-8 h-8 opacity-30" />
          <p className="text-sm">Click Simulate to run the attack</p>
        </div>
      )}

      {result && (
        <div className="space-y-2">
          {result.steps.slice(0, visibleSteps).map((step) => {
            const meta = ACTION_META[step.action] ?? {
              bg: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              border: isDark ? '#1f2d45' : '#e2e8f0',
              text: isDark ? '#94a3b8' : '#64748b',
            }
            return (
              <div
                key={step.step}
                className="flex items-start gap-3 p-3 rounded-lg text-sm"
                style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
              >
                <span
                  className="text-xs font-mono font-bold w-5 flex-shrink-0 mt-0.5"
                  style={{ color: meta.text }}
                >
                  {step.step}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs mb-0.5" style={{ color: meta.text }}>{step.action}</p>
                  <p className="text-xs truncate" style={{ color: isDark ? '#6b7280' : '#94a3b8' }}>{step.detail}</p>
                </div>
              </div>
            )
          })}

          {visibleSteps >= result.steps.length && result.steps.length > 0 && (
            <div
              className="flex items-start gap-3 p-3 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">{result.assessment}</p>
            </div>
          )}

          {result.steps.length === 0 && (
            <div className="flex items-center gap-2 text-emerald-500 text-sm p-3">
              <CheckCircle className="w-4 h-4" />
              <span>No attack path detected — network appears secure.</span>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
