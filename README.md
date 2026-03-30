# Internal Developer Platform

An internal platform that lets developers browse Azure reference architecture templates and deploy them to their own Azure subscription or GitHub repository.

## Architecture Overview

The platform is a monorepo with two workspaces:

- **Frontend** (`src/frontend/`) — React + TypeScript + Vite SPA that provides a template catalog browser, deployment wizard, and deployment status dashboard.
- **Backend** (`src/backend/`) — Node.js + Express + TypeScript API that serves the template catalog, orchestrates Azure deployments via the Azure SDK, and scaffolds GitHub repositories via Octokit.

Templates are defined as Bicep files in `templates/bicep/` with matching GitHub Actions workflows in `templates/workflows/`. The catalog metadata lives in `catalog/templates.json`.

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Install Dependencies

```bash
npm install
```

### Run in Development

```bash
# Start the backend API (port 3001)
npm run backend:dev

# Start the frontend dev server (port 3000)
npm run frontend:dev
```

### Run Tests

```bash
npm test
```

### Lint

```bash
npm run lint
```

## Template Catalog

| Template | Category | Complexity | Services |
|----------|----------|------------|----------|
| Basic Web App | Web | Beginner | App Service, SQL Database, Application Insights, Entra ID |
| Baseline Zone-Redundant Web App | Web | Advanced | Application Gateway, WAF, App Service, SQL Database, Key Vault, VNet, Private Link |
| Microservices on AKS | Containers | Advanced | AKS, Container Registry, Service Bus, Cosmos DB, Application Insights, VNet |
| Serverless API | Serverless | Intermediate | Azure Functions, API Management, Cosmos DB, Storage Account, Application Insights |
| Static Web App with API | Web | Beginner | Static Web Apps, Azure Functions, Cosmos DB |
| Hub-Spoke Network | Networking | Advanced | Virtual Network, Azure Firewall, Bastion, VPN Gateway, NSG |

## Tech Stack

- **Frontend:** React, TypeScript, Vite, React Router, Vitest
- **Backend:** Node.js, Express, TypeScript, Jest
- **IaC:** Bicep
- **CI/CD:** GitHub Actions
- **Azure SDK:** @azure/identity, @azure/arm-resources
- **GitHub SDK:** @octokit/rest
- **Package Management:** npm workspaces (monorepo)

## Project Structure

```
├── src/
│   ├── frontend/          # React SPA
│   └── backend/           # Express API
├── templates/
│   ├── bicep/             # Bicep IaC templates
│   └── workflows/         # GitHub Actions workflows
├── catalog/
│   └── templates.json     # Template metadata catalog
├── tests/                 # Test suites
├── infra/                 # Platform infrastructure
└── .github/workflows/     # CI/CD pipelines
```
