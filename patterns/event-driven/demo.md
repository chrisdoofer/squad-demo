# Event-Driven Architecture — Demo Guide

> This demo deploys a fully serverless, event-driven processing pipeline on Azure using Event Grid for routing, Azure Functions for compute, Service Bus for reliable messaging, Storage Accounts for durable state, and Application Insights for end-to-end observability.

## Component Breakdown

### Event Grid

#### Customer Value
Azure Event Grid is a fully managed event-routing service that enables reactive, event-driven programming at massive scale. It provides near-real-time event delivery with a pay-per-event pricing model, meaning customers only pay for the events they actually process — no idle infrastructure costs.

Event Grid natively integrates with over 20 Azure services as event sources, eliminating the need to build custom polling logic or webhook infrastructure. Customers can react to resource changes (blob created, resource group modified, IoT device telemetry) within seconds, enabling highly responsive architectures.

For enterprises, Event Grid provides built-in dead-lettering, retry policies with exponential backoff, and event filtering at the subscription level. This means downstream consumers only receive the events they care about, reducing compute waste and simplifying handler logic.

#### Competitive Advantage
| Feature | Azure (Event Grid) | AWS (EventBridge) | GCP (Eventarc) |
|---------|-------------------|-------------------|----------------|
| Native Azure source integrations | 20+ first-party sources | 30+ AWS sources | 15+ Google Cloud sources |
| Custom event support | Custom topics with schema validation | Custom event buses | Custom channels |
| Pricing model | Per-event ($0.60/million) | Per-event ($1.00/million) | Free tier + Pub/Sub pricing |
| Event filtering | Advanced subject/property filtering | Content-based filtering rules | CEL-based filtering |
| Delivery guarantee | At-least-once with 24hr retry | At-least-once with configurable retry | At-least-once via Pub/Sub |
| Schema validation | Native Event Grid Schema + CloudEvents | Schema Registry integration | CloudEvents support |
| Max event size | 1 MB (Cloud Events) | 256 KB | Depends on Pub/Sub (10 MB) |

Azure Event Grid's strongest advantage is its deep, zero-configuration integration with the Azure ecosystem. When a blob is uploaded to Storage, Event Grid can route that event to a Function within milliseconds without any polling or custom connectors. AWS EventBridge offers broader third-party SaaS integrations, while GCP Eventarc is newer and more tightly coupled to Cloud Run.

Event Grid's pricing is notably competitive at $0.60 per million events compared to EventBridge's $1.00 per million. For high-throughput scenarios processing billions of events monthly, this cost difference becomes significant. Event Grid also supports CloudEvents natively, promoting portability and standards compliance.

#### Common Use Cases
- **Real-time file processing** — Trigger image resizing, virus scanning, or ETL pipelines automatically when files land in Blob Storage.
- **Infrastructure automation** — React to Azure Resource Manager events to enforce compliance, tag resources, or trigger approval workflows when resources are provisioned.
- **IoT event routing** — Fan out device telemetry events from IoT Hub to multiple downstream consumers (analytics, alerting, storage) without coupling producers to consumers.
- **Microservice choreography** — Decouple microservices by publishing domain events through Event Grid topics, allowing services to evolve independently.

---

### Azure Functions

#### Customer Value
Azure Functions is a serverless compute platform that lets developers run code in response to events without provisioning or managing infrastructure. Functions scale automatically from zero to thousands of concurrent executions, and customers pay only for the compute time consumed — measured in gigabyte-seconds.

The platform supports multiple programming languages (C#, JavaScript/TypeScript, Python, Java, PowerShell, Go) and offers a rich set of input/output bindings that eliminate boilerplate code for connecting to databases, queues, and other services. A developer can write a function that reads from Service Bus, processes data, and writes to Cosmos DB — all with declarative bindings and no SDK plumbing.

Azure Functions integrates with Azure DevOps and GitHub Actions for CI/CD, supports local development with the Functions Core Tools, and offers both Consumption (pay-per-execution) and Premium (pre-warmed instances) plans. This flexibility lets customers start with zero cost during development and scale to enterprise-grade workloads without re-architecting.

#### Competitive Advantage
| Feature | Azure (Functions) | AWS (Lambda) | GCP (Cloud Functions) |
|---------|-------------------|--------------|----------------------|
| Max execution timeout | 10 min (Consumption) / unlimited (Premium) | 15 min | 9 min (1st gen) / 60 min (2nd gen) |
| Language support | C#, JS/TS, Python, Java, PowerShell, Go | Most major languages + custom runtimes | Node.js, Python, Go, Java, .NET, Ruby, PHP |
| Declarative bindings | 30+ input/output bindings | Manual SDK integration | Limited (Eventarc triggers) |
| Durable workflows | Durable Functions (built-in) | Step Functions (separate service) | Workflows (separate service) |
| Local development | Full local runtime emulator | SAM local (limited) | Functions Framework |
| Cold start mitigation | Premium plan (pre-warmed) | Provisioned Concurrency | Min instances (2nd gen) |
| VNET integration | Native VNET integration | VPC integration | VPC connectors |

Azure Functions' unique differentiator is Durable Functions — an extension that enables writing stateful, long-running orchestrations as code. While AWS requires a separate Step Functions service with a JSON state machine definition, Azure developers can express complex workflows (fan-out/fan-in, human interaction, chaining) in their preferred programming language. This dramatically reduces the learning curve and keeps orchestration logic alongside business logic.

The declarative binding model is another key strength. Where AWS Lambda developers must write explicit SDK code to read from SQS or write to DynamoDB, Azure Functions developers declare bindings in configuration, reducing code volume by 30-50% for integration-heavy scenarios. The local development experience with Azure Functions Core Tools also provides a higher-fidelity local emulation than AWS SAM Local.

#### Common Use Cases
- **Event-driven data processing** — Process messages from Service Bus queues or Event Grid subscriptions to transform, validate, and route data through processing pipelines.
- **Scheduled batch jobs** — Replace expensive always-on VMs running cron jobs with timer-triggered Functions that execute on schedule and scale to zero between runs.
- **API backends** — Build lightweight HTTP APIs with Azure Functions as the compute layer behind API Management, scaling automatically with request volume.
- **Real-time stream processing** — Consume events from Event Hubs or IoT Hub to perform real-time aggregation, anomaly detection, or alerting.
- **Workflow orchestration** — Use Durable Functions to coordinate multi-step business processes like order fulfillment, document approval, or multi-service provisioning.

---

### Service Bus

#### Customer Value
Azure Service Bus is an enterprise-grade messaging service that provides reliable, ordered message delivery between decoupled applications and services. It supports both queue-based (point-to-point) and topic-based (publish/subscribe) messaging patterns, making it suitable for a wide range of integration scenarios.

Service Bus provides advanced features that go beyond simple message queuing: sessions for ordered processing, dead-letter queues for poison message handling, scheduled delivery for time-delayed processing, and transactions for atomic operations across multiple queues. These capabilities make it ideal for mission-critical business workflows where message loss or duplicate processing is unacceptable.

With support for messages up to 100 MB (Premium tier), AMQP 1.0 and HTTP protocols, and native integration with Azure Functions and Logic Apps, Service Bus serves as the backbone for enterprise integration architectures. Premium tier offers dedicated throughput with predictable latency, making it suitable for financial services, healthcare, and other regulated industries.

#### Competitive Advantage
| Feature | Azure (Service Bus) | AWS (SQS/SNS) | GCP (Pub/Sub) |
|---------|---------------------|----------------|----------------|
| Message ordering | Sessions (guaranteed FIFO) | FIFO queues (limited throughput) | Ordering keys |
| Max message size | 100 MB (Premium) | 256 KB (SQS) | 10 MB |
| Pub/Sub | Topics with SQL-like filters | SNS + SQS combination | Native pub/sub |
| Transactions | Cross-entity transactions | Not supported | Not supported |
| Dead-letter queue | Built-in with reason tracking | Separate DLQ configuration | Dead-letter topics |
| Scheduled delivery | Native scheduling | Delay queues (max 15 min) | Not native |
| Duplicate detection | Built-in time window | Manual deduplication | Dataflow deduplication |
| Protocol support | AMQP 1.0, HTTP, WebSocket | HTTP, SQS API | HTTP, gRPC |

Azure Service Bus offers the most complete enterprise messaging feature set among the three cloud providers. The combination of sessions, transactions, and duplicate detection in a single service is unmatched. AWS requires combining SQS (queues) with SNS (pub/sub) to achieve what Service Bus delivers natively, adding architectural complexity and additional service boundaries.

Service Bus's SQL-like subscription filters allow consumers to subscribe to specific message subsets using property-based rules — a capability that is more expressive than SNS filter policies and avoids the need for client-side filtering. GCP Pub/Sub excels at raw throughput for streaming scenarios but lacks the enterprise messaging features (sessions, transactions, scheduled delivery) that Service Bus provides.

#### Common Use Cases
- **Order processing pipelines** — Queue orders for reliable, sequential processing with sessions ensuring per-customer ordering and dead-letter queues catching processing failures.
- **Cross-service communication** — Decouple microservices using topics and subscriptions so that each service processes only the events relevant to its domain.
- **Load leveling** — Buffer incoming requests during traffic spikes, allowing backend systems to process at their own pace without being overwhelmed.
- **Distributed transactions** — Coordinate multi-step business processes that span multiple services, using Service Bus transactions to ensure atomic message operations.

---

### Storage Account

#### Customer Value
Azure Storage Accounts provide a unified, massively scalable storage platform that combines Blob Storage (objects), File Storage (SMB/NFS shares), Queue Storage (simple messaging), and Table Storage (NoSQL key-value) under a single account with consistent management, security, and billing.

For event-driven architectures, Storage Accounts serve dual purposes: as the durable persistence layer for data at rest and as an event source that triggers downstream processing. Every blob upload, delete, or modification can automatically generate events routed through Event Grid, creating seamless integration between storage operations and compute pipelines.

With support for hot, cool, cold, and archive access tiers, customers can optimize storage costs by automatically transitioning data based on access patterns. Lifecycle management policies can move aging data to cheaper tiers or delete it entirely, reducing storage costs by up to 80% compared to keeping all data in the hot tier.

#### Competitive Advantage
| Feature | Azure (Storage Account) | AWS (S3) | GCP (Cloud Storage) |
|---------|------------------------|----------|---------------------|
| Unified storage types | Blob + File + Queue + Table | Separate services (S3, EFS, SQS, DynamoDB) | Separate services (GCS, Filestore) |
| Access tiers | Hot, Cool, Cold, Archive | Standard, IA, Glacier, Deep Archive | Standard, Nearline, Coldline, Archive |
| Redundancy options | LRS, ZRS, GRS, GZRS, RA-GRS, RA-GZRS | Standard, IA, One Zone | Regional, Dual-region, Multi-region |
| Event integration | Native Event Grid events | S3 Event Notifications + EventBridge | Pub/Sub notifications |
| Static website hosting | Built-in | Built-in | Built-in |
| Data Lake integration | HNS (hierarchical namespace) | S3 + Lake Formation | GCS + BigLake |
| Max blob size | 190.7 TB | 5 TB | 5 TB |
| Immutable storage | Legal hold + time-based retention | Object Lock | Retention policies + bucket lock |

Azure Storage's standout advantage is the unified account model — a single Storage Account provides blob, file, queue, and table storage with shared access keys, managed identity support, and consolidated billing. AWS requires separate services (S3, EFS, SQS, DynamoDB) each with their own access management, increasing operational complexity.

The six redundancy options (LRS through RA-GZRS) give Azure customers more granular control over durability and availability trade-offs. The hierarchical namespace (HNS) option transforms a Storage Account into a high-performance Data Lake with directory-level operations, while AWS requires a separate Lake Formation layer on top of S3.

#### Common Use Cases
- **Event source for processing pipelines** — Blob uploads trigger Event Grid events that kick off serverless processing functions for ETL, image processing, or document analysis.
- **Application data persistence** — Store application state, user uploads, configuration files, and logs with automatic geo-redundancy and lifecycle management.
- **Data lake foundation** — Use hierarchical namespace (ADLS Gen2) to build analytics data lakes with directory-level ACLs and high-throughput access patterns.
- **Backup and archival** — Tier infrequently accessed data to cool or archive storage, achieving durable long-term retention at a fraction of hot storage costs.

---

### Application Insights

#### Customer Value
Application Insights is an extensible Application Performance Management (APM) service that provides deep observability into application behavior, performance, and usage. It automatically detects performance anomalies, diagnoses failures, and provides actionable insights through AI-powered analytics — all without requiring code changes for basic instrumentation.

For event-driven architectures, Application Insights provides distributed tracing across Functions, Service Bus, and Event Grid, enabling developers to follow a single event from ingestion through every processing step to completion. This end-to-end visibility is critical for debugging asynchronous, multi-service pipelines where traditional request-response tracing falls short.

Application Insights collects telemetry including requests, dependencies, exceptions, traces, and custom metrics, storing everything in a Log Analytics workspace queryable via Kusto Query Language (KQL). Smart Detection automatically identifies anomalies in failure rates, response times, and dependency performance, proactively alerting teams before users are impacted.

#### Competitive Advantage
| Feature | Azure (Application Insights) | AWS (X-Ray + CloudWatch) | GCP (Cloud Trace + Cloud Monitoring) |
|---------|------------------------------|--------------------------|--------------------------------------|
| Distributed tracing | Built-in (auto-instrumented) | X-Ray (separate SDK) | Cloud Trace (separate service) |
| Log analytics | KQL (powerful query language) | CloudWatch Logs Insights | Cloud Logging (filter expressions) |
| AI-powered anomaly detection | Smart Detection (built-in) | CloudWatch Anomaly Detection | Automated anomaly detection |
| Application map | Auto-generated dependency map | X-Ray service map | Service topology |
| Live metrics | Real-time streaming dashboard | CloudWatch real-time (limited) | Not available |
| Availability tests | URL ping + multi-step tests | CloudWatch Synthetics (Canaries) | Uptime checks |
| Custom events & metrics | Extensive API | Custom metrics via SDK | Custom metrics API |
| Cost model | Per GB ingested | Per trace + per GB logs | Per spans + per GB logs |

Application Insights' key advantage is its unified experience — tracing, logging, metrics, anomaly detection, and availability testing are all part of a single integrated service. AWS requires combining X-Ray (tracing), CloudWatch (metrics/logs), and CloudWatch Synthetics (availability) as separate services with different interfaces and pricing models.

The Live Metrics feature provides a real-time streaming dashboard showing requests, failures, and performance counters with sub-second latency — invaluable for monitoring deployments and live debugging. KQL provides significantly more analytical power than CloudWatch Logs Insights, supporting complex joins, time-series analysis, and statistical functions that enable deep root-cause analysis.

#### Common Use Cases
- **Event pipeline observability** — Trace events end-to-end through Event Grid, Service Bus, and Functions to identify bottlenecks, failures, and latency hotspots in asynchronous processing pipelines.
- **Proactive anomaly detection** — Smart Detection automatically identifies unusual patterns in failure rates, dependency latency, or processing throughput, alerting teams before degradation impacts end users.
- **Performance optimization** — Analyze Function execution times, dependency call durations, and resource utilization to identify optimization opportunities and right-size compute resources.
- **Custom business telemetry** — Track domain-specific metrics (orders processed, events handled, SLA compliance) alongside infrastructure telemetry for holistic operational dashboards.

---

## Why This Architecture?

Event-driven architecture on Azure combines loosely coupled services into a highly scalable, cost-efficient processing pipeline. Event Grid serves as the intelligent event router, delivering events with sub-second latency to the appropriate consumers. Azure Functions provides elastic, serverless compute that scales from zero to thousands of concurrent executions, ensuring that processing capacity matches event volume at all times.

Service Bus adds enterprise messaging guarantees — ordered delivery, duplicate detection, and transactional processing — for scenarios where at-least-once delivery from Event Grid isn't sufficient. This layered approach lets teams use the right messaging pattern for each use case: Event Grid for high-volume reactive events, Service Bus for critical business workflows requiring guaranteed processing.

Storage Accounts provide the durable persistence layer that both generates events (blob triggers) and stores processing results, while Application Insights ties everything together with distributed tracing across the entire pipeline. This architecture is ideal for organizations that need to process variable workloads cost-effectively, as every component scales independently and charges based on actual usage rather than provisioned capacity.
