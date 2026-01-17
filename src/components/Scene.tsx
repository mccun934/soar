import { Canvas } from '@react-three/fiber'
import { Stars, Environment, Grid } from '@react-three/drei'
import { Suspense } from 'react'
import { ArchitectureGraph } from './ArchitectureGraph'
import { CameraController } from './CameraController'

export function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 15, 30], fov: 60, near: 0.1, far: 1000 }}
      style={{ background: '#050508' }}
      shadows
    >
      <Suspense fallback={null}>
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <pointLight position={[-10, 10, -10]} intensity={0.5} color="#00d4ff" />
        <pointLight position={[10, 10, 10]} intensity={0.3} color="#9d4edd" />

        {/* Environment */}
        <Stars radius={300} depth={60} count={5000} factor={4} fade speed={1} />

        {/* Ground grid */}
        <Grid
          position={[0, -0.01, 0]}
          args={[100, 100]}
          cellSize={2}
          cellThickness={0.5}
          cellColor="#1a1a2e"
          sectionSize={10}
          sectionThickness={1}
          sectionColor="#00d4ff"
          fadeDistance={80}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid
        />

        {/* Architecture visualization */}
        <ArchitectureGraph />

        {/* Camera controls */}
        <CameraController />
      </Suspense>

      {/* Environment map for reflections */}
      <Environment preset="night" />
    </Canvas>
  )
}
