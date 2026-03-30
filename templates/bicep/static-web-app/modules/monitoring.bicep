@description('Name prefix for resources.')
param appName string

@description('Azure region for resource deployment.')
param location string

@description('Tags to apply to all resources.')
param tags object

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${appName}-law'
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${appName}-ai'
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
  }
}

@description('Resource ID of the Log Analytics workspace.')
output logAnalyticsWorkspaceId string = logAnalyticsWorkspace.id

@description('Resource ID of Application Insights.')
output appInsightsId string = appInsights.id

@description('Instrumentation key for Application Insights.')
output appInsightsInstrumentationKey string = appInsights.properties.InstrumentationKey

@description('Connection string for Application Insights.')
output appInsightsConnectionString string = appInsights.properties.ConnectionString
