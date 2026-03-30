targetScope = 'resourceGroup'

@description('Name prefix for all resources')
param appName string

@description('Azure region for all resources')
param location string = 'uksouth'

@description('Tags to apply to all resources')
param tags object = {}

module monitoring 'modules/monitoring.bicep' = {
  name: 'monitoring-deployment'
  params: {
    namePrefix: appName
    location: location
    tags: tags
  }
}

module cosmosDb 'modules/cosmosDb.bicep' = {
  name: 'cosmosdb-deployment'
  params: {
    namePrefix: appName
    location: location
    tags: tags
  }
}

module functions 'modules/functions.bicep' = {
  name: 'functions-deployment'
  params: {
    namePrefix: appName
    location: location
    tags: tags
    appInsightsInstrumentationKey: monitoring.outputs.appInsightsInstrumentationKey
    appInsightsConnectionString: monitoring.outputs.appInsightsConnectionString
    cosmosDbEndpoint: cosmosDb.outputs.cosmosDbEndpoint
    cosmosDbAccountName: cosmosDb.outputs.cosmosDbAccountName
  }
}

module apiManagement 'modules/apiManagement.bicep' = {
  name: 'apim-deployment'
  params: {
    namePrefix: appName
    location: location
    tags: tags
    functionAppDefaultHostName: functions.outputs.functionAppDefaultHostName
    appInsightsId: monitoring.outputs.appInsightsId
    appInsightsInstrumentationKey: monitoring.outputs.appInsightsInstrumentationKey
  }
}

@description('Function App default hostname')
output functionAppHostName string = functions.outputs.functionAppDefaultHostName

@description('API Management gateway URL')
output apimGatewayUrl string = apiManagement.outputs.apimGatewayUrl

@description('Cosmos DB endpoint')
output cosmosDbEndpoint string = cosmosDb.outputs.cosmosDbEndpoint

@description('Application Insights resource ID')
output appInsightsId string = monitoring.outputs.appInsightsId
