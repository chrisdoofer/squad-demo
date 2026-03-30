@description('Azure region for all resources')
param location string

@description('Application name prefix')
param appName string

@description('Environment name')
param environment string

@description('Resource tags')
param tags object

var vnetName = 'vnet-${appName}-${environment}'

resource nsgAppGateway 'Microsoft.Network/networkSecurityGroups@2024-01-01' = {
  name: 'nsg-appgateway-${environment}'
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'AllowHTTP'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '80'
          sourceAddressPrefix: 'Internet'
          destinationAddressPrefix: '*'
        }
      }
      {
        name: 'AllowHTTPS'
        properties: {
          priority: 110
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: 'Internet'
          destinationAddressPrefix: '*'
        }
      }
      {
        name: 'AllowGatewayManager'
        properties: {
          priority: 120
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '65200-65535'
          sourceAddressPrefix: 'GatewayManager'
          destinationAddressPrefix: '*'
        }
      }
      {
        name: 'AllowAzureLoadBalancer'
        properties: {
          priority: 130
          direction: 'Inbound'
          access: 'Allow'
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: 'AzureLoadBalancer'
          destinationAddressPrefix: '*'
        }
      }
    ]
  }
}

resource nsgApp 'Microsoft.Network/networkSecurityGroups@2024-01-01' = {
  name: 'nsg-app-${environment}'
  location: location
  tags: tags
  properties: {
    securityRules: []
  }
}

resource nsgPrivateEndpoints 'Microsoft.Network/networkSecurityGroups@2024-01-01' = {
  name: 'nsg-pe-${environment}'
  location: location
  tags: tags
  properties: {
    securityRules: []
  }
}

resource vnet 'Microsoft.Network/virtualNetworks@2024-01-01' = {
  name: vnetName
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
        name: 'snet-appgateway'
        properties: {
          addressPrefix: '10.0.1.0/24'
          networkSecurityGroup: {
            id: nsgAppGateway.id
          }
        }
      }
      {
        name: 'snet-app'
        properties: {
          addressPrefix: '10.0.2.0/24'
          networkSecurityGroup: {
            id: nsgApp.id
          }
          delegations: [
            {
              name: 'delegation-app-service'
              properties: {
                serviceName: 'Microsoft.Web/serverFarms'
              }
            }
          ]
        }
      }
      {
        name: 'snet-private-endpoints'
        properties: {
          addressPrefix: '10.0.3.0/24'
          networkSecurityGroup: {
            id: nsgPrivateEndpoints.id
          }
        }
      }
    ]
  }
}

output vnetId string = vnet.id
output vnetName string = vnet.name
output appGatewaySubnetId string = vnet.properties.subnets[0].id
output appSubnetId string = vnet.properties.subnets[1].id
output privateEndpointsSubnetId string = vnet.properties.subnets[2].id
