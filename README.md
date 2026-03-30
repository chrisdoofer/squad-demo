# Internal Developer Platform

An internal developer platform with a web UI for one-click deployment of standardised Azure infrastructure and GitHub Actions workflow templates.

## Overview

This platform provides a curated catalog of Azure reference architectures (sourced from the [Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/browse/)) as ready-to-deploy Bicep templates with matching CI/CD workflows. Developers can:

- **Browse** a catalog of 6 production-quality Azure reference architectures
- **Deploy to Azure** — deploy Bicep templates directly to their Azure subscription
- **Push to GitHub** — push templates and CI/CD workflows to their GitHub repositories
- **Track deployments** — monitor deployment status in real-time

## Reference Architecture Templates

| Template | Category | Complexity | Key Azure Services |
|----------|----------|------------|-------------------|
| [Basic Web App](https://learn.microsoft.com/en-us/azure/architecture/web-apps/app-service/architectures/basic-web-app) | Web | Beginner | App Service, SQL Database, App Insights |
| [Baseline Zone-Redundant Web App](https://learn.microsoft.com/en-us/azure/architecture/web-apps/app-service/architectures/baseline-zone-redundant) | Web | Advanced | App Gateway + WAF, App Service, SQL DB, Key Vault, VNet, Private Link |
| [Microservices on AKS](https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/containers/aks-microservices/aks-microservices) | Containers | Advanced | AKS, Container Registry, Service Bus, Cosmos DB |
| [Serverless API](https://learn.microsoft.com/en-us/azure/architecture/web-apps/serverless/architectures/web-app) | Serverless | Intermediate | Azure Functions, API Management, Cosmos DB |
| [Static Web App with API](https://learn.microsoft.com/en-us/azure/architecture/guide/web/static-web-apps-content-overview) | Web | Beginner | Static Web Apps, Functions, Cosmos DB |
| [Hub-Spoke Network](https://learn.microsoft.com/en-us/azure/architecture/networking/architecture/hub-spoke) | Networking | Advanced | VNet, Azure Firewall, Bastion, VPN Gateway |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│  (Template Catalog · Deploy Wizard · Status Board)   │
└──────────────────────┬──────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────┐
│              Node.js/Express Backend API             │
│  (Catalog · GitHub Integration · Azure Deployment)   │
└────┬─────────────────┬──────────────────────┬───────┘
     │                 │                      │
     ▼                 ▼                      ▼
┌─────────┐   ┌──────────────┐   ┌───────────────────┐
│ Template │   │  GitHub API  │   │  Azure CLI / SDK  │
│  Store   │   │  (Octokit)   │   │  (Bicep Deploy)   │
└─────────┘   └──────────────┘   └───────────────────┘
```

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Node.js + Express + TypeScript
- **Infrastructure as Code:** Bicep (Azure-native)
- **CI/CD:** GitHub Actions (OIDC authentication)
- **GitHub Integration:** Octokit REST client
- **Azure Integration:** Azure SDK for JavaScript
- **Testing:** Vitest + React Testing Library (frontend), Jest + Supertest (backend), Playwright (E2E)

## Getting Started

### Prerequisites

- Node.js 18+
- Azure CLI with Bicep extension (`az bicep install`)
- Git

### Installation

```bash
git clone <repo-url>
cd Squad-Project
npm install
```

### Development

```bash
# Start backend (port 3001)
npm run backend:dev

# Start frontend (port 5173)
npm run frontend:dev
```

The frontend proxies API requests to the backend via Vite's dev server proxy.

### Testing

```bash
# Run all tests
npm test

# Frontend tests only
npm run test -w src/frontend

# Backend tests only
npm run test -w src/backend

# Validate Bicep templates
az bicep build --file templates/bicep/basic-web-app/main.bicep
```

### Build

```bash
# Build frontend
npm run build -w src/frontend

# Build backend
npm run build -w src/backend
```

## Project Structure

```
├── src/
│   ├── frontend/          # React app (Vite + TypeScript)
│   └── backend/           # Express API (TypeScript)
├── templates/
│   ├── bicep/             # 6 Bicep template directories
│   └── workflows/         # 6 GitHub Actions workflow templates
├── catalog/
│   └── templates.json     # Template catalog metadata
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # API integration tests
│   ├── bicep/             # Bicep validation tests
│   └── e2e/               # Playwright E2E tests
├── .github/workflows/     # CI pipeline + reusable workflows
└── .squad/                # Team configuration
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/templates` | List templates (supports `?category=` and `?search=`) |
| GET | `/api/templates/:id` | Get template details |
| GET | `/api/templates/:id/bicep` | Get raw Bicep content |
| GET | `/api/templates/:id/workflow` | Get raw workflow YAML |
| POST | `/api/deploy/azure` | Deploy to Azure subscription |
| POST | `/api/deploy/github` | Push template to GitHub repo |
| POST | `/api/deploy/validate` | Validate deployment (what-if) |
| GET | `/api/deployments` | List all deployments |
| GET | `/api/deployments/:id` | Get deployment status |

## Deployment

Each template includes a GitHub Actions workflow for CI/CD deployment with:
- OIDC authentication (no stored secrets)
- Bicep lint and what-if validation
- Environment-based promotion (dev → staging → prod)
- Approval gates for staging and production

## License

Internal use only.
