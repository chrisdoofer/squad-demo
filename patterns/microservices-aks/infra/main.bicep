// Microservices on AKS pattern: AKS + ACR + Service Bus + Cosmos DB + Log Analytics
// Deploys a production-ready Kubernetes cluster with supporting services for microservice workloads.
targetScope = 'resourceGroup'

// ──────────────────────────── Parameters ────────────────────────────

@description('Name of the AKS cluster.')
param clusterName string

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Number of nodes in the default node pool.')
@minValue(1)
@maxValue(50)
param nodeCount int = 3

@description('VM size for the AKS node pool.')
param nodeVmSize string = 'Standard_DS2_v2'

@description('Kubernetes version.')
param kubernetesVersion string = '1.29'

@description('Service Bus SKU.')
@allowed(['Basic', 'Standard', 'Premium'])
param serviceBusSku string = 'Standard'

// ──────────────────────────── Variables ─────────────────────────────

var uniqueSuffix = uniqueString(resourceGroup().id, clusterName)
var acrName = replace('acr${clusterName}${uniqueSuffix}', '-', '')
var logAnalyticsName = 'log-${clusterName}-${uniqueSuffix}'
var serviceBusName = 'sb-${clusterName}-${uniqueSuffix}'
var cosmosAccountName = 'cosmos-${clusterName}-${uniqueSuffix}'
var cosmosDatabaseName = 'app-database'

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

// ──────────────────────────── Azure Container Registry ──────────────

resource acr 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: acrName
  location: location
  sku: {
    name: 'Standard'
  }
  properties: {
    adminUserEnabled: false
  }
}

// ──────────────────────────── AKS Cluster ───────────────────────────

resource aksCluster 'Microsoft.ContainerService/managedClusters@2024-01-01' = {
  name: clusterName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    dnsPrefix: '${clusterName}-dns'
    kubernetesVersion: kubernetesVersion
    agentPoolProfiles: [
      {
        name: 'systempool'
        count: nodeCount
        vmSize: nodeVmSize
        osType: 'Linux'
        mode: 'System'
        enableAutoScaling: true
        minCount: 1
        maxCount: nodeCount * 2
      }
    ]
    networkProfile: {
      networkPlugin: 'azure'
      loadBalancerSku: 'standard'
    }
    addonProfiles: {
      omsagent: {
        enabled: true
        config: {
          logAnalyticsWorkspaceResourceID: logAnalyticsWorkspace.id
        }
      }
    }
  }
}

// Grant AKS pull access to ACR
resource acrPullRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(aksCluster.id, acr.id, 'acrpull')
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d') // AcrPull
    principalId: aksCluster.properties.identityProfile.kubeletidentity.objectId
    principalType: 'ServicePrincipal'
  }
}

// ──────────────────────────── Service Bus ───────────────────────────

resource serviceBusNamespace 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: serviceBusName
  location: location
  sku: {
    name: serviceBusSku
    tier: serviceBusSku
  }
}

resource serviceBusQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBusNamespace
  name: 'orders'
  properties: {
    maxDeliveryCount: 10
    lockDuration: 'PT1M'
    defaultMessageTimeToLive: 'P14D'
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

resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-02-15-preview' = {
  parent: cosmosAccount
  name: cosmosDatabaseName
  properties: {
    resource: {
      id: cosmosDatabaseName
    }
  }
}

// ──────────────────────────── Outputs ───────────────────────────────

output aksClusterId string = aksCluster.id
output aksClusterFqdn string = aksCluster.properties.fqdn
output acrLoginServer string = acr.properties.loginServer
output acrId string = acr.id
output serviceBusNamespaceId string = serviceBusNamespace.id
output serviceBusEndpoint string = serviceBusNamespace.properties.serviceBusEndpoint
output cosmosAccountId string = cosmosAccount.id
output cosmosDocumentEndpoint string = cosmosAccount.properties.documentEndpoint
output logAnalyticsWorkspaceId string = logAnalyticsWorkspace.id
