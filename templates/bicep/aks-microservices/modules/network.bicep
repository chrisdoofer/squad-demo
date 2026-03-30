@description('Azure region for all resources')
param location string

@description('Cluster name prefix')
param clusterName string

@description('Environment name')
param environment string

@description('Resource tags')
param tags object

var vnetName = 'vnet-${clusterName}-${environment}'

resource nsgAks 'Microsoft.Network/networkSecurityGroups@2024-01-01' = {
  name: 'nsg-aks-${environment}'
  location: location
  tags: tags
  properties: {
    securityRules: []
  }
}

resource nsgServices 'Microsoft.Network/networkSecurityGroups@2024-01-01' = {
  name: 'nsg-services-${environment}'
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
        '10.0.0.0/12'
      ]
    }
    subnets: [
      {
        name: 'snet-aks'
        properties: {
          addressPrefix: '10.0.0.0/16'
          networkSecurityGroup: {
            id: nsgAks.id
          }
        }
      }
      {
        name: 'snet-services'
        properties: {
          addressPrefix: '10.1.0.0/24'
          networkSecurityGroup: {
            id: nsgServices.id
          }
        }
      }
    ]
  }
}

output vnetId string = vnet.id
output vnetName string = vnet.name
output aksSubnetId string = vnet.properties.subnets[0].id
output servicesSubnetId string = vnet.properties.subnets[1].id
