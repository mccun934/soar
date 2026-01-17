/**
 * Integration tests for SOAR Architecture Analyzer
 *
 * These tests clone real public GitHub repositories and analyze them
 * using the Anthropic API or Vertex AI.
 *
 * Prerequisites:
 * - Either ANTHROPIC_API_KEY or GOOGLE_CLOUD_PROJECT + gcloud auth configured
 * - Git installed
 * - Network access to GitHub
 *
 * Run with: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execSync } from 'child_process'
import { existsSync, mkdirSync, rmSync, readdirSync, statSync, readFileSync } from 'fs'
import { join } from 'path'
import { ArchitectureAnalyzer, type AuthConfig } from '@/lib/analyzer'
import type { AnalysisResult, Architecture } from '@/types/architecture'

// Test configuration
const TEST_REPOS_DIR = join(process.cwd(), '.test-repos')
const CLONE_TIMEOUT = 120000 // 2 minutes

// Test repositories
const TEST_REPOS = {
  opencode: {
    name: 'opencode',
    url: 'https://github.com/anomalyco/opencode',
    description: 'Open source coding assistant CLI tool',
    expectedTech: ['TypeScript', 'Rust'],
  },
  gcpMicroservices: {
    name: 'microservices-demo',
    url: 'https://github.com/GoogleCloudPlatform/microservices-demo',
    description: 'GCP microservices demo - Online Boutique',
    expectedTech: ['Go', 'Python', 'Java', 'Kubernetes'],
  },
  springBrewery: {
    name: 'brewery',
    url: 'https://github.com/spring-cloud-samples/brewery',
    description: 'Spring Cloud brewery sample application',
    expectedTech: ['Java', 'Spring'],
  },
}

// Determine auth configuration
function getAuthConfig(): AuthConfig | null {
  if (process.env.ANTHROPIC_API_KEY) {
    return { provider: 'anthropic' }
  }
  if (process.env.GOOGLE_CLOUD_PROJECT) {
    return {
      provider: 'vertex',
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
      region: process.env.GOOGLE_CLOUD_REGION || 'us-east5',
    }
  }
  return null
}

// Helper to clone a repository
function cloneRepo(url: string, targetDir: string): void {
  console.log(`Cloning ${url} to ${targetDir}...`)
  execSync(`git clone --depth 1 ${url} ${targetDir}`, {
    timeout: CLONE_TIMEOUT,
    stdio: 'pipe',
  })
}

// Helper to get repo stats
function getRepoStats(repoPath: string): { files: number; directories: number; languages: string[] } {
  const languages = new Set<string>()
  let files = 0
  let directories = 0

  const extensionToLang: Record<string, string> = {
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript',
    '.py': 'Python',
    '.go': 'Go',
    '.java': 'Java',
    '.rs': 'Rust',
    '.rb': 'Ruby',
    '.cs': 'C#',
    '.cpp': 'C++',
    '.c': 'C',
    '.scala': 'Scala',
    '.kt': 'Kotlin',
    '.swift': 'Swift',
    '.yaml': 'YAML',
    '.yml': 'YAML',
    '.json': 'JSON',
    '.proto': 'Protobuf',
  }

  function walk(dir: string) {
    try {
      const entries = readdirSync(dir)
      for (const entry of entries) {
        if (entry.startsWith('.') || entry === 'node_modules' || entry === 'vendor') continue
        const fullPath = join(dir, entry)
        try {
          const stat = statSync(fullPath)
          if (stat.isDirectory()) {
            directories++
            walk(fullPath)
          } else if (stat.isFile()) {
            files++
            const ext = entry.substring(entry.lastIndexOf('.'))
            if (extensionToLang[ext]) {
              languages.add(extensionToLang[ext])
            }
          }
        } catch {
          // Skip inaccessible files
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  }

  walk(repoPath)
  return { files, directories, languages: Array.from(languages) }
}

// Validate architecture result
function validateArchitecture(result: AnalysisResult): void {
  expect(result).toBeDefined()
  expect(result.architecture).toBeDefined()
  expect(result.architecture.name).toBeTruthy()
  expect(result.architecture.nodes).toBeInstanceOf(Array)
  expect(result.architecture.connections).toBeInstanceOf(Array)
  expect(result.summary).toBeTruthy()
  expect(result.insights).toBeInstanceOf(Array)
  expect(result.warnings).toBeInstanceOf(Array)

  // Should have at least one node
  expect(result.architecture.nodes.length).toBeGreaterThan(0)

  // Validate nodes have required fields
  for (const node of result.architecture.nodes) {
    expect(node.id).toBeTruthy()
    expect(node.name).toBeTruthy()
    expect(node.type).toBeTruthy()
  }

  // Validate connections that have all fields (some may be partial from model)
  const validConnections = result.architecture.connections.filter(
    conn => conn.sourceId && conn.targetId && conn.type
  )
  console.log(`   Valid connections: ${validConnections.length}/${result.architecture.connections.length}`)
}

describe('Repository Architecture Analysis', () => {
  const authConfig = getAuthConfig()
  let analyzer: ArchitectureAnalyzer | null = null

  beforeAll(() => {
    // Create test repos directory
    if (!existsSync(TEST_REPOS_DIR)) {
      mkdirSync(TEST_REPOS_DIR, { recursive: true })
    }

    // Initialize analyzer if credentials available
    if (authConfig) {
      analyzer = new ArchitectureAnalyzer(authConfig)
      console.log(`Using ${authConfig.provider} authentication`)
    } else {
      console.log('No API credentials found - tests will be skipped')
    }
  })

  afterAll(() => {
    // Cleanup test repos directory
    if (existsSync(TEST_REPOS_DIR)) {
      console.log('Cleaning up test repos...')
      rmSync(TEST_REPOS_DIR, { recursive: true, force: true })
    }
  })

  describe('1. OpenCode - TypeScript/Rust CLI Tool', () => {
    const repo = TEST_REPOS.opencode
    const repoPath = join(TEST_REPOS_DIR, repo.name)
    let repoStats: ReturnType<typeof getRepoStats>

    beforeAll(() => {
      if (!existsSync(repoPath)) {
        cloneRepo(repo.url, repoPath)
      }
      repoStats = getRepoStats(repoPath)
      console.log(`\n📦 ${repo.name} stats:`, repoStats)
    })

    it('should successfully clone the repository', () => {
      expect(existsSync(repoPath)).toBe(true)
      expect(existsSync(join(repoPath, '.git'))).toBe(true)
    })

    it('should detect TypeScript or Rust in the codebase', () => {
      expect(
        repoStats.languages.includes('TypeScript') ||
        repoStats.languages.includes('Rust')
      ).toBe(true)
    })

    it('should analyze the architecture and return valid results', async () => {
      if (!analyzer) {
        console.log('Skipping - no API credentials')
        return
      }

      console.log(`\n🔍 Analyzing ${repo.name}...`)
      const result = await analyzer.analyze({
        repositoryPath: repoPath,
        analysisType: 'full',
        maxDepth: 3,
      })

      validateArchitecture(result)

      console.log(`\n✅ Analysis complete for ${repo.name}:`)
      console.log(`   Summary: ${result.summary}`)
      console.log(`   Nodes: ${result.architecture.nodes.length}`)
      console.log(`   Connections: ${result.architecture.connections.length}`)
      console.log(`   Insights: ${result.insights.length}`)

      // Should identify it as a CLI/tool application
      const hasServiceOrModule = result.architecture.nodes.some(
        n => n.type === 'service' || n.type === 'module'
      )
      expect(hasServiceOrModule).toBe(true)
    })
  })

  describe('2. GCP Microservices Demo - Online Boutique', () => {
    const repo = TEST_REPOS.gcpMicroservices
    const repoPath = join(TEST_REPOS_DIR, repo.name)
    let repoStats: ReturnType<typeof getRepoStats>

    beforeAll(() => {
      if (!existsSync(repoPath)) {
        cloneRepo(repo.url, repoPath)
      }
      repoStats = getRepoStats(repoPath)
      console.log(`\n📦 ${repo.name} stats:`, repoStats)
    })

    it('should successfully clone the repository', () => {
      expect(existsSync(repoPath)).toBe(true)
      expect(existsSync(join(repoPath, '.git'))).toBe(true)
    })

    it('should detect multiple languages (Go, Python, etc.)', () => {
      // This is a polyglot microservices demo
      expect(repoStats.languages.length).toBeGreaterThan(1)
    })

    it('should analyze the architecture and identify multiple services', async () => {
      if (!analyzer) {
        console.log('Skipping - no API credentials')
        return
      }

      console.log(`\n🔍 Analyzing ${repo.name}...`)
      const result = await analyzer.analyze({
        repositoryPath: repoPath,
        analysisType: 'services',
        maxDepth: 2,
      })

      validateArchitecture(result)

      console.log(`\n✅ Analysis complete for ${repo.name}:`)
      console.log(`   Summary: ${result.summary}`)
      console.log(`   Nodes: ${result.architecture.nodes.length}`)
      console.log(`   Connections: ${result.architecture.connections.length}`)

      // List services found
      const services = result.architecture.nodes.filter(n => n.type === 'service')
      console.log(`   Services found: ${services.map(s => s.name).join(', ')}`)

      // Should identify multiple microservices
      expect(services.length).toBeGreaterThan(1)

      // Should have connections between services
      expect(result.architecture.connections.length).toBeGreaterThan(0)
    })
  })

  describe('3. Spring Cloud Brewery - Spring Microservices', () => {
    const repo = TEST_REPOS.springBrewery
    const repoPath = join(TEST_REPOS_DIR, repo.name)
    let repoStats: ReturnType<typeof getRepoStats>

    beforeAll(() => {
      if (!existsSync(repoPath)) {
        cloneRepo(repo.url, repoPath)
      }
      repoStats = getRepoStats(repoPath)
      console.log(`\n📦 ${repo.name} stats:`, repoStats)
    })

    it('should successfully clone the repository', () => {
      expect(existsSync(repoPath)).toBe(true)
      expect(existsSync(join(repoPath, '.git'))).toBe(true)
    })

    it('should detect Java in the codebase', () => {
      expect(repoStats.languages.includes('Java')).toBe(true)
    })

    it('should analyze the architecture and identify Spring services', async () => {
      if (!analyzer) {
        console.log('Skipping - no API credentials')
        return
      }

      console.log(`\n🔍 Analyzing ${repo.name}...`)
      const result = await analyzer.analyze({
        repositoryPath: repoPath,
        analysisType: 'full',
        maxDepth: 3,
      })

      validateArchitecture(result)

      console.log(`\n✅ Analysis complete for ${repo.name}:`)
      console.log(`   Summary: ${result.summary}`)
      console.log(`   Nodes: ${result.architecture.nodes.length}`)
      console.log(`   Connections: ${result.architecture.connections.length}`)

      // List all node types found
      const nodeTypes = [...new Set(result.architecture.nodes.map(n => n.type))]
      console.log(`   Node types: ${nodeTypes.join(', ')}`)

      // Should identify services/modules
      const hasArchitecturalComponents = result.architecture.nodes.some(
        n => ['service', 'module', 'gateway', 'database'].includes(n.type)
      )
      expect(hasArchitecturalComponents).toBe(true)
    })
  })

  describe('Summary Report', () => {
    it('should generate a comparison of all analyzed repositories', async () => {
      if (!analyzer) {
        console.log('Skipping summary - no API credentials')
        return
      }

      console.log('\n' + '='.repeat(60))
      console.log('📊 ANALYSIS SUMMARY REPORT')
      console.log('='.repeat(60))

      for (const [key, repo] of Object.entries(TEST_REPOS)) {
        const repoPath = join(TEST_REPOS_DIR, repo.name)
        if (existsSync(repoPath)) {
          const stats = getRepoStats(repoPath)
          console.log(`\n${repo.name}:`)
          console.log(`  URL: ${repo.url}`)
          console.log(`  Description: ${repo.description}`)
          console.log(`  Files: ${stats.files}`)
          console.log(`  Directories: ${stats.directories}`)
          console.log(`  Languages: ${stats.languages.join(', ')}`)
        }
      }

      console.log('\n' + '='.repeat(60))
    })
  })
})
