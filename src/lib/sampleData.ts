import type { Architecture } from '@/types/architecture'

/**
 * Sample architecture representing a modern microservices e-commerce platform
 * This demonstrates all the node types and connection types
 */
export const sampleArchitecture: Architecture = {
  name: 'E-Commerce Platform',
  version: '2.1.0',
  description: 'Modern microservices-based e-commerce platform with event-driven architecture',
  generatedAt: new Date().toISOString(),
  sourceRepository: 'https://github.com/example/ecommerce-platform',

  nodes: [
    // API Gateway
    {
      id: 'api-gateway',
      name: 'API Gateway',
      type: 'gateway',
      description: 'Kong-based API gateway handling authentication, rate limiting, and routing',
      technology: 'Kong',
      position: { x: 0, y: 8, z: 0 },
    },

    // Core Services
    {
      id: 'user-service',
      name: 'User Service',
      type: 'service',
      description: 'Handles user authentication, profiles, and preferences',
      language: 'TypeScript',
      framework: 'NestJS',
      position: { x: -15, y: 4, z: -10 },
      children: [
        {
          id: 'user-auth-module',
          name: 'Auth Module',
          type: 'module',
          description: 'JWT authentication and OAuth2 integration',
          filePath: 'services/user/src/auth/auth.module.ts',
        },
        {
          id: 'user-profile-module',
          name: 'Profile Module',
          type: 'module',
          description: 'User profile management',
          filePath: 'services/user/src/profile/profile.module.ts',
        },
      ],
    },
    {
      id: 'product-service',
      name: 'Product Service',
      type: 'service',
      description: 'Product catalog, inventory, and search functionality',
      language: 'Go',
      framework: 'Gin',
      position: { x: 0, y: 4, z: -15 },
      children: [
        {
          id: 'product-catalog',
          name: 'Catalog',
          type: 'module',
          description: 'Product CRUD operations',
        },
        {
          id: 'product-search',
          name: 'Search',
          type: 'module',
          description: 'Elasticsearch-powered product search',
        },
        {
          id: 'product-inventory',
          name: 'Inventory',
          type: 'module',
          description: 'Real-time inventory tracking',
        },
      ],
    },
    {
      id: 'order-service',
      name: 'Order Service',
      type: 'service',
      description: 'Order processing, fulfillment, and tracking',
      language: 'Java',
      framework: 'Spring Boot',
      position: { x: 15, y: 4, z: -10 },
      children: [
        {
          id: 'order-processor',
          name: 'Order Processor',
          type: 'module',
          description: 'Order state machine and validation',
        },
        {
          id: 'fulfillment',
          name: 'Fulfillment',
          type: 'module',
          description: 'Warehouse integration and shipping',
        },
      ],
    },
    {
      id: 'payment-service',
      name: 'Payment Service',
      type: 'service',
      description: 'Payment processing with Stripe and PayPal integration',
      language: 'TypeScript',
      framework: 'Express',
      position: { x: 20, y: 4, z: 5 },
    },
    {
      id: 'notification-service',
      name: 'Notification Service',
      type: 'service',
      description: 'Email, SMS, and push notification delivery',
      language: 'Python',
      framework: 'FastAPI',
      position: { x: -20, y: 4, z: 5 },
    },
    {
      id: 'recommendation-service',
      name: 'Recommendation Engine',
      type: 'service',
      description: 'ML-powered product recommendations',
      language: 'Python',
      framework: 'FastAPI',
      technology: 'TensorFlow',
      position: { x: -10, y: 4, z: 15 },
    },
    {
      id: 'analytics-service',
      name: 'Analytics Service',
      type: 'service',
      description: 'Real-time analytics and reporting',
      language: 'Scala',
      framework: 'Akka',
      position: { x: 10, y: 4, z: 15 },
    },

    // Databases
    {
      id: 'user-db',
      name: 'User Database',
      type: 'database',
      description: 'PostgreSQL database for user data',
      technology: 'PostgreSQL',
      position: { x: -20, y: 0, z: -15 },
    },
    {
      id: 'product-db',
      name: 'Product Database',
      type: 'database',
      description: 'MongoDB for product catalog',
      technology: 'MongoDB',
      position: { x: 0, y: 0, z: -20 },
    },
    {
      id: 'order-db',
      name: 'Order Database',
      type: 'database',
      description: 'PostgreSQL with TimescaleDB for orders',
      technology: 'PostgreSQL',
      position: { x: 20, y: 0, z: -15 },
    },

    // Caching
    {
      id: 'redis-cache',
      name: 'Redis Cache',
      type: 'cache',
      description: 'Distributed caching layer',
      technology: 'Redis',
      position: { x: 0, y: 2, z: 0 },
    },

    // Message Queues
    {
      id: 'event-bus',
      name: 'Event Bus',
      type: 'queue',
      description: 'Kafka event streaming platform',
      technology: 'Apache Kafka',
      position: { x: 0, y: 6, z: 10 },
    },
    {
      id: 'task-queue',
      name: 'Task Queue',
      type: 'queue',
      description: 'RabbitMQ for async task processing',
      technology: 'RabbitMQ',
      position: { x: -15, y: 6, z: 12 },
    },

    // External Services
    {
      id: 'stripe-api',
      name: 'Stripe API',
      type: 'external',
      description: 'Payment processing provider',
      position: { x: 30, y: 6, z: 5 },
    },
    {
      id: 'sendgrid-api',
      name: 'SendGrid API',
      type: 'external',
      description: 'Email delivery service',
      position: { x: -30, y: 6, z: 5 },
    },
    {
      id: 'elasticsearch',
      name: 'Elasticsearch',
      type: 'external',
      description: 'Search and analytics engine',
      technology: 'Elasticsearch',
      position: { x: 5, y: 0, z: -25 },
    },
  ],

  connections: [
    // Gateway to Services
    {
      id: 'gw-user',
      sourceId: 'api-gateway',
      targetId: 'user-service',
      type: 'http',
      label: 'REST API',
    },
    {
      id: 'gw-product',
      sourceId: 'api-gateway',
      targetId: 'product-service',
      type: 'http',
      label: 'REST API',
    },
    {
      id: 'gw-order',
      sourceId: 'api-gateway',
      targetId: 'order-service',
      type: 'http',
      label: 'REST API',
    },

    // Service to Database
    {
      id: 'user-to-db',
      sourceId: 'user-service',
      targetId: 'user-db',
      type: 'database',
    },
    {
      id: 'product-to-db',
      sourceId: 'product-service',
      targetId: 'product-db',
      type: 'database',
    },
    {
      id: 'order-to-db',
      sourceId: 'order-service',
      targetId: 'order-db',
      type: 'database',
    },

    // Caching
    {
      id: 'user-cache',
      sourceId: 'user-service',
      targetId: 'redis-cache',
      type: 'database',
      label: 'Session Cache',
    },
    {
      id: 'product-cache',
      sourceId: 'product-service',
      targetId: 'redis-cache',
      type: 'database',
      label: 'Product Cache',
    },

    // Event Bus
    {
      id: 'order-events',
      sourceId: 'order-service',
      targetId: 'event-bus',
      type: 'queue',
      label: 'Order Events',
    },
    {
      id: 'payment-events',
      sourceId: 'payment-service',
      targetId: 'event-bus',
      type: 'queue',
      label: 'Payment Events',
    },
    {
      id: 'notification-sub',
      sourceId: 'event-bus',
      targetId: 'notification-service',
      type: 'event',
      label: 'Subscribe',
    },
    {
      id: 'analytics-sub',
      sourceId: 'event-bus',
      targetId: 'analytics-service',
      type: 'event',
      label: 'Subscribe',
    },

    // Service to Service
    {
      id: 'order-payment',
      sourceId: 'order-service',
      targetId: 'payment-service',
      type: 'grpc',
      label: 'Process Payment',
    },
    {
      id: 'order-user',
      sourceId: 'order-service',
      targetId: 'user-service',
      type: 'grpc',
      label: 'Get User',
    },
    {
      id: 'order-product',
      sourceId: 'order-service',
      targetId: 'product-service',
      type: 'grpc',
      label: 'Check Inventory',
    },
    {
      id: 'recommendation-product',
      sourceId: 'recommendation-service',
      targetId: 'product-service',
      type: 'grpc',
      label: 'Get Products',
    },

    // Task Queue
    {
      id: 'notification-queue',
      sourceId: 'notification-service',
      targetId: 'task-queue',
      type: 'queue',
      label: 'Email Tasks',
    },

    // External APIs
    {
      id: 'payment-stripe',
      sourceId: 'payment-service',
      targetId: 'stripe-api',
      type: 'http',
      label: 'Payment API',
    },
    {
      id: 'notification-sendgrid',
      sourceId: 'notification-service',
      targetId: 'sendgrid-api',
      type: 'http',
      label: 'Email API',
    },
    {
      id: 'product-search',
      sourceId: 'product-service',
      targetId: 'elasticsearch',
      type: 'http',
      label: 'Search Index',
    },
  ],

  layout: {
    type: 'manual',
    spacing: 5,
  },

  defaultView: {
    position: { x: 0, y: 15, z: 30 },
    target: { x: 0, y: 0, z: 0 },
    detailLevel: 'service',
  },
}
