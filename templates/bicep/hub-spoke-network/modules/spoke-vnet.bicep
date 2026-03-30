@description('Name of the hub network.')
param hubName string

@description('Index of the spoke (1-based).')
param spokeIndex int

@description('Azure region for resource deployment.')
param location string

@description('Tags to apply to all resources.')
param tags object

@description('Name of the hub Virtual Network for peering.')
param hubVnetName string

@description('Resource ID of the hub Virtual Network.')
param hubVnetId string

@description('Private IP address of the Azure Firewall for routing.')
param firewallPrivateIp string

var spokeName = '${hubName}-spoke-${spokeIndex}'
var addressPrefix = '10.${spokeIndex}.0.0/16'
var workloadSubnetPrefix = '10.${spokeIndex}.1.0/24'
var peSubnetPrefix = '10.${spokeIndex}.2.0/24'

resource nsg 'Microsoft.Network/networkSecurityGroups@2024-01-01' = {
  name: '${spokeName}-nsg-workload'
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'AllowHttpsInbound'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '443'
        }
      }
      {
        name: 'DenyAllInbound'
        properties: {
          priority: 4096
          direction: 'Inbound'
          access: 'Deny'
          protocol: '*'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
        }
      }
    ]
  }
}

resource routeTable 'Microsoft.Network/routeTables@2024-01-01' = {
  name: '${spokeName}-rt'
  location: location
  tags: tags
  properties: {
    disableBgpRoutePropagation: true
    routes: [
      {
        name: 'default-route-via-firewall'
        properties: {
          addressPrefix: '0.0.0.0/0'
          nextHopType: 'VirtualAppliance'
          nextHopIpAddress: firewallPrivateIp
        }
      }
    ]
  }
}

resource spokeVnet 'Microsoft.Network/virtualNetworks@2024-01-01' = {
  name: '${spokeName}-vnet'
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        addressPrefix
      ]
    }
    subnets: [
      {
        name: 'snet-workload'
        properties: {
          addressPrefix: workloadSubnetPrefix
          networkSecurityGroup: {
            id: nsg.id
          }
          routeTable: {
            id: routeTable.id
          }
        }
      }
      {
        name: 'snet-private-endpoints'
        properties: {
          addressPrefix: peSubnetPrefix
        }
      }
    ]
  }
}

// Peering: spoke → hub
resource spokeToHubPeering 'Microsoft.Network/virtualNetworks/virtualNetworkPeerings@2024-01-01' = {
  parent: spokeVnet
  name: 'peer-${spokeName}-to-hub'
  properties: {
    remoteVirtualNetwork: {
      id: hubVnetId
    }
    allowForwardedTraffic: true
    allowGatewayTransit: false
    useRemoteGateways: false
    allowVirtualNetworkAccess: true
  }
}

// Peering: hub → spoke
resource hubVnet 'Microsoft.Network/virtualNetworks@2024-01-01' existing = {
  name: hubVnetName
}

resource hubToSpokePeering 'Microsoft.Network/virtualNetworks/virtualNetworkPeerings@2024-01-01' = {
  parent: hubVnet
  name: 'peer-hub-to-${spokeName}'
  properties: {
    remoteVirtualNetwork: {
      id: spokeVnet.id
    }
    allowForwardedTraffic: true
    allowGatewayTransit: true
    allowVirtualNetworkAccess: true
  }
}

@description('Resource ID of the spoke Virtual Network.')
output spokeVnetId string = spokeVnet.id

@description('Name of the spoke Virtual Network.')
output spokeVnetName string = spokeVnet.name

@description('Resource ID of the workload subnet.')
output workloadSubnetId string = spokeVnet.properties.subnets[0].id

@description('Resource ID of the private endpoints subnet.')
output privateEndpointSubnetId string = spokeVnet.properties.subnets[1].id
