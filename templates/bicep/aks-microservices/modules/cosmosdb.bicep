@description('Azure region for all resources')
param location string

@description('Cluster name prefix')
param clusterName string

@description('Environment name')
param environment string

@description('Resource tags')
param tags object

var suffix = uniqueString(resourceGroup().id)
var cosmosAccountName = toLower('cosmos-${clusterName}-${environment}-${suffix}')

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  name: cosmosAccountName
  location: location
  tags: tags
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    enableAutomaticFailover: true
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: true
      }
    ]
    backupPolicy: {
      type: 'Periodic'
      periodicModeProperties: {
        backupIntervalInMinutes: 240
        backupRetentionIntervalInHours: 8
        backupStorageRedundancy: 'Geo'
      }
    }
  }
}

resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-05-15' = {
  parent: cosmosAccount
  name: '${clusterName}-db'
  tags: tags
  properties: {
    resource: {
      id: '${clusterName}-db'
    }
  }
}

output cosmosDbEndpoint string = cosmosAccount.properties.documentEndpoint
output cosmosDbName string = cosmosAccount.name
output cosmosDbId string = cosmosAccount.id

