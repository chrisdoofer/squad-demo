# Microservices on AKS — Demo Guide

> This demo deploys a microservices architecture on Azure Kubernetes Service, with asynchronous messaging via Service Bus, multi-model data storage through Cosmos DB and Redis Cache, container image management in Azure Container Registry, and full-stack observability through Azure Monitor.

## Component Breakdown

### Azure Kubernetes Service (AKS)

#### Customer Value

Azure Kubernetes Service is a managed Kubernetes offering that removes the complexity of cluster provisioning, upgrades, and maintenance. AKS manages the control plane at no charge — customers only pay for the worker nodes. This makes Kubernetes accessible to teams that need container orchestration without the dedicated platform engineering staff typically required to run Kubernetes in production.

AKS integrates deeply with the Azure ecosystem. Entra ID provides RBAC for cluster access, Azure Policy enforces governance at the pod level, and Azure Monitor's Container Insights delivers rich observability out of the box. The result is a Kubernetes experience that inherits enterprise security, compliance, and operational tooling rather than requiring teams to bolt it on after the fact.

For customers running microservices, AKS provides the scheduling, scaling, and self-healing capabilities that make distributed systems manageable. Horizontal Pod Autoscaler and KEDA enable fine-grained scaling, while node auto-provisioning (Karpenter) ensures the right compute is available when workloads spike. Teams get production-grade orchestration with significantly less operational investment than self-managed Kubernetes.

#### Competitive Advantage

| Feature | Azure (AKS) | AWS (EKS) | GCP (GKE) |
|---------|-------------|-----------|-----------|
| Control plane cost | Free | $0.10/hr (~$73/mo) per cluster | Free (Standard); $0.10/hr (Enterprise) |
| Managed upgrades | Automated with maintenance windows | Manual or managed node groups | Automated with release channels |
| Node autoscaling | Cluster Autoscaler + Karpenter (preview) | Karpenter (mature) | Node Auto-Provisioning |
| Azure AD integration | Native Entra ID RBAC | IAM Roles for Service Accounts | Workload Identity Federation |
| Dev tooling | Bridge to Kubernetes, Draft, Azure Dev Spaces | No direct equivalent | Cloud Code, Skaffold |
| Windows containers | Native support | Supported but limited | Not supported |
| Service mesh | Istio-based add-on (managed) | App Mesh (separate service) | Anthos Service Mesh |

AKS's free control plane is a significant cost advantage, especially for organizations running multiple clusters (dev, staging, production). At $73/month per cluster, EKS control plane costs add up — an organization with 10 clusters saves over $8,700/year with AKS. GKE's Standard tier is also free, making AKS and GKE more comparable on this dimension.

GKE is generally recognized as the most mature managed Kubernetes offering, with features like Autopilot mode and rapid release channel adoption. However, AKS has closed the gap significantly and offers advantages for organizations with existing Azure and Microsoft investments — particularly around identity (Entra ID), policy (Azure Policy), and hybrid scenarios (Azure Arc-enabled Kubernetes).

#### Common Use Cases

- **Microservices platforms** — Running dozens of independently deployable services with service discovery, load balancing, and automated scaling.
- **Machine learning inference** — Deploying ML models as containerized services with GPU node pools and autoscaling based on inference queue depth.
- **Multi-tenant SaaS platforms** — Using Kubernetes namespaces, resource quotas, and network policies to isolate tenants on shared infrastructure.
- **Hybrid and edge workloads** — Extending AKS to on-premises environments with Azure Arc-enabled Kubernetes for consistent management across locations.
- **CI/CD pipeline workloads** — Running build agents, test environments, and ephemeral preview environments as Kubernetes pods.

---

### Service Bus

#### Customer Value

Azure Service Bus is an enterprise-grade message broker that provides reliable asynchronous communication between microservices. It supports queues (point-to-point) and topics (publish-subscribe), with features like message sessions, dead-letter queues, scheduled delivery, and duplicate detection built into the platform. These are not add-on features — they are core capabilities available at every tier.

For microservices architectures, Service Bus is the backbone of loose coupling. Services communicate through messages rather than direct HTTP calls, which means a temporary failure in one service does not cascade to others. Messages are durably stored and delivered at-least-once (or exactly-once with sessions), ensuring that no business event is lost even during outages or deployments.

The value for customers is resilience and scalability without complexity. Service Bus handles the hard problems of distributed messaging — ordered delivery, transactional processing, competing consumers — so that application developers can focus on business logic rather than messaging infrastructure.

#### Competitive Advantage

| Feature | Azure (Service Bus) | AWS (SQS + SNS / Amazon MQ) | GCP (Pub/Sub) |
|---------|---------------------|------------------------------|---------------|
| Message ordering | Sessions with guaranteed FIFO | SQS FIFO (limited throughput) | Ordering keys |
| Transactions | Cross-entity transactions | Not supported in SQS | Not supported |
| Dead-letter queues | Built-in with reason tracking | Basic DLQ in SQS | Dead-letter topics |
| Message size | Up to 100 MB (Premium) | 256 KB (SQS), 256 KB (SNS) | 10 MB |
| Scheduled delivery | Native, per-message scheduling | SQS delay queues (queue-level only) | Not native |
| Duplicate detection | Built-in time-window dedup | SQS FIFO dedup (5-min window) | Not built-in |
| Protocol support | AMQP 1.0, HTTP, JMS 2.0 | HTTP/SQS protocol | HTTP, gRPC |

Service Bus Premium tier's support for large messages (up to 100 MB) and cross-entity transactions is unmatched. SQS's 256 KB limit forces customers to use S3 as an overflow store, adding complexity and latency. For workloads that require transactional messaging — process the message AND update the database atomically — Service Bus is the only major cloud offering with native support.

The AMQP 1.0 protocol support is also significant for enterprise customers migrating from on-premises message brokers (IBM MQ, RabbitMQ, ActiveMQ). AMQP is an open standard, making Service Bus a natural migration target. AWS's closest equivalent for AMQP workloads is Amazon MQ, which is essentially managed ActiveMQ/RabbitMQ — functional but not cloud-native.

#### Common Use Cases

- **Microservices decoupling** — Asynchronous command and event processing between services, with dead-letter queues for failed message handling.
- **Order processing pipelines** — Ensuring ordered, exactly-once processing of financial transactions and e-commerce orders using message sessions.
- **Event-driven workflows** — Topic subscriptions with filters to route events to multiple consumers based on message properties.
- **Legacy system integration** — Bridging on-premises applications with cloud services using AMQP protocol support and hybrid connections.
- **Load leveling** — Absorbing traffic spikes by buffering requests in queues, allowing backend services to process at their own pace.

---

### Cosmos DB

#### Customer Value

Azure Cosmos DB is a globally distributed, multi-model database designed for applications that require low latency at any scale. It guarantees single-digit millisecond reads and writes at the 99th percentile, backed by comprehensive SLAs covering availability, throughput, consistency, and latency. No other cloud database offers SLAs across all four dimensions simultaneously.

Cosmos DB's multi-model capability means customers can use it as a document store, key-value store, graph database, or column-family database — all through the same service. The choice of five consistency models (from strong to eventual) gives architects fine-grained control over the consistency-latency tradeoff, rather than forcing a binary choice between strong and eventual consistency.

For microservices architectures, Cosmos DB serves as a polyglot-persistent data store that multiple services can use with different access patterns. One service might use the SQL API for document queries while another uses the Gremlin API for graph traversal — all backed by the same globally distributed engine.

#### Competitive Advantage

| Feature | Azure (Cosmos DB) | AWS (DynamoDB) | GCP (Cloud Spanner / Firestore) |
|---------|-------------------|----------------|-------------------------------|
| Global distribution | Multi-region writes, turnkey | Global tables (eventual only) | Spanner: multi-region strong consistency |
| Consistency models | 5 tunable levels | Strong or eventual only | Spanner: strong; Firestore: strong or eventual |
| Multi-model | Document, key-value, graph, column-family | Key-value and document | Firestore: document; Spanner: relational |
| Latency SLA | <10ms reads, <10ms writes at P99 | No latency SLA | No latency SLA |
| Serverless tier | Consumption-based billing | On-demand mode | Firestore: consumption; Spanner: no |
| Change feed | Built-in, ordered per partition | DynamoDB Streams | Firestore listeners; Spanner change streams |

Cosmos DB's five consistency models are a genuine architectural differentiator. Bounded staleness, session consistency, and consistent prefix fill the gap between strong and eventual consistency that DynamoDB leaves wide open. Session consistency — where a client always sees its own writes — is the sweet spot for most applications and is Cosmos DB's default.

Cloud Spanner is the strongest competitor for globally distributed workloads requiring strong consistency, and it genuinely excels at relational workloads. However, Spanner lacks the multi-model flexibility and the sub-10ms latency SLA that Cosmos DB provides. For microservices that need diverse data models with global distribution, Cosmos DB remains the broadest offering.

#### Common Use Cases

- **Real-time personalization** — Low-latency user profile and preference storage powering recommendation engines and dynamic content delivery.
- **IoT telemetry ingestion** — High-throughput writes from millions of devices with automatic indexing and change feed for downstream processing.
- **Gaming leaderboards and state** — Globally distributed player data with session consistency and single-digit millisecond access.
- **E-commerce product catalogs** — Flexible document schemas for diverse product types with globally distributed reads for low-latency shopping experiences.
- **Social graphs** — Using the Gremlin API for relationship traversal in social networks, fraud detection, and knowledge graphs.

---

### Redis Cache

#### Customer Value

Azure Cache for Redis is a fully managed in-memory data store that provides sub-millisecond response times for caching, session storage, and real-time data processing. Based on the open-source Redis engine, it provides familiar data structures (strings, hashes, lists, sets, sorted sets, streams) with enterprise features layered on top — geo-replication, data persistence, clustering, and built-in patching.

In a microservices architecture, Redis Cache serves as the high-speed data layer that sits between services and their primary databases. It absorbs read traffic, stores session state, manages distributed locks, and powers real-time features like leaderboards and rate limiting. By offloading hot data to Redis, services achieve dramatically lower latency and higher throughput without scaling their database tier.

For customers, the value is performance at reduced cost. A single Redis Cache instance can handle hundreds of thousands of operations per second, often eliminating the need to scale expensive database compute. The managed service adds monitoring, automatic failover, and security (private endpoints, encryption) without the operational burden of self-managed Redis clusters.

#### Competitive Advantage

| Feature | Azure (Cache for Redis) | AWS (ElastiCache for Redis) | GCP (Memorystore for Redis) |
|---------|-------------------------|-----------------------------|-----------------------------|
| Enterprise tier | Redis Enterprise modules (RediSearch, RedisBloom, RedisTimeSeries) | No Redis Enterprise modules | No Redis Enterprise modules |
| Active geo-replication | Enterprise tier (active-active) | Global Datastore (active-passive) | Cross-region replication (basic) |
| Zone redundancy | Built-in across Premium/Enterprise | Multi-AZ with automatic failover | Standard tier HA |
| OSS compatibility | Redis 6.x/7.x | Redis 6.x/7.x | Redis 6.x/7.x |
| Flash storage | Enterprise Flash (SSDs extend memory) | No equivalent | No equivalent |
| Data persistence | RDB/AOF to managed storage | RDB/AOF to EBS | RDB snapshots |

Azure Cache for Redis's Enterprise tier, built on Redis Ltd.'s commercial technology, provides modules like RediSearch (full-text search), RedisTimeSeries, and RedisBloom (probabilistic data structures) as managed services. Neither ElastiCache nor Memorystore offer these modules, forcing customers to self-manage Redis Enterprise on VMs for equivalent functionality.

The Enterprise Flash tier is another unique offering — it uses NVMe SSDs to extend the dataset beyond available RAM, reducing costs by up to 80% for large datasets where sub-millisecond latency is still required. This makes Azure Cache for Redis viable for workloads that would otherwise be too expensive to keep entirely in memory.

#### Common Use Cases

- **Application caching** — Caching database query results, API responses, and computed values to reduce latency and database load.
- **Session state management** — Storing user sessions in Redis for stateless application tiers, enabling horizontal scaling without sticky sessions.
- **Real-time analytics** — Using sorted sets for leaderboards, HyperLogLog for unique counts, and streams for event processing.
- **Distributed locking** — Coordinating exclusive access to shared resources across microservice instances using Redis locks.
- **Rate limiting** — Implementing API rate limiting and throttling using Redis atomic counters with TTL expiration.

---

### Azure Container Registry

#### Customer Value

Azure Container Registry (ACR) is a managed Docker registry for storing, building, and managing container images and OCI artifacts. It integrates natively with AKS, App Service, and Azure DevOps, providing a secure, private registry that sits within the Azure network fabric. Geo-replication ensures images are available close to deployment targets, reducing pull times and improving deployment reliability.

ACR Tasks provides a built-in image build service that can compile multi-architecture images, run automated builds on source code commits, and execute multi-step container workflows — all without maintaining separate build infrastructure. This is particularly valuable for teams adopting containers who want to avoid the complexity and cost of dedicated CI runners for image builds.

For customers, ACR eliminates the operational overhead of running a private container registry while providing enterprise features like image scanning, content trust (signed images), and retention policies. The tight integration with AKS — including managed identity authentication and image pull secrets — means containers deploy securely without credential management headaches.

#### Competitive Advantage

| Feature | Azure (Container Registry) | AWS (ECR) | GCP (Artifact Registry) |
|---------|---------------------------|-----------|------------------------|
| Build service | ACR Tasks (multi-step, multi-arch) | No built-in build service | Cloud Build (separate service) |
| Geo-replication | Native multi-region replication | Cross-region replication | Multi-region repositories |
| OCI artifacts | Full OCI artifact support (Helm, WASM) | OCI support | OCI support |
| Content trust | Docker Content Trust / Notation | No native image signing | Binary Authorization |
| Retention policies | Tag and untagged image policies | Lifecycle policies | Cleanup policies |
| Private link | Private endpoints for VNet access | VPC endpoints | VPC Service Controls |

ACR Tasks is a differentiator for teams that want container builds without maintaining a separate CI system. A single `az acr build` command uploads source code and returns a built, tagged, and pushed image — no Docker daemon, no build agent, no image push step. AWS ECR requires external build infrastructure (CodeBuild, GitHub Actions, etc.) for equivalent functionality.

Geo-replication with webhook notifications enables efficient multi-region deployment patterns. When an image is pushed to ACR in one region, it is automatically replicated to configured regions, and webhooks trigger deployments in each target region. This is simpler than maintaining separate registries per region with sync automation.

#### Common Use Cases

- **AKS image registry** — Storing and serving container images for Kubernetes deployments with managed identity authentication and private endpoint access.
- **CI/CD image pipeline** — Building container images from source code on every commit using ACR Tasks, with vulnerability scanning before promotion to production.
- **Helm chart repository** — Storing Helm charts as OCI artifacts alongside container images in a single registry.
- **Multi-region deployment** — Geo-replicating images to regions where AKS clusters are deployed for fast, reliable image pulls.
- **Base image management** — Maintaining curated base images with automated rebuilds when upstream images are updated.

---

### Azure Monitor

#### Customer Value

Azure Monitor is the unified observability platform that underpins all monitoring in Azure. For AKS-based microservices architectures, Container Insights — a feature of Azure Monitor — provides deep visibility into cluster health, node performance, pod status, and container resource utilization. It collects metrics and logs from the Kubernetes control plane, nodes, and containers automatically.

The integration between Azure Monitor and AKS is seamless. Enabling Container Insights during cluster creation deploys monitoring agents automatically. Prometheus metrics collection, Grafana dashboards, and log analytics are available as managed services, eliminating the need to self-host and maintain the monitoring stack that Kubernetes typically demands.

For customers, this means full-stack observability from day one. Infrastructure metrics, Kubernetes events, application traces, and business metrics flow into a single platform. KQL queries can correlate a Kubernetes pod restart with application errors and infrastructure metrics in a single query — a capability that typically requires stitching together Prometheus, Grafana, Jaeger, and ELK in self-managed environments.

#### Competitive Advantage

| Feature | Azure (Monitor + Container Insights) | AWS (CloudWatch Container Insights) | GCP (Cloud Monitoring + GKE Monitoring) |
|---------|--------------------------------------|-------------------------------------|----------------------------------------|
| Managed Prometheus | Azure Monitor Managed Prometheus | Amazon Managed Prometheus (AMP) | Google Cloud Managed Prometheus |
| Managed Grafana | Azure Managed Grafana | Amazon Managed Grafana (AMG) | No native managed Grafana |
| Log query language | KQL (rich, SQL-like) | CloudWatch Logs Insights (basic) | Cloud Logging filters |
| Kubernetes-specific views | Live container logs, pod health maps | Basic container metrics | GKE Dashboard (comprehensive) |
| Cost optimization tools | Container Insights cost analysis | Kubecost integration available | GKE cost allocation |
| Alert integration | Action groups (email, SMS, webhooks, ITSM) | SNS + Lambda | Notification channels |

Azure's managed Prometheus + managed Grafana combination provides a fully managed, cloud-native monitoring stack that Kubernetes teams expect — without the operational burden. All three clouds now offer managed Prometheus, but Azure's integration with KQL and Log Analytics provides a unique dual-query capability: teams can use PromQL for Kubernetes-native queries and KQL for cross-service correlation.

GKE's monitoring experience is also strong, with deep integration into Google Cloud Operations Suite. The differentiator for Azure is the breadth of the platform — Azure Monitor covers not just containers but every Azure service, enabling teams to trace a request from an API Management gateway through AKS to Cosmos DB in a single observability platform.

#### Common Use Cases

- **Cluster health monitoring** — Tracking node CPU/memory utilization, pod status, and container restarts with proactive alerting on resource exhaustion.
- **Application performance management** — Correlating application traces with infrastructure metrics to identify performance bottlenecks in microservices.
- **Cost visibility** — Analyzing container resource requests vs. actual usage to identify over-provisioned workloads and optimize node pool sizing.
- **Incident response** — Using KQL to query logs across all microservices simultaneously during outages, with action groups routing alerts to on-call teams.
- **Compliance and audit** — Retaining Kubernetes audit logs, container access logs, and API server logs for regulatory requirements.

---

## Why This Architecture?

The microservices-on-AKS architecture represents Azure's most comprehensive offering for teams building distributed systems. AKS provides the orchestration layer, Service Bus enables reliable asynchronous communication, and the combination of Cosmos DB and Redis Cache delivers a data tier that handles both persistent storage and high-speed caching. Container Registry completes the deployment pipeline, and Azure Monitor ties everything together with unified observability.

What distinguishes this architecture is the degree of managed integration. AKS pulls images from ACR using managed identity — no secrets to rotate. Service Bus integrates with KEDA for event-driven autoscaling of Kubernetes pods. Cosmos DB's change feed triggers real-time processing pipelines. Redis Cache provides the session affinity that stateless microservices require. Each service connects to the others through Azure-native mechanisms rather than generic glue code.

For demo purposes, this architecture showcases Azure's ability to handle complexity. Microservices are inherently complex, and the value proposition is that Azure's managed services absorb that complexity. The customer focuses on business logic in their containers while Azure handles networking, messaging, data replication, caching, and monitoring. The alternative — self-managing Kafka, Redis, Prometheus, and a container registry on Kubernetes — requires a dedicated platform team. Azure makes that team optional.
