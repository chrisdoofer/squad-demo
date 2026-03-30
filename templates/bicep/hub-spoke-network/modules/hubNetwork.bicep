@description('Prefix for resource names')
param namePrefix string

@description('Azure region for resources')
param location string

@description('Tags to apply to all resources')
param tags object = {}

@description('Address space for the hub virtual network')
param hubAddressPrefix string = '10.0.0.0/16'

@description('Address prefix for the Azure Firewall subnet')
param firewallSubnetPrefix string = '10.0.1.0/26'

@description('Address prefix for the Azure Bastion subnet')
param bastionSubnetPrefix string = '10.0.2.0/26'

@description('Address prefix for the Gateway subnet')
param gatewaySubnetPrefix string = '10.0.3.0/27'

resource hubVnet 'Microsoft.Network/virtualNetworks@2024-01-01' = {
  name: '${namePrefix}-hub-vnet'
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        hubAddressPrefix
      ]
    }
    subnets: [
      {
        name: 'AzureFirewallSubnet'
        properties: {
          addressPrefix: firewallSubnetPrefix
        }
      }
      {
        name: 'AzureBastionSubnet'
        properties: {
          addressPrefix: bastionSubnetPrefix
        }
      }
      {
        name: 'GatewaySubnet'
        properties: {
          addressPrefix: gatewaySubnetPrefix
        }
      }
    ]
  }
}

@description('Resource ID of the hub virtual network')
output hubVnetId string = hubVnet.id

@description('Name of the hub virtual network')
output hubVnetName string = hubVnet.name

@description('Resource ID of the Azure Firewall subnet')
output firewallSubnetId string = hubVnet.properties.subnets[0].id

@description('Resource ID of the Azure Bastion subnet')
output bastionSubnetId string = hubVnet.properties.subnets[1].id

@description('Resource ID of the Gateway subnet')
output gatewaySubnetId string = hubVnet.properties.subnets[2].id
