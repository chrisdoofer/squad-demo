@description('Azure region for all resources')
param location string

@description('Application name prefix')
param appName string

@description('Environment name')
param environment string

@description('Resource tags')
param tags object

@description('Subnet ID for App Service VNet integration')
param appSubnetId string

@description('Subnet ID for private endpoints')
param privateEndpointsSubnetId string

@description('Application Insights connection string')
param appInsightsConnectionString string

@description('Key Vault name for secret references')
param keyVaultName string

@description('Private DNS zone ID for web apps')
param privateDnsZoneId string

var suffix = uniqueString(resourceGroup().id)
var appServicePlanName = 'asp-${appName}-${environment}'
var appServiceName = 'app-${appName}-${suffix}'

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  kind: 'linux'
  sku: {
    name: 'P1v3'
    tier: 'PremiumV3'
  }
  properties: {
    reserved: true
    zoneRedundant: true
  }
}

resource appService 'Microsoft.Web/sites@2023-12-01' = {
  name: appServiceName
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    virtualNetworkSubnetId: appSubnetId
    siteConfig: {
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      vnetRouteAllEnabled: true
      linuxFxVersion: 'DOTNETCORE|8.0'
      appSettings: [
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsightsConnectionString
        }
        {
          name: 'ApplicationInsightsAgent_EXTENSION_VERSION'
          value: '~3'
        }
        {
          name: 'SqlConnectionString'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=sql-connection-string)'
        }
      ]
    }
  }
}

resource privateEndpoint 'Microsoft.Network/privateEndpoints@2024-01-01' = {
  name: 'pe-${appServiceName}'
  location: location
  tags: tags
  properties: {
    subnet: {
      id: privateEndpointsSubnetId
    }
    privateLinkServiceConnections: [
      {
        name: 'plsc-${appServiceName}'
        properties: {
          privateLinkServiceId: appService.id
          groupIds: [
            'sites'
          ]
        }
      }
    ]
  }
}

resource dnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2024-01-01' = {
  parent: privateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'config'
        properties: {
          privateDnsZoneId: privateDnsZoneId
        }
      }
    ]
  }
}

output appServiceName string = appService.name
output appServicePrincipalId string = appService.identity.principalId
output appServiceDefaultHostName string = appService.properties.defaultHostName
