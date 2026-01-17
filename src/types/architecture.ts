/**
 * SOAR Architecture Schema
 * JSON representation of software architecture for 3D visualization
 */

// Node types representing different architectural components
export type NodeType =
  | 'service'      // Microservice or standalone service
  | 'module'       // Code module/package within a service
  | 'class'        // Class or major code construct
  | 'function'     // Function or method
  | 'database'     // Database or data store
  | 'cache'        // Caching layer (Redis, Memcached)
  | 'queue'        // Message queue (RabbitMQ, Kafka, SQS)
  | 'gateway'      // API Gateway or load balancer
  | 'external'     // External service/API
  | 'container'    // Docker container or pod
  | 'region'       // Cloud region for deployment view
  | 'cluster'      // Kubernetes cluster or server group

// Connection types representing relationships
export type ConnectionType =
  | 'http'         // HTTP/REST API call
  | 'grpc'         // gRPC call
  | 'websocket'    // WebSocket connection
  | 'database'     // Database connection
  | 'queue'        // Message queue pub/sub
  | 'import'       // Code import/dependency
  | 'inheritance'  // Class inheritance
  | 'composition'  // Object composition
  | 'event'        // Event emission/subscription

// Health/status for live monitoring (future feature)
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown'

// Position in 3D space
export interface Position3D {
  x: number
  y: number
  z: number
}

// Metrics for live data (future feature)
export interface NodeMetrics {
  requestsPerSecond?: number
  latencyMs?: number
  errorRate?: number
  cpuPercent?: number
  memoryPercent?: number
  connections?: number
}

// Base node interface
export interface ArchitectureNode {
  id: string
  name: string
  type: NodeType
  description?: string

  // Visual properties
  position?: Position3D
  color?: string
  size?: number

  // Hierarchy - nodes can contain other nodes
  children?: ArchitectureNode[]
  parentId?: string

  // Code reference for drill-down
  filePath?: string
  lineStart?: number
  lineEnd?: number

  // Tech stack info
  technology?: string
  language?: string
  framework?: string

  // Live data (future feature)
  health?: HealthStatus
  metrics?: NodeMetrics

  // Deployment info (future feature)
  region?: string
  instances?: number

  // Custom metadata
  metadata?: Record<string, unknown>
}

// Connection between nodes
export interface ArchitectureConnection {
  id: string
  sourceId: string
  targetId: string
  type: ConnectionType
  label?: string

  // Visual properties
  color?: string
  thickness?: number
  animated?: boolean

  // Flow direction and data
  bidirectional?: boolean
  dataFlow?: 'request' | 'response' | 'stream' | 'event'

  // Live metrics (future feature)
  requestsPerSecond?: number
  latencyMs?: number
  errorRate?: number

  // Custom metadata
  metadata?: Record<string, unknown>
}

// Detail level for zoom-based rendering
export type DetailLevel = 'overview' | 'service' | 'module' | 'code'

// Complete architecture model
export interface Architecture {
  // Metadata
  name: string
  version: string
  description?: string
  generatedAt?: string
  sourceRepository?: string

  // The architecture graph
  nodes: ArchitectureNode[]
  connections: ArchitectureConnection[]

  // Layout hints
  layout?: {
    type: 'force' | 'hierarchical' | 'radial' | 'manual'
    spacing?: number
    layers?: string[][]  // For hierarchical layout
  }

  // Default view settings
  defaultView?: {
    position: Position3D
    target: Position3D
    detailLevel: DetailLevel
  }
}

// Analysis request for Anthropic SDK
export interface AnalysisRequest {
  repositoryPath: string
  includePatterns?: string[]
  excludePatterns?: string[]
  maxDepth?: number
  analysisType: 'full' | 'services' | 'dependencies' | 'classes'
}

// Analysis result from Anthropic SDK
export interface AnalysisResult {
  architecture: Architecture
  summary: string
  insights: string[]
  warnings: string[]
}

// Node type visual configurations
export const NODE_TYPE_CONFIG: Record<NodeType, {
  color: string
  shape: 'box' | 'sphere' | 'cylinder' | 'octahedron' | 'torus'
  defaultSize: number
  icon: string
}> = {
  service: { color: '#00d4ff', shape: 'box', defaultSize: 2, icon: '⬡' },
  module: { color: '#9d4edd', shape: 'box', defaultSize: 1.5, icon: '◈' },
  class: { color: '#ff6b6b', shape: 'octahedron', defaultSize: 1, icon: '◆' },
  function: { color: '#ffd93d', shape: 'sphere', defaultSize: 0.5, icon: 'ƒ' },
  database: { color: '#00ff88', shape: 'cylinder', defaultSize: 2, icon: '⛁' },
  cache: { color: '#ff9500', shape: 'torus', defaultSize: 1.5, icon: '◎' },
  queue: { color: '#c77dff', shape: 'box', defaultSize: 1.5, icon: '≡' },
  gateway: { color: '#48bfe3', shape: 'octahedron', defaultSize: 2.5, icon: '⬢' },
  external: { color: '#adb5bd', shape: 'sphere', defaultSize: 1.5, icon: '◇' },
  container: { color: '#0077b6', shape: 'box', defaultSize: 3, icon: '▣' },
  region: { color: '#2a9d8f', shape: 'box', defaultSize: 10, icon: '⌘' },
  cluster: { color: '#e76f51', shape: 'box', defaultSize: 5, icon: '⎔' },
}

// Connection type visual configurations
export const CONNECTION_TYPE_CONFIG: Record<ConnectionType, {
  color: string
  dashPattern?: number[]
  animated: boolean
}> = {
  http: { color: '#00d4ff', animated: true },
  grpc: { color: '#9d4edd', animated: true },
  websocket: { color: '#00ff88', dashPattern: [0.5, 0.2], animated: true },
  database: { color: '#00ff88', animated: false },
  queue: { color: '#c77dff', dashPattern: [0.3, 0.3], animated: true },
  import: { color: '#6c757d', animated: false },
  inheritance: { color: '#ff6b6b', dashPattern: [0.2, 0.1], animated: false },
  composition: { color: '#ffd93d', animated: false },
  event: { color: '#ff9500', dashPattern: [0.1, 0.1], animated: true },
}
