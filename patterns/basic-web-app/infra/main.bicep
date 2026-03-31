// Basic Web App pattern: App Service + SQL Database + Application Insights
// Deploys a typical three-tier web application with monitoring.
targetScope = 'resourceGroup'

// ──────────────────────────── Parameters ────────────────────────────

@description('Base name used to generate resource names.')
param appName string

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Administrator login for the SQL Server.')
param sqlAdminLogin string

@secure()
@description('Administrator password for the SQL Server.')
param sqlAdminPassword string

@description('SKU for the App Service Plan.')
@allowed(['B1', 'B2', 'S1', 'S2', 'P1v3', 'P2v3'])
param appServiceSkuName string = 'B1'

@description('SQL Database SKU name.')
param sqlDatabaseSku string = 'Basic'

// ──────────────────────────── Variables ─────────────────────────────

var uniqueSuffix = uniqueString(resourceGroup().id, appName)
var appServicePlanName = 'plan-${appName}-${uniqueSuffix}'
var webAppName = 'app-${appName}-${uniqueSuffix}'
var sqlServerName = 'sql-${appName}-${uniqueSuffix}'
var sqlDatabaseName = 'sqldb-${appName}'
var logAnalyticsName = 'log-${appName}-${uniqueSuffix}'
var appInsightsName = 'appi-${appName}-${uniqueSuffix}'

// ──────────────────────────── Log Analytics ─────────────────────────

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// ──────────────────────────── Application Insights ──────────────────

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
  }
}

// ──────────────────────────── App Service Plan ──────────────────────

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: appServiceSkuName
  }
  properties: {}
}

// ──────────────────────────── Web App ───────────────────────────────

resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: webAppName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      minTlsVersion: '1.2'
      appSettings: [
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'ApplicationInsightsAgent_EXTENSION_VERSION'
          value: '~3'
        }
      ]
      connectionStrings: [
        {
          name: 'DefaultConnection'
          connectionString: 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Database=${sqlDatabaseName};User ID=${sqlAdminLogin};Password=${sqlAdminPassword};Encrypt=true;Connection Timeout=30;'
          type: 'SQLAzure'
        }
      ]
    }
  }
}

// ──────────────────────────── SQL Server ────────────────────────────

resource sqlServer 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    minimalTlsVersion: '1.2'
  }
}

resource sqlServerFirewallAzure 'Microsoft.Sql/servers/firewallRules@2023-08-01-preview' = {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// ──────────────────────────── SQL Database ──────────────────────────

resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
  parent: sqlServer
  name: sqlDatabaseName
  location: location
  sku: {
    name: sqlDatabaseSku
  }
  properties: {}
}

// ──────────────────────────── Outputs ───────────────────────────────

output webAppId string = webApp.id
output webAppDefaultHostName string = webApp.properties.defaultHostName
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
output sqlDatabaseId string = sqlDatabase.id
output appInsightsConnectionString string = appInsights.properties.ConnectionString
output logAnalyticsWorkspaceId string = logAnalyticsWorkspace.id
