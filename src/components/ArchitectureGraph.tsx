import { useMemo } from 'react'
import { useArchitectureStore } from '@/store/architectureStore'
import { ArchitectureNodeMesh } from './ArchitectureNode'
import { ConnectionLine } from './ConnectionLine'
import type { ArchitectureNode, Position3D } from '@/types/architecture'

// Calculate positions for nodes if not specified
function calculatePositions(nodes: ArchitectureNode[]): Map<string, Position3D> {
  const positions = new Map<string, Position3D>()

  // Simple force-directed-like layout
  const nodeCount = nodes.length
  const radius = Math.max(15, nodeCount * 3)

  nodes.forEach((node, index) => {
    if (node.position) {
      positions.set(node.id, node.position)
    } else {
      // Arrange in a circle with some variation
      const angle = (index / nodeCount) * Math.PI * 2
      const layerOffset = Math.floor(index / 8) * 8
      const r = radius + layerOffset

      positions.set(node.id, {
        x: Math.cos(angle) * r,
        y: getNodeHeight(node),
        z: Math.sin(angle) * r,
      })
    }

    // Handle children
    if (node.children) {
      const childPositions = calculateChildPositions(
        node.children,
        positions.get(node.id)!
      )
      childPositions.forEach((pos, id) => positions.set(id, pos))
    }
  })

  return positions
}

function getNodeHeight(node: ArchitectureNode): number {
  const typeHeights: Record<string, number> = {
    gateway: 8,
    service: 4,
    module: 2,
    class: 1,
    function: 0.5,
    database: 0,
    cache: 1,
    queue: 1,
    external: 6,
    container: 3,
    region: 10,
    cluster: 7,
  }
  return typeHeights[node.type] ?? 3
}

function calculateChildPositions(
  children: ArchitectureNode[],
  parentPos: Position3D
): Map<string, Position3D> {
  const positions = new Map<string, Position3D>()
  const radius = 4

  children.forEach((child, index) => {
    const angle = (index / children.length) * Math.PI * 2
    positions.set(child.id, {
      x: parentPos.x + Math.cos(angle) * radius,
      y: parentPos.y - 2,
      z: parentPos.z + Math.sin(angle) * radius,
    })

    if (child.children) {
      const childPositions = calculateChildPositions(
        child.children,
        positions.get(child.id)!
      )
      childPositions.forEach((pos, id) => positions.set(id, pos))
    }
  })

  return positions
}

export function ArchitectureGraph() {
  const { architecture, showConnections, getVisibleNodes } = useArchitectureStore()

  const visibleNodes = getVisibleNodes()

  // Calculate positions for all nodes
  const nodePositions = useMemo(() => {
    if (!architecture) return new Map<string, Position3D>()
    return calculatePositions(architecture.nodes)
  }, [architecture])

  if (!architecture) return null

  return (
    <group>
      {/* Render connections first (behind nodes) */}
      {showConnections &&
        architecture.connections.map((connection) => {
          const sourcePos = nodePositions.get(connection.sourceId)
          const targetPos = nodePositions.get(connection.targetId)

          // Only render if both nodes are visible
          const sourceVisible = visibleNodes.some((n) => n.id === connection.sourceId)
          const targetVisible = visibleNodes.some((n) => n.id === connection.targetId)

          if (!sourcePos || !targetPos || !sourceVisible || !targetVisible) {
            return null
          }

          return (
            <ConnectionLine
              key={connection.id}
              connection={connection}
              startPosition={sourcePos}
              endPosition={targetPos}
            />
          )
        })}

      {/* Render nodes */}
      {visibleNodes.map((node) => {
        const position = nodePositions.get(node.id)
        if (!position) return null

        return (
          <ArchitectureNodeMesh
            key={node.id}
            node={node}
            position={[position.x, position.y, position.z]}
          />
        )
      })}
    </group>
  )
}
