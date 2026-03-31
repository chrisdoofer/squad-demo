export interface AzureService {
  name: string;
  icon: string;
}

export interface PatternFile {
  name: string;
  path: string;
  language: string;
}

export interface ArchitecturePattern {
  id: string;
  title: string;
  category: string;
  description: string;
  longDescription: string;
  services: AzureService[];
  architectureUrl: string;
  diagramUrl: string;
  deployUrl: string;
  files: PatternFile[];
  tags: string[];
  complexity: 'beginner' | 'intermediate' | 'advanced';
}

// ⚠️ UPDATE THIS to your GitHub org/repo before deploying
const GITHUB_ORG = 'chrisdoofer';
const GITHUB_REPO = 'squad-demo';
const GITHUB_BRANCH = 'main';

const rawBase = `https://raw.githubusercontent.com/${GITHUB_ORG}/${GITHUB_REPO}/${GITHUB_BRANCH}/patterns/`;
const deployBase = `https://portal.azure.com/#create/Microsoft.Template/uri/${encodeURIComponent(rawBase)}`;

function patternFiles(id: string): PatternFile[] {
  return [
    { name: 'main.bicep', path: `patterns/${id}/infra/main.bicep`, language: 'bicep' },
    { name: 'deploy.yml', path: `patterns/${id}/.github/workflows/deploy.yml`, language: 'yaml' },
    { name: 'app-deploy.yml', path: `patterns/${id}/.github/workflows/app-deploy.yml`, language: 'yaml' },
  ];
}

export const patterns: ArchitecturePattern[] = [
  // ── 1. Basic Web App ────────────────────────────────────────────────
  {
    id: 'basic-web-app',
    title: 'Basic Web App on Azure App Service',
    category: 'Web',
    description:
      'A basic architecture for running web applications on Azure App Service in a single region. Includes App Service, SQL Database, Entra ID authentication, and Application Insights monitoring.',
    longDescription: `This architecture provides a straightforward starting point for hosting web applications on Azure. An HTTPS request from the user is routed to Azure App Service, which serves the application and communicates with Azure SQL Database for relational data storage. Entra ID handles authentication through App Service's built-in Easy Auth integration, so you can add sign-in without writing authentication code.

Application Insights and Azure Monitor are wired in from the start, giving you request tracing, failure alerts, and performance metrics out of the box. The single-region deployment keeps the topology simple while still following Azure best practices for security and observability.

Use this pattern when you are evaluating Azure for the first time, building a proof-of-concept, or running an internal tool that does not require multi-region failover. It is the recommended baseline in the Azure Architecture Center and can be evolved into the multi-region variant when your availability requirements grow.`,
    services: [
      { name: 'App Service', icon: '🌐' },
      { name: 'SQL Database', icon: '🗄️' },
      { name: 'Entra ID', icon: '🔐' },
      { name: 'Application Insights', icon: '📊' },
      { name: 'Azure Monitor', icon: '📈' },
    ],
    architectureUrl:
      'https://learn.microsoft.com/en-us/azure/architecture/web-apps/app-service/architectures/basic-web-app',
    diagramUrl: '/diagrams/basic-web-app-architecture.svg',
    deployUrl: `${deployBase}basic-web-app%2Finfra%2Fmain.json`,
    files: patternFiles('basic-web-app'),
    tags: ['web', 'app-service', 'sql', 'single-region', 'beginner'],
    complexity: 'beginner',
  },

  // ── 2. Microservices on AKS ─────────────────────────────────────────
  {
    id: 'microservices-aks',
    title: 'Microservices on Azure Kubernetes Service',
    category: 'Containers',
    description:
      'Deploy microservices to AKS with Service Bus messaging, Cosmos DB for data, and managed NGINX ingress. Uses publisher-subscriber and competing consumers patterns.',
    longDescription: `This reference architecture demonstrates how to run a microservices workload on Azure Kubernetes Service. Each microservice runs in its own pod, communicates asynchronously through Azure Service Bus using the publisher-subscriber pattern, and stores data in Azure Cosmos DB. A managed NGINX ingress controller routes external traffic, while Azure Container Registry hosts the container images.

Redis provides a distributed cache layer for frequently accessed data, reducing database round-trips and improving response latency. Azure Monitor with Container Insights gives you deep visibility into cluster health, pod metrics, and application-level traces across every service.

Choose this architecture when you need fine-grained control over orchestration, want to leverage the Kubernetes ecosystem of tools and operators, or are running workloads that require advanced scheduling, service mesh integration, or custom autoscaling policies. The competing consumers pattern on Service Bus ensures reliable message processing even under heavy load.`,
    services: [
      { name: 'AKS', icon: '☸️' },
      { name: 'Service Bus', icon: '📬' },
      { name: 'Cosmos DB', icon: '🌍' },
      { name: 'Redis', icon: '⚡' },
      { name: 'Container Registry', icon: '📦' },
      { name: 'Azure Monitor', icon: '📈' },
    ],
    architectureUrl:
      'https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/containers/aks-microservices/aks-microservices',
    diagramUrl: '/diagrams/microservices-aks-architecture.svg',
    deployUrl: `${deployBase}microservices-aks%2Finfra%2Fmain.json`,
    files: patternFiles('microservices-aks'),
    tags: ['kubernetes', 'microservices', 'containers', 'messaging', 'advanced'],
    complexity: 'advanced',
  },

  // ── 3. Hub-Spoke Network ────────────────────────────────────────────
  {
    id: 'hub-spoke-network',
    title: 'Hub-Spoke Network Topology',
    category: 'Networking',
    description:
      'Implement a hub-spoke network pattern with customer-managed hub infrastructure. The hub VNet hosts shared services (Firewall, Bastion, VPN Gateway) while spoke VNets isolate workloads.',
    longDescription: `The hub-spoke topology is a foundational networking pattern recommended by the Azure Cloud Adoption Framework. A central hub virtual network hosts shared services such as Azure Firewall for centralized egress control, Azure Bastion for secure VM access, and a VPN Gateway for hybrid connectivity to on-premises networks. Spoke virtual networks peer with the hub and contain the actual application workloads, isolated from one another by default.

Network Security Groups on each spoke subnet enforce fine-grained traffic rules, while Azure Firewall in the hub inspects and logs all outbound traffic. This separation of concerns means network teams manage the hub independently from application teams who own the spokes, aligning with enterprise governance and cost-allocation models.

Adopt this pattern when you need workload isolation across teams or environments, centralized network security controls, or hybrid connectivity through a single, auditable chokepoint. It scales naturally—adding a new workload is as simple as provisioning a new spoke and peering it with the hub.`,
    services: [
      { name: 'Virtual Network', icon: '🔗' },
      { name: 'Azure Firewall', icon: '🛡️' },
      { name: 'Bastion', icon: '🏰' },
      { name: 'VPN Gateway', icon: '🔒' },
      { name: 'Network Security Group', icon: '🚧' },
    ],
    architectureUrl:
      'https://learn.microsoft.com/en-us/azure/architecture/networking/architecture/hub-spoke',
    diagramUrl: '/diagrams/hub-spoke-network-architecture.svg',
    deployUrl: `${deployBase}hub-spoke-network%2Finfra%2Fmain.json`,
    files: patternFiles('hub-spoke-network'),
    tags: ['networking', 'hub-spoke', 'firewall', 'security', 'intermediate'],
    complexity: 'intermediate',
  },

  // ── 4. Serverless API ───────────────────────────────────────────────
  {
    id: 'serverless-api',
    title: 'Serverless API with Azure Functions',
    category: 'Serverless',
    description:
      'Build a scalable serverless API using Azure Functions with API Management for governance, rate limiting, and developer portal. Cosmos DB provides globally distributed data storage.',
    longDescription: `This pattern pairs Azure Functions with API Management to deliver a fully serverless HTTP API that scales automatically with demand. API Management sits in front of your function endpoints, providing a unified gateway with rate limiting, request validation, caching policies, and a built-in developer portal where consumers can discover and test your APIs.

Azure Cosmos DB serves as the data layer, offering single-digit-millisecond reads and writes with turnkey global distribution. A Storage Account backs the Functions runtime, and Application Insights captures end-to-end distributed traces from the API gateway through to the database call.

This architecture is ideal when you want zero infrastructure management, pay-per-execution pricing, and the ability to scale from zero to thousands of concurrent requests seamlessly. It works well for public-facing APIs, mobile backends, and webhook processors where traffic patterns are unpredictable.`,
    services: [
      { name: 'Azure Functions', icon: '⚡' },
      { name: 'API Management', icon: '🚪' },
      { name: 'Cosmos DB', icon: '🌍' },
      { name: 'Storage Account', icon: '💾' },
      { name: 'Application Insights', icon: '📊' },
    ],
    architectureUrl:
      'https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/serverless/web-app',
    diagramUrl: '/diagrams/serverless-api-architecture.svg',
    deployUrl: `${deployBase}serverless-api%2Finfra%2Fmain.json`,
    files: patternFiles('serverless-api'),
    tags: ['serverless', 'functions', 'api', 'cosmos-db', 'intermediate'],
    complexity: 'intermediate',
  },

  // ── 5. Static Web App ──────────────────────────────────────────────
  {
    id: 'static-web-app',
    title: 'Static Web App with Serverless API',
    category: 'Web',
    description:
      'Host a static frontend with Azure Static Web Apps and a serverless API backend. Includes automatic SSL, global CDN distribution, and integrated authentication.',
    longDescription: `Azure Static Web Apps provides a streamlined hosting model for modern JavaScript frameworks and static site generators. Your frontend assets are deployed to a globally distributed CDN, so users everywhere get fast load times with automatic SSL certificates. An integrated Azure Functions backend lets you add API routes without managing separate infrastructure—just drop your functions into the project and they deploy alongside the frontend.

Authentication is built in with support for Entra ID, GitHub, and other identity providers, requiring no additional code. Cosmos DB can be added as the data layer for any persistent state your API needs to manage.

This pattern shines for JAMstack applications, documentation sites, dashboards, and single-page apps where you want minimal operational overhead. Staging environments are created automatically for every pull request, giving you preview URLs for code review before merging to production.`,
    services: [
      { name: 'Static Web Apps', icon: '🖥️' },
      { name: 'Azure Functions', icon: '⚡' },
      { name: 'Cosmos DB', icon: '🌍' },
    ],
    architectureUrl:
      'https://learn.microsoft.com/en-us/azure/architecture/solution-ideas/articles/static-website',
    diagramUrl: '/diagrams/static-web-app-architecture.svg',
    deployUrl: `${deployBase}static-web-app%2Finfra%2Fmain.json`,
    files: patternFiles('static-web-app'),
    tags: ['static', 'web', 'serverless', 'cdn', 'beginner'],
    complexity: 'beginner',
  },

  // ── 6. Event-Driven Architecture ───────────────────────────────────
  {
    id: 'event-driven',
    title: 'Event-Driven Architecture',
    category: 'Integration',
    description:
      'Process events at scale using Event Grid for routing, Azure Functions for compute, and Service Bus for reliable messaging. Supports fan-out, filtering, and dead-letter handling.',
    longDescription: `Event-driven architecture decouples producers from consumers, allowing systems to react to state changes in near-real time. Azure Event Grid acts as the central routing fabric, receiving events from Azure services or custom sources and delivering them to subscribers based on filtering rules. Azure Functions respond to these events with serverless compute that scales automatically.

For scenarios that require guaranteed delivery and ordering, Azure Service Bus complements Event Grid with queues and topics that support sessions, dead-letter handling, and scheduled delivery. A Storage Account provides durable state for checkpointing, and Application Insights ties everything together with distributed tracing across the asynchronous flow.

Use this pattern when you are building systems that must react to changes—order processing, IoT telemetry ingestion, audit logging, or workflow orchestration. The loose coupling means each component can be developed, deployed, and scaled independently, and adding new consumers is as simple as creating a new subscription.`,
    services: [
      { name: 'Event Grid', icon: '📡' },
      { name: 'Azure Functions', icon: '⚡' },
      { name: 'Service Bus', icon: '📬' },
      { name: 'Storage Account', icon: '💾' },
      { name: 'Application Insights', icon: '📊' },
    ],
    architectureUrl:
      'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/event-driven',
    diagramUrl: '/diagrams/event-driven-architecture.svg',
    deployUrl: `${deployBase}event-driven%2Finfra%2Fmain.json`,
    files: patternFiles('event-driven'),
    tags: ['events', 'messaging', 'integration', 'serverless', 'intermediate'],
    complexity: 'intermediate',
  },

  // ── 7. Multi-Region Web App ────────────────────────────────────────
  {
    id: 'multi-region-web',
    title: 'Multi-Region Web Application',
    category: 'Web',
    description:
      'Deploy a high-availability web application across two Azure regions with Azure Front Door for global load balancing and SQL Database geo-replication for data resilience.',
    longDescription: `When your application requires high availability and resilience against regional outages, a multi-region deployment is essential. This architecture deploys identical App Service instances in two Azure regions behind Azure Front Door, which performs global load balancing, SSL offloading, and automatic failover. If the primary region becomes unavailable, Front Door routes traffic to the secondary region within seconds.

Azure SQL Database geo-replication keeps a continuously synchronized read replica in the secondary region. In a failover scenario the replica can be promoted to primary, minimizing data loss. Azure Monitor and Traffic Manager provide health probes and alerting so your operations team has full visibility into regional health.

Adopt this pattern for customer-facing applications with SLA requirements above 99.9%, e-commerce platforms, or any workload where downtime directly impacts revenue. It builds on the basic web app pattern—so teams can start simple and graduate to multi-region when the business demands it.`,
    services: [
      { name: 'App Service', icon: '🌐' },
      { name: 'Front Door', icon: '🚀' },
      { name: 'SQL Database', icon: '🗄️' },
      { name: 'Azure Monitor', icon: '📈' },
      { name: 'Traffic Manager', icon: '🔀' },
    ],
    architectureUrl:
      'https://learn.microsoft.com/en-us/azure/architecture/web-apps/app-service/architectures/multi-region',
    diagramUrl: '/diagrams/multi-region-web-architecture.svg',
    deployUrl: `${deployBase}multi-region-web%2Finfra%2Fmain.json`,
    files: patternFiles('multi-region-web'),
    tags: ['multi-region', 'high-availability', 'front-door', 'geo-replication', 'advanced'],
    complexity: 'advanced',
  },

  // ── 8. Container Apps ──────────────────────────────────────────────
  {
    id: 'container-apps',
    title: 'Microservices with Azure Container Apps',
    category: 'Containers',
    description:
      'Run containerized microservices with Azure Container Apps and Dapr for service-to-service communication. Includes auto-scaling, revision management, and built-in observability.',
    longDescription: `Azure Container Apps provides a serverless container platform that abstracts away Kubernetes complexity while still running on AKS under the hood. Each microservice is deployed as a container app with independent scaling rules—scale to zero when idle or burst to hundreds of replicas based on HTTP traffic, queue depth, or custom metrics. Revision management lets you run multiple versions side by side for blue-green deployments and A/B testing.

Dapr (Distributed Application Runtime) is integrated natively, giving your services a sidecar that handles service discovery, pub/sub messaging, state management, and distributed tracing without requiring SDK dependencies. Azure Container Registry stores your images, Cosmos DB provides the data layer, and Redis Cache accelerates hot-path reads.

Choose Container Apps when you want the benefits of containers and microservices without managing Kubernetes clusters, node pools, or ingress controllers. It is the sweet spot between Azure Functions (event-driven, single-purpose) and AKS (full Kubernetes control), ideal for teams that want to ship containers quickly with minimal ops overhead.`,
    services: [
      { name: 'Container Apps', icon: '📦' },
      { name: 'Container Registry', icon: '🏗️' },
      { name: 'Cosmos DB', icon: '🌍' },
      { name: 'Redis Cache', icon: '⚡' },
      { name: 'Log Analytics', icon: '📋' },
    ],
    architectureUrl:
      'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices',
    diagramUrl: '/diagrams/container-apps-architecture.svg',
    deployUrl: `${deployBase}container-apps%2Finfra%2Fmain.json`,
    files: patternFiles('container-apps'),
    tags: ['containers', 'microservices', 'dapr', 'serverless-containers', 'intermediate'],
    complexity: 'intermediate',
  },

  // ── 9. Data Analytics ──────────────────────────────────────────────
  {
    id: 'data-analytics',
    title: 'Modern Data Analytics Platform',
    category: 'Data',
    description:
      'Build a modern analytics platform with Azure Synapse Analytics for data warehousing, Data Lake Storage Gen2 for raw data, and Data Factory for ETL/ELT pipelines.',
    longDescription: `This architecture implements the modern data warehouse pattern on Azure. Raw data lands in Azure Data Lake Storage Gen2 organized into bronze, silver, and gold zones. Azure Data Factory orchestrates the ETL/ELT pipelines that ingest data from operational databases, SaaS applications, and streaming sources, transforming it through each zone until it is ready for analytics.

Azure Synapse Analytics serves as the unified analytics workspace, combining serverless and dedicated SQL pools for querying data at any scale. Key Vault secures connection strings and secrets, while Power BI connects directly to Synapse for interactive dashboards and self-service reporting.

This pattern suits organizations that need to consolidate data from multiple sources into a single analytics platform. Whether you are building executive dashboards, training machine-learning models on historical data, or enabling ad-hoc exploration by data analysts, the lakehouse approach gives you the flexibility of a data lake with the performance of a data warehouse.`,
    services: [
      { name: 'Synapse Analytics', icon: '🔬' },
      { name: 'Data Lake Storage', icon: '🏞️' },
      { name: 'Data Factory', icon: '🏭' },
      { name: 'Key Vault', icon: '🔑' },
      { name: 'Power BI', icon: '📊' },
    ],
    architectureUrl:
      'https://learn.microsoft.com/en-us/azure/architecture/solution-ideas/articles/azure-databricks-modern-analytics-architecture',
    diagramUrl: '/diagrams/data-analytics-architecture.svg',
    deployUrl: `${deployBase}data-analytics%2Finfra%2Fmain.json`,
    files: patternFiles('data-analytics'),
    tags: ['analytics', 'data-lake', 'synapse', 'etl', 'advanced'],
    complexity: 'advanced',
  },

  // ── 10. AI/ML Workload ─────────────────────────────────────────────
  {
    id: 'ai-ml-workload',
    title: 'AI/ML Application with Azure OpenAI',
    category: 'AI/ML',
    description:
      'Deploy an AI-powered application using Azure OpenAI Service for language models, Cognitive Services for vision and speech, and App Service for the web frontend.',
    longDescription: `This architecture brings generative AI capabilities into your applications through Azure OpenAI Service. The web frontend runs on App Service and sends user prompts to Azure OpenAI, which hosts GPT and embedding models within your own Azure tenant—keeping data private and under your control. Cognitive Services extend the AI surface with pre-built models for computer vision, speech-to-text, and language understanding.

Key Vault stores API keys and connection strings, ensuring secrets never appear in application code or configuration files. Application Insights captures every inference request with latency, token usage, and error details, giving you the observability needed to optimize costs and model performance.

Choose this pattern when you want to add chat, summarization, code generation, or multimodal intelligence to an existing application. It works for internal productivity tools, customer-facing copilot experiences, and batch processing pipelines alike. The architecture can be extended with Azure AI Search for retrieval-augmented generation (RAG), grounding model responses in your own enterprise data.`,
    services: [
      { name: 'Azure OpenAI', icon: '🤖' },
      { name: 'Cognitive Services', icon: '🧠' },
      { name: 'App Service', icon: '🌐' },
      { name: 'Key Vault', icon: '🔑' },
      { name: 'Application Insights', icon: '📊' },
    ],
    architectureUrl:
      'https://learn.microsoft.com/en-us/azure/architecture/ai-ml/',
    diagramUrl: '/diagrams/ai-ml-workload-architecture.svg',
    deployUrl: `${deployBase}ai-ml-workload%2Finfra%2Fmain.json`,
    files: patternFiles('ai-ml-workload'),
    tags: ['ai', 'openai', 'cognitive-services', 'ml', 'intermediate'],
    complexity: 'intermediate',
  },
];
