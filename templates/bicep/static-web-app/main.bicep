targetScope = 'resourceGroup'

// ──────────────────────────────────────────────
// Static Web App with API — Azure Static Web Apps + Cosmos DB
// Reference: https://learn.microsoft.com/en-us/azure/architecture/guide/web/static-web-apps-content-overview
// ──────────────────────────────────────────────

@description('Name of the application. Used as a prefix for all resources.')
param appName string

@description('Azure region for resource deployment.')
param location string = 'uksouth'

@description('GitHub repository URL for the Static Web App source.')
param repositoryUrl string

@description('GitHub repository branch for deployment.')
param repositoryBranch string = 'main'

@allowed([
  'dev'
  'staging'
  'prod'
])
@description('Deployment environment.')
param environment string = 'dev'

var tags = {
  environment: environment
  project: appName
}

// ── Monitoring ──────────────────────────────
module monitoring 'modules/monitoring.bicep' = {
  name: '${appName}-monitoring'
  params: {
    appName: appName
    location: location
    tags: tags
  }
}

// ── Static Web App ──────────────────────────
module staticWebApp 'modules/staticWebApp.bicep' = {
  name: '${appName}-swa'
  params: {
    appName: appName
    location: location
    repositoryUrl: repositoryUrl
    repositoryBranch: repositoryBranch
    environment: environment
    tags: tags
  }
}

// ── Cosmos DB ───────────────────────────────
module cosmosDb 'modules/cosmosDb.bicep' = {
  name: '${appName}-cosmos'
  params: {
    appName: appName
    location: location
    tags: tags
  }
}

// ── Outputs ─────────────────────────────────
@description('URL of the Static Web App.')
output staticWebAppUrl string = 'https://${staticWebApp.outputs.defaultHostName}'

@description('Default hostname of the Static Web App.')
output staticWebAppDefaultHostname string = staticWebApp.outputs.defaultHostName

@description('Cosmos DB account endpoint URI.')
output cosmosDbEndpoint string = cosmosDb.outputs.cosmosDbEndpoint
