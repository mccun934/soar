import { useArchitectureStore } from '@/store/architectureStore'
import { NODE_TYPE_CONFIG } from '@/types/architecture'

export function NodeInfoPanel() {
  const { selectedNodeId, getNode, getNodeConnections, selectNode } =
    useArchitectureStore()

  const node = selectedNodeId ? getNode(selectedNodeId) : null
  const connections = selectedNodeId ? getNodeConnections(selectedNodeId) : []

  if (!node) {
    return (
      <div className="glass-panel p-4 w-64 pointer-events-auto">
        <div className="text-gray-500 text-sm text-center py-8">
          Click on a node to see details
        </div>
      </div>
    )
  }

  const config = NODE_TYPE_CONFIG[node.type]
  const color = node.color || config.color

  return (
    <div className="glass-panel p-4 w-64 pointer-events-auto max-h-[70vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span style={{ color }} className="text-xl">
              {config.icon}
            </span>
            <h3 className="text-white font-semibold">{node.name}</h3>
          </div>
          <div
            className="text-xs mt-1 px-2 py-0.5 rounded inline-block"
            style={{ backgroundColor: color + '20', color }}
          >
            {node.type}
          </div>
        </div>
        <button
          onClick={() => selectNode(null)}
          className="text-gray-500 hover:text-white transition-colors"
        >
          ×
        </button>
      </div>

      {/* Description */}
      {node.description && (
        <div className="mb-4">
          <div className="text-gray-400 text-xs mb-1">Description</div>
          <p className="text-gray-300 text-sm">{node.description}</p>
        </div>
      )}

      {/* Technology stack */}
      {(node.technology || node.language || node.framework) && (
        <div className="mb-4">
          <div className="text-gray-400 text-xs mb-2">Technology</div>
          <div className="flex flex-wrap gap-1">
            {node.language && (
              <span className="px-2 py-0.5 bg-purple-900/50 text-purple-300 rounded text-xs">
                {node.language}
              </span>
            )}
            {node.framework && (
              <span className="px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded text-xs">
                {node.framework}
              </span>
            )}
            {node.technology && (
              <span className="px-2 py-0.5 bg-green-900/50 text-green-300 rounded text-xs">
                {node.technology}
              </span>
            )}
          </div>
        </div>
      )}

      {/* File path */}
      {node.filePath && (
        <div className="mb-4">
          <div className="text-gray-400 text-xs mb-1">Source</div>
          <code className="text-xs text-soar-accent bg-gray-900/50 px-2 py-1 rounded block overflow-x-auto">
            {node.filePath}
            {node.lineStart && `:${node.lineStart}`}
            {node.lineEnd && `-${node.lineEnd}`}
          </code>
        </div>
      )}

      {/* Metrics (future feature placeholder) */}
      {node.metrics && (
        <div className="mb-4">
          <div className="text-gray-400 text-xs mb-2">Metrics</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {node.metrics.requestsPerSecond !== undefined && (
              <div className="bg-gray-900/50 p-2 rounded">
                <div className="text-gray-500">RPS</div>
                <div className="text-white font-mono">
                  {node.metrics.requestsPerSecond}
                </div>
              </div>
            )}
            {node.metrics.latencyMs !== undefined && (
              <div className="bg-gray-900/50 p-2 rounded">
                <div className="text-gray-500">Latency</div>
                <div className="text-white font-mono">
                  {node.metrics.latencyMs}ms
                </div>
              </div>
            )}
            {node.metrics.errorRate !== undefined && (
              <div className="bg-gray-900/50 p-2 rounded">
                <div className="text-gray-500">Error Rate</div>
                <div className="text-soar-error font-mono">
                  {(node.metrics.errorRate * 100).toFixed(2)}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Connections */}
      {connections.length > 0 && (
        <div>
          <div className="text-gray-400 text-xs mb-2">
            Connections ({connections.length})
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {connections.map((conn) => {
              const isOutgoing = conn.sourceId === node.id
              const otherId = isOutgoing ? conn.targetId : conn.sourceId

              return (
                <div
                  key={conn.id}
                  className="flex items-center gap-2 text-xs bg-gray-900/50 px-2 py-1 rounded cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => selectNode(otherId)}
                >
                  <span className={isOutgoing ? 'text-soar-accent' : 'text-soar-warning'}>
                    {isOutgoing ? '→' : '←'}
                  </span>
                  <span className="text-gray-300 truncate">{otherId}</span>
                  <span className="text-gray-600 ml-auto">{conn.type}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Children */}
      {node.children && node.children.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="text-gray-400 text-xs mb-2">
            Children ({node.children.length})
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {node.children.map((child) => (
              <div
                key={child.id}
                className="flex items-center gap-2 text-xs bg-gray-900/50 px-2 py-1 rounded cursor-pointer hover:bg-gray-800 transition-colors"
                onClick={() => selectNode(child.id)}
              >
                <span style={{ color: NODE_TYPE_CONFIG[child.type].color }}>
                  {NODE_TYPE_CONFIG[child.type].icon}
                </span>
                <span className="text-gray-300 truncate">{child.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
