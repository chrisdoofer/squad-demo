# Container Apps Architecture — Demo Guide

> This demo deploys a cloud-native containerized application on Azure Container Apps with Azure Container Registry for image management, Cosmos DB for globally distributed data, Redis Cache for high-speed caching, and Log Analytics for centralized observability.

## Component Breakdown

### Azure Container Apps

#### Customer Value
Azure Container Apps is a fully managed serverless container platform built on Kubernetes that enables developers to deploy containerized applications without managing clusters, nodes, or infrastructure. It supports any language or framework packaged as a container, with built-in auto-scaling (including scale-to-zero), revision management, traffic splitting, and Dapr integration for microservice patterns.

Container Apps abstracts away Kubernetes complexity while preserving its power. Developers get automatic HTTPS ingress, service discovery between containers, and KEDA-based auto-scaling that responds to HTTP traffic, queue depth, CPU/memory utilization, or custom metrics. This means applications scale precisely with demand — from zero instances during idle periods to hundreds of replicas during peak load — with no manual intervention.

The platform natively supports microservice architectures with Dapr sidecars that provide service invocation, state management, pub/sub messaging, and secret management through standardized APIs. This lets teams build distributed applications using consistent patterns without tight coupling to specific infrastructure services, improving portability and reducing boilerplate code.

#### Competitive Advantage
| Feature | Azure (Container Apps) | AWS (App Runner / ECS Fargate) | GCP (Cloud Run) |
|---------|------------------------|-------------------------------|------------------|
| Scale to zero | Native scale-to-zero | App Runner (yes), Fargate (no) | Native scale-to-zero |
| Kubernetes-based | Built on AKS (managed K8s) | Custom orchestrator (ECS) | Built on GKE (Knative) |
| Dapr integration | Built-in sidecar injection | Not available | Not available |
| KEDA scaling | Native KEDA support (30+ scalers) | Application Auto Scaling | Concurrency/CPU-based scaling |
| Traffic splitting | Revision-based traffic splitting | Not available (App Runner) | Revision-based traffic splitting |
| Microservice communication | Built-in service discovery + Dapr | Service Connect / App Mesh | Service-to-service auth |
| Jobs support | Container Apps Jobs (scheduled/event) | ECS Scheduled Tasks | Cloud Run Jobs |
| GPU support | GPU workloads supported | Fargate GPU (limited) | Cloud Run GPU |
| Max replicas | 300 per revision | Service-dependent | 1000 per service |

Azure Container Apps' defining differentiator is the integrated Dapr and KEDA support, which is unmatched on any other cloud platform. Dapr provides portable microservice building blocks (pub/sub, state, service invocation) that work across cloud and on-premises, while KEDA enables scaling based on 30+ event sources (queues, streams, cron, custom metrics). AWS and GCP require self-managing these CNCF projects on their Kubernetes services.

Container Apps occupies a unique position between fully serverless (Cloud Run, App Runner) and fully managed Kubernetes (AKS, EKS, GKE). Developers get Kubernetes-grade networking and scaling without writing YAML manifests or managing node pools. Cloud Run is the closest GCP equivalent and excels at simple stateless containers, but it lacks Dapr integration, KEDA's rich scaling triggers, and the multi-container revision model that Container Apps provides.

#### Common Use Cases
- **Microservice architectures** — Deploy interconnected microservices with built-in service discovery, Dapr-enabled pub/sub messaging, and independent scaling per service.
- **Event-driven processing** — Use KEDA scalers to automatically spin up container replicas in response to queue messages, database changes, or custom events, scaling to zero when idle.
- **API backends** — Host containerized APIs with automatic HTTPS, traffic splitting for canary deployments, and auto-scaling based on HTTP request volume.
- **Background job processing** — Run scheduled or event-triggered container jobs for batch processing, data migration, or periodic maintenance tasks.
- **Migration from Kubernetes** — Teams running AKS or self-managed Kubernetes can migrate workloads to Container Apps for simplified operations while retaining container-native workflows.

---

### Azure Container Registry

#### Customer Value
Azure Container Registry (ACR) is a managed Docker container registry that provides secure, private storage for container images and OCI artifacts. It integrates natively with Azure container services (Container Apps, AKS, App Service), eliminating credential management overhead and providing fast image pulls over Azure's private backbone network.

ACR offers geo-replication, automatically synchronizing images across multiple Azure regions for low-latency pulls and regional redundancy. ACR Tasks provides cloud-based container image building, eliminating the need for local Docker daemons or dedicated build servers. Teams can trigger automated builds from source code commits, base image updates, or on a schedule.

Security features include content trust (image signing), vulnerability scanning with Microsoft Defender for Containers, network isolation via private endpoints, and fine-grained access control with Azure AD and managed identities. The Premium tier adds customer-managed encryption keys and dedicated throughput for high-pull-rate scenarios.

#### Competitive Advantage
| Feature | Azure (Container Registry) | AWS (ECR) | GCP (Artifact Registry) |
|---------|---------------------------|-----------|------------------------|
| Geo-replication | Built-in multi-region replication | Cross-region replication | Multi-region repositories |
| Image building | ACR Tasks (cloud-native builds) | CodeBuild integration | Cloud Build integration |
| Vulnerability scanning | Defender for Containers integration | ECR scanning + Inspector | Container Analysis |
| OCI artifact support | Full OCI artifact support | OCI support | OCI support |
| Helm chart storage | Native Helm chart repository | OCI-based Helm storage | OCI-based Helm storage |
| Managed identity pull | Native managed identity integration | IAM role-based access | Workload identity |
| Quarantine pattern | Image quarantine (preview) | Not available | Not available |
| Retention policies | Tag-based retention rules | Lifecycle policies | Cleanup policies |

ACR's standout feature is ACR Tasks — a cloud-native image building service that can compile and push images directly in Azure without requiring a separate CI/CD build system. Quick tasks let developers build an image from a Dockerfile with a single CLI command, while multi-step tasks support complex build workflows with parallel execution. Neither ECR nor Artifact Registry offers equivalent built-in build capabilities without a separate build service.

Geo-replication in ACR is seamless — push an image once, and it's automatically available in all configured regions. This is critical for multi-region Container Apps deployments where image pull latency can impact scale-out speed. ECR's cross-region replication requires explicit configuration per repository, while GCP Artifact Registry's multi-region repositories provide similar but less granular control.

#### Common Use Cases
- **CI/CD image pipeline** — Build, test, scan, and publish container images with ACR Tasks, triggering automated builds from GitHub/Azure DevOps commits and base image updates.
- **Multi-region image distribution** — Geo-replicate images across regions to ensure fast pulls for Container Apps deployments worldwide, reducing container startup latency.
- **Artifact management** — Store and distribute not just Docker images but also Helm charts, OCI artifacts, and signed images with content trust for supply chain security.
- **Vulnerability management** — Integrate Defender for Containers scanning into the image build and promotion pipeline, blocking vulnerable images from reaching production registries.

---

### Cosmos DB

#### Customer Value
Azure Cosmos DB is a globally distributed, multi-model NoSQL database service that provides single-digit millisecond latency at any scale with guaranteed SLAs for availability, throughput, consistency, and latency. It supports multiple APIs (NoSQL, MongoDB, Cassandra, Gremlin, Table) and five tunable consistency levels, giving developers precise control over the performance-consistency trade-off.

For containerized applications, Cosmos DB's serverless and autoscale provisioning modes align perfectly with Container Apps' elastic scaling. As container replicas scale up to handle increased load, Cosmos DB autoscale dynamically increases throughput to match. When traffic subsides, both the compute (Container Apps) and data (Cosmos DB) tiers scale down, optimizing costs.

Cosmos DB's turnkey global distribution allows data to be replicated to any number of Azure regions with a single click. Multi-region writes enable active-active architectures where any region can accept writes, and automatic conflict resolution handles concurrent updates. This makes it the ideal data tier for globally distributed containerized applications that need low-latency data access everywhere.

#### Competitive Advantage
| Feature | Azure (Cosmos DB) | AWS (DynamoDB) | GCP (Cloud Spanner / Firestore) |
|---------|-------------------|----------------|-------------------------------|
| Global distribution | Turnkey multi-region, multi-write | DynamoDB Global Tables | Spanner (multi-region, multi-write) |
| Consistency models | 5 tunable levels | Eventually consistent + strongly consistent | Strong (Spanner) / Eventually (Firestore) |
| Multi-model APIs | NoSQL, MongoDB, Cassandra, Gremlin, Table | DynamoDB API only | Spanner SQL / Firestore document |
| Latency SLA | <10ms read, <10ms write (p99) | Single-digit ms (no SLA) | <10ms (Spanner, no SLA) |
| Serverless mode | Consumption-based serverless | On-demand mode | Firestore (always serverless) |
| Change feed | Built-in change feed for all containers | DynamoDB Streams | Spanner change streams / Firestore listeners |
| Automatic indexing | All properties indexed by default | Secondary indexes (manual) | Composite indexes (manual) |
| Comprehensive SLA | 99.999% availability SLA (multi-region) | 99.999% (Global Tables) | 99.999% (Spanner multi-region) |

Cosmos DB's five tunable consistency levels (strong, bounded staleness, session, consistent prefix, eventual) are unique among cloud databases. DynamoDB offers only two (strong and eventual), and Spanner provides only strong consistency. This granularity lets developers choose the exact consistency-performance trade-off for each operation — session consistency for user-facing reads, eventual consistency for analytics, strong consistency for financial transactions.

The multi-model API support is another major differentiator. Teams can migrate existing MongoDB or Cassandra workloads to Cosmos DB without code changes by using the wire-compatible APIs, gaining global distribution and SLA guarantees. DynamoDB requires application rewrites to migrate from other NoSQL databases. Cosmos DB's automatic indexing of all properties eliminates the need to predict access patterns and manage secondary indexes upfront, accelerating development.

#### Common Use Cases
- **User profiles and session state** — Store user data with session consistency for fast, consistent reads in containerized web applications, with global distribution for low-latency access worldwide.
- **Real-time personalization** — Use the change feed to power real-time recommendation engines and event-driven processing as data changes.
- **IoT telemetry ingestion** — Ingest high-velocity device telemetry using Cosmos DB's autoscale throughput, with time-to-live (TTL) policies for automatic data expiration.
- **Multi-tenant SaaS data** — Leverage hierarchical partition keys and serverless mode for cost-effective multi-tenant data isolation with per-tenant scaling.
- **Shopping cart and catalog** — Store product catalogs and shopping cart data with the document model, using Cosmos DB's global distribution for consistent e-commerce experiences across regions.

---

### Redis Cache

#### Customer Value
Azure Cache for Redis is a fully managed, in-memory data store based on the open-source Redis engine. It provides sub-millisecond data access for caching, session management, real-time analytics, and message brokering — dramatically improving application performance by reducing database load and network round-trips.

For containerized applications, Redis Cache serves as the shared state layer across container replicas. Since Container Apps scale horizontally (adding more container instances), application state like user sessions, API rate limits, and feature flags cannot be stored in-process. Redis provides a centralized, blazing-fast store that all container replicas access consistently, enabling true stateless container design.

Azure Cache for Redis offers three tiers: Basic (development/test), Standard (production with replication), and Premium/Enterprise (clustering, geo-replication, Redis modules, persistence). The Enterprise tier, powered by Redis Ltd., supports advanced data structures (RedisJSON, RediSearch, RedisTimeSeries, RedisBloom) that go beyond basic caching into real-time search, analytics, and AI workloads.

#### Competitive Advantage
| Feature | Azure (Cache for Redis) | AWS (ElastiCache for Redis) | GCP (Memorystore for Redis) |
|---------|--------------------------|----------------------------|----------------------------|
| Enterprise tier | Redis Enterprise with modules | ElastiCache (open-source Redis) | Memorystore (open-source Redis) |
| Redis modules | RediSearch, RedisJSON, RedisTimeSeries, RedisBloom | Not available (managed) | Not available (managed) |
| Active geo-replication | Enterprise tier (active-active) | Global Datastore (read replicas) | Cross-region replication (preview) |
| Clustering | Up to 10 shards (Premium) / 500 (Enterprise) | Up to 500 shards | Up to 5 shards |
| Persistence | RDB + AOF (Premium/Enterprise) | RDB + AOF | RDB snapshots |
| OSS compatibility | Redis 6.x / 7.x | Redis 7.x | Redis 6.x / 7.x |
| Private connectivity | Private Link | VPC endpoints | Private Service Connect |
| Flash storage | Enterprise Flash (SSD-backed) | Not available | Not available |

Azure Cache for Redis Enterprise is the only fully managed offering from any major cloud provider that includes Redis modules (RediSearch, RedisJSON, RedisTimeSeries, RedisBloom). These modules transform Redis from a simple cache into a real-time data platform capable of full-text search, time-series analytics, probabilistic data structures, and native JSON operations. AWS and GCP only offer open-source Redis without module support in their managed services.

Enterprise Flash is another unique capability — it extends Redis capacity using NVMe SSDs while maintaining sub-millisecond performance for frequently accessed data. This enables cost-effective caching for large datasets (up to 13.5 TB per cluster) at a fraction of the cost of pure in-memory instances. Active geo-replication in the Enterprise tier supports true active-active cross-region caching, while AWS Global Datastore provides only read replicas.

#### Common Use Cases
- **Application caching** — Cache frequently accessed database query results, API responses, and computed values to reduce latency from hundreds of milliseconds to sub-millisecond.
- **Session management** — Store user session data in Redis so that all container replicas share session state, enabling seamless horizontal scaling and container recycling.
- **Real-time leaderboards and counters** — Use Redis sorted sets and atomic increments for real-time leaderboards, rate limiting, and counters across distributed container instances.
- **Pub/sub messaging** — Implement lightweight real-time messaging between containers using Redis pub/sub for notifications, chat features, or coordination.
- **Full-text search** — Use RediSearch (Enterprise tier) for sub-millisecond full-text search, auto-complete, and secondary indexing without a separate search engine.

---

### Log Analytics

#### Customer Value
Log Analytics is the central log aggregation and query engine within Azure Monitor, providing a scalable, cloud-native platform for collecting, storing, and analyzing telemetry data from Azure resources, applications, and infrastructure. It uses Kusto Query Language (KQL) — one of the most powerful log analytics languages available — to enable complex queries across massive datasets in seconds.

For Container Apps architectures, Log Analytics serves as the unified observability backend where container logs, platform metrics, scaling events, and application traces converge. Every container stdout/stderr output, Dapr sidecar log, and KEDA scaling decision is automatically routed to Log Analytics, providing comprehensive visibility without additional instrumentation.

Log Analytics workspaces support data retention from 30 days to 12 years (with archive tiers), interactive queries, alert rule evaluation, workbook visualizations, and export to Event Hubs or Storage for long-term analysis. Dedicated clusters provide customer-managed encryption keys, cross-workspace queries, and committed-tier pricing for large-scale deployments.

#### Competitive Advantage
| Feature | Azure (Log Analytics) | AWS (CloudWatch Logs) | GCP (Cloud Logging) |
|---------|----------------------|----------------------|---------------------|
| Query language | KQL (Kusto) — full analytics language | CloudWatch Logs Insights (limited) | Logging query language |
| Cross-resource queries | Query across workspaces and subscriptions | Cross-account (limited) | Cross-project queries |
| Data retention | 30 days to 12 years (archive) | Indefinite (per class) | 30 days default + custom |
| Container log integration | Automatic for Container Apps | Container Insights + FluentBit | GKE logging integration |
| Alerting | KQL-based alert rules | Metric filters + alarms | Log-based alerts |
| Workbooks | Interactive parameterized dashboards | CloudWatch Dashboards | Looker Studio integration |
| Export capabilities | Event Hubs, Storage, custom tables | Kinesis, S3, Lambda | Pub/Sub, BigQuery, Cloud Storage |
| Pricing model | Per-GB ingested + retention | Per-GB ingested + queries | Per-GB ingested + retention |

Log Analytics' KQL engine is significantly more powerful than CloudWatch Logs Insights. KQL supports joins, unions, time-series analysis, machine learning operators (anomaly detection, forecasting), rendering visualizations, and user-defined functions — essentially a full analytics language. CloudWatch Logs Insights supports basic filtering, aggregation, and simple statistical functions but lacks the depth for complex root-cause analysis.

The automatic integration with Container Apps is seamless — all container logs, system logs, and platform events flow to Log Analytics without agent configuration or sidecar injection. For AWS, achieving equivalent container log visibility requires configuring FluentBit/Fluentd sidecars, CloudWatch Container Insights, and potentially a separate OpenSearch cluster for advanced querying. This out-of-the-box integration significantly reduces the time to operational visibility for containerized workloads.

#### Common Use Cases
- **Container troubleshooting** — Query container logs, restart events, and scaling decisions to diagnose application crashes, OOM kills, and cold start issues in Container Apps.
- **Security monitoring** — Analyze access logs, authentication events, and network traffic patterns to detect anomalies and potential security incidents using KQL-based alert rules.
- **Operational dashboards** — Build interactive workbooks that combine container metrics, application logs, and business KPIs into executive and engineering dashboards.
- **Cost optimization** — Analyze resource utilization trends to identify over-provisioned containers, underused replicas, and opportunities to tune KEDA scaling thresholds.

---

## Why This Architecture?

Azure Container Apps with supporting managed services creates a cloud-native platform that balances developer productivity with operational simplicity. Container Apps removes the Kubernetes management burden while preserving container-native workflows — developers build images, push to ACR, and deploy with a single command or CI/CD pipeline. KEDA-based auto-scaling and Dapr integration provide Kubernetes-grade capabilities without Kubernetes-grade complexity.

Cosmos DB and Redis Cache form a complementary data tier optimized for different access patterns. Cosmos DB handles durable, globally distributed data with tunable consistency, while Redis Cache provides a sub-millisecond caching and session management layer. Together, they deliver a data architecture where hot data is served from Redis in microseconds, warm data from Cosmos DB in single-digit milliseconds, and both scale independently with the containerized application tier.

Log Analytics ties the entire stack together with centralized observability. The automatic telemetry collection from Container Apps, combined with KQL's analytical power, gives teams deep insight into application behavior, scaling patterns, and operational health. This architecture is ideal for teams that want the portability and density of containers, the scalability of serverless, and the operational simplicity of fully managed services — without the overhead of running their own Kubernetes clusters.
