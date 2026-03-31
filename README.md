# Azure Dev Platform — Internal Developer Portal

An internal developer platform with a web UI showcasing Azure architecture patterns from the [Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/browse/).

## Features

- **10 Azure Architecture Patterns** — curated reference architectures with Bicep IaC
- **One-Click Deploy** — deploy any pattern directly to your Azure subscription
- **GitHub Workflows** — infrastructure deploy + app CI/CD starter workflows per pattern
- **Pattern Catalog** — searchable, filterable catalog with descriptions and architecture diagrams

## Patterns Included

| Pattern | Key Azure Services |
|---------|-------------------|
| Basic Web App | App Service, SQL Database, Entra ID |
| Microservices on AKS | AKS, Service Bus, Cosmos DB, Redis |
| Hub-Spoke Network | VNet, Firewall, Bastion, VPN Gateway |
| Serverless API | Functions, API Management, Cosmos DB |
| Static Web App | Static Web Apps, Functions, Cosmos DB |
| Event-Driven Architecture | Event Grid, Functions, Service Bus |
| Multi-Region Web App | App Service, Front Door, SQL geo-replication |
| Container Apps Microservices | Container Apps, Dapr, Cosmos DB, Redis |
| Data Analytics Platform | Synapse, Data Lake, Power BI, Data Factory |
| AI/ML Workload | Azure OpenAI, Cognitive Services, App Service |

## Quick Start

```bash
npm install
npm run dev        # Start the web UI
npm run dev:api    # Start the API server
```

## Project Structure

```
├── src/web/        # React + TypeScript frontend (Vite)
├── src/api/        # Express + TypeScript API
├── patterns/       # 10 Azure architecture patterns (Bicep + workflows)
└── .github/        # Platform CI/CD
```

## Deploy to Azure

Each pattern includes a "Deploy to Azure" button that opens the Azure Portal with the pattern's Bicep template pre-loaded. Simply click, configure parameters, and deploy.

## License

MIT
