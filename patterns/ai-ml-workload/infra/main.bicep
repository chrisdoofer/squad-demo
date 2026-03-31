// AI/ML Workload pattern: Azure OpenAI + Cognitive Services + App Service + Key Vault + App Insights
// Deploys an AI-powered application with Azure OpenAI, a web frontend, secrets management, and monitoring.
targetScope = 'resourceGroup'

// ──────────────────────────── Parameters ────────────────────────────

@description('Base name for the application resources.')
param appName string

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('SKU name for the Azure OpenAI account.')
@allowed(['S0'])
param openAiSkuName string = 'S0'

@description('App Service Plan SKU.')
param appServiceSkuName string = 'B1'

@description('OpenAI model name to deploy.')
param openAiModelName string = 'gpt-4'

@description('OpenAI model version.')
param openAiModelVersion string = '0613'

@description('Capacity (TPM in thousands) for the OpenAI deployment.')
@minValue(1)
param openAiDeploymentCapacity int = 10

// ──────────────────────────── Variables ─────────────────────────────

var uniqueSuffix = uniqueString(resourceGroup().id, appName)
var openAiAccountName = 'oai-${appName}-${uniqueSuffix}'
var openAiDeploymentName = 'gpt4-deployment'
var cognitiveServicesName = 'cog-${appName}-${uniqueSuffix}'
var appServicePlanName = 'plan-${appName}-${uniqueSuffix}'
var webAppName = 'app-${appName}-${uniqueSuffix}'
var keyVaultName = take('kv-${appName}-${uniqueSuffix}', 24)
var appInsightsName = 'appi-${appName}-${uniqueSuffix}'
var logAnalyticsName = 'log-${appName}-${uniqueSuffix}'

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

// ──────────────────────────── Azure OpenAI ──────────────────────────

resource openAiAccount 'Microsoft.CognitiveServices/accounts@2024-04-01-preview' = {
  name: openAiAccountName
  location: location
  kind: 'OpenAI'
  sku: {
    name: openAiSkuName
  }
  properties: {
    customSubDomainName: openAiAccountName
    publicNetworkAccess: 'Enabled'
  }
}

resource openAiDeployment 'Microsoft.CognitiveServices/accounts/deployments@2024-04-01-preview' = {
  parent: openAiAccount
  name: openAiDeploymentName
  sku: {
    name: 'Standard'
    capacity: openAiDeploymentCapacity
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: openAiModelName
      version: openAiModelVersion
    }
  }
}

// ──────────────────────────── Cognitive Services (multi-service) ────

resource cognitiveServices 'Microsoft.CognitiveServices/accounts@2024-04-01-preview' = {
  name: cognitiveServicesName
  location: location
  kind: 'CognitiveServices'
  sku: {
    name: 'S0'
  }
  properties: {
    customSubDomainName: cognitiveServicesName
    publicNetworkAccess: 'Enabled'
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
  identity: {
    type: 'SystemAssigned'
  }
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
          name: 'AZURE_OPENAI_ENDPOINT'
          value: openAiAccount.properties.endpoint
        }
        {
          name: 'AZURE_OPENAI_DEPLOYMENT'
          value: openAiDeploymentName
        }
        {
          name: 'AZURE_COGNITIVE_SERVICES_ENDPOINT'
          value: cognitiveServices.properties.endpoint
        }
        {
          name: 'KEY_VAULT_URI'
          value: keyVault.properties.vaultUri
        }
      ]
    }
  }
}

// Grant the Web App identity access to Key Vault secrets (Key Vault Secrets User)
resource kvRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(webApp.id, keyVault.id, 'kvsecretsuser')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6') // Key Vault Secrets User
    principalId: webApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// Store OpenAI key in Key Vault
resource openAiKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'openai-api-key'
  properties: {
    value: openAiAccount.listKeys().key1
  }
}

// ──────────────────────────── Outputs ───────────────────────────────

output webAppId string = webApp.id
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output openAiAccountId string = openAiAccount.id
output openAiEndpoint string = openAiAccount.properties.endpoint
output openAiDeploymentId string = openAiDeployment.id
output cognitiveServicesId string = cognitiveServices.id
output cognitiveServicesEndpoint string = cognitiveServices.properties.endpoint
output keyVaultId string = keyVault.id
output keyVaultUri string = keyVault.properties.vaultUri
output appInsightsConnectionString string = appInsights.properties.ConnectionString
