// Serverless API pattern: Function App + API Management + Cosmos DB + Application Insights
// Deploys a fully serverless backend with managed API gateway and NoSQL data store.
targetScope = 'resourceGroup'

// ──────────────────────────── Parameters ────────────────────────────

@description('Base name for the API resources.')
param apiName string

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Publisher e-mail address for API Management.')
param publisherEmail string

@description('Publisher display name for API Management.')
param publisherName string

@description('Function App runtime stack.')
@allowed(['dotnet-isolated', 'node', 'python', 'java'])
param functionRuntime string = 'node'

// ──────────────────────────── Variables ─────────────────────────────

var uniqueSuffix = uniqueString(resourceGroup().id, apiName)
var storageAccountName = take(replace('st${apiName}${uniqueSuffix}', '-', ''), 24)
var functionAppName = 'func-${apiName}-${uniqueSuffix}'
var appServicePlanName = 'plan-${apiName}-${uniqueSuffix}'
var apimName = 'apim-${apiName}-${uniqueSuffix}'
var appInsightsName = 'appi-${apiName}-${uniqueSuffix}'
var logAnalyticsName = 'log-${apiName}-${uniqueSuffix}'
var cosmosAccountName = 'cosmos-${apiName}-${uniqueSuffix}'
var cosmosDatabaseName = '${apiName}-db'
var cosmosContainerName = 'items'

// ──────────────────────────── Log Analytics ─────────────────────────

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// ──────────────────────────── Application Insights ──────────────────

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
  }
}

// ──────────────────────────── Storage Account (for Functions) ───────

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
  }
}

// ──────────────────────────── Consumption Plan ──────────────────────

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  properties: {}
}

// ──────────────────────────── Function App ──────────────────────────

resource functionApp 'Microsoft.Web/sites@2023-12-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp'
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      minTlsVersion: '1.2'
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTSHARE'
          value: toLower(functionAppName)
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: functionRuntime
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'COSMOS_CONNECTION_STRING'
          value: cosmosAccount.listConnectionStrings().connectionStrings[0].connectionString
        }
      ]
    }
  }
}

// ──────────────────────────── API Management ────────────────────────

resource apim 'Microsoft.ApiManagement/service@2023-09-01-preview' = {
  name: apimName
  location: location
  sku: {
    name: 'Consumption'
    capacity: 0
  }
  properties: {
    publisherEmail: publisherEmail
    publisherName: publisherName
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

// ──────────────────────────── Outputs ───────────────────────────────

output functionAppId string = functionApp.id
output functionAppDefaultHostName string = functionApp.properties.defaultHostName
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
output apimGatewayUrl string = apim.properties.gatewayUrl
output apimId string = apim.id
output cosmosAccountId string = cosmosAccount.id
output cosmosDocumentEndpoint string = cosmosAccount.properties.documentEndpoint
output appInsightsConnectionString string = appInsights.properties.ConnectionString
