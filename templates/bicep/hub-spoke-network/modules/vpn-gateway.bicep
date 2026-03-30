@description('Name of the hub network.')
param hubName string

@description('Azure region for resource deployment.')
param location string

@description('Tags to apply to all resources.')
param tags object

@description('Resource ID of the GatewaySubnet.')
param gatewaySubnetId string

resource vpnGatewayPublicIp 'Microsoft.Network/publicIPAddresses@2024-01-01' = {
  name: '${hubName}-vpngw-pip'
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

resource vpnGateway 'Microsoft.Network/virtualNetworkGateways@2024-01-01' = {
  name: '${hubName}-vpngw'
  location: location
  tags: tags
  properties: {
    gatewayType: 'Vpn'
    vpnType: 'RouteBased'
    sku: {
      name: 'VpnGw1'
      tier: 'VpnGw1'
    }
    ipConfigurations: [
      {
        name: 'vpngw-ipconfig'
        properties: {
          subnet: {
            id: gatewaySubnetId
          }
          publicIPAddress: {
            id: vpnGatewayPublicIp.id
          }
        }
      }
    ]
  }
}

@description('Resource ID of the VPN Gateway.')
output vpnGatewayId string = vpnGateway.id

@description('Name of the VPN Gateway.')
output vpnGatewayName string = vpnGateway.name
