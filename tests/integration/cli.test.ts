/**
 * CLI Integration tests for SOAR Architecture Analyzer
 *
 * These tests run the actual CLI command against public repositories
 *
 * Run with: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execSync, spawn } from 'child_process'
import { existsSync, mkdirSync, rmSync, readFileSync } from 'fs'
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
})
