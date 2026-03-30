targetScope = 'resourceGroup'

@description('Name of the web application (used as prefix for all resources)')
param appName string

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('SQL Server administrator login')
param sqlAdminLogin string

@description('SQL Server administrator password')
@secure()
param sqlAdminPassword string

@description('Environment name')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environment string = 'dev'

@description('Base64-encoded PFX certificate data for Application Gateway HTTPS listener')
@secure()
param sslCertificateData string

@description('Password for the PFX certificate')
@secure()
param sslCertificatePassword string

var tags = {
  environment: environment
  project: appName
}

var suffix = uniqueString(resourceGroup().id)
var keyVaultName = take('kv-${appName}-${suffix}', 24)

module network 'modules/network.bicep' = {
  name: 'network'
  params: {
    location: location
    appName: appName
    environment: environment
    tags: tags
  }
}

module privateDns 'modules/private-dns.bicep' = {
  name: 'privateDns'
  params: {
    tags: tags
    vnetId: network.outputs.vnetId
  }
}

module monitoring 'modules/monitoring.bicep' = {
  name: 'monitoring'
  params: {
    location: location
    appName: appName
    environment: environment
    tags: tags
  }
}

module appService 'modules/app-service.bicep' = {
  name: 'appService'
  params: {
    location: location
    appName: appName
    environment: environment
    tags: tags
    appSubnetId: network.outputs.appSubnetId
    privateEndpointsSubnetId: network.outputs.privateEndpointsSubnetId
    appInsightsConnectionString: monitoring.outputs.appInsightsConnectionString
    keyVaultName: keyVaultName
    privateDnsZoneId: privateDns.outputs.webAppsDnsZoneId
  }
}

module sql 'modules/sql.bicep' = {
  name: 'sql'
  params: {
    location: location
    appName: appName
    environment: environment
    tags: tags
    privateEndpointsSubnetId: network.outputs.privateEndpointsSubnetId
    sqlAdminLogin: sqlAdminLogin
    sqlAdminPassword: sqlAdminPassword
    privateDnsZoneId: privateDns.outputs.sqlDnsZoneId
  }
}

module keyVault 'modules/keyvault.bicep' = {
  name: 'keyVault'
  params: {
    location: location
    tags: tags
    keyVaultName: keyVaultName
    privateEndpointsSubnetId: network.outputs.privateEndpointsSubnetId
    appServicePrincipalId: appService.outputs.appServicePrincipalId
    sqlConnectionString: 'Server=tcp:${sql.outputs.sqlServerFqdn},1433;Initial Catalog=${sql.outputs.sqlDatabaseName};Persist Security Info=False;User ID=${sqlAdminLogin};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
    privateDnsZoneId: privateDns.outputs.keyVaultDnsZoneId
  }
}

module appGateway 'modules/app-gateway.bicep' = {
  name: 'appGateway'
  params: {
    location: location
    appName: appName
    environment: environment
    tags: tags
    subnetId: network.outputs.appGatewaySubnetId
    appServiceHostName: appService.outputs.appServiceDefaultHostName
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsId
    sslCertificateData: sslCertificateData
    sslCertificatePassword: sslCertificatePassword
  }
}

output appGatewayPublicIp string = appGateway.outputs.appGatewayPublicIp
output appServiceName string = appService.outputs.appServiceName
output keyVaultName string = keyVault.outputs.keyVaultName
