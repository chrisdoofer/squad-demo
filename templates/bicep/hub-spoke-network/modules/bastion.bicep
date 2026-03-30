@description('Prefix for resource names')
param namePrefix string

@description('Azure region for resources')
param location string

@description('Tags to apply to all resources')
param tags object = {}

@description('Resource ID of the Azure Bastion subnet')
param subnetId string

resource bastionPublicIp 'Microsoft.Network/publicIPAddresses@2024-01-01' = {
  name: '${namePrefix}-bastion-pip'
  location: location
  tags: tags
  sku: {
    name: 'Standard'
  }
  properties: {
    publicIPAllocationMethod: 'Static'
    publicIPAddressVersion: 'IPv4'
  }
}

resource bastion 'Microsoft.Network/bastionHosts@2024-01-01' = {
  name: '${namePrefix}-bastion'
  location: location
  tags: tags
  sku: {
    name: 'Basic'
  }
  properties: {
    ipConfigurations: [
      {
        name: 'bastion-ipconfig'
        properties: {
          subnet: {
            id: subnetId
          }
          publicIPAddress: {
            id: bastionPublicIp.id
          }
        }
      }
    ]
  }
}

@description('Resource ID of Azure Bastion')
output bastionId string = bastion.id

@description('Name of Azure Bastion')
output bastionName string = bastion.name
