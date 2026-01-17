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
 */

import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { ArchitectureAnalyzer } from '../lib/analyzer'
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
  --help, -h            Show this help message

Environment:
  ANTHROPIC_API_KEY     Your Anthropic API key (required)

Examples:
  npx ts-node src/cli/analyze.ts ./my-project
  npx ts-node src/cli/analyze.ts ./my-project -o architecture.json
  npx ts-node src/cli/analyze.ts ./my-project -t services -d 2
`)
    process.exit(0)
  }

  // Parse arguments
  const repositoryPath = resolve(args[0])
  let outputPath: string | undefined
  let analysisType: AnalysisRequest['analysisType'] = 'full'
  let maxDepth = 3

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
    }
  }

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is required')
    console.error('Set it with: export ANTHROPIC_API_KEY=your-api-key')
    process.exit(1)
  }

  console.log(`\n🔍 Analyzing repository: ${repositoryPath}`)
  console.log(`   Type: ${analysisType}`)
  console.log(`   Max depth: ${maxDepth}\n`)

  try {
    const analyzer = new ArchitectureAnalyzer()
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
