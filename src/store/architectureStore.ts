import { create } from 'zustand'
import type {
  Architecture,
  ArchitectureNode,
  ArchitectureConnection,
  DetailLevel,
  Position3D,
} from '@/types/architecture'

interface ArchitectureState {
  // Architecture data
  architecture: Architecture | null
  isLoading: boolean
  error: string | null

  // Selection state
  selectedNodeId: string | null
  hoveredNodeId: string | null
  expandedNodeIds: Set<string>

  // View state
  detailLevel: DetailLevel
  showConnections: boolean
  showLabels: boolean
  animateConnections: boolean

  // Camera state (for UI display)
  cameraPosition: Position3D

  // Actions
  setArchitecture: (arch: Architecture) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  selectNode: (nodeId: string | null) => void
  hoverNode: (nodeId: string | null) => void
  toggleNodeExpanded: (nodeId: string) => void

  setDetailLevel: (level: DetailLevel) => void
  setShowConnections: (show: boolean) => void
  setShowLabels: (show: boolean) => void
  setAnimateConnections: (animate: boolean) => void

  setCameraPosition: (pos: Position3D) => void

  // Computed helpers
  getNode: (nodeId: string) => ArchitectureNode | undefined
  getNodeConnections: (nodeId: string) => ArchitectureConnection[]
  getVisibleNodes: () => ArchitectureNode[]
}

export const useArchitectureStore = create<ArchitectureState>((set, get) => ({
  // Initial state
  architecture: null,
  isLoading: false,
  error: null,

  selectedNodeId: null,
  hoveredNodeId: null,
  expandedNodeIds: new Set(),

  detailLevel: 'service',
  showConnections: true,
  showLabels: true,
  animateConnections: true,

  cameraPosition: { x: 0, y: 10, z: 20 },

  // Actions
  setArchitecture: (arch) => set({ architecture: arch, error: null }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
  hoverNode: (nodeId) => set({ hoveredNodeId: nodeId }),

  toggleNodeExpanded: (nodeId) =>
    set((state) => {
      const newExpanded = new Set(state.expandedNodeIds)
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId)
      } else {
        newExpanded.add(nodeId)
      }
      return { expandedNodeIds: newExpanded }
    }),

  setDetailLevel: (level) => set({ detailLevel: level }),
  setShowConnections: (show) => set({ showConnections: show }),
  setShowLabels: (show) => set({ showLabels: show }),
  setAnimateConnections: (animate) => set({ animateConnections: animate }),

  setCameraPosition: (pos) => set({ cameraPosition: pos }),

  // Computed helpers
  getNode: (nodeId) => {
    const arch = get().architecture
    if (!arch) return undefined

    const findNode = (nodes: ArchitectureNode[]): ArchitectureNode | undefined => {
      for (const node of nodes) {
        if (node.id === nodeId) return node
        if (node.children) {
          const found = findNode(node.children)
          if (found) return found
        }
      }
      return undefined
    }

    return findNode(arch.nodes)
  },

  getNodeConnections: (nodeId) => {
    const arch = get().architecture
    if (!arch) return []
    return arch.connections.filter(
      (conn) => conn.sourceId === nodeId || conn.targetId === nodeId
    )
  },

  getVisibleNodes: () => {
    const { architecture, detailLevel, expandedNodeIds } = get()
    if (!architecture) return []

    const detailDepth: Record<DetailLevel, number> = {
      overview: 1,
      service: 2,
      module: 3,
      code: 4,
    }

    const maxDepth = detailDepth[detailLevel]

    const collectNodes = (
      nodes: ArchitectureNode[],
      depth: number = 1
    ): ArchitectureNode[] => {
      const result: ArchitectureNode[] = []

      for (const node of nodes) {
        result.push(node)

        // Show children if within depth limit or explicitly expanded
        if (node.children && (depth < maxDepth || expandedNodeIds.has(node.id))) {
          result.push(...collectNodes(node.children, depth + 1))
        }
      }

      return result
    }

    return collectNodes(architecture.nodes)
  },
}))
