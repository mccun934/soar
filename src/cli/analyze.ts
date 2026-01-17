#!/usr/bin/env ts-node

/**
 * SOAR CLI - Analyze codebase and generate architecture model
 *
 * Usage:
 *   npm run analyze -- <repository-path> [options]
 *   npm run analyze -- --input <json-file>
 *
 * Options:
 *   --output, -o    Output file path (default: stdout)
 *   --input, -i     Load architecture from JSON file and start visualization
 *   --type, -t      Analysis type: full, services, dependencies, classes (default: full)
 *   --depth, -d     Maximum depth for analysis (default: 3)
 *   --vertex        Use Google Cloud Vertex AI instead of Anthropic API
 *   --project       GCP project ID (for Vertex AI)
 *   --region        GCP region (for Vertex AI, default: us-east5)
 *   --port, -p      Port for visualization server (default: 3000)
 */

import { writeFileSync, readFileSync, existsSync } from 'fs'
import { resolve, join } from 'path'
import { spawn } from 'child_process'
import { ArchitectureAnalyzer } from '../lib/analyzer'
import type { AuthConfig } from '../lib/analyzer'
import type { AnalysisRequest, AnalysisResult } from '../types/architecture'

async function startVisualizationServer(port: number): Promise<void> {
  console.log(`\n🚀 Starting visualization server on http://localhost:${port}`)
  console.log('   Press Ctrl+C to stop\n')

  const vite = spawn('npx', ['vite', '--port', port.toString()], {
    stdio: 'inherit',
    cwd: process.cwd(),
    shell: true,
  })

  // Handle process termination
  process.on('SIGINT', () => {
    vite.kill()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    vite.kill()
    process.exit(0)
  })

  // Wait for vite to exit
  await new Promise<void>((resolve, reject) => {
    vite.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Vite exited with code ${code}`))
      }
    })
    vite.on('error', reject)
  })
}

function loadAndValidateArchitecture(inputPath: string): AnalysisResult {
  if (!existsSync(inputPath)) {
    console.error(`Error: File not found: ${inputPath}`)
    process.exit(1)
  }

  try {
    const content = readFileSync(inputPath, 'utf-8')
    const data = JSON.parse(content)

    // Validate the structure
    if (!data.architecture) {
      console.error('Error: Invalid architecture file - missing "architecture" field')
      process.exit(1)
    }

    if (!data.architecture.nodes || !Array.isArray(data.architecture.nodes)) {
      console.error('Error: Invalid architecture file - missing or invalid "nodes" array')
      process.exit(1)
    }

    if (!data.architecture.connections || !Array.isArray(data.architecture.connections)) {
      console.error('Error: Invalid architecture file - missing or invalid "connections" array')
      process.exit(1)
    }

    console.log(`✅ Loaded architecture from: ${inputPath}`)
    console.log(`   Name: ${data.architecture.name || 'Unnamed'}`)
    console.log(`   Nodes: ${data.architecture.nodes.length}`)
    console.log(`   Connections: ${data.architecture.connections.length}`)

    return data as AnalysisResult
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(`Error: Invalid JSON in file: ${inputPath}`)
    } else {
      console.error(`Error reading file: ${error}`)
    }
    process.exit(1)
  }
}

function writeArchitectureForVisualization(result: AnalysisResult): void {
  const publicDir = join(process.cwd(), 'public')
  const outputPath = join(publicDir, 'architecture.json')

  // Write the architecture data to public folder
  writeFileSync(outputPath, JSON.stringify(result, null, 2))
  console.log(`   Written to: ${outputPath}`)
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
SOAR - Software Architecture Analyzer & Visualizer

Usage:
  npm run analyze -- <repository-path> [options]    Analyze a codebase
  npm run analyze -- --input <json-file> [options]  Visualize existing JSON

Options:
  --output, -o <path>   Output file path (default: stdout)
  --input, -i <file>    Load architecture JSON and start 3D visualization
  --type, -t <type>     Analysis type: full, services, dependencies, classes
  --depth, -d <number>  Maximum depth for directory traversal (default: 3)
  --port, -p <number>   Port for visualization server (default: 3000)
  --vertex              Use Google Cloud Vertex AI authentication
  --project <id>        GCP project ID (for Vertex AI, or set GOOGLE_CLOUD_PROJECT)
  --region <region>     GCP region (for Vertex AI, default: us-east5)
  --help, -h            Show this help message

Authentication (for analysis):
  Anthropic API (default):
    Set ANTHROPIC_API_KEY environment variable

  Vertex AI (--vertex flag):
    Uses Google Application Default Credentials (ADC)
    - Run 'gcloud auth application-default login' for local dev
    - Or set GOOGLE_APPLICATION_CREDENTIALS to a service account key
    - Set GOOGLE_CLOUD_PROJECT or use --project flag

Examples:
  # Analyze a repository
  npm run analyze -- ./my-project
  npm run analyze -- ./my-project -o architecture.json

  # Analyze and immediately visualize
  npm run analyze -- ./my-project -o arch.json && npm run analyze -- -i arch.json

  # Visualize an existing architecture file
  npm run analyze -- --input architecture.json
  npm run analyze -- -i architecture.json --port 8080

  # Using Vertex AI
  npm run analyze -- ./my-project --vertex --project my-gcp-project
`)
    process.exit(0)
  }

  // Parse arguments
  let inputPath: string | undefined
  let outputPath: string | undefined
  let analysisType: AnalysisRequest['analysisType'] = 'full'
  let maxDepth = 3
  let useVertex = false
  let projectId: string | undefined
  let region: string | undefined
  let port = 3000
  let repositoryPath: string | undefined

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    const nextArg = args[i + 1]

    if (arg === '--input' || arg === '-i') {
      inputPath = resolve(nextArg)
      i++
    } else if (arg === '--output' || arg === '-o') {
      outputPath = nextArg
      i++
    } else if (arg === '--type' || arg === '-t') {
      analysisType = nextArg as AnalysisRequest['analysisType']
      i++
    } else if (arg === '--depth' || arg === '-d') {
      maxDepth = parseInt(nextArg, 10)
      i++
    } else if (arg === '--port' || arg === '-p') {
      port = parseInt(nextArg, 10)
      i++
    } else if (arg === '--vertex') {
      useVertex = true
    } else if (arg === '--project') {
      projectId = nextArg
      i++
    } else if (arg === '--region') {
      region = nextArg
      i++
    } else if (!arg.startsWith('-') && !repositoryPath) {
      repositoryPath = resolve(arg)
    }
  }

  // Mode 1: Visualize existing architecture file
  if (inputPath) {
    console.log('\n📊 SOAR - Architecture Visualization Mode\n')

    const result = loadAndValidateArchitecture(inputPath)
    writeArchitectureForVisualization(result)

    await startVisualizationServer(port)
    return
  }

  // Mode 2: Analyze repository
  if (!repositoryPath) {
    console.error('Error: Please provide a repository path or use --input to load a JSON file')
    console.error('Run with --help for usage information')
    process.exit(1)
  }

  // Build auth config
  let authConfig: AuthConfig

  if (useVertex) {
    authConfig = {
      provider: 'vertex',
      projectId,
      region,
    }
    console.log(`\n☁️  Using Vertex AI authentication`)
    console.log(`   Project: ${projectId || process.env.GOOGLE_CLOUD_PROJECT || '(from environment)'}`)
    console.log(`   Region: ${region || process.env.GOOGLE_CLOUD_REGION || 'us-east5'}`)
  } else {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('Error: ANTHROPIC_API_KEY environment variable is required')
      console.error('Set it with: export ANTHROPIC_API_KEY=your-api-key')
      console.error('Or use --vertex flag for Google Cloud Vertex AI authentication')
      process.exit(1)
    }
    authConfig = {
      provider: 'anthropic',
    }
    console.log(`\n🔑 Using Anthropic API authentication`)
  }

  console.log(`\n🔍 Analyzing repository: ${repositoryPath}`)
  console.log(`   Type: ${analysisType}`)
  console.log(`   Max depth: ${maxDepth}\n`)

  try {
    const analyzer = new ArchitectureAnalyzer(authConfig)
    const result = await analyzer.analyze({
      repositoryPath,
      analysisType,
      maxDepth,
    })

    const output = JSON.stringify(result, null, 2)

    if (outputPath) {
      writeFileSync(outputPath, output)
      console.log(`✅ Architecture saved to: ${outputPath}`)
    } else {
      console.log('\n📊 Analysis Result:\n')
      console.log(output)
    }

    // Print summary
    console.log('\n📋 Summary:')
    console.log(`   ${result.summary}`)
    console.log(`\n   Nodes: ${result.architecture.nodes.length}`)
    console.log(`   Connections: ${result.architecture.connections.length}`)

    if (result.insights.length > 0) {
      console.log('\n💡 Insights:')
      result.insights.forEach((insight) => console.log(`   • ${insight}`))
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:')
      result.warnings.forEach((warning) => console.log(`   • ${warning}`))
    }

    console.log('\n')
  } catch (error) {
    console.error('Error analyzing repository:', error)
    process.exit(1)
  }
}

main()
