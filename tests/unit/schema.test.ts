import { describe, it, expect } from 'vitest'
import {
  validateArchitecture,
  validateArchitectureOnly,
  formatValidationErrors,
  ArchitectureNodeSchema,
  ArchitectureConnectionSchema,
  ArchitectureSchema,
  AnalysisResultSchema,
} from '../../src/lib/schema'

describe('Schema Validation - Phase 1', () => {
  describe('ArchitectureNodeSchema', () => {
    it('should validate a minimal valid node', () => {
      const node = {
        id: 'node-1',
        name: 'Test Service',
        type: 'service',
      }
      const result = ArchitectureNodeSchema.safeParse(node)
      expect(result.success).toBe(true)
    })

    it('should validate a node with all optional fields', () => {
      const node = {
        id: 'node-1',
        name: 'Test Service',
        type: 'service',
        description: 'A test service',
        position: { x: 0, y: 0, z: 0 },
        color: '#00d4ff',
        size: 2,
        parentId: 'parent-1',
        filePath: '/src/service.ts',
        lineStart: 1,
        lineEnd: 100,
        technology: 'Node.js',
        language: 'TypeScript',
        framework: 'Express',
        health: 'healthy',
        metrics: {
          requestsPerSecond: 100,
          latencyMs: 50,
          errorRate: 0.01,
        },
        region: 'us-east-1',
        instances: 3,
        metadata: { custom: 'data' },
      }
      const result = ArchitectureNodeSchema.safeParse(node)
      expect(result.success).toBe(true)
    })

    it('should validate a node with children', () => {
      const node = {
        id: 'parent',
        name: 'Parent Service',
        type: 'service',
        children: [
          { id: 'child-1', name: 'Child Module', type: 'module' },
          { id: 'child-2', name: 'Child Class', type: 'class' },
        ],
      }
      const result = ArchitectureNodeSchema.safeParse(node)
      expect(result.success).toBe(true)
    })

    it('should reject node with empty id', () => {
      const node = {
        id: '',
        name: 'Test Service',
        type: 'service',
      }
      const result = ArchitectureNodeSchema.safeParse(node)
      expect(result.success).toBe(false)
    })

    it('should reject node with empty name', () => {
      const node = {
        id: 'node-1',
        name: '',
        type: 'service',
      }
      const result = ArchitectureNodeSchema.safeParse(node)
      expect(result.success).toBe(false)
    })

    it('should reject node with invalid type', () => {
      const node = {
        id: 'node-1',
        name: 'Test Service',
        type: 'invalid-type',
      }
      const result = ArchitectureNodeSchema.safeParse(node)
      expect(result.success).toBe(false)
    })

    it('should reject node with missing required fields', () => {
      const node = { id: 'node-1' }
      const result = ArchitectureNodeSchema.safeParse(node)
      expect(result.success).toBe(false)
    })

    it('should validate all node types', () => {
      const nodeTypes = [
        'service', 'module', 'class', 'function', 'database',
        'cache', 'queue', 'gateway', 'external', 'container',
        'region', 'cluster',
      ]
      for (const type of nodeTypes) {
        const node = { id: 'n1', name: 'Test', type }
        const result = ArchitectureNodeSchema.safeParse(node)
        expect(result.success, `Type ${type} should be valid`).toBe(true)
      }
    })
  })

  describe('ArchitectureConnectionSchema', () => {
    it('should validate a minimal valid connection', () => {
      const conn = {
        id: 'conn-1',
        sourceId: 'node-1',
        targetId: 'node-2',
        type: 'http',
      }
      const result = ArchitectureConnectionSchema.safeParse(conn)
      expect(result.success).toBe(true)
    })

    it('should validate a connection with all optional fields', () => {
      const conn = {
        id: 'conn-1',
        sourceId: 'node-1',
        targetId: 'node-2',
        type: 'http',
        label: 'REST API',
        color: '#00d4ff',
        thickness: 2,
        animated: true,
        bidirectional: false,
        dataFlow: 'request',
        requestsPerSecond: 100,
        latencyMs: 50,
        errorRate: 0.01,
        metadata: { protocol: 'HTTP/2' },
      }
      const result = ArchitectureConnectionSchema.safeParse(conn)
      expect(result.success).toBe(true)
    })

    it('should reject connection with empty sourceId', () => {
      const conn = {
        id: 'conn-1',
        sourceId: '',
        targetId: 'node-2',
        type: 'http',
      }
      const result = ArchitectureConnectionSchema.safeParse(conn)
      expect(result.success).toBe(false)
    })

    it('should reject connection with invalid type', () => {
      const conn = {
        id: 'conn-1',
        sourceId: 'node-1',
        targetId: 'node-2',
        type: 'invalid',
      }
      const result = ArchitectureConnectionSchema.safeParse(conn)
      expect(result.success).toBe(false)
    })

    it('should validate all connection types', () => {
      const connTypes = [
        'http', 'grpc', 'websocket', 'database', 'queue',
        'import', 'inheritance', 'composition', 'event',
      ]
      for (const type of connTypes) {
        const conn = { id: 'c1', sourceId: 'n1', targetId: 'n2', type }
        const result = ArchitectureConnectionSchema.safeParse(conn)
        expect(result.success, `Type ${type} should be valid`).toBe(true)
      }
    })
  })

  describe('ArchitectureSchema', () => {
    it('should validate a minimal valid architecture', () => {
      const arch = {
        name: 'Test App',
        version: '1.0.0',
        nodes: [{ id: 'n1', name: 'Service', type: 'service' }],
        connections: [],
      }
      const result = ArchitectureSchema.safeParse(arch)
      expect(result.success).toBe(true)
    })

    it('should reject architecture with no nodes', () => {
      const arch = {
        name: 'Test App',
        version: '1.0.0',
        nodes: [],
        connections: [],
      }
      const result = ArchitectureSchema.safeParse(arch)
      expect(result.success).toBe(false)
    })

    it('should reject architecture with missing name', () => {
      const arch = {
        version: '1.0.0',
        nodes: [{ id: 'n1', name: 'Service', type: 'service' }],
        connections: [],
      }
      const result = ArchitectureSchema.safeParse(arch)
      expect(result.success).toBe(false)
    })

    it('should validate architecture with layout hints', () => {
      const arch = {
        name: 'Test App',
        version: '1.0.0',
        nodes: [{ id: 'n1', name: 'Service', type: 'service' }],
        connections: [],
        layout: {
          type: 'hierarchical',
          spacing: 10,
          layers: [['n1']],
        },
      }
      const result = ArchitectureSchema.safeParse(arch)
      expect(result.success).toBe(true)
    })
  })

  describe('AnalysisResultSchema', () => {
    it('should validate a complete analysis result', () => {
      const result = {
        architecture: {
          name: 'Test App',
          version: '1.0.0',
          nodes: [{ id: 'n1', name: 'Service', type: 'service' }],
          connections: [],
        },
        summary: 'A test application',
        insights: ['Insight 1', 'Insight 2'],
        warnings: ['Warning 1'],
      }
      const validation = AnalysisResultSchema.safeParse(result)
      expect(validation.success).toBe(true)
    })

    it('should reject result with missing summary', () => {
      const result = {
        architecture: {
          name: 'Test App',
          version: '1.0.0',
          nodes: [{ id: 'n1', name: 'Service', type: 'service' }],
          connections: [],
        },
        insights: [],
        warnings: [],
      }
      const validation = AnalysisResultSchema.safeParse(result)
      expect(validation.success).toBe(false)
    })
  })

  describe('validateArchitecture function', () => {
    it('should return success for valid data', () => {
      const data = {
        architecture: {
          name: 'Test App',
          version: '1.0.0',
          nodes: [{ id: 'n1', name: 'Service', type: 'service' }],
          connections: [],
        },
        summary: 'Test',
        insights: [],
        warnings: [],
      }
      const result = validateArchitecture(data)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.errors).toBeUndefined()
    })

    it('should return errors for invalid data', () => {
      const data = {
        architecture: {
          name: '',
          version: '1.0.0',
          nodes: [],
          connections: [],
        },
        summary: 'Test',
        insights: [],
        warnings: [],
      }
      const result = validateArchitecture(data)
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })

    it('should return detailed error paths', () => {
      const data = {
        architecture: {
          name: 'Test',
          version: '1.0.0',
          nodes: [
            { id: '', name: 'Service', type: 'service' },
          ],
          connections: [],
        },
        summary: 'Test',
        insights: [],
        warnings: [],
      }
      const result = validateArchitecture(data)
      expect(result.success).toBe(false)
      const idError = result.errors!.find(e => e.path.includes('id'))
      expect(idError).toBeDefined()
    })
  })

  describe('formatValidationErrors function', () => {
    it('should format errors as readable string', () => {
      const errors = [
        { path: 'architecture.name', message: 'Required', code: 'invalid_type' },
        { path: 'architecture.nodes.0.id', message: 'Too short', code: 'too_small' },
      ]
      const output = formatValidationErrors(errors)
      expect(output).toContain('Validation errors:')
      expect(output).toContain('architecture.name')
      expect(output).toContain('architecture.nodes.0.id')
    })
  })
})
