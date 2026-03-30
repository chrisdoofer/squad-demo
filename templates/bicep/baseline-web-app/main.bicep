targetScope = 'resourceGroup'

// ──────────────────────────────────────────────────────
// Baseline Zone-Redundant Web App
// AppGw + WAF ➜ App Service (VNet) ➜ SQL (Private Link) + Key Vault
// Reference: https://learn.microsoft.com/en-us/azure/architecture/web-apps/app-service/architectures/baseline-zone-redundant
// ──────────────────────────────────────────────────────

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

// ── Networking ──────────────────────────────
module network 'modules/network.bicep' = {
  name: '${appName}-network'
  params: {
    appName: appName
    location: location
    tags: tags
  }
}

// ── SQL Database (Private Link) ─────────────
module sql 'modules/sqlDatabase.bicep' = {
  name: '${appName}-sql'
  params: {
    appName: appName
    location: location
    sqlAdminLogin: sqlAdminLogin
    sqlAdminPassword: sqlAdminPassword
    privateEndpointSubnetId: network.outputs.privateEndpointSubnetId
    vnetId: network.outputs.vnetId
    tags: tags
  }
}

// ── App Service (VNet integrated) ───────────
module appService 'modules/appService.bicep' = {
  name: '${appName}-appservice'
  params: {
    appName: appName
    location: location
    subnetId: network.outputs.appSubnetId
    appInsightsConnectionString: monitoring.outputs.appInsightsConnectionString
    tags: tags
  }
}

// ── Key Vault (Private Link) ────────────────
module keyVault 'modules/keyVault.bicep' = {
  name: '${appName}-keyvault'
  params: {
    appName: appName
    location: location
    webAppPrincipalId: appService.outputs.webAppPrincipalId
    sqlServerFqdn: sql.outputs.sqlServerFqdn
    sqlAdminLogin: sqlAdminLogin
    sqlAdminPassword: sqlAdminPassword
    sqlDatabaseName: sql.outputs.sqlDatabaseName
    privateEndpointSubnetId: network.outputs.privateEndpointSubnetId
    vnetId: network.outputs.vnetId
    tags: tags
  }
}

// ── Application Gateway + WAF ───────────────
module appGateway 'modules/appGateway.bicep' = {
  name: '${appName}-appgateway'
  params: {
    appName: appName
    location: location
    subnetId: network.outputs.appGwSubnetId
    backendFqdn: appService.outputs.webAppHostName
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
    tags: tags
  }
}

// ── Outputs ─────────────────────────────────
@description('Public IP address of the Application Gateway.')
output appGatewayPublicIp string = appGateway.outputs.publicIpAddress

@description('Default hostname of the Web App.')
output webAppHostName string = appService.outputs.webAppHostName

@description('Resource ID of the Web App.')
output webAppId string = appService.outputs.webAppId

@description('Resource ID of the SQL Server.')
output sqlServerId string = sql.outputs.sqlServerId

@description('Resource ID of the Key Vault.')
output keyVaultId string = keyVault.outputs.keyVaultId

@description('Resource ID of the Virtual Network.')
output vnetId string = network.outputs.vnetId

@description('Resource ID of the Application Insights instance.')
output appInsightsId string = monitoring.outputs.appInsightsId
