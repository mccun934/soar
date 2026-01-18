/**
 * SOAR Architecture Schema - Zod Validation
 * Runtime validation for architecture JSON files
 */

import { z } from 'zod'

// Node types representing different architectural components
export const NodeTypeSchema = z.enum([
  'service',      // Microservice or standalone service
  'module',       // Code module/package within a service
  'class',        // Class or major code construct
  'function',     // Function or method
  'database',     // Database or data store
  'cache',        // Caching layer (Redis, Memcached)
  'queue',        // Message queue (RabbitMQ, Kafka, SQS)
  'gateway',      // API Gateway or load balancer
  'external',     // External service/API
  'container',    // Docker container or pod
  'region',       // Cloud region for deployment view
  'cluster',      // Kubernetes cluster or server group
])

// Connection types representing relationships
export const ConnectionTypeSchema = z.enum([
  'http',         // HTTP/REST API call
  'grpc',         // gRPC call
  'websocket',    // WebSocket connection
  'database',     // Database connection
  'queue',        // Message queue pub/sub
  'import',       // Code import/dependency
  'inheritance',  // Class inheritance
  'composition',  // Object composition
  'event',        // Event emission/subscription
])

// Health status for live monitoring
export const HealthStatusSchema = z.enum(['healthy', 'degraded', 'unhealthy', 'unknown'])

// Position in 3D space
export const Position3DSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
})

// Metrics for live data
export const NodeMetricsSchema = z.object({
  requestsPerSecond: z.number().optional(),
  latencyMs: z.number().optional(),
  errorRate: z.number().optional(),
  cpuPercent: z.number().optional(),
  memoryPercent: z.number().optional(),
  connections: z.number().optional(),
})

// Architecture node schema with recursive children
// Using z.lazy for recursive type definition
export const ArchitectureNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string().min(1, 'Node id is required'),
    name: z.string().min(1, 'Node name is required'),
    type: NodeTypeSchema,
    description: z.string().optional(),

    // Visual properties
    position: Position3DSchema.optional(),
    color: z.string().optional(),
    size: z.number().positive().optional(),

    // Hierarchy
    parentId: z.string().optional(),
    children: z.array(ArchitectureNodeSchema).optional(),

    // Code reference for drill-down
    filePath: z.string().optional(),
    lineStart: z.number().int().positive().optional(),
    lineEnd: z.number().int().positive().optional(),

    // Tech stack info
    technology: z.string().optional(),
    language: z.string().optional(),
    framework: z.string().optional(),

    // Live data
    health: HealthStatusSchema.optional(),
    metrics: NodeMetricsSchema.optional(),

    // Deployment info
    region: z.string().optional(),
    instances: z.number().int().positive().optional(),

    // Custom metadata
    metadata: z.record(z.string(), z.any()).optional(),
  })
)

// Connection between nodes
export const ArchitectureConnectionSchema = z.object({
  id: z.string().min(1, 'Connection id is required'),
  sourceId: z.string().min(1, 'Connection sourceId is required'),
  targetId: z.string().min(1, 'Connection targetId is required'),
  type: ConnectionTypeSchema,
  label: z.string().optional(),

  // Visual properties
  color: z.string().optional(),
  thickness: z.number().positive().optional(),
  animated: z.boolean().optional(),

  // Flow direction and data
  bidirectional: z.boolean().optional(),
  dataFlow: z.enum(['request', 'response', 'stream', 'event']).optional(),

  // Live metrics
  requestsPerSecond: z.number().optional(),
  latencyMs: z.number().optional(),
  errorRate: z.number().optional(),

  // Custom metadata
  metadata: z.record(z.string(), z.any()).optional(),
})

// Detail level for zoom-based rendering
export const DetailLevelSchema = z.enum(['overview', 'service', 'module', 'code'])

// Layout configuration
export const LayoutSchema = z.object({
  type: z.enum(['force', 'hierarchical', 'radial', 'manual']),
  spacing: z.number().positive().optional(),
  layers: z.array(z.array(z.string())).optional(),
})

// Default view settings
export const DefaultViewSchema = z.object({
  position: Position3DSchema,
  target: Position3DSchema,
  detailLevel: DetailLevelSchema,
})

// Complete architecture model
export const ArchitectureSchema = z.object({
  // Metadata
  name: z.string().min(1, 'Architecture name is required'),
  version: z.string().min(1, 'Architecture version is required'),
  description: z.string().optional(),
  generatedAt: z.string().optional(),
  sourceRepository: z.string().optional(),

  // The architecture graph
  nodes: z.array(ArchitectureNodeSchema).min(1, 'Architecture must have at least one node'),
  connections: z.array(ArchitectureConnectionSchema),

  // Layout hints
  layout: LayoutSchema.optional(),

  // Default view settings
  defaultView: DefaultViewSchema.optional(),
})

// Analysis result schema
export const AnalysisResultSchema = z.object({
  architecture: ArchitectureSchema,
  summary: z.string(),
  insights: z.array(z.string()),
  warnings: z.array(z.string()),
})

// Inferred TypeScript types from Zod schemas
export type NodeType = z.infer<typeof NodeTypeSchema>
export type ConnectionType = z.infer<typeof ConnectionTypeSchema>
export type HealthStatus = z.infer<typeof HealthStatusSchema>
export type Position3D = z.infer<typeof Position3DSchema>
export type NodeMetrics = z.infer<typeof NodeMetricsSchema>
export interface ArchitectureNode {
  id: string
  name: string
  type: NodeType
  description?: string
  position?: Position3D
  color?: string
  size?: number
  parentId?: string
  children?: ArchitectureNode[]
  filePath?: string
  lineStart?: number
  lineEnd?: number
  technology?: string
  language?: string
  framework?: string
  health?: HealthStatus
  metrics?: NodeMetrics
  region?: string
  instances?: number
  metadata?: Record<string, unknown>
}
export type ArchitectureConnection = z.infer<typeof ArchitectureConnectionSchema>
export type DetailLevel = z.infer<typeof DetailLevelSchema>
export type Architecture = z.infer<typeof ArchitectureSchema>
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>

/**
 * Validation result with detailed errors
 */
export interface ValidationResult {
  success: boolean
  data?: AnalysisResult
  errors?: ValidationError[]
}

export interface ValidationError {
  path: string
  message: string
  code: string
}

/**
 * Format Zod errors into user-friendly validation errors
 */
function formatZodErrors(error: z.ZodError): ValidationError[] {
  // Zod v4 uses 'issues' instead of 'errors'
  const issues = error.issues || (error as any).errors || []
  return issues.map((err: any) => ({
    path: (err.path || []).join('.') || 'root',
    message: err.message,
    code: err.code,
  }))
}

/**
 * Validate an architecture JSON object
 */
export function validateArchitecture(data: unknown): ValidationResult {
  const result = AnalysisResultSchema.safeParse(data)

  if (result.success) {
    return {
      success: true,
      data: result.data,
    }
  }

  return {
    success: false,
    errors: formatZodErrors(result.error),
  }
}

/**
 * Validate just the Architecture portion (without summary/insights/warnings)
 */
export function validateArchitectureOnly(data: unknown): ValidationResult {
  // Wrap in expected structure if it's just the architecture
  const wrapped = { architecture: data, summary: '', insights: [], warnings: [] }
  const result = AnalysisResultSchema.safeParse(wrapped)

  if (result.success) {
    return {
      success: true,
      data: result.data,
    }
  }

  return {
    success: false,
    errors: formatZodErrors(result.error),
  }
}

/**
 * Pretty print validation errors for CLI output
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  const lines = ['Validation errors:']

  for (const err of errors) {
    lines.push(`  - ${err.path}: ${err.message}`)
  }

  return lines.join('\n')
}
