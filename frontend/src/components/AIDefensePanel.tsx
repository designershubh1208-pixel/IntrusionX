import { AlertCircle, Brain, Clock, Shield, TrendingUp, Zap } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import type { AIAnalysis } from '../types'
import { Button } from './ui/Button'
import { Card, CardHeader } from './ui/Card'
import { Skeleton } from './ui/Skeleton'

interface Props {
  analysis: AIAnalysis | null
  loading: boolean
  error: string | null
  onFetch: () => void
}

const CAT_META = {
  immediate: { icon: Zap,        label: 'Immediate Action',   bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   text: '#f87171' },
  short_term: { icon: Clock,      label: 'Short-term Fix',     bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)',  text: '#fbbf24' },
  long_term:  { icon: TrendingUp, label: 'Long-term Strategy', bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.2)',  text: '#818cf8' },
}

export function AIDefensePanel({ analysis, loading, error, onFetch }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <Card>
      <CardHeader
        title="AI Defense Recommendations"
        subtitle="Powered by OpenAI"
        action={
          <Button onClick={onFetch} loading={loading} icon={<Brain className="w-3.5 h-3.5" />} size="sm">
            Analyse
          </Button>
        }
      />

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      )}

      {error && !loading && (
        <div
          className="flex items-start gap-2 p-3 rounded-lg text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {!analysis && !loading && !error && (
        <div
          className="flex flex-col items-center justify-center py-10 gap-2"
          style={{ color: isDark ? '#374151' : '#cbd5e1' }}
        >
          <Shield className="w-8 h-8 opacity-30" />
          <p className="text-sm">Click Analyse to get AI recommendations</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-3">
          {!analysis.ai_available && (
            <div
              className="text-xs rounded-lg px-3 py-2"
              style={{ color: '#fbbf24', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              Static recommendations — add OPENAI_API_KEY for live AI analysis.
            </div>
          )}
          {analysis.recommendations.map((rec, i) => {
            const meta = CAT_META[rec.category] ?? CAT_META.long_term
            const Icon = meta.icon
            return (
              <div
                key={i}
                className="p-4 rounded-xl"
                style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="w-3.5 h-3.5" style={{ color: meta.text }} />
                  <span className="text-xs font-semibold" style={{ color: meta.text }}>{meta.label}</span>
                </div>
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: isDark ? '#e2e8f0' : '#0f172a' }}
                >
                  {rec.title}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: isDark ? '#6b7280' : '#64748b' }}>
                  {rec.detail}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
