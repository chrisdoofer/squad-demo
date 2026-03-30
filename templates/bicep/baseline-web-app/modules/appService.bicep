@description('Name prefix for App Service resources.')
param appName string

@description('Azure region for resource deployment.')
param location string

@description('Resource ID of the subnet for VNet integration.')
param subnetId string

@description('Application Insights connection string for telemetry.')
param appInsightsConnectionString string

@description('Tags to apply to all resources.')
param tags object = {}

var appServicePlanName = '${appName}-plan'
var webAppName = '${appName}-app'

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  sku: {
    name: 'P1v3'
    tier: 'PremiumV3'
  }
  properties: {
    reserved: false
    zoneRedundant: true
  }
}

resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: webAppName
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    virtualNetworkSubnetId: subnetId
    siteConfig: {
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      vnetRouteAllEnabled: true
      appSettings: [
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsightsConnectionString
        }
      ]
    }
  }
}

@description('Resource ID of the App Service Plan.')
output appServicePlanId string = appServicePlan.id

@description('Resource ID of the Web App.')
output webAppId string = webApp.id

@description('Default hostname of the Web App.')
output webAppHostName string = webApp.properties.defaultHostName

@description('Principal ID of the Web App managed identity.')
output webAppPrincipalId string = webApp.identity.principalId
