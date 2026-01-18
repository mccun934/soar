/**
 * CLI Integration tests for SOAR Architecture Analyzer
 *
 * These tests run the actual CLI command against public repositories
 *
 * Run with: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execSync, spawn } from 'child_process'
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// Test configuration
const TEST_REPOS_DIR = join(process.cwd(), '.test-repos-cli')
const CLI_TIMEOUT = 180000 // 3 minutes for clone + analysis

// Check if API credentials are available
function hasCredentials(): boolean {
  return !!(process.env.ANTHROPIC_API_KEY || process.env.GOOGLE_CLOUD_PROJECT)
}

// Clone a repo for testing
function cloneRepo(url: string, targetDir: string): void {
  console.log(`Cloning ${url}...`)
  execSync(`git clone --depth 1 ${url} ${targetDir}`, {
    timeout: 120000,
    stdio: 'pipe',
  })
}

// Run the CLI and capture output
function runCLI(args: string[], env?: Record<string, string>): { stdout: string; stderr: string; exitCode: number } {
  try {
    const result = execSync(`npx tsx src/cli/analyze.ts ${args.join(' ')}`, {
      timeout: CLI_TIMEOUT,
      encoding: 'utf-8',
      env: { ...process.env, ...env },
      cwd: process.cwd(),
    })
    return { stdout: result, stderr: '', exitCode: 0 }
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || error.message,
      exitCode: error.status || 1,
    }
  }
}

// Run the CLI with a shorter timeout (for commands that start servers and hang)
function runCLIWithTimeout(args: string[], timeoutMs: number): { stdout: string; stderr: string; exitCode: number } {
  try {
    const result = execSync(`npx tsx src/cli/analyze.ts ${args.join(' ')}`, {
      timeout: timeoutMs,
      encoding: 'utf-8',
      env: process.env,
      cwd: process.cwd(),
    })
    return { stdout: result, stderr: '', exitCode: 0 }
  } catch (error: any) {
    // Timeout is expected for server commands - capture output
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.killed ? 0 : (error.status || 1),
    }
  }
}

describe('CLI Integration Tests', () => {
  beforeAll(() => {
    if (!existsSync(TEST_REPOS_DIR)) {
      mkdirSync(TEST_REPOS_DIR, { recursive: true })
    }
  })

  afterAll(() => {
    if (existsSync(TEST_REPOS_DIR)) {
      console.log('Cleaning up CLI test repos...')
      rmSync(TEST_REPOS_DIR, { recursive: true, force: true })
    }
  })

  describe('CLI Help & Arguments', () => {
    it('should show help message with --help flag', () => {
      const result = runCLI(['--help'])
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('SOAR - Software Architecture Analyzer')
      expect(result.stdout).toContain('--output')
      expect(result.stdout).toContain('--vertex')
      expect(result.stdout).toContain('--project')
    })

    it('should show help message with -h flag', () => {
      const result = runCLI(['-h'])
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Usage:')
    })

    it('should show help when no arguments provided', () => {
      const result = runCLI([])
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('SOAR')
    })

    it('should error when no API key and not using vertex', () => {
      const result = runCLI(['./some-path'], { ANTHROPIC_API_KEY: '' })
      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('ANTHROPIC_API_KEY')
    })
  })

  describe('CLI Analysis - OpenCode Repository', () => {
    const repoPath = join(TEST_REPOS_DIR, 'opencode')
    const outputPath = join(TEST_REPOS_DIR, 'opencode-architecture.json')

    beforeAll(() => {
      if (!existsSync(repoPath)) {
        cloneRepo('https://github.com/anomalyco/opencode', repoPath)
      }
    })

    it('should analyze repository and output to stdout', async () => {
      if (!hasCredentials()) {
        console.log('Skipping - no API credentials')
        return
      }

      console.log('\n🔍 Running CLI analysis on opencode...')
      const result = runCLI([repoPath])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Analyzing repository')
      expect(result.stdout).toContain('Analysis Result')
      expect(result.stdout).toContain('Summary')
      expect(result.stdout).toContain('Nodes')
    })

    it('should analyze repository and save to file with -o flag', async () => {
      if (!hasCredentials()) {
        console.log('Skipping - no API credentials')
        return
      }

      console.log('\n🔍 Running CLI analysis with output file...')
      const result = runCLI([repoPath, '-o', outputPath])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Architecture saved to')
      expect(existsSync(outputPath)).toBe(true)

      // Validate the output file
      const content = readFileSync(outputPath, 'utf-8')
      const data = JSON.parse(content)

      expect(data.architecture).toBeDefined()
      expect(data.architecture.name).toBeTruthy()
      expect(data.architecture.nodes).toBeInstanceOf(Array)
      expect(data.architecture.nodes.length).toBeGreaterThan(0)
      expect(data.summary).toBeTruthy()

      console.log(`   Generated ${data.architecture.nodes.length} nodes`)
      console.log(`   Summary: ${data.summary.substring(0, 100)}...`)
    })

    it('should support --type flag for analysis type', async () => {
      if (!hasCredentials()) {
        console.log('Skipping - no API credentials')
        return
      }

      console.log('\n🔍 Running CLI with --type services...')
      const result = runCLI([repoPath, '-t', 'services'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Type: services')
    })

    it('should support --depth flag', async () => {
      if (!hasCredentials()) {
        console.log('Skipping - no API credentials')
        return
      }

      console.log('\n🔍 Running CLI with --depth 2...')
      const result = runCLI([repoPath, '-d', '2'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Max depth: 2')
    })
  })

  describe('CLI Analysis - GCP Microservices Demo', () => {
    const repoPath = join(TEST_REPOS_DIR, 'microservices-demo')
    const outputPath = join(TEST_REPOS_DIR, 'microservices-architecture.json')

    beforeAll(() => {
      if (!existsSync(repoPath)) {
        cloneRepo('https://github.com/GoogleCloudPlatform/microservices-demo', repoPath)
      }
    })

    it('should analyze GCP microservices demo and identify services', async () => {
      if (!hasCredentials()) {
        console.log('Skipping - no API credentials')
        return
      }

      console.log('\n🔍 Running CLI analysis on microservices-demo...')
      const result = runCLI([repoPath, '-o', outputPath, '-t', 'services'])

      expect(result.exitCode).toBe(0)
      expect(existsSync(outputPath)).toBe(true)

      const content = readFileSync(outputPath, 'utf-8')
      const data = JSON.parse(content)

      expect(data.architecture.nodes.length).toBeGreaterThan(5)

      // Should identify multiple services
      const services = data.architecture.nodes.filter((n: any) => n.type === 'service')
      console.log(`   Found ${services.length} services: ${services.map((s: any) => s.name).join(', ')}`)

      expect(services.length).toBeGreaterThan(3)
    })
  })

  describe('CLI Error Handling', () => {
    it('should handle non-existent repository path gracefully', async () => {
      if (!hasCredentials()) {
        console.log('Skipping - no API credentials')
        return
      }

      const result = runCLI(['/non/existent/path'])
      // Should still run but with empty/minimal results
      expect(result.stdout).toContain('Analyzing repository')
    })
  })

  describe('CLI --input Mode', () => {
    const testFilesDir = join(TEST_REPOS_DIR, 'input-test-files')

    beforeAll(() => {
      if (!existsSync(testFilesDir)) {
        mkdirSync(testFilesDir, { recursive: true })
      }
    })

    it('should show --input option in help', () => {
      const result = runCLI(['--help'])
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('--input')
      expect(result.stdout).toContain('-i')
      expect(result.stdout).toContain('Load architecture')
    })

    it('should error when input file does not exist', () => {
      const result = runCLI(['--input', '/non/existent/file.json'])
      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('File not found')
    })

    it('should error on invalid JSON file', () => {
      const invalidJsonPath = join(testFilesDir, 'invalid.json')
      writeFileSync(invalidJsonPath, '{ invalid json content')

      const result = runCLI(['--input', invalidJsonPath])
      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Invalid JSON')
    })

    it('should error on JSON missing architecture field', () => {
      const noArchPath = join(testFilesDir, 'no-architecture.json')
      writeFileSync(noArchPath, JSON.stringify({ name: 'test' }))

      const result = runCLI(['--input', noArchPath])
      expect(result.exitCode).toBe(1)
      // Zod validation error includes the field path
      expect(result.stderr).toContain('architecture')
    })

    it('should error on architecture missing nodes array', () => {
      const noNodesPath = join(testFilesDir, 'no-nodes.json')
      writeFileSync(noNodesPath, JSON.stringify({
        architecture: {
          name: 'Test',
          connections: []
        }
      }))

      const result = runCLI(['--input', noNodesPath])
      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('nodes')
    })

    it('should error on architecture missing connections array', () => {
      const noConnectionsPath = join(testFilesDir, 'no-connections.json')
      writeFileSync(noConnectionsPath, JSON.stringify({
        architecture: {
          name: 'Test',
          nodes: []
        }
      }))

      const result = runCLI(['--input', noConnectionsPath])
      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('connections')
    })

    it('should successfully validate and load a valid architecture file', () => {
      const validPath = join(testFilesDir, 'valid-architecture.json')
      const validArchitecture = {
        architecture: {
          name: 'Test Architecture',
          version: '1.0.0',
          description: 'A test architecture',
          nodes: [
            { id: 'node-1', name: 'Service A', type: 'service' },
            { id: 'node-2', name: 'Database', type: 'database' }
          ],
          connections: [
            { id: 'conn-1', sourceId: 'node-1', targetId: 'node-2', type: 'database' }
          ]
        },
        summary: 'Test architecture summary',
        insights: ['Insight 1'],
        warnings: []
      }
      writeFileSync(validPath, JSON.stringify(validArchitecture, null, 2))

      // Run with a timeout since the vite server will hang
      // We just want to verify it validates and starts (output shows success)
      // Need 5+ seconds for vite to initialize and output messages
      const result = runCLIWithTimeout(['--input', validPath], 6000)

      // Should show validation success messages
      expect(result.stdout).toContain('Loaded architecture from')
      expect(result.stdout).toContain('Test Architecture')
      expect(result.stdout).toContain('Nodes: 2')
      expect(result.stdout).toContain('Connections: 1')
      expect(result.stdout).toContain('Written to')
      expect(result.stdout).toContain('Starting visualization server')
    })

    it('should support --port flag with --input', () => {
      const validPath = join(testFilesDir, 'valid-architecture.json')
      // Reuse the valid file from previous test

      const result = runCLIWithTimeout(['--input', validPath, '--port', '8888'], 6000)

      expect(result.stdout).toContain('localhost:8888')
    })
  })

  describe('CLI --validate Mode (Phase 2)', () => {
    const testFilesDir = join(TEST_REPOS_DIR, 'validate-test-files')

    beforeAll(() => {
      if (!existsSync(testFilesDir)) {
        mkdirSync(testFilesDir, { recursive: true })
      }
    })

    it('should show --validate option in help', () => {
      const result = runCLI(['--help'])
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('--validate')
      expect(result.stdout).toContain('Validate')
    })

    it('should validate a valid architecture file and exit successfully', () => {
      const validPath = join(testFilesDir, 'valid.json')
      const validArchitecture = {
        architecture: {
          name: 'Valid App',
          version: '1.0.0',
          description: 'A valid architecture',
          nodes: [
            { id: 'svc-1', name: 'API Service', type: 'service' },
            { id: 'db-1', name: 'PostgreSQL', type: 'database' },
            { id: 'cache-1', name: 'Redis Cache', type: 'cache' },
          ],
          connections: [
            { id: 'c1', sourceId: 'svc-1', targetId: 'db-1', type: 'database' },
            { id: 'c2', sourceId: 'svc-1', targetId: 'cache-1', type: 'http' },
          ],
        },
        summary: 'A microservice with database and cache',
        insights: ['Uses PostgreSQL for persistence', 'Redis for caching'],
        warnings: [],
      }
      writeFileSync(validPath, JSON.stringify(validArchitecture, null, 2))

      const result = runCLI(['--validate', validPath])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Validation PASSED')
      expect(result.stdout).toContain('Valid App')
      expect(result.stdout).toContain('Nodes:       3')
      expect(result.stdout).toContain('Connections: 2')
      expect(result.stdout).toContain('service: 1')
      expect(result.stdout).toContain('database: 1')
      expect(result.stdout).toContain('cache: 1')
    })

    it('should fail validation for missing required fields', () => {
      const invalidPath = join(testFilesDir, 'missing-fields.json')
      writeFileSync(invalidPath, JSON.stringify({
        architecture: {
          name: 'Test',
          version: '1.0.0',
          nodes: [
            { id: 'n1', type: 'service' }, // missing name
          ],
          connections: [],
        },
        summary: 'Test',
        insights: [],
        warnings: [],
      }))

      const result = runCLI(['--validate', invalidPath])

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Validation FAILED')
      expect(result.stderr).toContain('name')
    })

    it('should fail validation for invalid node type', () => {
      const invalidPath = join(testFilesDir, 'invalid-node-type.json')
      writeFileSync(invalidPath, JSON.stringify({
        architecture: {
          name: 'Test',
          version: '1.0.0',
          nodes: [
            { id: 'n1', name: 'Bad Node', type: 'invalid-type' },
          ],
          connections: [],
        },
        summary: 'Test',
        insights: [],
        warnings: [],
      }))

      const result = runCLI(['--validate', invalidPath])

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Validation FAILED')
    })

    it('should fail validation for invalid connection type', () => {
      const invalidPath = join(testFilesDir, 'invalid-conn-type.json')
      writeFileSync(invalidPath, JSON.stringify({
        architecture: {
          name: 'Test',
          version: '1.0.0',
          nodes: [
            { id: 'n1', name: 'Node 1', type: 'service' },
            { id: 'n2', name: 'Node 2', type: 'service' },
          ],
          connections: [
            { id: 'c1', sourceId: 'n1', targetId: 'n2', type: 'invalid-connection' },
          ],
        },
        summary: 'Test',
        insights: [],
        warnings: [],
      }))

      const result = runCLI(['--validate', invalidPath])

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Validation FAILED')
    })

    it('should fail validation for empty nodes array', () => {
      const invalidPath = join(testFilesDir, 'empty-nodes.json')
      writeFileSync(invalidPath, JSON.stringify({
        architecture: {
          name: 'Test',
          version: '1.0.0',
          nodes: [],
          connections: [],
        },
        summary: 'Test',
        insights: [],
        warnings: [],
      }))

      const result = runCLI(['--validate', invalidPath])

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Validation FAILED')
      expect(result.stderr).toContain('at least one node')
    })

    it('should fail validation for empty architecture name', () => {
      const invalidPath = join(testFilesDir, 'empty-name.json')
      writeFileSync(invalidPath, JSON.stringify({
        architecture: {
          name: '',
          version: '1.0.0',
          nodes: [{ id: 'n1', name: 'Node', type: 'service' }],
          connections: [],
        },
        summary: 'Test',
        insights: [],
        warnings: [],
      }))

      const result = runCLI(['--validate', invalidPath])

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Validation FAILED')
    })

    it('should show node type breakdown in validation output', () => {
      const validPath = join(testFilesDir, 'multi-types.json')
      writeFileSync(validPath, JSON.stringify({
        architecture: {
          name: 'Multi-type App',
          version: '1.0.0',
          nodes: [
            { id: 'n1', name: 'API', type: 'gateway' },
            { id: 'n2', name: 'Service 1', type: 'service' },
            { id: 'n3', name: 'Service 2', type: 'service' },
            { id: 'n4', name: 'DB', type: 'database' },
            { id: 'n5', name: 'Queue', type: 'queue' },
          ],
          connections: [
            { id: 'c1', sourceId: 'n1', targetId: 'n2', type: 'http' },
            { id: 'c2', sourceId: 'n2', targetId: 'n4', type: 'database' },
            { id: 'c3', sourceId: 'n2', targetId: 'n5', type: 'queue' },
          ],
        },
        summary: 'Test',
        insights: [],
        warnings: [],
      }))

      const result = runCLI(['--validate', validPath])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Node Types:')
      expect(result.stdout).toContain('gateway: 1')
      expect(result.stdout).toContain('service: 2')
      expect(result.stdout).toContain('database: 1')
      expect(result.stdout).toContain('queue: 1')
      expect(result.stdout).toContain('Connection Types:')
      expect(result.stdout).toContain('http: 1')
    })

    it('should error when validate file does not exist', () => {
      const result = runCLI(['--validate', '/nonexistent/file.json'])

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('File not found')
    })

    it('should error when validate file has invalid JSON', () => {
      const invalidPath = join(testFilesDir, 'bad-json.json')
      writeFileSync(invalidPath, '{ invalid json }')

      const result = runCLI(['--validate', invalidPath])

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Invalid JSON')
    })
  })
})
