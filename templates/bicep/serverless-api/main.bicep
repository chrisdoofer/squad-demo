targetScope = 'resourceGroup'

// ──────────────────────────────────────────────
// Serverless API — Azure Functions + API Management + Cosmos DB
// Reference: https://learn.microsoft.com/en-us/azure/architecture/serverless/web-app
// ──────────────────────────────────────────────

@description('Name of the application. Used as a prefix for all resources.')
param appName string

@description('Azure region for resource deployment.')
param location string = 'uksouth'

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

// ── Cosmos DB ───────────────────────────────
module cosmosDb 'modules/cosmosDb.bicep' = {
  name: '${appName}-cosmos'
  params: {
    appName: appName
    location: location
    tags: tags
  }
}

// ── Azure Functions ─────────────────────────
module functions 'modules/functions.bicep' = {
  name: '${appName}-functions'
  params: {
    appName: appName
    location: location
    tags: tags
    appInsightsInstrumentationKey: monitoring.outputs.appInsightsInstrumentationKey
    cosmosDbConnectionString: cosmosDb.outputs.cosmosDbConnectionString
  }
}

// ── API Management ──────────────────────────
module apiManagement 'modules/apiManagement.bicep' = {
  name: '${appName}-apim'
  params: {
    appName: appName
    location: location
    tags: tags
    functionAppDefaultHostName: functions.outputs.functionAppDefaultHostName
    functionAppResourceId: functions.outputs.functionAppId
    appInsightsId: monitoring.outputs.appInsightsId
    appInsightsInstrumentationKey: monitoring.outputs.appInsightsInstrumentationKey
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
  }
}

// ── Outputs ─────────────────────────────────
@description('URL of the deployed Function App.')
output functionAppUrl string = 'https://${functions.outputs.functionAppDefaultHostName}'

@description('Gateway URL of the API Management instance.')
output apimGatewayUrl string = apiManagement.outputs.apimGatewayUrl

@description('Cosmos DB account endpoint URI.')
output cosmosDbEndpoint string = cosmosDb.outputs.cosmosDbEndpoint
