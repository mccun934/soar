import { useArchitectureStore } from '@/store/architectureStore'
import type { DetailLevel } from '@/types/architecture'

export function ControlPanel() {
  const {
    detailLevel,
    showConnections,
    showLabels,
    animateConnections,
    setDetailLevel,
    setShowConnections,
    setShowLabels,
    setAnimateConnections,
  } = useArchitectureStore()

  const detailLevels: { value: DetailLevel; label: string; icon: string }[] = [
    { value: 'overview', label: 'Overview', icon: '◉' },
    { value: 'service', label: 'Services', icon: '⬡' },
    { value: 'module', label: 'Modules', icon: '◈' },
    { value: 'code', label: 'Code', icon: '{ }' },
  ]

  return (
    <div className="glass-panel p-4 w-48 pointer-events-auto">
      <h3 className="text-soar-accent font-semibold text-sm mb-4">View Controls</h3>

      {/* Detail level */}
      <div className="mb-4">
        <div className="text-gray-400 text-xs mb-2">Detail Level</div>
        <div className="space-y-1">
          {detailLevels.map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => setDetailLevel(value)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all ${
                detailLevel === value
                  ? 'bg-soar-accent/20 text-soar-accent border border-soar-accent/50'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2">
        <div className="text-gray-400 text-xs mb-2">Display</div>

        <Toggle
          label="Connections"
          checked={showConnections}
          onChange={setShowConnections}
        />

        <Toggle
          label="Labels"
          checked={showLabels}
          onChange={setShowLabels}
        />

        <Toggle
          label="Animate"
          checked={animateConnections}
          onChange={setAnimateConnections}
        />
      </div>

      {/* Quick actions */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="text-gray-400 text-xs mb-2">Actions</div>
        <button
          onClick={() => window.location.reload()}
          className="w-full px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-all text-left"
        >
          ↺ Reset View
        </button>
      </div>
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-xs text-gray-400 group-hover:text-white transition-colors">
        {label}
      </span>
      <button
        onClick={() => onChange(!checked)}
        className={`w-8 h-4 rounded-full transition-all relative ${
          checked ? 'bg-soar-accent' : 'bg-gray-600'
        }`}
      >
        <span
          className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
            checked ? 'left-4' : 'left-0.5'
          }`}
        />
      </button>
    </label>
  )
}
