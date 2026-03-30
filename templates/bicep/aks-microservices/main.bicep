targetScope = 'resourceGroup'

@description('Name of the AKS cluster (used as prefix for all resources)')
param clusterName string

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Initial node count for the user node pool')
@minValue(1)
@maxValue(10)
param nodeCount int = 3

@description('VM size for AKS node pools')
param nodeVmSize string = 'Standard_D4s_v3'

@description('Environment name')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environment string = 'dev'

var tags = {
  environment: environment
  project: clusterName
}

module network 'modules/network.bicep' = {
  name: 'network'
  params: {
    location: location
    clusterName: clusterName
    environment: environment
    tags: tags
  }
}

module monitoring 'modules/monitoring.bicep' = {
  name: 'monitoring'
  params: {
    location: location
    clusterName: clusterName
    environment: environment
    tags: tags
  }
}

module aks 'modules/aks.bicep' = {
  name: 'aks'
  params: {
    location: location
    clusterName: clusterName
    environment: environment
    tags: tags
    aksSubnetId: network.outputs.aksSubnetId
    nodeCount: nodeCount
    nodeVmSize: nodeVmSize
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsId
  }
}

module acr 'modules/acr.bicep' = {
  name: 'acr'
  params: {
    location: location
    clusterName: clusterName
    environment: environment
    tags: tags
    aksKubeletIdentityObjectId: aks.outputs.kubeletIdentityObjectId
  }
}

module serviceBus 'modules/servicebus.bicep' = {
  name: 'serviceBus'
  params: {
    location: location
    clusterName: clusterName
    environment: environment
    tags: tags
  }
}

module cosmosDb 'modules/cosmosdb.bicep' = {
  name: 'cosmosDb'
  params: {
    location: location
    clusterName: clusterName
    environment: environment
    tags: tags
  }
}

output aksClusterName string = aks.outputs.aksClusterName
output acrLoginServer string = acr.outputs.acrLoginServer
output serviceBusNamespace string = serviceBus.outputs.serviceBusNamespaceName
output cosmosDbEndpoint string = cosmosDb.outputs.cosmosDbEndpoint
