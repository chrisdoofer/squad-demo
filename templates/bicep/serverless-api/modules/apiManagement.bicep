@description('Prefix for resource names')
param namePrefix string

@description('Azure region for resources')
param location string

@description('Tags to apply to all resources')
param tags object = {}

@description('Default hostname of the Function App')
param functionAppDefaultHostName string

@description('Resource ID of Application Insights')
param appInsightsId string

@description('Application Insights instrumentation key')
param appInsightsInstrumentationKey string

@description('Publisher email for APIM')
param publisherEmail string = 'admin@contoso.com'

@description('Publisher name for APIM')
param publisherName string = 'Contoso'

resource apim 'Microsoft.ApiManagement/service@2023-09-01-preview' = {
  name: '${namePrefix}-apim'
  location: location
  tags: tags
  sku: {
    name: 'Consumption'
    capacity: 0
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    publisherEmail: publisherEmail
    publisherName: publisherName
  }
}

resource apimLogger 'Microsoft.ApiManagement/service/loggers@2023-09-01-preview' = {
  parent: apim
  name: 'app-insights-logger'
  properties: {
    loggerType: 'applicationInsights'
    resourceId: appInsightsId
    credentials: {
      instrumentationKey: appInsightsInstrumentationKey
    }
  }
}

resource backendApi 'Microsoft.ApiManagement/service/apis@2023-09-01-preview' = {
  parent: apim
  name: 'serverless-api'
  properties: {
    displayName: 'Serverless API'
    path: 'api'
    protocols: [
      'https'
    ]
    serviceUrl: 'https://${functionAppDefaultHostName}/api'
    subscriptionRequired: false
  }
}

resource healthOperation 'Microsoft.ApiManagement/service/apis/operations@2023-09-01-preview' = {
  parent: backendApi
  name: 'health-check'
  properties: {
    displayName: 'Health Check'
    method: 'GET'
    urlTemplate: '/health'
    description: 'Health check endpoint'
    responses: [
      {
        statusCode: 200
        description: 'OK'
      }
    ]
  }
}

@description('Resource ID of API Management')
output apimId string = apim.id

@description('Name of API Management instance')
output apimName string = apim.name

@description('Gateway URL of API Management')
output apimGatewayUrl string = apim.properties.gatewayUrl
