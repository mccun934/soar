# SOAR - 3D Software Architecture Visualizer

SOAR is an interactive 3D visualization tool for exploring software architecture. Navigate through your codebase like a video game, with AI-powered analysis that automatically generates architecture models from your code.

![SOAR Demo](docs/demo.png)

## Features

- **3D Architecture Visualization** - Explore your software architecture in an immersive 3D environment
- **WASD/Mouse Navigation** - Navigate like a first-person game with keyboard and mouse controls
- **AI-Powered Analysis** - Uses Anthropic's Claude to introspect codebases and generate architecture models
- **Multi-Level Detail** - Zoom from high-level service overview down to individual classes and functions
- **Interactive Nodes** - Click to select, double-click to expand, hover for details
- **Live Connections** - Animated visualization of data flow between components
- **JSON Schema** - Flexible JSON representation for architecture data

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## Controls

| Control | Action |
|---------|--------|
| `W/A/S/D` | Move forward/left/backward/right |
| `Space` | Move up |
| `Q` | Move down |
| `Mouse` | Look around (hold left or right click) |
| `Scroll` | Zoom in/out |
| `Shift` | Move faster |
| `Click` | Select node |
| `Double-click` | Expand/collapse node children |

## Architecture Analysis

SOAR can analyze your codebase using Claude to automatically generate architecture models:

```bash
# Set your Anthropic API key
export ANTHROPIC_API_KEY=your-api-key

# Analyze a repository
npm run analyze -- /path/to/your/repo -o architecture.json

# Or use Vertex AI authentication
export GOOGLE_CLOUD_PROJECT=your-project-id
npm run analyze -- /path/to/your/repo --vertex -o architecture.json
```

### CLI Options

```
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
  --project <id>        GCP project ID (for Vertex AI)
  --region <region>     GCP region (for Vertex AI, default: us-east5)
```

### Visualizing Architecture

After generating an architecture JSON file, you can visualize it in 3D:

```bash
# Analyze and save to file
npm run analyze -- ./my-project -o architecture.json

# Visualize the architecture file
npm run analyze -- --input architecture.json

# Specify a custom port
npm run analyze -- -i architecture.json --port 8080
```

This will start the Vite development server and open the 3D visualization with your architecture loaded.

## Architecture Schema

The architecture is represented in JSON with nodes and connections:

```typescript
interface Architecture {
  name: string
  version: string
  nodes: ArchitectureNode[]
  connections: ArchitectureConnection[]
}

interface ArchitectureNode {
  id: string
  name: string
  type: 'service' | 'module' | 'class' | 'database' | 'cache' | 'queue' | 'gateway' | 'external'
  description?: string
  children?: ArchitectureNode[]
  position?: { x: number, y: number, z: number }
  // ... more fields
}

interface ArchitectureConnection {
  id: string
  sourceId: string
  targetId: string
  type: 'http' | 'grpc' | 'database' | 'queue' | 'import' | 'event'
  // ... more fields
}
```

See [`src/types/architecture.ts`](src/types/architecture.ts) for the complete schema.

## Node Types

| Type | Icon | Description |
|------|------|-------------|
| `service` | ⬡ | Microservice or standalone service |
| `module` | ◈ | Code module/package within a service |
| `class` | ◆ | Class or major code construct |
| `function` | ƒ | Function or method |
| `database` | ⛁ | Database or data store |
| `cache` | ◎ | Caching layer (Redis, Memcached) |
| `queue` | ≡ | Message queue (Kafka, RabbitMQ) |
| `gateway` | ⬢ | API Gateway or load balancer |
| `external` | ◇ | External service/API |

## Technology Stack

- **React** + **TypeScript** - UI framework
- **Three.js** / **React Three Fiber** - 3D rendering
- **@react-three/drei** - Useful 3D components
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Anthropic SDK** - AI-powered analysis

## Project Structure

```
src/
├── components/          # React components
│   ├── Scene.tsx        # Main 3D scene
│   ├── ArchitectureGraph.tsx
│   ├── ArchitectureNode.tsx
│   ├── ConnectionLine.tsx
│   ├── CameraController.tsx
│   └── UI components...
├── lib/
│   ├── analyzer.ts      # Anthropic SDK integration
│   └── sampleData.ts    # Demo architecture data
├── store/
│   └── architectureStore.ts  # Zustand store
├── types/
│   └── architecture.ts  # TypeScript types & JSON schema
└── cli/
    └── analyze.ts       # CLI tool
```

## Future Roadmap

- [ ] **Cloud Deployment View** - Visualize architecture deployed across cloud regions
- [ ] **Live Metrics** - Real-time traffic, latency, and error rate visualization
- [ ] **Time Travel** - Replay architecture changes over time
- [ ] **Collaboration** - Multi-user exploration mode
- [ ] **VR Support** - Immersive VR navigation

## License

MIT
