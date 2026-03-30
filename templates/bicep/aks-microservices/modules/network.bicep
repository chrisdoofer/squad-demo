@description('Prefix for resource names')
param namePrefix string

@description('Azure region for resources')
param location string

@description('Tags to apply to all resources')
param tags object = {}

@description('Address space for the virtual network')
param vnetAddressPrefix string = '10.0.0.0/16'

@description('Address prefix for the AKS subnet')
param aksSubnetPrefix string = '10.0.0.0/22'

@description('Address prefix for the services subnet')
param servicesSubnetPrefix string = '10.0.4.0/24'

resource vnet 'Microsoft.Network/virtualNetworks@2024-01-01' = {
  name: '${namePrefix}-vnet'
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        vnetAddressPrefix
      ]
    }
    subnets: [
      {
        name: 'aks-subnet'
        properties: {
          addressPrefix: aksSubnetPrefix
        }
      }
      {
        name: 'services-subnet'
        properties: {
          addressPrefix: servicesSubnetPrefix
        }
      }
    ]
  }
}

@description('Resource ID of the virtual network')
output vnetId string = vnet.id

@description('Name of the virtual network')
output vnetName string = vnet.name

@description('Resource ID of the AKS subnet')
output aksSubnetId string = vnet.properties.subnets[0].id

@description('Resource ID of the services subnet')
output servicesSubnetId string = vnet.properties.subnets[1].id
