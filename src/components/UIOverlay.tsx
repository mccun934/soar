import { useArchitectureStore } from '@/store/architectureStore'
import { ControlPanel } from './ControlPanel'
import { NodeInfoPanel } from './NodeInfoPanel'
import { MiniMap } from './MiniMap'

export function UIOverlay() {
  const { architecture, cameraPosition } = useArchitectureStore()

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
        <div className="glass-panel px-4 py-2 pointer-events-auto">
          <h1 className="text-soar-accent font-bold text-xl tracking-wider">
            SOAR
          </h1>
          <p className="text-gray-400 text-xs">
            Software Architecture Visualizer
          </p>
        </div>

        {architecture && (
          <div className="glass-panel px-4 py-2 text-right">
            <div className="text-white font-semibold">{architecture.name}</div>
            <div className="text-gray-400 text-xs">
              v{architecture.version} • {architecture.nodes.length} nodes
            </div>
          </div>
        )}
      </header>

      {/* Left panel - Controls */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        <ControlPanel />
      </div>

      {/* Right panel - Node info */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        <NodeInfoPanel />
      </div>

      {/* Bottom left - Mini map */}
      <div className="absolute left-4 bottom-4">
        <MiniMap />
      </div>

      {/* Bottom center - Camera info & controls help */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className="glass-panel px-4 py-2 text-center">
          <div className="text-gray-400 text-xs mb-1">
            Position: ({cameraPosition.x.toFixed(1)}, {cameraPosition.y.toFixed(1)},{' '}
            {cameraPosition.z.toFixed(1)})
          </div>
          <div className="flex gap-4 text-xs text-gray-500">
            <span>
              <kbd className="px-1 bg-gray-800 rounded">WASD</kbd> Move
            </span>
            <span>
              <kbd className="px-1 bg-gray-800 rounded">Space/Q</kbd> Up/Down
            </span>
            <span>
              <kbd className="px-1 bg-gray-800 rounded">Mouse</kbd> Look
            </span>
            <span>
              <kbd className="px-1 bg-gray-800 rounded">Scroll</kbd> Zoom
            </span>
            <span>
              <kbd className="px-1 bg-gray-800 rounded">Shift</kbd> Fast
            </span>
          </div>
        </div>
      </div>

      {/* Bottom right - Legend */}
      <div className="absolute right-4 bottom-4">
        <Legend />
      </div>
    </div>
  )
}

function Legend() {
  const nodeTypes = [
    { type: 'Service', color: '#00d4ff', icon: '⬡' },
    { type: 'Database', color: '#00ff88', icon: '⛁' },
    { type: 'Gateway', color: '#48bfe3', icon: '⬢' },
    { type: 'Queue', color: '#c77dff', icon: '≡' },
    { type: 'Cache', color: '#ff9500', icon: '◎' },
    { type: 'External', color: '#adb5bd', icon: '◇' },
  ]

  return (
    <div className="glass-panel p-3 pointer-events-auto">
      <div className="text-gray-400 text-xs font-semibold mb-2">Legend</div>
      <div className="space-y-1">
        {nodeTypes.map(({ type, color, icon }) => (
          <div key={type} className="flex items-center gap-2 text-xs">
            <span style={{ color }}>{icon}</span>
            <span className="text-gray-300">{type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
