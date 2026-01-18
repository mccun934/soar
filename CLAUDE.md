# SOAR - Software Architecture Visualizer

SOAR is a 3D architecture visualization tool that renders software architectures as interactive 3D graphs using Three.js and React.

## Architecture Analysis Schema

**IMPORTANT**: When generating architecture analysis JSON for this project (or any project intended for SOAR visualization), you MUST use the following schema. Do NOT use prose/documentation formats.

### Required Output Structure

```json
{
  "architecture": {
    "name": "Project Name",
    "version": "1.0.0",
    "description": "Brief description of the architecture",
    "generatedAt": "ISO 8601 timestamp",
    "sourceRepository": "https://github.com/org/repo",
    "nodes": [...],
    "connections": [...],
    "layout": {
      "type": "force | hierarchical | radial | manual",
      "spacing": 5
    },
    "defaultView": {
      "position": { "x": 0, "y": 15, "z": 30 },
      "target": { "x": 0, "y": 0, "z": 0 },
      "detailLevel": "overview | service | module | code"
    }
  },
  "summary": "2-3 sentence summary of the architecture",
  "insights": ["Key insight 1", "Key insight 2"],
  "warnings": ["Potential issue 1", "Potential issue 2"]
}
```

### Node Schema

Each node in the `nodes` array must have:

```json
{
  "id": "unique-node-id",
  "name": "Display Name",
  "type": "service | module | class | function | database | cache | queue | gateway | external | container | region | cluster",
  "description": "What this component does",
  "technology": "Redis, PostgreSQL, etc.",
  "language": "TypeScript, Python, Go, etc.",
  "framework": "React, FastAPI, Spring Boot, etc.",
  "position": { "x": 0, "y": 4, "z": 0 },
  "children": [],
  "filePath": "src/services/user.ts",
  "lineStart": 1,
  "lineEnd": 100,
  "metadata": {}
}
```

**Required fields**: `id`, `name`, `type`
**Optional fields**: All others

### Node Types

| Type | Description | Use For |
|------|-------------|---------|
| `service` | Microservice or standalone service | Backend services, APIs |
| `module` | Code module/package within a service | Logical code groupings |
| `class` | Class or major code construct | Important classes |
| `function` | Function or method | Key functions |
| `database` | Database or data store | PostgreSQL, MongoDB, etc. |
| `cache` | Caching layer | Redis, Memcached |
| `queue` | Message queue | Kafka, RabbitMQ, SQS |
| `gateway` | API Gateway or load balancer | Kong, nginx, ALB |
| `external` | External service/API | Third-party APIs |
| `container` | Docker container or pod | Deployment units |
| `region` | Cloud region | AWS regions, GCP regions |
| `cluster` | Kubernetes cluster or server group | Infrastructure groupings |

### Connection Schema

Each connection in the `connections` array must have:

```json
{
  "id": "unique-connection-id",
  "sourceId": "node-id-1",
  "targetId": "node-id-2",
  "type": "http | grpc | websocket | database | queue | import | inheritance | composition | event",
  "label": "Optional label",
  "bidirectional": false,
  "dataFlow": "request | response | stream | event",
  "metadata": {}
}
```

**Required fields**: `id`, `sourceId`, `targetId`, `type`
**Optional fields**: All others

### Connection Types

| Type | Description | Use For |
|------|-------------|---------|
| `http` | HTTP/REST API call | REST APIs, webhooks |
| `grpc` | gRPC call | gRPC services |
| `websocket` | WebSocket connection | Real-time connections |
| `database` | Database connection | DB queries |
| `queue` | Message queue pub/sub | Async messaging |
| `import` | Code import/dependency | Module imports |
| `inheritance` | Class inheritance | OOP inheritance |
| `composition` | Object composition | Has-a relationships |
| `event` | Event emission/subscription | Event-driven patterns |

### Example Output

```json
{
  "architecture": {
    "name": "User Management Service",
    "version": "1.0.0",
    "description": "Microservice handling user authentication and profiles",
    "nodes": [
      {
        "id": "api-gateway",
        "name": "API Gateway",
        "type": "gateway",
        "description": "Kong-based API gateway",
        "technology": "Kong"
      },
      {
        "id": "user-service",
        "name": "User Service",
        "type": "service",
        "description": "Handles user authentication and profiles",
        "language": "TypeScript",
        "framework": "NestJS",
        "children": [
          {
            "id": "auth-module",
            "name": "Auth Module",
            "type": "module",
            "description": "JWT authentication"
          },
          {
            "id": "profile-module",
            "name": "Profile Module",
            "type": "module",
            "description": "User profile management"
          }
        ]
      },
      {
        "id": "user-db",
        "name": "User Database",
        "type": "database",
        "technology": "PostgreSQL"
      },
      {
        "id": "redis-cache",
        "name": "Session Cache",
        "type": "cache",
        "technology": "Redis"
      }
    ],
    "connections": [
      {
        "id": "gw-to-user",
        "sourceId": "api-gateway",
        "targetId": "user-service",
        "type": "http",
        "label": "REST API"
      },
      {
        "id": "user-to-db",
        "sourceId": "user-service",
        "targetId": "user-db",
        "type": "database"
      },
      {
        "id": "user-to-cache",
        "sourceId": "user-service",
        "targetId": "redis-cache",
        "type": "database",
        "label": "Session Cache"
      }
    ]
  },
  "summary": "A NestJS-based user service with PostgreSQL storage and Redis caching, fronted by Kong API gateway.",
  "insights": [
    "Clean separation between auth and profile concerns",
    "Caching layer reduces database load for session lookups"
  ],
  "warnings": []
}
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Analyze a repository and generate architecture JSON
npm run analyze -- /path/to/repo -o architecture.json

# Visualize an existing architecture file
npm run analyze -- --input architecture.json

# Run tests
npm test
```

## Project Structure

- `src/components/` - React components for 3D visualization
- `src/lib/analyzer.ts` - Architecture analyzer using Claude API
- `src/types/architecture.ts` - TypeScript types for the schema
- `src/store/` - Zustand state management
