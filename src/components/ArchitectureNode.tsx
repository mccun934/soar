import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Text, RoundedBox } from '@react-three/drei'
import type { Mesh, Group } from 'three'
import { useArchitectureStore } from '@/store/architectureStore'
import type { ArchitectureNode } from '@/types/architecture'
import { NODE_TYPE_CONFIG } from '@/types/architecture'

interface ArchitectureNodeMeshProps {
  node: ArchitectureNode
  position: [number, number, number]
}

export function ArchitectureNodeMesh({ node, position }: ArchitectureNodeMeshProps) {
  const groupRef = useRef<Group>(null)
  const meshRef = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)

  const {
    selectedNodeId,
    hoveredNodeId,
    showLabels,
    selectNode,
    hoverNode,
    toggleNodeExpanded,
  } = useArchitectureStore()

  const isSelected = selectedNodeId === node.id
  const isHovered = hoveredNodeId === node.id || hovered

  const config = NODE_TYPE_CONFIG[node.type]
  const color = node.color || config.color
  const size = node.size || config.defaultSize

  // Animation
  useFrame((state) => {
    if (meshRef.current) {
      // Subtle floating animation
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime + node.id.length) * 0.1

      // Pulse when hovered or selected
      if (isHovered || isSelected) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.05
        meshRef.current.scale.setScalar(scale)
      } else {
        meshRef.current.scale.setScalar(1)
      }
    }
  })

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    selectNode(node.id)
  }

  const handleDoubleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    if (node.children && node.children.length > 0) {
      toggleNodeExpanded(node.id)
    }
  }

  const handlePointerOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    setHovered(true)
    hoverNode(node.id)
    document.body.style.cursor = 'pointer'
  }

  const handlePointerOut = () => {
    setHovered(false)
    hoverNode(null)
    document.body.style.cursor = 'auto'
  }

  const renderShape = () => {
    const commonProps = {
      ref: meshRef,
      onClick: handleClick,
      onDoubleClick: handleDoubleClick,
      onPointerOver: handlePointerOver,
      onPointerOut: handlePointerOut,
      castShadow: true,
      receiveShadow: true,
    }

    const emissiveIntensity = isSelected ? 0.5 : isHovered ? 0.3 : 0.1

    switch (config.shape) {
      case 'sphere':
        return (
          <mesh {...commonProps}>
            <sphereGeometry args={[size * 0.5, 32, 32]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={emissiveIntensity}
              metalness={0.3}
              roughness={0.4}
            />
          </mesh>
        )

      case 'cylinder':
        return (
          <mesh {...commonProps} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[size * 0.5, size * 0.5, size, 32]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={emissiveIntensity}
              metalness={0.3}
              roughness={0.4}
            />
          </mesh>
        )

      case 'octahedron':
        return (
          <mesh {...commonProps}>
            <octahedronGeometry args={[size * 0.6]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={emissiveIntensity}
              metalness={0.5}
              roughness={0.3}
            />
          </mesh>
        )

      case 'torus':
        return (
          <mesh {...commonProps} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[size * 0.4, size * 0.15, 16, 32]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={emissiveIntensity}
              metalness={0.4}
              roughness={0.3}
            />
          </mesh>
        )

      case 'box':
      default:
        return (
          <RoundedBox
            {...commonProps}
            args={[size, size * 0.6, size]}
            radius={0.1}
            smoothness={4}
          >
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={emissiveIntensity}
              metalness={0.3}
              roughness={0.4}
            />
          </RoundedBox>
        )
    }
  }

  return (
    <group ref={groupRef} position={position}>
      {renderShape()}

      {/* Glow ring for selected/hovered */}
      {(isSelected || isHovered) && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 0.8, size * 0.9, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={isSelected ? 0.6 : 0.3}
          />
        </mesh>
      )}

      {/* Label */}
      {showLabels && (
        <Text
          position={[0, size * 0.6 + 0.5, 0]}
          fontSize={0.5}
          color="white"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          {node.name}
        </Text>
      )}

      {/* Type icon */}
      <Text
        position={[0, -size * 0.5 - 0.3, 0]}
        fontSize={0.4}
        color={color}
        anchorX="center"
        anchorY="top"
      >
        {config.icon}
      </Text>

      {/* Info popup on hover */}
      {isHovered && (
        <Html
          position={[size, size * 0.5, 0]}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div className="glass-panel p-3 min-w-[200px] text-xs">
            <div className="font-semibold text-soar-accent mb-1">{node.name}</div>
            <div className="text-gray-400 mb-2">{node.type}</div>
            {node.description && (
              <div className="text-gray-300 text-xs">{node.description}</div>
            )}
            {node.technology && (
              <div className="text-gray-500 mt-1">
                Tech: {node.technology}
              </div>
            )}
            {node.children && node.children.length > 0 && (
              <div className="text-soar-accent-dim mt-2 text-xs">
                Double-click to expand ({node.children.length} children)
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}
