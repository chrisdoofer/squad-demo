@description('Azure region for all resources')
param location string

@description('Cluster name prefix')
param clusterName string

@description('Environment name')
param environment string

@description('Resource tags')
param tags object

@description('AKS kubelet managed identity object ID for AcrPull role assignment')
param aksKubeletIdentityObjectId string

var suffix = uniqueString(resourceGroup().id)
var acrName = toLower('acr${clusterName}${environment}${suffix}')

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  tags: tags
  sku: {
    name: 'Premium'
  }
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
    zoneRedundancy: 'Enabled'
  }
}

var acrPullRoleId = '7f951dda-4ed3-4680-a7ca-43fe172d538d'

resource acrPullRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, aksKubeletIdentityObjectId, acrPullRoleId)
  scope: acr
  properties: {
    principalId: aksKubeletIdentityObjectId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleId)
    principalType: 'ServicePrincipal'
  }
}

output acrName string = acr.name
output acrLoginServer string = acr.properties.loginServer
output acrId string = acr.id

