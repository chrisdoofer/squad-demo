# Static Web App — Demo Guide

> This demo deploys a static frontend application on Azure Static Web Apps with integrated serverless API functions and Cosmos DB for data persistence, delivering a complete full-stack application with zero server management.

## Component Breakdown

### Azure Static Web Apps

#### Customer Value

Azure Static Web Apps is a purpose-built hosting service for modern frontend applications — React, Angular, Vue, Svelte, Blazor WASM, or any framework that produces static output. It combines static content hosting, integrated serverless API backends, built-in authentication, and automated CI/CD into a single, streamlined service. The Free tier includes custom domains, SSL certificates, and global CDN distribution at no cost.

The CI/CD integration is a defining feature. Connecting a GitHub or Azure DevOps repository triggers automatic build and deployment on every push. Pull requests generate unique staging environments with their own URLs, enabling reviewers to test changes in a production-like setting before merging. When the PR is closed, the staging environment is automatically torn down. This workflow is built into the service — no pipeline configuration required.

For customers, Static Web Apps eliminates the "infrastructure for a frontend" problem. Traditional static hosting requires configuring a CDN, storage account, SSL certificate, CI/CD pipeline, and authentication middleware — each as a separate service. Static Web Apps collapses this into a single resource with a single configuration file (`staticwebapp.config.json`), reducing the time from repository to production URL to minutes.

#### Competitive Advantage

| Feature | Azure (Static Web Apps) | AWS (Amplify Hosting) | GCP (Firebase Hosting) |
|---------|------------------------|----------------------|----------------------|
| Integrated API | Managed Functions (built-in) or linked Function App | Amplify Functions (Lambda-backed) | Cloud Functions integration |
| PR staging environments | Automatic per-PR environments | Preview branches | Preview channels |
| Built-in auth | Entra ID, GitHub, Twitter, custom OpenID Connect | Cognito integration | Firebase Auth |
| Free tier | Custom domain, SSL, 100 GB bandwidth/month | 1,000 build minutes, 5 GB storage | 10 GB storage, 360 MB/day bandwidth |
| Enterprise features | Private endpoints, Entra ID auth, linked backends | Amplify Gen 2 (backend integration) | Firebase App Check |
| Global distribution | Automatic CDN (100+ edge locations) | CloudFront CDN | Global CDN |
| Config-as-code | `staticwebapp.config.json` (routing, auth, headers) | `amplify.yml` + console config | `firebase.json` |
| Framework support | Auto-detects React, Angular, Vue, Svelte, Blazor, etc. | Auto-detects major frameworks | Auto-detects major frameworks |

Azure Static Web Apps' integrated API support is uniquely streamlined. API functions live in the same repository as the frontend, are deployed together, and share the same authentication context — the user identity from the frontend is automatically available in the API. AWS Amplify offers similar integration through Lambda, and Firebase provides Cloud Functions, but Azure's approach with managed Functions is more tightly coupled and requires less configuration.

The Free tier is notably generous. Custom domains, managed SSL, global CDN, and 100 GB of bandwidth per month at no cost make it one of the best free hosting options for frontend applications. Firebase Hosting's free tier has a much lower daily bandwidth limit (360 MB), and while Amplify's free tier is competitive, it limits build minutes rather than bandwidth.

#### Common Use Cases

- **Single-page applications (SPAs)** — React, Angular, or Vue applications with client-side routing, API integration, and authentication.
- **Documentation sites** — Static site generators (Docusaurus, VuePress, Hugo) with automatic deployment from Git repositories.
- **Progressive web apps (PWAs)** — Offline-capable web applications with service workers, served from a global CDN for fast load times.
- **Marketing and landing pages** — Fast, globally distributed static pages with forms backed by integrated serverless functions.
- **Jamstack applications** — Headless CMS frontends (with Contentful, Sanity, or Strapi) that rebuild and deploy on content changes via webhooks.

---

### Azure Functions

#### Customer Value

In the Static Web Apps architecture, Azure Functions serves as the API backend that complements the static frontend. Functions can be managed directly within the Static Web Apps service (managed functions) or linked as a separate Function App for more control. This creates a full-stack application where the frontend and API share a deployment lifecycle, authentication context, and domain.

Managed Functions within Static Web Apps are the simplest option — they are deployed from an `api/` folder in the same repository as the frontend. There is no separate Function App to create or manage. The Static Web Apps service handles provisioning, scaling, and routing API requests to the functions. For applications that need more advanced capabilities (Durable Functions, custom runtime configuration, VNet integration), a linked Function App provides full flexibility while maintaining the unified domain and auth experience.

For customers, this means building a full-stack web application with a single deployment. The frontend makes API calls to `/api/...` paths, which are routed to Functions automatically. Authentication tokens from the frontend are forwarded to the API, so the function code can access user identity without implementing its own auth flow. This unified model reduces development time and eliminates common integration mistakes.

#### Competitive Advantage

| Feature | Azure (Functions in SWA) | AWS (Amplify + Lambda) | GCP (Firebase + Cloud Functions) |
|---------|--------------------------|------------------------|----------------------------------|
| Deployment model | Same repo, `api/` folder | Amplify Gen 2 backend definition | `functions/` directory |
| Auth integration | Automatic user identity forwarding | Cognito token available | Firebase Auth token available |
| Managed vs. linked | Both options available | Lambda-backed only | Cloud Functions-backed only |
| Cold start | Managed Functions auto-scale (some cold start) | Lambda cold start applies | Cloud Functions cold start applies |
| Language support | JavaScript, TypeScript, C#, Python, Java | JavaScript, TypeScript, Python | JavaScript, TypeScript, Python |
| Local development | SWA CLI (full local emulation) | Amplify sandbox | Firebase Emulator Suite |

The SWA CLI provides a unified local development experience that emulates the entire Static Web Apps environment — frontend, API, authentication, and routing — on a developer's machine. This means the full application stack can be tested locally before pushing to the cloud. Firebase's Emulator Suite offers comparable local development, while AWS Amplify's local development story has improved with Gen 2 but is less mature.

The option to link an existing Function App (rather than only using managed functions) gives Azure Static Web Apps an architectural flexibility advantage. Applications can start with simple managed functions and later migrate to a full Function App when they need features like Durable Functions, custom middleware, or premium hosting plans — without changing the frontend code or URL structure.

#### Common Use Cases

- **CRUD API backends** — Creating, reading, updating, and deleting data in Cosmos DB or other data stores, triggered by frontend HTTP requests.
- **Form processing** — Handling contact forms, survey submissions, and user registrations with server-side validation and data storage.
- **Third-party integrations** — Proxying requests to external APIs that require server-side secrets (API keys, OAuth tokens) that cannot be exposed in frontend code.
- **Authentication middleware** — Custom authentication logic, role assignment, and authorization checks that augment Static Web Apps' built-in auth providers.
- **Server-side rendering (SSR) supplements** — Generating dynamic content (OG tags, sitemaps, RSS feeds) that cannot be handled by client-side rendering alone.

---

### Cosmos DB

#### Customer Value

Cosmos DB completes the Static Web Apps stack by providing a globally distributed, serverless-compatible database that matches the scaling characteristics of the rest of the architecture. In serverless mode, Cosmos DB charges per request unit consumed and scales to zero during idle periods — mirroring the cost model of Static Web Apps and Azure Functions.

For static web applications, Cosmos DB's flexible JSON document model is a natural fit. Frontend applications already work with JSON, and Cosmos DB stores and queries JSON documents natively. There is no object-relational mapping layer, no schema migration process, and no impedance mismatch between the API and the database. Documents can have different shapes within the same container, accommodating the evolving data models that are common in early-stage applications.

Customers get a database that grows with their application. A hobby project might use Cosmos DB serverless with minimal traffic and near-zero cost. As the application gains users, the same database handles millions of requests per second with guaranteed sub-10ms latency. The partition key strategy and automatic indexing ensure performance remains consistent regardless of data volume.

#### Competitive Advantage

| Feature | Azure (Cosmos DB) | AWS (DynamoDB) | GCP (Firestore) |
|---------|-------------------|----------------|-----------------|
| Frontend SDK | JavaScript SDK + REST API | AWS SDK / Amplify DataStore | Firebase SDK (real-time) |
| Serverless mode | Request-unit billing, scales to zero | On-demand billing | Always-on (consumption-based) |
| Real-time sync | Change feed (requires custom implementation) | AppSync (separate service) | Real-time listeners (native) |
| Offline support | Not built-in (requires custom) | Amplify DataStore (offline-first) | Firebase offline persistence |
| Query language | SQL-like syntax for JSON | PartiQL / key-value API | Collection/document API |
| Free tier | 1,000 RU/s + 25 GB (permanent) | 25 GB + 25 read/write CU | Generous free quotas |

For static web app architectures specifically, GCP's Firestore has a notable advantage in real-time synchronization. Firestore's real-time listeners push data changes to connected clients automatically — a feature that is native to the SDK and deeply integrated with Firebase Hosting. Cosmos DB's change feed provides similar capabilities but requires additional implementation (SignalR, WebSockets) to push updates to frontends.

Where Cosmos DB excels in this architecture is query flexibility and performance guarantees. The SQL-like query language makes complex queries straightforward — filtering, sorting, aggregation, and joins across document properties are first-class operations. DynamoDB's query model is more constrained (primary key + sort key access patterns), and Firestore requires composite indexes for complex queries. For applications with diverse or evolving query patterns, Cosmos DB provides more flexibility.

The permanent free tier (1,000 RU/s and 25 GB) is also significant for the static web app use case. Combined with the Static Web Apps Free tier and managed Functions, customers can run a complete full-stack application with database at zero monthly cost — making it an ideal platform for prototypes, personal projects, and proof-of-concept deployments.

#### Common Use Cases

- **User-generated content** — Storing blog posts, comments, reviews, and social content with flexible schemas and automatic indexing.
- **Application configuration** — Storing feature flags, settings, and per-tenant configuration with low-latency reads.
- **E-commerce product data** — Catalog information with varied attributes per product category, queried by multiple fields.
- **User profiles and preferences** — Personal settings, saved items, and activity history with session consistency for immediate read-after-write.
- **Multi-tenant SaaS data** — Using partition keys for tenant isolation with Cosmos DB's built-in throughput and storage scaling.

---

## Why This Architecture?

The Static Web Apps architecture is Azure's most accessible full-stack offering. It combines a globally distributed frontend, a serverless API backend, and a flexible database into a stack that can be deployed from a single Git repository with zero infrastructure configuration. The entire architecture can run on free tiers, making it the lowest-barrier entry point to Azure for web developers.

What makes this architecture compelling is its growth path. A project starts on the Free tier with managed functions and Cosmos DB serverless. As traffic grows, the Standard tier adds more bandwidth, staging slots, and linked Function Apps. Cosmos DB scales from serverless to provisioned throughput. At no point does the architecture need to be re-platformed — it evolves in place from a side project to a production application.

For demos, this architecture resonates with frontend developers and startup teams who want to build full-stack applications without becoming infrastructure experts. The deployment workflow — push to GitHub, wait for the build, get a URL — is familiar and immediate. The integrated authentication removes the most complex part of web development. And the cost model — pay nothing until you have real traffic — removes the financial risk of experimenting with Azure. This is the architecture that turns developers into Azure customers.
