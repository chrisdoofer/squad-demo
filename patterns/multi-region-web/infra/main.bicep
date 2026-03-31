// Multi-Region Web App pattern: 2 × App Service + Front Door + SQL geo-replication
// Deploys a globally available web app with traffic management and database failover across two regions.
targetScope = 'resourceGroup'

// ──────────────────────────── Parameters ────────────────────────────

@description('Base name for the application resources.')
param appName string

@description('Primary Azure region.')
param primaryLocation string

@description('Secondary Azure region for geo-redundancy.')
param secondaryLocation string

@description('Administrator login for the SQL Server.')
param sqlAdminLogin string

@secure()
@description('Administrator password for the SQL Server.')
param sqlAdminPassword string

@description('App Service Plan SKU.')
param appServiceSkuName string = 'S1'

// ──────────────────────────── Variables ─────────────────────────────

var uniqueSuffix = uniqueString(resourceGroup().id, appName)
var primaryPlanName = 'plan-${appName}-primary-${uniqueSuffix}'
var secondaryPlanName = 'plan-${appName}-secondary-${uniqueSuffix}'
var primaryWebAppName = 'app-${appName}-primary-${uniqueSuffix}'
var secondaryWebAppName = 'app-${appName}-secondary-${uniqueSuffix}'
var primarySqlServerName = 'sql-${appName}-primary-${uniqueSuffix}'
var secondarySqlServerName = 'sql-${appName}-secondary-${uniqueSuffix}'
var sqlDatabaseName = 'sqldb-${appName}'
var frontDoorProfileName = 'afd-${appName}-${uniqueSuffix}'
var frontDoorEndpointName = 'fde-${appName}-${uniqueSuffix}'
var frontDoorOriginGroupName = 'default-origin-group'
var frontDoorRouteName = 'default-route'

// ──────────────────────────── Primary App Service ───────────────────

resource primaryPlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: primaryPlanName
  location: primaryLocation
  sku: {
    name: appServiceSkuName
  }
  properties: {}
}

resource primaryWebApp 'Microsoft.Web/sites@2023-12-01' = {
  name: primaryWebAppName
  location: primaryLocation
  properties: {
    serverFarmId: primaryPlan.id
    httpsOnly: true
    siteConfig: {
      minTlsVersion: '1.2'
      connectionStrings: [
        {
          name: 'DefaultConnection'
          connectionString: 'Server=tcp:${primarySqlServer.properties.fullyQualifiedDomainName},1433;Database=${sqlDatabaseName};User ID=${sqlAdminLogin};Password=${sqlAdminPassword};Encrypt=true;Connection Timeout=30;'
          type: 'SQLAzure'
        }
      ]
    }
  }
}

// ──────────────────────────── Secondary App Service ─────────────────

resource secondaryPlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: secondaryPlanName
  location: secondaryLocation
  sku: {
    name: appServiceSkuName
  }
  properties: {}
}

resource secondaryWebApp 'Microsoft.Web/sites@2023-12-01' = {
  name: secondaryWebAppName
  location: secondaryLocation
  properties: {
    serverFarmId: secondaryPlan.id
    httpsOnly: true
    siteConfig: {
      minTlsVersion: '1.2'
      connectionStrings: [
        {
          name: 'DefaultConnection'
          connectionString: 'Server=tcp:${secondarySqlServer.properties.fullyQualifiedDomainName},1433;Database=${sqlDatabaseName};User ID=${sqlAdminLogin};Password=${sqlAdminPassword};Encrypt=true;Connection Timeout=30;'
          type: 'SQLAzure'
        }
      ]
    }
  }
}

// ──────────────────────────── Primary SQL Server + Database ─────────

resource primarySqlServer 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: primarySqlServerName
  location: primaryLocation
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    minimalTlsVersion: '1.2'
  }
}

resource primarySqlFirewall 'Microsoft.Sql/servers/firewallRules@2023-08-01-preview' = {
  parent: primarySqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
  parent: primarySqlServer
  name: sqlDatabaseName
  location: primaryLocation
  sku: {
    name: 'S1'
    tier: 'Standard'
  }
  properties: {}
}

// ──────────────────────────── Secondary SQL Server + Geo-Replica ────

resource secondarySqlServer 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: secondarySqlServerName
  location: secondaryLocation
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    minimalTlsVersion: '1.2'
  }
}

resource secondarySqlFirewall 'Microsoft.Sql/servers/firewallRules@2023-08-01-preview' = {
  parent: secondarySqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource sqlDatabaseReplica 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
  parent: secondarySqlServer
  name: sqlDatabaseName
  location: secondaryLocation
  properties: {
    createMode: 'Secondary'
    sourceDatabaseId: sqlDatabase.id
  }
}

// ──────────────────────────── Front Door ────────────────────────────

resource frontDoorProfile 'Microsoft.Cdn/profiles@2024-02-01' = {
  name: frontDoorProfileName
  location: 'global'
  sku: {
    name: 'Standard_AzureFrontDoor'
  }
}

resource frontDoorEndpoint 'Microsoft.Cdn/profiles/afdEndpoints@2024-02-01' = {
  parent: frontDoorProfile
  name: frontDoorEndpointName
  location: 'global'
  properties: {
    enabledState: 'Enabled'
  }
}

resource frontDoorOriginGroup 'Microsoft.Cdn/profiles/originGroups@2024-02-01' = {
  parent: frontDoorProfile
  name: frontDoorOriginGroupName
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
      additionalLatencyInMilliseconds: 50
    }
    healthProbeSettings: {
      probePath: '/'
      probeRequestType: 'HEAD'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 30
    }
    sessionAffinityState: 'Disabled'
  }
}

resource primaryOrigin 'Microsoft.Cdn/profiles/originGroups/origins@2024-02-01' = {
  parent: frontDoorOriginGroup
  name: 'primary-origin'
  properties: {
    hostName: primaryWebApp.properties.defaultHostName
    httpPort: 80
    httpsPort: 443
    originHostHeader: primaryWebApp.properties.defaultHostName
    priority: 1
    weight: 1000
    enabledState: 'Enabled'
  }
}

resource secondaryOrigin 'Microsoft.Cdn/profiles/originGroups/origins@2024-02-01' = {
  parent: frontDoorOriginGroup
  name: 'secondary-origin'
  properties: {
    hostName: secondaryWebApp.properties.defaultHostName
    httpPort: 80
    httpsPort: 443
    originHostHeader: secondaryWebApp.properties.defaultHostName
    priority: 2
    weight: 1000
    enabledState: 'Enabled'
  }
}

resource frontDoorRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2024-02-01' = {
  parent: frontDoorEndpoint
  name: frontDoorRouteName
  properties: {
    originGroup: {
      id: frontDoorOriginGroup.id
    }
    supportedProtocols: ['Https']
    patternsToMatch: ['/*']
    forwardingProtocol: 'HttpsOnly'
    httpsRedirect: 'Enabled'
    linkToDefaultDomain: 'Enabled'
  }
  dependsOn: [
    primaryOrigin
    secondaryOrigin
  ]
}

// ──────────────────────────── Outputs ───────────────────────────────

output primaryWebAppId string = primaryWebApp.id
output primaryWebAppUrl string = 'https://${primaryWebApp.properties.defaultHostName}'
output secondaryWebAppId string = secondaryWebApp.id
output secondaryWebAppUrl string = 'https://${secondaryWebApp.properties.defaultHostName}'
output frontDoorEndpointHostName string = frontDoorEndpoint.properties.hostName
output frontDoorUrl string = 'https://${frontDoorEndpoint.properties.hostName}'
output primarySqlServerFqdn string = primarySqlServer.properties.fullyQualifiedDomainName
output secondarySqlServerFqdn string = secondarySqlServer.properties.fullyQualifiedDomainName
