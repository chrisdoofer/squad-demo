@description('Name prefix for Static Web App resources.')
param appName string

@description('Azure region for resource deployment.')
param location string

@description('GitHub repository URL for the Static Web App source.')
param repositoryUrl string

@description('Tags to apply to all resources.')
param tags object = {}

var staticWebAppName = '${appName}-swa'

resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: staticWebAppName
  location: location
  tags: tags
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    repositoryUrl: repositoryUrl
    branch: 'main'
    buildProperties: {
      appLocation: '/'
      apiLocation: 'api'
      outputLocation: 'build'
    }
  }
}

@description('Resource ID of the Static Web App.')
output staticWebAppId string = staticWebApp.id

@description('Default hostname of the Static Web App.')
output defaultHostName string = staticWebApp.properties.defaultHostname

@description('Name of the Static Web App.')
output staticWebAppName string = staticWebApp.name
