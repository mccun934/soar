import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { QuadraticBezierLine } from '@react-three/drei'
import { Vector3, Mesh } from 'three'
import { useArchitectureStore } from '@/store/architectureStore'
import type { ArchitectureConnection, Position3D } from '@/types/architecture'
import { CONNECTION_TYPE_CONFIG } from '@/types/architecture'

interface ConnectionLineProps {
  connection: ArchitectureConnection
  startPosition: Position3D
  endPosition: Position3D
}

export function ConnectionLine({
  connection,
  startPosition,
  endPosition,
}: ConnectionLineProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineRef = useRef<any>(null)
  const { animateConnections, selectedNodeId, hoveredNodeId } = useArchitectureStore()

  const config = CONNECTION_TYPE_CONFIG[connection.type]
  const color = connection.color || config.color
  const thickness = connection.thickness || 2

  const isHighlighted =
    selectedNodeId === connection.sourceId ||
    selectedNodeId === connection.targetId ||
    hoveredNodeId === connection.sourceId ||
    hoveredNodeId === connection.targetId

  // Calculate control point for curved line
  const midPoint = useMemo(() => {
    const mid = new Vector3(
      (startPosition.x + endPosition.x) / 2,
      (startPosition.y + endPosition.y) / 2 + 2, // Curve upward
      (startPosition.z + endPosition.z) / 2
    )
    return mid
  }, [startPosition, endPosition])

  // Animation for dashed lines
  useFrame((state) => {
    if (lineRef.current && animateConnections && config.animated) {
      // Animate dash offset
      const material = lineRef.current.material as unknown as { dashOffset?: number }
      if (material.dashOffset !== undefined) {
        material.dashOffset = -state.clock.elapsedTime * 2
      }
    }
  })

  const start: [number, number, number] = [
    startPosition.x,
    startPosition.y,
    startPosition.z,
  ]
  const end: [number, number, number] = [
    endPosition.x,
    endPosition.y,
    endPosition.z,
  ]
  const mid: [number, number, number] = [midPoint.x, midPoint.y, midPoint.z]

  // Use curved line for better visibility
  return (
    <group>
      <QuadraticBezierLine
        ref={lineRef}
        start={start}
        end={end}
        mid={mid}
        color={color}
        lineWidth={isHighlighted ? thickness * 2 : thickness}
        transparent
        opacity={isHighlighted ? 1 : 0.6}
        dashed={!!config.dashPattern}
        dashScale={config.dashPattern ? 5 : undefined}
        dashSize={config.dashPattern ? config.dashPattern[0] : undefined}
        gapSize={config.dashPattern ? config.dashPattern[1] : undefined}
      />

      {/* Arrow head at end */}
      {!connection.bidirectional && (
        <mesh position={end}>
          <coneGeometry args={[0.2, 0.5, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
      )}

      {/* Flow particles for animated connections */}
      {animateConnections && config.animated && (
        <FlowParticle
          start={startPosition}
          mid={midPoint}
          end={endPosition}
          color={color}
        />
      )}
    </group>
  )
}

// Animated particle that flows along the connection
function FlowParticle({
  start,
  mid,
  end,
  color,
}: {
  start: Position3D
  mid: Vector3
  end: Position3D
  color: string
}) {
  const meshRef = useRef<Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      // Calculate position along bezier curve
      const t = (Math.sin(state.clock.elapsedTime * 2) + 1) / 2

      // Quadratic bezier formula
      const x =
        (1 - t) * (1 - t) * start.x +
        2 * (1 - t) * t * mid.x +
        t * t * end.x
      const y =
        (1 - t) * (1 - t) * start.y +
        2 * (1 - t) * t * mid.y +
        t * t * end.y
      const z =
        (1 - t) * (1 - t) * start.z +
        2 * (1 - t) * t * mid.z +
        t * t * end.z

      meshRef.current.position.set(x, y, z)
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.15, 8, 8]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}
