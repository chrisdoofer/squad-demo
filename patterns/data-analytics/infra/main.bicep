// Data Analytics pattern: Synapse Workspace + SQL Pool + Spark Pool + Data Lake + Data Factory + Key Vault
// Deploys a modern data analytics platform with lakehouse architecture and orchestration.
targetScope = 'resourceGroup'

// ──────────────────────────── Parameters ────────────────────────────

@description('Name of the Synapse workspace.')
param workspaceName string

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('SQL administrator login for the Synapse workspace.')
param sqlAdminLogin string

@secure()
@description('SQL administrator password for the Synapse workspace.')
param sqlAdminPassword string

@description('Synapse dedicated SQL pool SKU (DWU).')
param sqlPoolSku string = 'DW100c'

@description('Number of Spark nodes.')
@minValue(3)
@maxValue(200)
param sparkNodeCount int = 3

@description('Spark node size.')
@allowed(['Small', 'Medium', 'Large'])
param sparkNodeSize string = 'Small'

// ──────────────────────────── Variables ─────────────────────────────

var uniqueSuffix = uniqueString(resourceGroup().id, workspaceName)
var dataLakeName = take(replace('stdl${workspaceName}${uniqueSuffix}', '-', ''), 24)
var synapseName = 'syn-${workspaceName}-${uniqueSuffix}'
var sqlPoolName = 'sqlpool01'
var sparkPoolName = 'sparkpool01'
var dataFactoryName = 'adf-${workspaceName}-${uniqueSuffix}'
var keyVaultName = take('kv-${workspaceName}-${uniqueSuffix}', 24)
var dataLakeFileSystemName = 'default'

// ──────────────────────────── Data Lake Storage Gen2 ────────────────

resource dataLakeStorage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: dataLakeName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    isHnsEnabled: true
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    accessTier: 'Hot'
  }
}

resource dataLakeBlobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: dataLakeStorage
  name: 'default'
}

resource dataLakeFileSystem 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: dataLakeBlobService
  name: dataLakeFileSystemName
}

// ──────────────────────────── Key Vault ─────────────────────────────

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
  }
}

// ──────────────────────────── Synapse Workspace ─────────────────────

resource synapseWorkspace 'Microsoft.Synapse/workspaces@2021-06-01' = {
  name: synapseName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    defaultDataLakeStorage: {
      accountUrl: 'https://${dataLakeStorage.name}.dfs.${environment().suffixes.storage}'
      filesystem: dataLakeFileSystemName
    }
    sqlAdministratorLogin: sqlAdminLogin
    sqlAdministratorLoginPassword: sqlAdminPassword
  }
  dependsOn: [dataLakeFileSystem]
}

// Allow Azure services to access the Synapse workspace
resource synapseFirewall 'Microsoft.Synapse/workspaces/firewallRules@2021-06-01' = {
  parent: synapseWorkspace
  name: 'AllowAllWindowsAzureIps'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// ──────────────────────────── Synapse SQL Pool ──────────────────────

resource synapseSqlPool 'Microsoft.Synapse/workspaces/sqlPools@2021-06-01' = {
  parent: synapseWorkspace
  name: sqlPoolName
  location: location
  sku: {
    name: sqlPoolSku
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
  }
}

// ──────────────────────────── Synapse Spark Pool ────────────────────

resource synapseSparkPool 'Microsoft.Synapse/workspaces/bigDataPools@2021-06-01' = {
  parent: synapseWorkspace
  name: sparkPoolName
  location: location
  properties: {
    nodeCount: sparkNodeCount
    nodeSizeFamily: 'MemoryOptimized'
    nodeSize: sparkNodeSize
    autoScale: {
      enabled: true
      minNodeCount: 3
      maxNodeCount: sparkNodeCount
    }
    autoPause: {
      enabled: true
      delayInMinutes: 15
    }
    sparkVersion: '3.4'
  }
}

// ──────────────────────────── Data Factory ──────────────────────────

resource dataFactory 'Microsoft.DataFactory/factories@2018-06-01' = {
  name: dataFactoryName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {}
}

// ──────────────────────────── Outputs ───────────────────────────────

output synapseWorkspaceId string = synapseWorkspace.id
output synapseWorkspaceName string = synapseWorkspace.name
output synapseSqlEndpoint string = synapseWorkspace.properties.connectivityEndpoints.sql
output synapseDevEndpoint string = synapseWorkspace.properties.connectivityEndpoints.dev
output dataLakeStorageId string = dataLakeStorage.id
output dataLakeStorageDfsEndpoint string = 'https://${dataLakeStorage.name}.dfs.${environment().suffixes.storage}'
output dataFactoryId string = dataFactory.id
output keyVaultId string = keyVault.id
output keyVaultUri string = keyVault.properties.vaultUri
