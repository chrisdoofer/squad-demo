@description('Azure region for all resources')
param location string

@description('Cluster name prefix')
param clusterName string

@description('Environment name')
param environment string

@description('Resource tags')
param tags object

var suffix = uniqueString(resourceGroup().id)
var serviceBusName = 'sb-${clusterName}-${environment}-${suffix}'

resource serviceBusNamespace 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: serviceBusName
  location: location
  tags: tags
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
}

resource ordersQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBusNamespace
  name: 'orders'
  properties: {
    lockDuration: 'PT1M'
    maxSizeInMegabytes: 1024
    deadLetteringOnMessageExpiration: true
    maxDeliveryCount: 10
    defaultMessageTimeToLive: 'P14D'
  }
}

output serviceBusNamespaceName string = serviceBusNamespace.name
output serviceBusNamespaceId string = serviceBusNamespace.id
output serviceBusEndpoint string = serviceBusNamespace.properties.serviceBusEndpoint

