import { useEffect } from 'react'
import { Scene } from '@/components/Scene'
import { UIOverlay } from '@/components/UIOverlay'
import { useArchitectureStore } from '@/store/architectureStore'
import { sampleArchitecture } from '@/lib/sampleData'

function App() {
  const { setArchitecture, isLoading, error } = useArchitectureStore()

  useEffect(() => {
    // Load sample architecture on mount
    setArchitecture(sampleArchitecture)
  }, [setArchitecture])

  return (
    <div className="relative w-full h-full bg-soar-darker">
      {/* 3D Scene */}
      <Scene />

      {/* UI Overlay */}
      <UIOverlay />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-soar-darker/80 z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="spinner w-12 h-12" />
            <p className="text-soar-accent font-mono">Analyzing architecture...</p>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="glass-panel px-4 py-2 border-soar-error/50">
            <p className="text-soar-error text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
