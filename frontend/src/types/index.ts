export interface GraphNode {
  id: string
  label: string
  node_type: 'attacker' | 'device' | 'vulnerability' | 'asset'
  device_type?: string
  criticality?: number
  severity?: number
  on_attack_path: boolean
  is_vulnerable: boolean
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  edge_type: string
  on_attack_path: boolean
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface AttackPath {
  attacker_id: string
  path: string[]
  labels: string[]
  risk_score: number
  risk_band: 'LOW' | 'MEDIUM' | 'HIGH'
  vuln_count: number
  vuln_severity_sum: number
  hop_count: number
}

export interface DeviceRisk {
  device_id: string
  label: string
  device_type: string
  criticality: number
  severity_sum: number
  risk_score: number
  risk_band: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface RiskScore {
  devices: DeviceRisk[]
  highest_risk_device: string | null
  overall_risk: number
}

export interface SimulationStep {
  step: number
  from_node: string
  to_node: string
  action: string
  detail: string
}

export interface SimulationResult {
  attacker_id: string
  path: string[]
  risk_score: number
  risk_band: string
  steps: SimulationStep[]
  assessment: string
}

export interface AIRecommendation {
  category: 'immediate' | 'short_term' | 'long_term'
  title: string
  detail: string
}

export interface AIAnalysis {
  attacker_id: string
  path: string[]
  risk_score: number
  recommendations: AIRecommendation[]
  raw_analysis: string
  ai_available: boolean
}

export interface HealthStatus {
  status: 'ok' | 'degraded'
  tigergraph_host: string
  graph: string
  ai_available: boolean
  version: string
}

export interface ScenarioInfo {
  id: string
  label: string
}
