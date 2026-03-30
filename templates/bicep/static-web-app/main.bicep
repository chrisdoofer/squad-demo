targetScope = 'resourceGroup'

// ──────────────────────────────────────────────
// Static Web App with API + Cosmos DB
// Reference: https://learn.microsoft.com/en-us/azure/architecture/guide/web/static-web-apps-content-overview
// ──────────────────────────────────────────────

@description('Name of the Static Web App. Used as a prefix for all resources.')
param appName string

@description('Azure region for resource deployment.')
param location string = 'uksouth'

@description('GitHub repository URL for the Static Web App source.')
param repositoryUrl string

@description('Tags to apply to all resources.')
param tags object = {}

// ── Static Web App ──────────────────────────
module staticWebApp 'modules/staticWebApp.bicep' = {
  name: '${appName}-swa'
  params: {
    appName: appName
    location: location
    repositoryUrl: repositoryUrl
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
@description('Default hostname of the Static Web App.')
output staticWebAppHostName string = staticWebApp.outputs.defaultHostName

@description('Resource ID of the Static Web App.')
output staticWebAppId string = staticWebApp.outputs.staticWebAppId

@description('Cosmos DB account endpoint URI.')
output cosmosEndpoint string = cosmosDb.outputs.cosmosEndpoint

@description('Resource ID of the Cosmos DB account.')
output cosmosAccountId string = cosmosDb.outputs.cosmosAccountId
