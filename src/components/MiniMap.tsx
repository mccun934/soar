import { useMemo } from 'react'
import { useArchitectureStore } from '@/store/architectureStore'
import { NODE_TYPE_CONFIG } from '@/types/architecture'

export function MiniMap() {
  const { architecture, cameraPosition, selectedNodeId, getVisibleNodes } =
    useArchitectureStore()

  const visibleNodes = getVisibleNodes()

  // Calculate bounds and positions for minimap
  const { nodes, cameraPos } = useMemo(() => {
    if (!architecture || visibleNodes.length === 0) {
      return {
        nodes: [],
        bounds: { minX: -50, maxX: 50, minZ: -50, maxZ: 50 },
        cameraPos: { x: 50, y: 50 },
      }
    }

    // Get all node positions (simplified - using index-based positions)
    const positions = visibleNodes.map((node, index) => {
      const angle = (index / visibleNodes.length) * Math.PI * 2
      const radius = 20 + Math.floor(index / 8) * 8
      return {
        id: node.id,
        x: node.position?.x ?? Math.cos(angle) * radius,
        z: node.position?.z ?? Math.sin(angle) * radius,
        color: node.color || NODE_TYPE_CONFIG[node.type].color,
      }
    })

    // Calculate bounds
    const xs = positions.map((p) => p.x)
    const zs = positions.map((p) => p.z)
    const padding = 10
    const minX = Math.min(...xs) - padding
    const maxX = Math.max(...xs) + padding
    const minZ = Math.min(...zs) - padding
    const maxZ = Math.max(...zs) + padding

    // Map camera position to minimap coordinates
    const mapWidth = 120
    const mapHeight = 80
    const camX = ((cameraPosition.x - minX) / (maxX - minX)) * mapWidth
    const camY = ((cameraPosition.z - minZ) / (maxZ - minZ)) * mapHeight

    return {
      nodes: positions.map((p) => ({
        ...p,
        mapX: ((p.x - minX) / (maxX - minX)) * mapWidth,
        mapY: ((p.z - minZ) / (maxZ - minZ)) * mapHeight,
      })),
      bounds: { minX, maxX, minZ, maxZ },
      cameraPos: {
        x: Math.max(0, Math.min(mapWidth, camX)),
        y: Math.max(0, Math.min(mapHeight, camY)),
      },
    }
  }, [architecture, visibleNodes, cameraPosition])

  return (
    <div className="glass-panel p-2 pointer-events-auto">
      <div className="text-gray-400 text-xs mb-1">Map</div>
      <svg width="120" height="80" className="bg-gray-900/50 rounded">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="12" height="12" patternUnits="userSpaceOnUse">
            <path
              d="M 12 0 L 0 0 0 12"
              fill="none"
              stroke="#1a1a2e"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Nodes */}
        {nodes.map((node) => (
          <circle
            key={node.id}
            cx={node.mapX}
            cy={node.mapY}
            r={selectedNodeId === node.id ? 4 : 2}
            fill={node.color}
            opacity={selectedNodeId === node.id ? 1 : 0.6}
          />
        ))}

        {/* Camera position indicator */}
        <g transform={`translate(${cameraPos.x}, ${cameraPos.y})`}>
          <circle r="4" fill="none" stroke="#00d4ff" strokeWidth="1" />
          <circle r="2" fill="#00d4ff" />
          {/* View direction indicator */}
          <line x1="0" y1="0" x2="0" y2="-8" stroke="#00d4ff" strokeWidth="1" />
        </g>
      </svg>
    </div>
  )
}
