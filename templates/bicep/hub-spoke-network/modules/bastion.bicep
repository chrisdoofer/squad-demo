@description('Name of the hub network.')
param hubName string

@description('Azure region for resource deployment.')
param location string

@description('Tags to apply to all resources.')
param tags object

@description('Resource ID of the AzureBastionSubnet.')
param bastionSubnetId string

resource bastionPublicIp 'Microsoft.Network/publicIPAddresses@2024-01-01' = {
  name: '${hubName}-bastion-pip'
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
  name: '${hubName}-bastion'
  location: location
  tags: tags
  sku: {
    name: 'Standard'
  }
  properties: {
    ipConfigurations: [
      {
        name: 'bastion-ipconfig'
        properties: {
          subnet: {
            id: bastionSubnetId
          }
          publicIPAddress: {
            id: bastionPublicIp.id
          }
        }
      }
    ]
  }
}

@description('Resource ID of the Azure Bastion.')
output bastionId string = bastion.id

@description('Name of the Azure Bastion.')
output bastionName string = bastion.name
