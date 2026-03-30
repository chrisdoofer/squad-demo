@description('Prefix for resource names')
param namePrefix string

@description('Spoke index number')
param spokeIndex int

@description('Azure region for resources')
param location string

@description('Tags to apply to all resources')
param tags object = {}

@description('Address prefix for the spoke virtual network')
param spokeAddressPrefix string

@description('Address prefix for the default subnet')
param defaultSubnetPrefix string

resource nsg 'Microsoft.Network/networkSecurityGroups@2024-01-01' = {
  name: '${namePrefix}-spoke-${spokeIndex}-nsg'
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'AllowVnetInbound'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: 'VirtualNetwork'
          destinationAddressPrefix: 'VirtualNetwork'
        }
      }
      {
        name: 'DenyAllInbound'
        properties: {
          priority: 4096
          direction: 'Inbound'
          access: 'Deny'
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
        }
      }
    ]
  }
}

resource spokeVnet 'Microsoft.Network/virtualNetworks@2024-01-01' = {
  name: '${namePrefix}-spoke-${spokeIndex}-vnet'
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        spokeAddressPrefix
      ]
    }
    subnets: [
      {
        name: 'default'
        properties: {
          addressPrefix: defaultSubnetPrefix
          networkSecurityGroup: {
            id: nsg.id
          }
        }
      }
    ]
  }
}

@description('Resource ID of the spoke virtual network')
output spokeVnetId string = spokeVnet.id

@description('Name of the spoke virtual network')
output spokeVnetName string = spokeVnet.name

@description('Resource ID of the default subnet')
output defaultSubnetId string = spokeVnet.properties.subnets[0].id

@description('Resource ID of the NSG')
output nsgId string = nsg.id
