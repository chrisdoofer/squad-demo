@description('Name prefix for network resources.')
param appName string

@description('Azure region for resource deployment.')
param location string

@description('Tags to apply to all resources.')
param tags object = {}

var vnetName = '${appName}-vnet'
var vnetAddressPrefix = '10.0.0.0/16'

var subnets = [
  {
    name: 'snet-appgw'
    addressPrefix: '10.0.0.0/24'
    delegations: []
    serviceEndpoints: []
  }
  {
    name: 'snet-app'
    addressPrefix: '10.0.1.0/24'
    delegations: [
      {
        name: 'delegation-appservice'
        properties: {
          serviceName: 'Microsoft.Web/serverFarms'
        }
      }
    ]
    serviceEndpoints: []
  }
  {
    name: 'snet-private-endpoints'
    addressPrefix: '10.0.2.0/24'
    delegations: []
    serviceEndpoints: []
  }
  {
    name: 'AzureBastionSubnet'
    addressPrefix: '10.0.3.0/26'
    delegations: []
    serviceEndpoints: []
  }
]

resource nsgAppGw 'Microsoft.Network/networkSecurityGroups@2024-01-01' = {
  name: '${appName}-nsg-appgw'
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'AllowGatewayManager'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: 'GatewayManager'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '65200-65535'
        }
      }
      {
        name: 'AllowHttpsInbound'
        properties: {
          priority: 110
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: 'Internet'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '443'
        }
      }
    ]
  }
}

resource nsgApp 'Microsoft.Network/networkSecurityGroups@2024-01-01' = {
  name: '${appName}-nsg-app'
  location: location
  tags: tags
  properties: {
    securityRules: []
  }
}

resource nsgPe 'Microsoft.Network/networkSecurityGroups@2024-01-01' = {
  name: '${appName}-nsg-pe'
  location: location
  tags: tags
  properties: {
    securityRules: []
  }
}

resource virtualNetwork 'Microsoft.Network/virtualNetworks@2024-01-01' = {
  name: vnetName
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        vnetAddressPrefix
      ]
    }
    subnets: [for (subnet, i) in subnets: {
      name: subnet.name
      properties: {
        addressPrefix: subnet.addressPrefix
        delegations: subnet.delegations
        serviceEndpoints: subnet.serviceEndpoints
        networkSecurityGroup: {
          id: i == 0 ? nsgAppGw.id : (i == 1 ? nsgApp.id : (i == 2 ? nsgPe.id : nsgApp.id))
        }
      }
    }]
  }
}

@description('Resource ID of the Virtual Network.')
output vnetId string = virtualNetwork.id

@description('Name of the Virtual Network.')
output vnetName string = virtualNetwork.name

@description('Resource ID of the Application Gateway subnet.')
output appGwSubnetId string = virtualNetwork.properties.subnets[0].id

@description('Resource ID of the App Service integration subnet.')
output appSubnetId string = virtualNetwork.properties.subnets[1].id

@description('Resource ID of the Private Endpoints subnet.')
output privateEndpointSubnetId string = virtualNetwork.properties.subnets[2].id

@description('Resource ID of the Bastion subnet.')
output bastionSubnetId string = virtualNetwork.properties.subnets[3].id
