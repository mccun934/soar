import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useArchitectureStore } from '@/store/architectureStore'

// Key state tracking
const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  q: false,
  e: false,
  shift: false,
  space: false,
}

// Mouse state
const mouse = {
  isDown: false,
  isRightDown: false,
  x: 0,
  y: 0,
  deltaX: 0,
  deltaY: 0,
}

export function CameraController() {
  const { camera, gl } = useThree()
  const setCameraPosition = useArchitectureStore((state) => state.setCameraPosition)

  const velocity = useRef(new Vector3())
  const targetRotationX = useRef(0)
  const targetRotationY = useRef(0)
  const currentRotationX = useRef(0)
  const currentRotationY = useRef(-0.3) // Slight downward angle

  // Movement settings
  const moveSpeed = 0.5
  const boostMultiplier = 2.5
  const rotationSpeed = 0.003
  const damping = 0.9
  const rotationDamping = 0.15

  useEffect(() => {
    const canvas = gl.domElement

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key in keys) {
        keys[key as keyof typeof keys] = true
      }
      if (e.key === 'Shift') keys.shift = true
      if (e.key === ' ') {
        keys.space = true
        e.preventDefault()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key in keys) {
        keys[key as keyof typeof keys] = false
      }
      if (e.key === 'Shift') keys.shift = false
      if (e.key === ' ') keys.space = false
    }

    // Mouse handlers
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) mouse.isDown = true
      if (e.button === 2) mouse.isRightDown = true
      mouse.x = e.clientX
      mouse.y = e.clientY
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) mouse.isDown = false
      if (e.button === 2) mouse.isRightDown = false
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (mouse.isRightDown || mouse.isDown) {
        mouse.deltaX = e.clientX - mouse.x
        mouse.deltaY = e.clientY - mouse.y
        mouse.x = e.clientX
        mouse.y = e.clientY

        // Update target rotation
        targetRotationX.current -= mouse.deltaX * rotationSpeed
        targetRotationY.current -= mouse.deltaY * rotationSpeed

        // Clamp vertical rotation
        targetRotationY.current = Math.max(
          -Math.PI / 2 + 0.1,
          Math.min(Math.PI / 2 - 0.1, targetRotationY.current)
        )
      }
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      // Zoom by moving forward/backward
      const direction = new Vector3(0, 0, -1)
      direction.applyQuaternion(camera.quaternion)
      const zoomSpeed = e.deltaY * 0.05
      camera.position.addScaledVector(direction, -zoomSpeed)
    }

    const handleContextMenu = (e: Event) => {
      e.preventDefault()
    }

    // Add listeners
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    canvas.addEventListener('contextmenu', handleContextMenu)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [gl, camera])

  useFrame(() => {
    // Smooth rotation interpolation
    currentRotationX.current += (targetRotationX.current - currentRotationX.current) * rotationDamping
    currentRotationY.current += (targetRotationY.current - currentRotationY.current) * rotationDamping

    // Apply rotation
    camera.rotation.order = 'YXZ'
    camera.rotation.y = currentRotationX.current
    camera.rotation.x = currentRotationY.current

    // Calculate movement direction
    const forward = new Vector3(0, 0, -1)
    const right = new Vector3(1, 0, 0)
    const up = new Vector3(0, 1, 0)

    // Apply camera rotation to movement vectors (only horizontal)
    forward.applyAxisAngle(up, currentRotationX.current)
    right.applyAxisAngle(up, currentRotationX.current)

    // Calculate speed
    const speed = keys.shift ? moveSpeed * boostMultiplier : moveSpeed

    // Apply movement based on keys
    if (keys.w) velocity.current.addScaledVector(forward, speed)
    if (keys.s) velocity.current.addScaledVector(forward, -speed)
    if (keys.a) velocity.current.addScaledVector(right, -speed)
    if (keys.d) velocity.current.addScaledVector(right, speed)
    if (keys.space) velocity.current.y += speed
    if (keys.q) velocity.current.y -= speed

    // Apply velocity
    camera.position.add(velocity.current)

    // Apply damping
    velocity.current.multiplyScalar(damping)

    // Update store with camera position
    setCameraPosition({
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    })
  })

  return null
}
