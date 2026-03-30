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

resource cosmosDbAccount 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
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

resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-05-15' = {
  parent: cosmosDbAccount
  name: databaseName
  properties: {
    resource: {
      id: databaseName
    }
  }
}

resource container 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = {
  parent: database
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
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          {
            path: '/*'
          }
        ]
      }
    }
  }
}

@description('Resource ID of the Cosmos DB account.')
output cosmosDbAccountId string = cosmosDbAccount.id

@description('Name of the Cosmos DB account.')
output cosmosDbAccountName string = cosmosDbAccount.name

@description('Endpoint URI of the Cosmos DB account.')
output cosmosDbEndpoint string = cosmosDbAccount.properties.documentEndpoint

@description('Primary connection string for the Cosmos DB account.')
#disable-next-line outputs-should-not-contain-secrets
output cosmosDbConnectionString string = cosmosDbAccount.listConnectionStrings().connectionStrings[0].connectionString

@description('Name of the Cosmos DB database.')
output databaseName string = database.name
