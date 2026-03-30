targetScope = 'resourceGroup'

// ──────────────────────────────────────────────
// Basic Web App — App Service + SQL + Monitoring
// Reference: https://learn.microsoft.com/en-us/azure/architecture/web-apps/app-service/architectures/basic-web-app
// ──────────────────────────────────────────────

@description('Name of the web application. Used as a prefix for all resources.')
param appName string

@description('Azure region for resource deployment.')
param location string = 'uksouth'

@description('SQL Server administrator login name.')
param sqlAdminLogin string

@secure()
@description('SQL Server administrator password.')
param sqlAdminPassword string

@description('Tags to apply to all resources.')
param tags object = {}

// ── Monitoring ──────────────────────────────
module monitoring 'modules/monitoring.bicep' = {
  name: '${appName}-monitoring'
  params: {
    appName: appName
    location: location
    tags: tags
  }
}

// ── SQL Database ────────────────────────────
module sql 'modules/sqlDatabase.bicep' = {
  name: '${appName}-sql'
  params: {
    appName: appName
    location: location
    sqlAdminLogin: sqlAdminLogin
    sqlAdminPassword: sqlAdminPassword
    tags: tags
  }
}

// ── App Service ─────────────────────────────
module appService 'modules/appService.bicep' = {
  name: '${appName}-appservice'
  params: {
    appName: appName
    location: location
    appInsightsConnectionString: monitoring.outputs.appInsightsConnectionString
    sqlServerFqdn: sql.outputs.sqlServerFqdn
    sqlAdminLogin: sqlAdminLogin
    sqlAdminPassword: sqlAdminPassword
    sqlDatabaseName: sql.outputs.sqlDatabaseName
    tags: tags
  }
}

// ── Outputs ─────────────────────────────────
@description('Default hostname of the deployed Web App.')
output webAppHostName string = appService.outputs.webAppHostName

@description('Resource ID of the Web App.')
output webAppId string = appService.outputs.webAppId

@description('Resource ID of the SQL Server.')
output sqlServerId string = sql.outputs.sqlServerId

@description('Resource ID of the Application Insights instance.')
output appInsightsId string = monitoring.outputs.appInsightsId
