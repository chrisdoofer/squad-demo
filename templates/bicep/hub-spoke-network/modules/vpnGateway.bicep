@description('Prefix for resource names')
param namePrefix string

@description('Azure region for resources')
param location string

@description('Tags to apply to all resources')
param tags object = {}

@description('Resource ID of the Gateway subnet')
param subnetId string

resource vpnGatewayPublicIp 'Microsoft.Network/publicIPAddresses@2024-01-01' = {
  name: '${namePrefix}-vpngw-pip'
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
  name: '${namePrefix}-vpngw'
  location: location
  tags: tags
  properties: {
    gatewayType: 'Vpn'
    vpnType: 'RouteBased'
    sku: {
      name: 'VpnGw1'
      tier: 'VpnGw1'
    }
    enableBgp: false
    ipConfigurations: [
      {
        name: 'vpngw-ipconfig'
        properties: {
          privateIPAllocationMethod: 'Dynamic'
          subnet: {
            id: subnetId
          }
          publicIPAddress: {
            id: vpnGatewayPublicIp.id
          }
        }
      }
    ]
  }
}

@description('Resource ID of the VPN Gateway')
output vpnGatewayId string = vpnGateway.id

@description('Name of the VPN Gateway')
output vpnGatewayName string = vpnGateway.name

@description('Public IP address of the VPN Gateway')
output vpnGatewayPublicIp string = vpnGatewayPublicIp.properties.ipAddress
