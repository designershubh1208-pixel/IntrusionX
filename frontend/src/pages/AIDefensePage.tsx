import { useState } from 'react'
import { AIDefensePanel } from '../components/AIDefensePanel'
import { AppLayout } from '../components/layout/AppLayout'
import { Card } from '../components/ui/Card'
import { useTheme } from '../context/ThemeContext'
import { useLazyApi } from '../hooks/useApi'
import { api } from '../services/api'

const ATTACKERS = ['Hacker1', 'Hacker2']

export function AIDefensePage() {
  const [attacker, setAttacker] = useState('Hacker1')
  const { data, loading, error, execute } = useLazyApi(api.getAIAnalysis)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <AppLayout title="AI Defense">
      <div className="max-w-2xl mx-auto space-y-5">
        <Card>
          <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: isDark ? '#4b5563' : '#94a3b8' }}>
            Select Attacker
          </p>
          <div className="flex gap-2">
            {ATTACKERS.map((a) => (
              <button
                key={a}
                onClick={() => setAttacker(a)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={
                  attacker === a
                    ? { background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }
                    : {
                        background: isDark ? '#0d1117' : '#f8fafc',
                        color: isDark ? '#6b7280' : '#64748b',
                        border: `1px solid ${isDark ? '#1f2d45' : '#e2e8f0'}`,
                      }
                }
              >
                {a}
              </button>
            ))}
          </div>
        </Card>
        <AIDefensePanel analysis={data} loading={loading} error={error} onFetch={() => execute(attacker, 0)} />
      </div>
    </AppLayout>
  )
}
