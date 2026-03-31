# Basic Web App — Demo Guide

> This demo deploys a secure, monitored web application on Azure App Service backed by Azure SQL Database, with identity management via Entra ID and full observability through Application Insights and Azure Monitor.

## Component Breakdown

### App Service

#### Customer Value

Azure App Service is a fully managed platform for building, deploying, and scaling web applications. It eliminates the need to manage underlying infrastructure — no patching servers, configuring load balancers, or tuning OS settings. Developers push code and App Service handles the rest, including automatic scaling, SSL termination, and deployment slots for zero-downtime releases.

App Service supports multiple language runtimes (.NET, Java, Node.js, Python, PHP) and integrates natively with CI/CD pipelines, making it an ideal choice for teams that want to ship features faster without hiring dedicated platform engineers. Built-in authentication, custom domains, and managed certificates reduce time-to-production significantly.

For customers, this translates directly into lower operational costs and faster iteration cycles. Teams spend less time on infrastructure tickets and more time building the features that differentiate their product.

#### Competitive Advantage

| Feature | Azure (App Service) | AWS (Elastic Beanstalk / App Runner) | GCP (App Engine / Cloud Run) |
|---------|---------------------|--------------------------------------|------------------------------|
| Deployment slots | Native blue/green slots with traffic splitting | Requires manual environment swaps | Traffic splitting available in App Engine Flex |
| Built-in auth | Easy Auth with Entra ID, social providers | Requires custom integration with Cognito | Identity-Aware Proxy (more complex setup) |
| Managed certificates | Free App Service Managed Certificates | ACM is free but requires ALB/CloudFront | Managed SSL via Google-managed certs |
| OS choice | Windows and Linux | Linux-focused (Beanstalk supports Windows) | Linux only for most services |
| WebJobs / background tasks | Native WebJobs alongside the app | Requires separate worker environment | Requires separate Cloud Tasks / Cloud Run jobs |
| Pricing model | Per-plan (shared across apps) | Per-environment | Per-instance or per-request |

Azure App Service's deployment slot system is genuinely best-in-class. The ability to create a staging slot, validate it with production traffic via percentage-based routing, and then swap atomically is built into the platform — no extra services or configuration required. AWS Elastic Beanstalk requires environment cloning and DNS swaps, which is slower and riskier.

App Service's pricing model also stands out: a single App Service Plan can host multiple applications, making it cost-effective for organizations running several small-to-medium workloads. AWS and GCP charge per-environment or per-instance, which can add up quickly when managing multiple services.

#### Common Use Cases

- **Line-of-business web applications** — Internal tools like HR portals, expense trackers, and reporting dashboards that need quick deployment with enterprise-grade auth.
- **Customer-facing web portals** — SaaS product frontends that need custom domains, SSL, autoscaling, and zero-downtime deployments.
- **API backends** — RESTful or GraphQL APIs powering mobile and web clients, often deployed alongside a frontend in the same App Service Plan.
- **WordPress / CMS hosting** — Running content management systems with managed infrastructure, including MySQL or SQL Database backends.
- **Migration landing zone** — Lift-and-shift of existing .NET or Java applications from on-premises IIS or Tomcat servers to the cloud with minimal code changes.

---

### Azure SQL Database

#### Customer Value

Azure SQL Database is a fully managed relational database engine built on the SQL Server engine. It delivers enterprise-grade performance, security, and availability without the operational burden of patching, backups, or high-availability configuration. Automatic tuning, intelligent query processing, and built-in threat detection make it a "set and forget" database for most workloads.

For customers already invested in the SQL Server ecosystem, the migration path is seamless — existing T-SQL code, stored procedures, and tooling (SSMS, Azure Data Studio) work as-is. This eliminates retraining costs and preserves years of institutional knowledge embedded in existing database code.

The elastic pool model allows multiple databases to share resources, making Azure SQL Database particularly cost-effective for SaaS providers managing per-tenant databases. Combined with geo-replication and automatic failover groups, it provides a global data tier without requiring a dedicated DBA team.

#### Competitive Advantage

| Feature | Azure (SQL Database) | AWS (RDS for SQL Server / Aurora) | GCP (Cloud SQL for SQL Server) |
|---------|----------------------|-----------------------------------|-------------------------------|
| Built-in intelligence | Automatic tuning, query performance insights | Performance Insights (less automated) | Query insights (basic) |
| Serverless tier | Auto-pause with per-second billing | No equivalent for RDS SQL Server | No equivalent |
| Elastic pools | Native multi-database resource sharing | Not available for RDS SQL Server | Not available |
| Hyperscale tier | Up to 100 TB, instant snapshots | Aurora scales to 128 TB (MySQL/PostgreSQL only) | Up to 64 TB |
| Ledger tables | Built-in tamper-evident tables | No native equivalent | No native equivalent |
| SQL Server compatibility | Full engine compatibility | Full engine (but fewer managed features) | Limited version support |

Azure SQL Database's serverless tier is a genuine differentiator. Databases automatically pause during inactivity and resume on the first connection, with per-second billing. This is transformative for dev/test environments and intermittent workloads — customers report 50-70% cost savings compared to provisioned tiers. Neither AWS RDS nor GCP Cloud SQL offer an equivalent auto-pause capability for SQL Server workloads.

The Hyperscale tier also deserves attention: near-instant database snapshots regardless of size, rapid scale-up/down of compute, and up to 100 TB of storage make it competitive with purpose-built cloud databases while retaining full SQL Server compatibility.

#### Common Use Cases

- **SaaS multi-tenant databases** — Using elastic pools to manage per-tenant databases with shared resources and predictable costs.
- **Enterprise transactional systems** — ERP, CRM, and order management systems that rely on ACID transactions and complex stored procedures.
- **Reporting and analytics** — Read replicas and columnstore indexes for analytical queries alongside transactional workloads.
- **Compliance-sensitive applications** — Healthcare, financial, and government workloads leveraging built-in encryption, auditing, and ledger tables.

---

### Entra ID

#### Customer Value

Microsoft Entra ID (formerly Azure Active Directory) is the identity backbone for Azure and Microsoft 365. It provides single sign-on (SSO), multi-factor authentication (MFA), conditional access policies, and identity governance out of the box. For organizations already using Microsoft 365, Entra ID is already provisioned — adding application authentication is incremental, not net-new.

Entra ID eliminates the need to build custom authentication systems. Developers integrate with industry-standard protocols (OAuth 2.0, OpenID Connect, SAML) via well-maintained SDKs (MSAL), and identity management — user provisioning, group management, password policies — is handled centrally by IT. This separation of concerns reduces security risk and development overhead simultaneously.

For customers, the value is both security and productivity. Employees use one identity across all applications, reducing password fatigue and help desk tickets. Conditional access policies enforce security posture (require MFA from untrusted networks, block legacy protocols) without degrading the user experience for compliant devices.

#### Competitive Advantage

| Feature | Azure (Entra ID) | AWS (IAM Identity Center / Cognito) | GCP (Cloud Identity / Firebase Auth) |
|---------|-------------------|-------------------------------------|--------------------------------------|
| Enterprise SSO | 3,000+ pre-built app integrations | ~300 integrations in IAM Identity Center | ~20 SAML apps in Cloud Identity |
| Conditional Access | Rich policy engine (device, location, risk) | Limited (requires custom Lambda authorizers) | Context-aware access (BeyondCorp) |
| B2C identity | Entra External ID (custom flows) | Cognito User Pools | Firebase Auth |
| M365 integration | Native (same directory) | Not applicable | Google Workspace integration |
| Governance | Access reviews, PIM, entitlement mgmt | Basic access management | Basic role management |
| Device management | Intune integration for MDM/MAM | No native equivalent | Endpoint management via Workspace |

Entra ID's greatest competitive advantage is its ubiquity in enterprise environments. With over 700 million monthly active users, most enterprise customers already have an Entra ID tenant through Microsoft 365. Adding application authentication becomes a configuration task rather than an infrastructure project. AWS Cognito and GCP Firebase Auth are capable B2C identity solutions, but neither matches Entra ID's depth in enterprise B2E scenarios.

The conditional access engine is another area where Azure leads. Policies can incorporate device compliance state (via Intune), sign-in risk scores (via Identity Protection), and application sensitivity to make nuanced access decisions. GCP's BeyondCorp approach is conceptually similar but requires more manual configuration.

#### Common Use Cases

- **Enterprise single sign-on** — Employees authenticate once and access all internal and SaaS applications without re-entering credentials.
- **Customer-facing identity (B2C)** — Self-service registration, social login, and progressive profiling for consumer-facing applications using Entra External ID.
- **Zero Trust access control** — Conditional access policies that enforce MFA, device compliance, and location restrictions before granting access to sensitive applications.
- **Partner and vendor collaboration** — B2B guest access allowing external users to access specific resources using their own organizational identities.
- **Privileged identity management** — Just-in-time elevation of administrative roles with approval workflows and audit trails.

---

### Application Insights

#### Customer Value

Application Insights is an application performance management (APM) service that provides deep visibility into application behavior. It automatically collects request rates, response times, failure rates, dependency calls, and exceptions — with no code changes required for many frameworks. Smart detection algorithms proactively alert on anomalies before users report problems.

The distributed tracing capability is particularly valuable for modern applications. Every request is tracked end-to-end across services, databases, and external APIs, making it possible to pinpoint exactly where latency or errors originate. The Application Map visualizes service dependencies and highlights problem areas, turning hours of log-diving into minutes of targeted investigation.

For customers, Application Insights transforms observability from reactive to proactive. Instead of waiting for support tickets to discover issues, teams see performance degradation and failure patterns in real time. The result is higher availability, faster incident resolution, and better user experience.

#### Competitive Advantage

| Feature | Azure (Application Insights) | AWS (X-Ray + CloudWatch) | GCP (Cloud Trace + Cloud Monitoring) |
|---------|------------------------------|--------------------------|--------------------------------------|
| Auto-instrumentation | Codeless agents for .NET, Java, Node.js, Python | X-Ray SDK requires code changes | Requires OpenTelemetry setup |
| Live metrics | Real-time stream with <1s latency | CloudWatch has 1-minute granularity | Near real-time (seconds delay) |
| Smart detection | ML-based anomaly detection built-in | CloudWatch Anomaly Detection (separate) | No native equivalent |
| Application Map | Auto-generated dependency visualization | X-Ray Service Map | Trace overview (less detailed) |
| Snapshot debugger | Production debugging without stopping app | No equivalent | No equivalent |
| Availability tests | Built-in URL ping and multi-step web tests | Requires CloudWatch Synthetics (extra cost) | Uptime checks (basic) |

Application Insights' snapshot debugger is unique in the market. When an exception occurs in production, it captures a snapshot of local variables and call stack at the point of failure — without any performance impact or service interruption. Developers can debug production issues using familiar Visual Studio tooling. Neither AWS X-Ray nor GCP Cloud Trace offer anything comparable.

The live metrics stream is another differentiator, delivering sub-second telemetry for active monitoring during deployments or incident response. AWS CloudWatch's standard metrics have a one-minute minimum granularity, which is too coarse for real-time diagnosis.

#### Common Use Cases

- **Production performance monitoring** — Tracking response times, throughput, and error rates across all application endpoints with automatic alerting on degradation.
- **Deployment validation** — Monitoring live metrics during and after deployments to catch regressions immediately and trigger rollback if needed.
- **Dependency failure diagnosis** — Identifying which downstream service (database, API, cache) is causing slowdowns using distributed tracing and the Application Map.
- **User behavior analytics** — Tracking custom events and page views to understand user flows, feature adoption, and conversion funnels.

---

### Azure Monitor

#### Customer Value

Azure Monitor is the unified observability platform for all Azure resources. It collects metrics, logs, and traces from every layer of the stack — infrastructure, platform, and application — and provides a single pane of glass for analysis, alerting, and automation. Every Azure resource emits metrics and diagnostic logs into Monitor by default, requiring zero instrumentation effort.

The platform's strength lies in its breadth and integration. Log Analytics workspaces centralize data from dozens of sources, and the Kusto Query Language (KQL) provides a powerful, expressive way to analyze that data. Workbooks create interactive dashboards, action groups route alerts to the right teams, and autoscale rules respond to metric thresholds automatically.

For customers, Azure Monitor eliminates the need to stitch together multiple observability tools. Infrastructure metrics, application traces (via Application Insights), security events, and cost signals all flow into one platform, reducing tool sprawl and enabling cross-cutting analysis that would be difficult with siloed tools.

#### Competitive Advantage

| Feature | Azure (Monitor) | AWS (CloudWatch) | GCP (Cloud Monitoring / Operations Suite) |
|---------|-----------------|-------------------|------------------------------------------|
| Query language | KQL (rich, SQL-like) | CloudWatch Logs Insights (limited) | MQL (Monitoring Query Language) |
| Unified platform | Metrics + Logs + Traces in one service | Separate services (CloudWatch, X-Ray, CloudTrail) | Partially unified Operations Suite |
| Workbooks | Interactive, parameterized dashboards | CloudWatch Dashboards (less interactive) | Custom dashboards (basic) |
| Autoscale | Native metric-based autoscale rules | Auto Scaling (separate service) | Autoscaler (separate) |
| Data retention | Up to 2 years (interactive), 12 years (archive) | 15 months standard, S3 export for longer | 400 days for metrics, logs configurable |
| Azure integrations | First-party integration with 200+ services | Deep AWS integration | Deep GCP integration |

Azure Monitor's KQL is widely regarded as the most expressive observability query language available. It supports time series analysis, joins, machine learning functions, and rendering — all within a single query. CloudWatch Logs Insights is functional but limited in comparison, particularly for complex analytical queries across multiple data sources.

The unified nature of Azure Monitor is a genuine architectural advantage. In AWS, customers must navigate between CloudWatch (metrics and logs), X-Ray (traces), CloudTrail (audit), and various service-specific monitoring tools. Azure Monitor consolidates these into a single platform with consistent APIs and a shared query language.

#### Common Use Cases

- **Infrastructure health monitoring** — Tracking CPU, memory, disk, and network metrics across VMs, databases, and platform services with automated alerting.
- **Centralized log analytics** — Aggregating logs from applications, infrastructure, and security systems into Log Analytics for unified querying and compliance reporting.
- **Autoscaling** — Configuring metric-based autoscale rules to respond to traffic spikes and reduce costs during low-demand periods.
- **Incident response** — Using alerts, action groups, and integration with ITSM tools (ServiceNow, PagerDuty) to streamline incident detection and response workflows.
- **Compliance and auditing** — Retaining diagnostic logs for extended periods and generating audit reports for regulatory requirements.

---

## Why This Architecture?

The basic web app architecture brings together Azure's most mature and battle-tested services into a cohesive, production-ready stack. App Service handles compute and deployment, Azure SQL Database provides a reliable relational data tier, and Entra ID delivers enterprise-grade identity — all with minimal operational overhead. This is not a toy demo; this is the architecture that thousands of production applications run on today.

The observability layer is equally important. Application Insights provides deep application-level telemetry while Azure Monitor covers infrastructure and platform metrics. Together, they ensure that the team deploying this architecture has full visibility from the first request. Smart detection catches issues proactively, and the unified KQL-based query experience means a single skill set covers all diagnostic scenarios.

What makes this architecture compelling for demos is its completeness. It covers the full lifecycle — deploy, secure, monitor — using services that integrate natively. Entra ID authentication flows directly into Application Insights telemetry. Azure SQL Database metrics appear in Azure Monitor without configuration. App Service deployment slots pair with Application Insights to validate releases. Every service reinforces the others, demonstrating Azure's integrated platform advantage.
