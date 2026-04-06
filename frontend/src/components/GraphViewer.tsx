import { useCallback, useEffect, useRef, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { useTheme } from '../context/ThemeContext'
import type { GraphData, GraphEdge, GraphNode } from '../types'

interface Props {
  data: GraphData
  height?: number
  /** Pass a unique key (e.g. scenario id) to fully reset the simulation */
  graphKey?: string
}

function shouldHideGraphNode(node: GraphNode): boolean {
  const label = node.label.toLowerCase()
  const id = node.id.toLowerCase()
  return label.includes('nmap scanner') || id.includes('nmap scanner')
}

const NODE_COLORS: Record<string, string> = {
  attacker:      '#ef4444',
  device:        '#3b82f6',
  vulnerability: '#f59e0b',
  asset:         '#8b5cf6',
}

function nodeColor(n: GraphNode): string {
  if (n.node_type === 'attacker') return '#ef4444'
  if (n.on_attack_path) return '#ef4444'
  if (n.is_vulnerable && n.node_type === 'device') return '#f59e0b'
  return NODE_COLORS[n.node_type] ?? '#64748b'
}

function edgeColor(e: GraphEdge, isDark: boolean): string {
  if (e.on_attack_path) return '#ef4444'
  if (e.edge_type === 'has_vulnerability') return '#f59e0b'
  return isDark ? '#2d3f5e' : '#cbd5e1'
}

function nodeRadius(n: GraphNode): number {
  if (n.node_type === 'attacker') return 8
  if (n.on_attack_path) return 9
  if (n.node_type === 'vulnerability') return 5
  return 6
}

/** Inner component — remounts fully when graphKey changes */
function GraphCanvas({
  data,
  height,
  isDark,
}: {
  data: GraphData
  height: number
  isDark: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fgRef = useRef<{ zoomToFit?: (ms: number, px: number) => void } | null>(null)
  const [width, setWidth] = useState(800)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w && w > 0) setWidth(Math.floor(w))
    })
    ro.observe(el)
    setWidth(Math.floor(el.getBoundingClientRect().width) || 800)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fgRef.current?.zoomToFit?.(500, 50)
    }, 800)
    return () => clearTimeout(timer)
  }, [width])

  const visibleNodes = data.nodes.filter((n) => !shouldHideGraphNode(n))
  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id))
  const visibleEdges = data.edges.filter(
    (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target),
  )

  const graphData = {
    nodes: visibleNodes.map((n) => ({ ...n, name: n.label })),
    links: visibleEdges.map((e) => ({ ...e, source: e.source, target: e.target })),
  }

  const paintNode = useCallback(
    (node: Record<string, unknown>, ctx: CanvasRenderingContext2D) => {
      const n = node as unknown as GraphNode & { x: number; y: number }
      const r = nodeRadius(n)
      const color = nodeColor(n)

      // Outer glow for attack-path nodes
      if (n.on_attack_path || n.node_type === 'attacker') {
        ctx.beginPath()
        ctx.arc(n.x, n.y, r + 6, 0, 2 * Math.PI)
        ctx.fillStyle = 'rgba(239,68,68,0.10)'
        ctx.fill()
      }

      // Node circle
      ctx.beginPath()
      ctx.arc(n.x, n.y, r, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()

      // Thin border ring
      ctx.beginPath()
      ctx.arc(n.x, n.y, r + 0.8, 0, 2 * Math.PI)
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'
      ctx.lineWidth = 0.8
      ctx.stroke()

      // Label
      const isHighlight = n.on_attack_path || n.node_type === 'attacker'
      ctx.font = `${isHighlight ? 'bold ' : ''}5.5px Inter, sans-serif`
      ctx.fillStyle = isHighlight
        ? '#fca5a5'
        : isDark ? '#94a3b8' : '#475569'
      ctx.textAlign = 'center'
      ctx.fillText(n.label, n.x, n.y + r + 7)
    },
    [isDark],
  )

  const bgColor = isDark ? '#0a0d14' : '#f8fafc'

  return (
    <div ref={containerRef} style={{ width: '100%', background: bgColor }}>
      {width > 0 && (
        <ForceGraph2D
          ref={fgRef as never}
          graphData={graphData}
          width={width}
          height={height}
          backgroundColor={bgColor}
          nodeCanvasObject={paintNode}
          nodeCanvasObjectMode={() => 'replace'}
          linkColor={(link) => edgeColor(link as unknown as GraphEdge, isDark)}
          linkWidth={(link) => ((link as unknown as GraphEdge).on_attack_path ? 2.5 : 1)}
          linkDirectionalArrowLength={5}
          linkDirectionalArrowRelPos={1}
          linkDirectionalParticles={(link) =>
            (link as unknown as GraphEdge).on_attack_path ? 4 : 0
          }
          linkDirectionalParticleColor={() => '#ef4444'}
          linkDirectionalParticleWidth={2.5}
          cooldownTicks={120}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.35}
        />
      )}
    </div>
  )
}

export function GraphViewer({ data, height = 520, graphKey }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const visibleNodes = data.nodes.filter((n) => !shouldHideGraphNode(n))
  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id))
  const visibleEdges = data.edges.filter(
    (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target),
  )

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: `1px solid ${isDark ? '#1f2d45' : '#e2e8f0'}`,
        background: isDark ? '#0a0d14' : '#f8fafc',
      }}
    >
      {/*
        The `key` here is critical — when graphKey changes (scenario switch),
        React fully unmounts and remounts GraphCanvas, resetting the force
        simulation from scratch with the new data.
      */}
      <GraphCanvas
        key={graphKey ?? `graph-${visibleNodes.length}-${visibleEdges.length}`}
        data={data}
        height={height}
        isDark={isDark}
      />

      {/* Legend */}
      <div
        className="flex items-center gap-5 px-5 py-2.5"
        style={{
          borderTop: `1px solid ${isDark ? '#1f2d45' : '#e2e8f0'}`,
          background: isDark ? '#0d1117' : '#f1f5f9',
        }}
      >
        {[
          { color: '#ef4444', label: 'Attack Path' },
          { color: '#f59e0b', label: 'Vulnerable' },
          { color: '#3b82f6', label: 'Device' },
          { color: '#8b5cf6', label: 'Asset' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-xs" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>{label}</span>
          </div>
        ))}
        <span className="ml-auto text-xs" style={{ color: isDark ? '#374151' : '#cbd5e1' }}>
          {visibleNodes.length} nodes · {visibleEdges.length} edges
        </span>
      </div>
    </div>
  )
}
