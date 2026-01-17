import Anthropic from '@anthropic-ai/sdk'
import { AnthropicVertex } from '@anthropic-ai/vertex-sdk'
import type {
  Architecture,
  ArchitectureNode,
  AnalysisRequest,
  AnalysisResult,
  NodeType,
} from '../types/architecture'

/**
 * SOAR Architecture Analyzer
 * Uses Anthropic's Claude to introspect codebases and generate architecture models
 * Supports both direct Anthropic API and Google Cloud Vertex AI authentication
 */

// Authentication configuration
export type AuthProvider = 'anthropic' | 'vertex'

export interface AnthropicAuthConfig {
  provider: 'anthropic'
  apiKey?: string  // Falls back to ANTHROPIC_API_KEY env var
}

export interface VertexAuthConfig {
  provider: 'vertex'
  projectId?: string   // Falls back to GOOGLE_CLOUD_PROJECT env var
  region?: string      // Falls back to GOOGLE_CLOUD_REGION env var, defaults to 'us-east5'
}

export type AuthConfig = AnthropicAuthConfig | VertexAuthConfig

const ANALYSIS_SYSTEM_PROMPT = `You are an expert software architect analyzing codebases to understand their structure and generate architecture models.

Your task is to analyze the provided codebase information and produce a comprehensive architecture model in JSON format.

When analyzing, consider:
1. **Services/Applications**: Identify distinct services, microservices, or application boundaries
2. **Modules**: Group related code into logical modules within services
3. **Dependencies**: Identify how components depend on and communicate with each other
4. **Data stores**: Identify databases, caches, queues, and external storage
5. **External integrations**: Identify third-party APIs and services
6. **Technology stack**: Note languages, frameworks, and key libraries

Output a JSON object with this structure:
{
  "architecture": {
    "name": "Project Name",
    "version": "1.0.0",
    "description": "Brief description",
    "nodes": [...],
    "connections": [...]
  },
  "summary": "2-3 sentence summary of the architecture",
  "insights": ["Key architectural insight 1", "Key architectural insight 2"],
  "warnings": ["Potential issue 1", "Potential issue 2"]
}

For nodes, use these types:
- "service": Microservice or standalone service
- "module": Code module/package within a service
- "class": Major class or code construct
- "function": Significant function
- "database": Database or data store
- "cache": Caching layer
- "queue": Message queue
- "gateway": API gateway or load balancer
- "external": External service/API

For connections, use these types:
- "http": HTTP/REST API call
- "grpc": gRPC call
- "websocket": WebSocket connection
- "database": Database connection
- "queue": Message queue pub/sub
- "import": Code import/dependency
- "inheritance": Class inheritance
- "composition": Object composition
- "event": Event emission/subscription

Be thorough but concise. Focus on the most important architectural components.`

// Model names differ between Anthropic API and Vertex AI
const MODELS = {
  anthropic: 'claude-sonnet-4-20250514',
  vertex: 'claude-sonnet-4@20250514',
}

export class ArchitectureAnalyzer {
  private client: Anthropic | AnthropicVertex
  private provider: AuthProvider
  private model: string

  constructor(config?: AuthConfig) {
    // Default to Anthropic if no config provided
    if (!config) {
      config = { provider: 'anthropic' }
    }

    this.provider = config.provider

    if (config.provider === 'vertex') {
      const projectId = config.projectId || process.env.GOOGLE_CLOUD_PROJECT
      const region = config.region || process.env.GOOGLE_CLOUD_REGION || 'us-east5'

      if (!projectId) {
        throw new Error(
          'Vertex AI requires a project ID. Set GOOGLE_CLOUD_PROJECT env var or pass projectId in config.'
        )
      }

      this.client = new AnthropicVertex({
        projectId,
        region,
      })
      this.model = MODELS.vertex
    } else {
      this.client = new Anthropic({
        apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
      })
      this.model = MODELS.anthropic
    }
  }

  /**
   * Get the current authentication provider
   */
  getProvider(): AuthProvider {
    return this.provider
  }

  /**
   * Analyze a codebase and generate architecture model
   */
  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    // This would typically:
    // 1. Read files from the repository
    // 2. Build a representation of the codebase structure
    // 3. Send to Claude for analysis
    // 4. Parse and return the result

    // For now, we'll create a simulated analysis flow
    const codebaseInfo = await this.gatherCodebaseInfo(request)
    const analysisPrompt = this.buildAnalysisPrompt(codebaseInfo)

    const response = await (this.client.messages.create as Anthropic['messages']['create'])({
      model: this.model,
      max_tokens: 8192,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
    })

    // Extract the text content
    const textContent = response.content.find((c: { type: string }) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    // Parse the JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response')
    }

    const result = JSON.parse(jsonMatch[0]) as AnalysisResult
    return this.validateAndEnhance(result)
  }

  /**
   * Gather information about the codebase
   */
  private async gatherCodebaseInfo(request: AnalysisRequest): Promise<CodebaseInfo> {
    const { readdirSync, statSync, readFileSync, existsSync } = await import('fs')
    const { join, relative, extname } = await import('path')

    const files: CodebaseInfo['files'] = []
    const packageManifests: CodebaseInfo['packageManifests'] = []
    const configFiles: CodebaseInfo['configFiles'] = []
    const entryPoints: string[] = []

    // File patterns for package manifests
    const manifestPatterns = [
      'package.json', 'go.mod', 'go.sum', 'Cargo.toml',
      'requirements.txt', 'pyproject.toml', 'setup.py',
      'pom.xml', 'build.gradle', 'build.gradle.kts',
      'Gemfile', 'composer.json', 'mix.exs'
    ]

    // File patterns for config files
    const configPatterns = [
      'docker-compose.yml', 'docker-compose.yaml', 'Dockerfile',
      'kubernetes.yml', 'kubernetes.yaml', 'k8s.yml', 'k8s.yaml',
      '.env.example', 'config.yml', 'config.yaml', 'config.json',
      'tsconfig.json', 'vite.config.ts', 'webpack.config.js',
      'nginx.conf', 'Makefile', 'CMakeLists.txt'
    ]

    // Entry point patterns
    const entryPointPatterns = [
      'main.go', 'main.py', 'main.ts', 'main.js', 'index.ts', 'index.js',
      'app.py', 'app.ts', 'app.js', 'server.ts', 'server.js',
      'Main.java', 'Application.java', 'main.rs', 'lib.rs'
    ]

    // Extension to type mapping
    const extToType: Record<string, string> = {
      '.ts': 'typescript', '.tsx': 'typescript',
      '.js': 'javascript', '.jsx': 'javascript',
      '.py': 'python',
      '.go': 'go',
      '.java': 'java',
      '.rs': 'rust',
      '.rb': 'ruby',
      '.cs': 'csharp',
      '.cpp': 'cpp', '.c': 'c', '.h': 'c',
      '.scala': 'scala',
      '.kt': 'kotlin',
      '.swift': 'swift',
      '.proto': 'protobuf',
      '.yaml': 'yaml', '.yml': 'yaml',
      '.json': 'json',
      '.md': 'markdown',
      '.sql': 'sql',
    }

    // Directories to skip
    const skipDirs = new Set([
      'node_modules', 'vendor', '.git', 'dist', 'build', 'target',
      '__pycache__', '.venv', 'venv', '.idea', '.vscode', 'coverage',
      '.next', '.nuxt', 'out', 'bin', 'obj', '.gradle'
    ])

    const maxFiles = 500 // Limit files to avoid token overflow
    const maxFileSize = 50000 // 50KB max per file
    let fileCount = 0

    const walk = (dir: string, depth: number = 0) => {
      if (depth > (request.maxDepth || 5) || fileCount >= maxFiles) return

      try {
        const entries = readdirSync(dir)
        for (const entry of entries) {
          if (fileCount >= maxFiles) break
          if (entry.startsWith('.') && entry !== '.env.example') continue
          if (skipDirs.has(entry)) continue

          const fullPath = join(dir, entry)
          const relativePath = relative(request.repositoryPath, fullPath)

          try {
            const stat = statSync(fullPath)

            if (stat.isDirectory()) {
              walk(fullPath, depth + 1)
            } else if (stat.isFile()) {
              const ext = extname(entry).toLowerCase()
              const fileType = extToType[ext] || 'other'
              const fileName = entry.toLowerCase()

              // Track file in structure
              if (extToType[ext]) {
                files.push({ path: relativePath, type: fileType })
                fileCount++
              }

              // Check for package manifests
              if (manifestPatterns.includes(entry)) {
                try {
                  const content = readFileSync(fullPath, 'utf-8')
                  if (content.length <= maxFileSize) {
                    packageManifests.push({ path: relativePath, content })
                  }
                } catch {}
              }

              // Check for config files
              if (configPatterns.some(p => fileName.includes(p.toLowerCase()) || entry === p)) {
                try {
                  const content = readFileSync(fullPath, 'utf-8')
                  if (content.length <= maxFileSize) {
                    configFiles.push({ path: relativePath, content })
                  }
                } catch {}
              }

              // Check for entry points
              if (entryPointPatterns.includes(entry)) {
                entryPoints.push(relativePath)
              }
            }
          } catch {}
        }
      } catch {}
    }

    if (existsSync(request.repositoryPath)) {
      walk(request.repositoryPath)
    }

    return {
      repositoryPath: request.repositoryPath,
      files,
      packageManifests,
      entryPoints,
      configFiles,
    }
  }

  /**
   * Build the analysis prompt from codebase info
   */
  private buildAnalysisPrompt(info: CodebaseInfo): string {
    return `Please analyze the following codebase and generate an architecture model:

Repository: ${info.repositoryPath}

## File Structure
${info.files.map((f) => `- ${f.path} (${f.type})`).join('\n') || 'No files provided'}

## Package Manifests
${info.packageManifests.map((p) => `### ${p.path}\n${p.content}`).join('\n\n') || 'No package manifests found'}

## Entry Points
${info.entryPoints.join('\n') || 'No entry points identified'}

## Configuration Files
${info.configFiles.map((c) => `### ${c.path}\n${c.content}`).join('\n\n') || 'No config files found'}

Please analyze this codebase and provide a comprehensive architecture model.`
  }

  /**
   * Validate and enhance the analysis result
   */
  private validateAndEnhance(result: AnalysisResult): AnalysisResult {
    // Ensure all required fields are present
    if (!result.architecture) {
      throw new Error('Invalid analysis result: missing architecture')
    }

    // Add positions if not present
    result.architecture.nodes = this.assignPositions(result.architecture.nodes)

    // Generate IDs if missing
    result.architecture.nodes = this.ensureIds(result.architecture.nodes)
    result.architecture.connections = result.architecture.connections.map((c, i) => ({
      ...c,
      id: c.id || `conn-${i}`,
    }))

    return result
  }

  /**
   * Assign 3D positions to nodes using a force-directed-like algorithm
   */
  private assignPositions(nodes: ArchitectureNode[]): ArchitectureNode[] {
    const typeLayerMap: Record<NodeType, number> = {
      gateway: 8,
      service: 4,
      module: 2,
      class: 1,
      function: 0.5,
      database: 0,
      cache: 1,
      queue: 5,
      external: 6,
      container: 3,
      region: 10,
      cluster: 7,
    }

    return nodes.map((node, index) => {
      if (node.position) return node

      const angle = (index / nodes.length) * Math.PI * 2
      const radius = 15 + Math.floor(index / 6) * 5

      return {
        ...node,
        position: {
          x: Math.cos(angle) * radius,
          y: typeLayerMap[node.type] ?? 3,
          z: Math.sin(angle) * radius,
        },
        children: node.children
          ? this.assignPositions(node.children)
          : undefined,
      }
    })
  }

  /**
   * Ensure all nodes have unique IDs
   */
  private ensureIds(nodes: ArchitectureNode[]): ArchitectureNode[] {
    return nodes.map((node, index) => ({
      ...node,
      id: node.id || `node-${index}-${node.name.toLowerCase().replace(/\s+/g, '-')}`,
      children: node.children ? this.ensureIds(node.children) : undefined,
    }))
  }
}

// Types for internal use
interface CodebaseInfo {
  repositoryPath: string
  files: Array<{ path: string; type: string; content?: string }>
  packageManifests: Array<{ path: string; content: string }>
  entryPoints: string[]
  configFiles: Array<{ path: string; content: string }>
}

/**
 * Analyze a repository and return architecture
 * Convenience function for direct usage
 */
export async function analyzeRepository(
  repositoryPath: string,
  options?: Partial<AnalysisRequest> & { auth?: AuthConfig }
): Promise<AnalysisResult> {
  const analyzer = new ArchitectureAnalyzer(options?.auth)
  return analyzer.analyze({
    repositoryPath,
    analysisType: 'full',
    ...options,
  })
}

/**
 * Parse architecture from JSON string
 */
export function parseArchitecture(json: string): Architecture {
  const data = JSON.parse(json)
  // Validate required fields
  if (!data.name || !data.nodes || !data.connections) {
    throw new Error('Invalid architecture JSON: missing required fields')
  }
  return data as Architecture
}

/**
 * Export architecture to JSON string
 */
export function exportArchitecture(architecture: Architecture): string {
  return JSON.stringify(architecture, null, 2)
}
