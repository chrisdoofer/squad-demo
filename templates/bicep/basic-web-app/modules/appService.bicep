@description('Name prefix for App Service resources.')
param appName string

@description('Azure region for resource deployment.')
param location string

@description('Application Insights connection string for telemetry.')
param appInsightsConnectionString string

@description('Fully qualified domain name of the SQL Server.')
param sqlServerFqdn string

@description('SQL Server administrator login name.')
param sqlAdminLogin string

@secure()
@description('SQL Server administrator password.')
param sqlAdminPassword string

@description('Name of the SQL Database.')
param sqlDatabaseName string

@description('Tags to apply to all resources.')
param tags object = {}

var appServicePlanName = '${appName}-plan'
var webAppName = '${appName}-app'

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  sku: {
    name: 'S1'
    tier: 'Standard'
  }
  properties: {
    reserved: false
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
    siteConfig: {
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      appSettings: [
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsightsConnectionString
        }
      ]
      connectionStrings: [
        {
          name: 'DefaultConnection'
          connectionString: 'Server=tcp:${sqlServerFqdn},1433;Initial Catalog=${sqlDatabaseName};Persist Security Info=False;User ID=${sqlAdminLogin};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
          type: 'SQLAzure'
        }
      ]
    }
  }
}

resource webAppDiagnostics 'Microsoft.Web/sites/config@2023-12-01' = {
  parent: webApp
  name: 'logs'
  properties: {
    applicationLogs: {
      fileSystem: {
        level: 'Warning'
      }
    }
    httpLogs: {
      fileSystem: {
        retentionInMb: 35
        retentionInDays: 3
        enabled: true
      }
    }
    detailedErrorMessages: {
      enabled: true
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
