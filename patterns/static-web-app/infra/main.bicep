// Static Web App pattern: Azure Static Web Apps + Cosmos DB backend
// Deploys a JAMstack application with a globally distributed NoSQL database.
targetScope = 'resourceGroup'

// ──────────────────────────── Parameters ────────────────────────────

@description('Base name for the application resources.')
param appName string

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('GitHub repository URL for the Static Web App source.')
param repositoryUrl string

@description('Branch to deploy from.')
param repositoryBranch string = 'main'

@description('Static Web App SKU.')
@allowed(['Free', 'Standard'])
param staticWebAppSku string = 'Standard'

// ──────────────────────────── Variables ─────────────────────────────

var uniqueSuffix = uniqueString(resourceGroup().id, appName)
var staticWebAppName = 'swa-${appName}-${uniqueSuffix}'
var cosmosAccountName = 'cosmos-${appName}-${uniqueSuffix}'
var cosmosDatabaseName = '${appName}-db'
var cosmosContainerName = 'items'

// ──────────────────────────── Static Web App ────────────────────────

resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: staticWebAppName
  location: location
  sku: {
    name: staticWebAppSku
    tier: staticWebAppSku
  }
  properties: {
    repositoryUrl: repositoryUrl
    branch: repositoryBranch
    buildProperties: {
      appLocation: '/'
      apiLocation: 'api'
      outputLocation: 'dist'
    }
  }
}

// ──────────────────────────── Cosmos DB ─────────────────────────────

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-02-15-preview' = {
  name: cosmosAccountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
      }
    ]
  }
}

resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-02-15-preview' = {
  parent: cosmosAccount
  name: cosmosDatabaseName
  properties: {
    resource: {
      id: cosmosDatabaseName
    }
  }
}

resource cosmosContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-02-15-preview' = {
  parent: cosmosDatabase
  name: cosmosContainerName
  properties: {
    resource: {
      id: cosmosContainerName
      partitionKey: {
        paths: ['/id']
        kind: 'Hash'
      }
    }
    options: {
      throughput: 400
    }
  }
}

// Link Cosmos DB to Static Web App via database connection
resource databaseConnection 'Microsoft.Web/staticSites/databaseConnections@2023-12-01' = {
  parent: staticWebApp
  name: 'default'
  properties: {
    resourceId: cosmosAccount.id
    region: location
  }
}

// ──────────────────────────── Outputs ───────────────────────────────

output staticWebAppId string = staticWebApp.id
output staticWebAppDefaultHostName string = staticWebApp.properties.defaultHostname
output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output cosmosAccountId string = cosmosAccount.id
output cosmosDocumentEndpoint string = cosmosAccount.properties.documentEndpoint
