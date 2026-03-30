@description('Prefix for resource names')
param namePrefix string

@description('Azure region for resources')
param location string

@description('Tags to apply to all resources')
param tags object = {}

@description('Object ID of the AKS kubelet identity for ACR pull role assignment')
param kubeletIdentityObjectId string

var acrName = replace('${namePrefix}acr', '-', '')

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: length(acrName) > 50 ? substring(acrName, 0, 50) : acrName
  location: location
  tags: tags
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: false
  }
}

// AcrPull role assignment for AKS kubelet identity
resource acrPullRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(containerRegistry.id, kubeletIdentityObjectId, '7f951dda-4ed3-4680-a7ca-43fe172d538d')
  scope: containerRegistry
  properties: {
    principalId: kubeletIdentityObjectId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
    principalType: 'ServicePrincipal'
  }
}

@description('Resource ID of the Container Registry')
output acrId string = containerRegistry.id

@description('Name of the Container Registry')
output acrName string = containerRegistry.name

@description('Login server of the Container Registry')
output acrLoginServer string = containerRegistry.properties.loginServer
