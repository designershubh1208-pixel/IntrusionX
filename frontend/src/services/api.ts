import type {
  AIAnalysis,
  AttackPath,
  GraphData,
  HealthStatus,
  RiskScore,
  ScenarioInfo,
  SimulationResult,
} from '../types'

const BASE = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  health: () => request<HealthStatus>('/health'),

  getAttackPaths: (attackerId?: string, limit = 20) => {
    const params = new URLSearchParams({ limit: String(limit) })
    if (attackerId) params.set('attacker_id', attackerId)
    return request<AttackPath[]>(`/attack-paths?${params}`)
  },

  getRiskScore: () => request<RiskScore>('/risk-score'),

  simulate: (attackerId: string, pathIndex = 0) =>
    request<SimulationResult>('/simulate', {
      method: 'POST',
      body: JSON.stringify({ attacker_id: attackerId, path_index: pathIndex }),
    }),

  getAIAnalysis: (attackerId: string, pathIndex = 0) =>
    request<AIAnalysis>('/ai-analysis', {
      method: 'POST',
      body: JSON.stringify({ attacker_id: attackerId, path_index: pathIndex }),
    }),

  getGraphData: (scenario = 'live') =>
    request<GraphData>(`/graph-data?scenario=${encodeURIComponent(scenario)}`),

  getScenarios: () => request<ScenarioInfo[]>('/graph-data/scenarios'),

  reloadCache: () => request<{ ok: boolean; message: string }>('/reload', { method: 'POST' }),

  loadSimulatorScenario: (scenarioNumber: number) =>
    request<{ ok: boolean; message: string }>('/simulator/load', {
      method: 'POST',
      body: JSON.stringify({ scenario: scenarioNumber }),
    }),
}
