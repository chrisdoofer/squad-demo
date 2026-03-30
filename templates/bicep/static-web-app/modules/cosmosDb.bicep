@description('Name prefix for resources.')
param appName string

@description('Azure region for resource deployment.')
param location string

@description('Tags to apply to all resources.')
param tags object

@description('Name of the Cosmos DB database.')
param databaseName string = 'appdb'

@description('Name of the Cosmos DB container.')
param containerName string = 'items'

var uniqueSuffix = uniqueString(resourceGroup().id)

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  name: '${appName}-cosmos-${uniqueSuffix}'
  location: location
  tags: tags
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    capabilities: [
      {
        name: 'EnableServerless'
      }
    ]
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
  }
}

resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-05-15' = {
  parent: cosmosAccount
  name: databaseName
  properties: {
    resource: {
      id: databaseName
    }
  }
}

resource cosmosContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = {
  parent: cosmosDatabase
  name: containerName
  properties: {
    resource: {
      id: containerName
      partitionKey: {
        paths: [
          '/id'
        ]
        kind: 'Hash'
      }
    }
  }
}

@description('Resource ID of the Cosmos DB account.')
output cosmosAccountId string = cosmosAccount.id

@description('Cosmos DB account endpoint URI.')
output cosmosDbEndpoint string = cosmosAccount.properties.documentEndpoint

@description('Name of the Cosmos DB account.')
output cosmosAccountName string = cosmosAccount.name

@description('Primary connection string for the Cosmos DB account.')
#disable-next-line outputs-should-not-contain-secrets
output cosmosConnectionString string = cosmosAccount.listConnectionStrings().connectionStrings[0].connectionString

@description('Name of the Cosmos DB database.')
output cosmosDatabaseName string = cosmosDatabase.name
