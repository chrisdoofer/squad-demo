@description('Name of the hub virtual network')
param hubVnetName string

@description('Resource ID of the hub virtual network')
param hubVnetId string

@description('Name of the spoke virtual network')
param spokeVnetName string

@description('Resource ID of the spoke virtual network')
param spokeVnetId string

@description('Whether to allow gateway transit from hub')
param allowGatewayTransit bool = false

@description('Whether the spoke should use remote gateways')
param useRemoteGateways bool = false

resource hubToSpokePeering 'Microsoft.Network/virtualNetworks/virtualNetworkPeerings@2024-01-01' = {
  name: '${hubVnetName}/peer-to-${spokeVnetName}'
  properties: {
    remoteVirtualNetwork: {
      id: spokeVnetId
    }
    allowVirtualNetworkAccess: true
    allowForwardedTraffic: true
    allowGatewayTransit: allowGatewayTransit
    useRemoteGateways: false
  }
}

resource spokeToHubPeering 'Microsoft.Network/virtualNetworks/virtualNetworkPeerings@2024-01-01' = {
  name: '${spokeVnetName}/peer-to-${hubVnetName}'
  properties: {
    remoteVirtualNetwork: {
      id: hubVnetId
    }
    allowVirtualNetworkAccess: true
    allowForwardedTraffic: true
    allowGatewayTransit: false
    useRemoteGateways: useRemoteGateways
  }
}

@description('Resource ID of the hub-to-spoke peering')
output hubToSpokePeeringId string = hubToSpokePeering.id

@description('Resource ID of the spoke-to-hub peering')
output spokeToHubPeeringId string = spokeToHubPeering.id
