targetScope = 'resourceGroup'

@description('Name prefix for hub resources')
param hubName string

@description('Azure region for all resources')
param location string = 'uksouth'

@description('Number of spoke VNets to deploy')
@minValue(1)
@maxValue(10)
param spokeCount int = 2

@description('Whether to deploy a VPN Gateway')
param enableVpnGateway bool = false

@description('Tags to apply to all resources')
param tags object = {}

// Spoke address space configuration: each spoke gets a /24 from the 10.x.0.0/16 range
var spokeConfigs = [for i in range(0, spokeCount): {
  addressPrefix: '10.${i + 1}.0.0/16'
  subnetPrefix: '10.${i + 1}.0.0/24'
}]

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${hubName}-law'
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

module hubNetwork 'modules/hubNetwork.bicep' = {
  name: 'hub-network-deployment'
  params: {
    namePrefix: hubName
    location: location
    tags: tags
  }
}

module spokeNetworks 'modules/spokeNetwork.bicep' = [for i in range(0, spokeCount): {
  name: 'spoke-${i + 1}-network-deployment'
  params: {
    namePrefix: hubName
    spokeIndex: i + 1
    location: location
    tags: tags
    spokeAddressPrefix: spokeConfigs[i].addressPrefix
    defaultSubnetPrefix: spokeConfigs[i].subnetPrefix
  }
}]

module firewall 'modules/firewall.bicep' = {
  name: 'firewall-deployment'
  params: {
    namePrefix: hubName
    location: location
    tags: tags
    subnetId: hubNetwork.outputs.firewallSubnetId
    logAnalyticsWorkspaceId: logAnalyticsWorkspace.id
  }
}

module bastion 'modules/bastion.bicep' = {
  name: 'bastion-deployment'
  params: {
    namePrefix: hubName
    location: location
    tags: tags
    subnetId: hubNetwork.outputs.bastionSubnetId
  }
}

module vpnGateway 'modules/vpnGateway.bicep' = if (enableVpnGateway) {
  name: 'vpn-gateway-deployment'
  params: {
    namePrefix: hubName
    location: location
    tags: tags
    subnetId: hubNetwork.outputs.gatewaySubnetId
  }
}

module peerings 'modules/peering.bicep' = [for i in range(0, spokeCount): {
  name: 'peering-${i + 1}-deployment'
  params: {
    hubVnetName: hubNetwork.outputs.hubVnetName
    hubVnetId: hubNetwork.outputs.hubVnetId
    spokeVnetName: spokeNetworks[i].outputs.spokeVnetName
    spokeVnetId: spokeNetworks[i].outputs.spokeVnetId
    allowGatewayTransit: enableVpnGateway
    useRemoteGateways: enableVpnGateway
  }
  dependsOn: [
    firewall
  ]
}]

@description('Hub VNet resource ID')
output hubVnetId string = hubNetwork.outputs.hubVnetId

@description('Firewall private IP address')
output firewallPrivateIp string = firewall.outputs.firewallPrivateIp

@description('Azure Bastion resource ID')
output bastionId string = bastion.outputs.bastionId

@description('Spoke VNet resource IDs')
output spokeVnetIds array = [for i in range(0, spokeCount): spokeNetworks[i].outputs.spokeVnetId]

@description('VPN Gateway resource ID (empty if not deployed)')
output vpnGatewayId string = enableVpnGateway ? vpnGateway!.outputs.vpnGatewayId : ''
