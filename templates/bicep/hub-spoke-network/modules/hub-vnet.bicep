@description('Name of the hub network.')
param hubName string

@description('Azure region for resource deployment.')
param location string

@description('Tags to apply to all resources.')
param tags object

resource hubVnet 'Microsoft.Network/virtualNetworks@2024-01-01' = {
  name: '${hubName}-hub-vnet'
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.0.0.0/16'
      ]
    }
    subnets: [
      {
        name: 'AzureFirewallSubnet'
        properties: {
          addressPrefix: '10.0.1.0/24'
        }
      }
      {
        name: 'AzureBastionSubnet'
        properties: {
          addressPrefix: '10.0.2.0/24'
        }
      }
      {
        name: 'GatewaySubnet'
        properties: {
          addressPrefix: '10.0.3.0/24'
        }
      }
      {
        name: 'snet-shared'
        properties: {
          addressPrefix: '10.0.4.0/24'
        }
      }
    ]
  }
}

@description('Resource ID of the hub Virtual Network.')
output hubVnetId string = hubVnet.id

@description('Name of the hub Virtual Network.')
output hubVnetName string = hubVnet.name

@description('Resource ID of the AzureFirewallSubnet.')
output firewallSubnetId string = hubVnet.properties.subnets[0].id

@description('Resource ID of the AzureBastionSubnet.')
output bastionSubnetId string = hubVnet.properties.subnets[1].id

@description('Resource ID of the GatewaySubnet.')
output gatewaySubnetId string = hubVnet.properties.subnets[2].id

@description('Resource ID of the shared services subnet.')
output sharedSubnetId string = hubVnet.properties.subnets[3].id
