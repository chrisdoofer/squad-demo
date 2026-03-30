targetScope = 'resourceGroup'

// ──────────────────────────────────────────────
// Hub-Spoke Network — Azure Hub-Spoke Topology
// Reference: https://learn.microsoft.com/en-us/azure/architecture/networking/architecture/hub-spoke
// ──────────────────────────────────────────────

@description('Name of the hub network. Used as a prefix for all resources.')
param hubName string

@description('Azure region for resource deployment.')
param location string = resourceGroup().location

@description('Number of spoke virtual networks to deploy.')
param spokeCount int = 2

@description('Enable VPN Gateway deployment in the hub.')
param enableVpnGateway bool = false

@description('Enable Azure Bastion deployment in the hub.')
param enableBastion bool = true

@allowed([
  'dev'
  'staging'
  'prod'
])
@description('Deployment environment.')
param environment string = 'dev'

var tags = {
  environment: environment
  project: hubName
}

// ── Monitoring ──────────────────────────────
module monitoring 'modules/monitoring.bicep' = {
  name: '${hubName}-monitoring'
  params: {
    hubName: hubName
    location: location
    tags: tags
  }
}

// ── Hub Virtual Network ─────────────────────
module hubVnet 'modules/hub-vnet.bicep' = {
  name: '${hubName}-hub-vnet'
  params: {
    hubName: hubName
    location: location
    tags: tags
  }
}

// ── Azure Firewall ──────────────────────────
module firewall 'modules/firewall.bicep' = {
  name: '${hubName}-firewall'
  params: {
    hubName: hubName
    location: location
    tags: tags
    firewallSubnetId: hubVnet.outputs.firewallSubnetId
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
  }
}

// ── Spoke Virtual Networks ──────────────────
module spokeVnets 'modules/spoke-vnet.bicep' = [for i in range(1, spokeCount): {
  name: '${hubName}-spoke-${i}'
  params: {
    hubName: hubName
    spokeIndex: i
    location: location
    tags: tags
    hubVnetName: hubVnet.outputs.hubVnetName
    hubVnetId: hubVnet.outputs.hubVnetId
    firewallPrivateIp: firewall.outputs.firewallPrivateIp
  }
}]

// ── Azure Bastion (optional) ────────────────
module bastion 'modules/bastion.bicep' = if (enableBastion) {
  name: '${hubName}-bastion'
  params: {
    hubName: hubName
    location: location
    tags: tags
    bastionSubnetId: hubVnet.outputs.bastionSubnetId
  }
}

// ── VPN Gateway (optional) ──────────────────
module vpnGateway 'modules/vpn-gateway.bicep' = if (enableVpnGateway) {
  name: '${hubName}-vpngw'
  params: {
    hubName: hubName
    location: location
    tags: tags
    gatewaySubnetId: hubVnet.outputs.gatewaySubnetId
  }
}

// ── Outputs ─────────────────────────────────
@description('Private IP address of the Azure Firewall.')
output firewallPrivateIp string = firewall.outputs.firewallPrivateIp

@description('Name of the Azure Bastion host.')
output bastionName string = enableBastion ? bastion!.outputs.bastionName : 'not-deployed'

@description('Resource ID of the hub Virtual Network.')
output hubVnetId string = hubVnet.outputs.hubVnetId

@description('Array of spoke Virtual Network resource IDs.')
output spokeVnetIds array = [for i in range(0, spokeCount): spokeVnets[i].outputs.spokeVnetId]
