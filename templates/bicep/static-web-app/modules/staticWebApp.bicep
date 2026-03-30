@description('Name prefix for resources.')
param appName string

@description('Azure region for resource deployment.')
param location string

@description('GitHub repository URL.')
param repositoryUrl string

@description('GitHub repository branch.')
param repositoryBranch string

@description('Deployment environment.')
param environment string

@description('Tags to apply to all resources.')
param tags object

var skuName = environment == 'prod' ? 'Standard' : 'Free'
var skuTier = environment == 'prod' ? 'Standard' : 'Free'

resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: '${appName}-swa'
  location: location
  tags: tags
  sku: {
    name: skuName
    tier: skuTier
  }
  properties: {
    repositoryUrl: repositoryUrl
    branch: repositoryBranch
    buildProperties: {
      appLocation: '/'
      apiLocation: 'api'
      outputLocation: 'dist'
    }
  }
}

@description('Resource ID of the Static Web App.')
output staticWebAppId string = staticWebApp.id

@description('Default hostname of the Static Web App.')
output defaultHostName string = staticWebApp.properties.defaultHostname

@description('Name of the Static Web App.')
output staticWebAppName string = staticWebApp.name
