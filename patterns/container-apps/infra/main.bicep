// Container Apps pattern: Container Apps Environment + 2 Container Apps + ACR + Cosmos DB + Redis
// Deploys a microservices application on Azure Container Apps with NoSQL data and caching.
targetScope = 'resourceGroup'

// ──────────────────────────── Parameters ────────────────────────────

@description('Base name for the application resources.')
param appName string

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Container image for the initial deployment (e.g. mcr.microsoft.com/azuredocs/containerapps-helloworld:latest).')
param containerImage string = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'

@description('Redis Cache SKU.')
@allowed(['Basic', 'Standard', 'Premium'])
param redisSku string = 'Basic'

// ──────────────────────────── Variables ─────────────────────────────

var uniqueSuffix = uniqueString(resourceGroup().id, appName)
var logAnalyticsName = 'log-${appName}-${uniqueSuffix}'
var containerEnvName = 'cae-${appName}-${uniqueSuffix}'
var frontendAppName = 'ca-frontend-${appName}-${uniqueSuffix}'
var backendAppName = 'ca-backend-${appName}-${uniqueSuffix}'
var acrName = replace('acr${appName}${uniqueSuffix}', '-', '')
var cosmosAccountName = 'cosmos-${appName}-${uniqueSuffix}'
var redisName = 'redis-${appName}-${uniqueSuffix}'

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

// ──────────────────────────── Container Apps Environment ────────────

resource containerAppsEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: containerEnvName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
  }
}

// ──────────────────────────── Container Registry ────────────────────

resource acr 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: acrName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

// ──────────────────────────── Frontend Container App ────────────────

resource frontendApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: frontendAppName
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 80
        transport: 'http'
      }
    }
    template: {
      containers: [
        {
          name: 'frontend'
          image: containerImage
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'BACKEND_URL'
              value: 'https://${backendAppName}.${containerAppsEnv.properties.defaultDomain}'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 10
      }
    }
  }
  dependsOn: [backendApp]
}

// ──────────────────────────── Backend Container App ─────────────────

resource backendApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: backendAppName
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnv.id
    configuration: {
      ingress: {
        external: false
        targetPort: 80
        transport: 'http'
      }
    }
    template: {
      containers: [
        {
          name: 'backend'
          image: containerImage
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'COSMOS_ENDPOINT'
              value: cosmosAccount.properties.documentEndpoint
            }
            {
              name: 'REDIS_HOST'
              value: '${redisCache.properties.hostName}:${redisCache.properties.sslPort}'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 10
      }
    }
  }
}

// ──────────────────────────── Cosmos DB ─────────────────────────────

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-02-15-preview' = {
  name: cosmosAccountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
      }
    ]
  }
}

// ──────────────────────────── Redis Cache ───────────────────────────

resource redisCache 'Microsoft.Cache/redis@2024-03-01' = {
  name: redisName
  location: location
  properties: {
    sku: {
      name: redisSku
      family: redisSku == 'Premium' ? 'P' : 'C'
      capacity: redisSku == 'Basic' ? 0 : 1
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
  }
}

// ──────────────────────────── Outputs ───────────────────────────────

output containerAppsEnvId string = containerAppsEnv.id
output frontendAppFqdn string = frontendApp.properties.configuration.ingress.fqdn
output frontendAppUrl string = 'https://${frontendApp.properties.configuration.ingress.fqdn}'
output backendAppFqdn string = backendApp.properties.configuration.ingress.fqdn
output acrLoginServer string = acr.properties.loginServer
output cosmosAccountId string = cosmosAccount.id
output cosmosDocumentEndpoint string = cosmosAccount.properties.documentEndpoint
output redisCacheHostName string = redisCache.properties.hostName
output logAnalyticsWorkspaceId string = logAnalyticsWorkspace.id
