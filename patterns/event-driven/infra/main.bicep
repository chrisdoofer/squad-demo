// Event-Driven pattern: Event Grid + Function App + Service Bus + Storage
// Deploys an event-driven architecture with Event Grid topics, Service Bus messaging, and serverless compute.
targetScope = 'resourceGroup'

// ──────────────────────────── Parameters ────────────────────────────

@description('Base name for the application resources.')
param appName string

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Function App runtime stack.')
@allowed(['dotnet-isolated', 'node', 'python', 'java'])
param functionRuntime string = 'node'

// ──────────────────────────── Variables ─────────────────────────────

var uniqueSuffix = uniqueString(resourceGroup().id, appName)
var functionStorageName = take(replace('stfunc${appName}${uniqueSuffix}', '-', ''), 24)
var eventStorageName = take(replace('stevt${appName}${uniqueSuffix}', '-', ''), 24)
var functionAppName = 'func-${appName}-${uniqueSuffix}'
var appServicePlanName = 'plan-${appName}-${uniqueSuffix}'
var eventGridTopicName = 'egt-${appName}-${uniqueSuffix}'
var serviceBusName = 'sb-${appName}-${uniqueSuffix}'
var appInsightsName = 'appi-${appName}-${uniqueSuffix}'
var logAnalyticsName = 'log-${appName}-${uniqueSuffix}'

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

// ──────────────────────────── Storage – Function App ────────────────

resource functionStorage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: functionStorageName
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

// ──────────────────────────── Storage – Events ──────────────────────

resource eventStorage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: eventStorageName
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
          value: 'DefaultEndpointsProtocol=https;AccountName=${functionStorage.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${functionStorage.listKeys().keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${functionStorage.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${functionStorage.listKeys().keys[0].value}'
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
          name: 'EVENT_STORAGE_CONNECTION'
          value: 'DefaultEndpointsProtocol=https;AccountName=${eventStorage.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${eventStorage.listKeys().keys[0].value}'
        }
        {
          name: 'SERVICE_BUS_CONNECTION'
          value: serviceBusNamespace.listKeys('RootManageSharedAccessKey').primaryConnectionString
        }
      ]
    }
  }
}

// ──────────────────────────── Event Grid Topic ──────────────────────

resource eventGridTopic 'Microsoft.EventGrid/topics@2024-06-01-preview' = {
  name: eventGridTopicName
  location: location
  properties: {
    inputSchema: 'EventGridSchema'
  }
}

// ──────────────────────────── Service Bus ───────────────────────────

resource serviceBusNamespace 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: serviceBusName
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
}

resource serviceBusQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBusNamespace
  name: 'events-queue'
  properties: {
    maxDeliveryCount: 10
    lockDuration: 'PT1M'
    defaultMessageTimeToLive: 'P14D'
  }
}

resource serviceBusTopic 'Microsoft.ServiceBus/namespaces/topics@2022-10-01-preview' = {
  parent: serviceBusNamespace
  name: 'events-topic'
  properties: {
    defaultMessageTimeToLive: 'P14D'
    maxSizeInMegabytes: 1024
  }
}

resource serviceBusSubscription 'Microsoft.ServiceBus/namespaces/topics/subscriptions@2022-10-01-preview' = {
  parent: serviceBusTopic
  name: 'processor'
  properties: {
    lockDuration: 'PT1M'
    maxDeliveryCount: 10
    defaultMessageTimeToLive: 'P14D'
  }
}

// ──────────────────────────── Outputs ───────────────────────────────

output functionAppId string = functionApp.id
output functionAppDefaultHostName string = functionApp.properties.defaultHostName
output eventGridTopicId string = eventGridTopic.id
output eventGridTopicEndpoint string = eventGridTopic.properties.endpoint
output serviceBusNamespaceId string = serviceBusNamespace.id
output serviceBusEndpoint string = serviceBusNamespace.properties.serviceBusEndpoint
output eventStorageAccountId string = eventStorage.id
output appInsightsConnectionString string = appInsights.properties.ConnectionString
