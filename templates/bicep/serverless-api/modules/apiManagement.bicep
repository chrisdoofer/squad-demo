@description('Name prefix for resources.')
param appName string

@description('Azure region for resource deployment.')
param location string

@description('Tags to apply to all resources.')
param tags object

@description('Default hostname of the Function App.')
param functionAppDefaultHostName string

@description('Resource ID of the Function App.')
param functionAppResourceId string

@description('Resource ID of Application Insights.')
param appInsightsId string

@description('Application Insights instrumentation key.')
param appInsightsInstrumentationKey string

@description('Resource ID of the Log Analytics workspace.')
param logAnalyticsWorkspaceId string

@description('Publisher email for API Management.')
param publisherEmail string = 'admin@contoso.com'

@description('Publisher name for API Management.')
param publisherName string = 'Contoso'

resource apim 'Microsoft.ApiManagement/service@2023-09-01-preview' = {
  name: '${appName}-apim'
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

resource apimDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: '${appName}-apim-diag'
  scope: apim
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      {
        categoryGroup: 'allLogs'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
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

resource functionAppHostKey 'Microsoft.ApiManagement/service/namedValues@2023-09-01-preview' = {
  parent: apim
  name: 'function-app-host-key'
  properties: {
    displayName: 'function-app-host-key'
    secret: true
    value: listKeys('${functionAppResourceId}/host/default', '2023-12-01').functionKeys.default
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

resource corsPolicy 'Microsoft.ApiManagement/service/apis/policies@2023-09-01-preview' = {
  parent: backendApi
  name: 'policy'
  properties: {
    format: 'xml'
    value: '<policies><inbound><base /><cors allow-credentials="false"><allowed-origins><origin>*</origin></allowed-origins><allowed-methods preflight-result-max-age="300"><method>GET</method><method>POST</method><method>PUT</method><method>DELETE</method><method>PATCH</method><method>OPTIONS</method></allowed-methods><allowed-headers><header>*</header></allowed-headers></cors></inbound><backend><base /></backend><outbound><base /></outbound><on-error><base /></on-error></policies>'
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

@description('Resource ID of API Management.')
output apimId string = apim.id

@description('Name of the API Management instance.')
output apimName string = apim.name

@description('Gateway URL of the API Management instance.')
output apimGatewayUrl string = apim.properties.gatewayUrl
