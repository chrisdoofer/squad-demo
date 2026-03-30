targetScope = 'resourceGroup'

@description('Name of the AKS cluster')
param clusterName string

@description('Azure region for all resources')
param location string = 'uksouth'

@description('Number of agent nodes in the system pool')
param nodeCount int = 3

@description('VM size for agent nodes')
param nodeVmSize string = 'Standard_D4s_v3'

@description('Tags to apply to all resources')
param tags object = {}

module monitoring 'modules/monitoring.bicep' = {
  name: 'monitoring-deployment'
  params: {
    namePrefix: clusterName
    location: location
    tags: tags
  }
}

module network 'modules/network.bicep' = {
  name: 'network-deployment'
  params: {
    namePrefix: clusterName
    location: location
    tags: tags
  }
}

module aks 'modules/aks.bicep' = {
  name: 'aks-deployment'
  params: {
    clusterName: clusterName
    location: location
    tags: tags
    nodeCount: nodeCount
    nodeVmSize: nodeVmSize
    subnetId: network.outputs.aksSubnetId
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
  }
}

module acr 'modules/acr.bicep' = {
  name: 'acr-deployment'
  params: {
    namePrefix: clusterName
    location: location
    tags: tags
    kubeletIdentityObjectId: aks.outputs.kubeletIdentityObjectId
  }
}

module serviceBus 'modules/serviceBus.bicep' = {
  name: 'servicebus-deployment'
  params: {
    namePrefix: clusterName
    location: location
    tags: tags
  }
}

module cosmosDb 'modules/cosmosDb.bicep' = {
  name: 'cosmosdb-deployment'
  params: {
    namePrefix: clusterName
    location: location
    tags: tags
  }
}

@description('AKS cluster FQDN')
output aksClusterFqdn string = aks.outputs.aksClusterFqdn

@description('ACR login server')
output acrLoginServer string = acr.outputs.acrLoginServer

@description('Service Bus endpoint')
output serviceBusEndpoint string = serviceBus.outputs.serviceBusEndpoint

@description('Cosmos DB endpoint')
output cosmosDbEndpoint string = cosmosDb.outputs.cosmosDbEndpoint

@description('Application Insights connection string')
output appInsightsConnectionString string = monitoring.outputs.appInsightsConnectionString
