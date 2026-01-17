#!/usr/bin/env ts-node

/**
 * SOAR CLI - Analyze codebase and generate architecture model
 *
 * Usage:
 *   npx ts-node src/cli/analyze.ts <repository-path> [options]
 *
 * Options:
 *   --output, -o    Output file path (default: stdout)
 *   --type, -t      Analysis type: full, services, dependencies, classes (default: full)
 *   --depth, -d     Maximum depth for analysis (default: 3)
 *   --vertex        Use Google Cloud Vertex AI instead of Anthropic API
 *   --project       GCP project ID (for Vertex AI)
 *   --region        GCP region (for Vertex AI, default: us-east5)
 */

import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { ArchitectureAnalyzer } from '../lib/analyzer'
import type { AuthConfig } from '../lib/analyzer'
import type { AnalysisRequest } from '../types/architecture'

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
SOAR - Software Architecture Analyzer

Usage:
  npx ts-node src/cli/analyze.ts <repository-path> [options]

Options:
  --output, -o <path>   Output file path (default: stdout)
  --type, -t <type>     Analysis type: full, services, dependencies, classes
  --depth, -d <number>  Maximum depth for analysis (default: 3)
  --vertex              Use Google Cloud Vertex AI authentication
  --project <id>        GCP project ID (for Vertex AI, or set GOOGLE_CLOUD_PROJECT)
  --region <region>     GCP region (for Vertex AI, default: us-east5)
  --help, -h            Show this help message

Authentication:
  Anthropic API (default):
    Set ANTHROPIC_API_KEY environment variable

  Vertex AI (--vertex flag):
    Uses Google Application Default Credentials (ADC)
    - Run 'gcloud auth application-default login' for local dev
    - Or set GOOGLE_APPLICATION_CREDENTIALS to a service account key
    - Set GOOGLE_CLOUD_PROJECT or use --project flag

Examples:
  # Using Anthropic API
  npx ts-node src/cli/analyze.ts ./my-project
  npx ts-node src/cli/analyze.ts ./my-project -o architecture.json

  # Using Vertex AI
  npx ts-node src/cli/analyze.ts ./my-project --vertex --project my-gcp-project
  npx ts-node src/cli/analyze.ts ./my-project --vertex --region europe-west1
`)
    process.exit(0)
  }

  // Parse arguments
  const repositoryPath = resolve(args[0])
  let outputPath: string | undefined
  let analysisType: AnalysisRequest['analysisType'] = 'full'
  let maxDepth = 3
  let useVertex = false
  let projectId: string | undefined
  let region: string | undefined

  for (let i = 1; i < args.length; i++) {
    const arg = args[i]
    const nextArg = args[i + 1]

    if (arg === '--output' || arg === '-o') {
      outputPath = nextArg
      i++
    } else if (arg === '--type' || arg === '-t') {
      analysisType = nextArg as AnalysisRequest['analysisType']
      i++
    } else if (arg === '--depth' || arg === '-d') {
      maxDepth = parseInt(nextArg, 10)
      i++
    } else if (arg === '--vertex') {
      useVertex = true
    } else if (arg === '--project') {
      projectId = nextArg
      i++
    } else if (arg === '--region') {
      region = nextArg
      i++
    }
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
