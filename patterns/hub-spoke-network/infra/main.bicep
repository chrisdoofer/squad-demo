// Hub-Spoke Network pattern: Hub VNet + Azure Firewall + Bastion + 2 Spoke VNets + Peerings
// Deploys a hub-and-spoke network topology with centralised firewall and secure management access.
targetScope = 'resourceGroup'

// ──────────────────────────── Parameters ────────────────────────────

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Address prefix for the hub VNet (e.g. 10.0.0.0/16).')
param hubAddressPrefix string = '10.0.0.0/16'

@description('Address prefix for spoke 1 VNet (e.g. 10.1.0.0/16).')
param spoke1AddressPrefix string = '10.1.0.0/16'

@description('Address prefix for spoke 2 VNet (e.g. 10.2.0.0/16).')
param spoke2AddressPrefix string = '10.2.0.0/16'

@description('SKU tier for the Azure Firewall.')
@allowed(['Standard', 'Premium'])
param firewallSkuTier string = 'Standard'

// ──────────────────────────── Variables ─────────────────────────────

var uniqueSuffix = uniqueString(resourceGroup().id)
var hubVNetName = 'vnet-hub-${uniqueSuffix}'
var spoke1VNetName = 'vnet-spoke1-${uniqueSuffix}'
var spoke2VNetName = 'vnet-spoke2-${uniqueSuffix}'
var firewallName = 'fw-hub-${uniqueSuffix}'
var firewallPolicyName = 'fwpol-hub-${uniqueSuffix}'
var firewallPublicIpName = 'pip-fw-${uniqueSuffix}'
var bastionName = 'bastion-hub-${uniqueSuffix}'
var bastionPublicIpName = 'pip-bastion-${uniqueSuffix}'

// ──────────────────────────── Hub VNet ──────────────────────────────

resource hubVNet 'Microsoft.Network/virtualNetworks@2024-01-01' = {
  name: hubVNetName
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [hubAddressPrefix]
    }
    subnets: [
      {
        name: 'AzureFirewallSubnet'
        properties: {
          addressPrefix: cidrSubnet(hubAddressPrefix, 26, 0)
        }
      }
      {
        name: 'GatewaySubnet'
        properties: {
          addressPrefix: cidrSubnet(hubAddressPrefix, 26, 1)
        }
      }
      {
        name: 'AzureBastionSubnet'
        properties: {
          addressPrefix: cidrSubnet(hubAddressPrefix, 26, 2)
        }
      }
    ]
  }
}

// ──────────────────────────── Spoke 1 VNet ──────────────────────────

resource spoke1VNet 'Microsoft.Network/virtualNetworks@2024-01-01' = {
  name: spoke1VNetName
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [spoke1AddressPrefix]
    }
    subnets: [
      {
        name: 'default'
        properties: {
          addressPrefix: cidrSubnet(spoke1AddressPrefix, 24, 0)
        }
      }
    ]
  }
}

// ──────────────────────────── Spoke 2 VNet ──────────────────────────

resource spoke2VNet 'Microsoft.Network/virtualNetworks@2024-01-01' = {
  name: spoke2VNetName
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [spoke2AddressPrefix]
    }
    subnets: [
      {
        name: 'default'
        properties: {
          addressPrefix: cidrSubnet(spoke2AddressPrefix, 24, 0)
        }
      }
    ]
  }
}

// ──────────────────────────── VNet Peerings ─────────────────────────

resource hubToSpoke1 'Microsoft.Network/virtualNetworks/virtualNetworkPeerings@2024-01-01' = {
  parent: hubVNet
  name: 'hub-to-spoke1'
  properties: {
    remoteVirtualNetwork: {
      id: spoke1VNet.id
    }
    allowVirtualNetworkAccess: true
    allowForwardedTraffic: true
    allowGatewayTransit: true
  }
}

resource spoke1ToHub 'Microsoft.Network/virtualNetworks/virtualNetworkPeerings@2024-01-01' = {
  parent: spoke1VNet
  name: 'spoke1-to-hub'
  properties: {
    remoteVirtualNetwork: {
      id: hubVNet.id
    }
    allowVirtualNetworkAccess: true
    allowForwardedTraffic: true
    useRemoteGateways: false
  }
}

resource hubToSpoke2 'Microsoft.Network/virtualNetworks/virtualNetworkPeerings@2024-01-01' = {
  parent: hubVNet
  name: 'hub-to-spoke2'
  properties: {
    remoteVirtualNetwork: {
      id: spoke2VNet.id
    }
    allowVirtualNetworkAccess: true
    allowForwardedTraffic: true
    allowGatewayTransit: true
  }
}

resource spoke2ToHub 'Microsoft.Network/virtualNetworks/virtualNetworkPeerings@2024-01-01' = {
  parent: spoke2VNet
  name: 'spoke2-to-hub'
  properties: {
    remoteVirtualNetwork: {
      id: hubVNet.id
    }
    allowVirtualNetworkAccess: true
    allowForwardedTraffic: true
    useRemoteGateways: false
  }
}

// ──────────────────────────── Firewall Policy ───────────────────────

resource firewallPolicy 'Microsoft.Network/firewallPolicies@2024-01-01' = {
  name: firewallPolicyName
  location: location
  properties: {
    sku: {
      tier: firewallSkuTier
    }
    threatIntelMode: 'Alert'
  }
}

// ──────────────────────────── Firewall Public IP ────────────────────

resource firewallPublicIp 'Microsoft.Network/publicIPAddresses@2024-01-01' = {
  name: firewallPublicIpName
  location: location
  sku: {
    name: 'Standard'
  }
  properties: {
    publicIPAllocationMethod: 'Static'
  }
}

// ──────────────────────────── Azure Firewall ────────────────────────

resource firewall 'Microsoft.Network/azureFirewalls@2024-01-01' = {
  name: firewallName
  location: location
  properties: {
    sku: {
      name: 'AZFW_VNet'
      tier: firewallSkuTier
    }
    firewallPolicy: {
      id: firewallPolicy.id
    }
    ipConfigurations: [
      {
        name: 'fw-ipconfig'
        properties: {
          publicIPAddress: {
            id: firewallPublicIp.id
          }
          subnet: {
            id: hubVNet.properties.subnets[0].id
          }
        }
      }
    ]
  }
}

// ──────────────────────────── Bastion Public IP ─────────────────────

resource bastionPublicIp 'Microsoft.Network/publicIPAddresses@2024-01-01' = {
  name: bastionPublicIpName
  location: location
  sku: {
    name: 'Standard'
  }
  properties: {
    publicIPAllocationMethod: 'Static'
  }
}

// ──────────────────────────── Bastion Host ──────────────────────────

resource bastion 'Microsoft.Network/bastionHosts@2024-01-01' = {
  name: bastionName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    ipConfigurations: [
      {
        name: 'bastion-ipconfig'
        properties: {
          publicIPAddress: {
            id: bastionPublicIp.id
          }
          subnet: {
            id: hubVNet.properties.subnets[2].id
          }
        }
      }
    ]
  }
}

// ──────────────────────────── Outputs ───────────────────────────────

output hubVNetId string = hubVNet.id
output spoke1VNetId string = spoke1VNet.id
output spoke2VNetId string = spoke2VNet.id
output firewallPrivateIp string = firewall.properties.ipConfigurations[0].properties.privateIPAddress
output firewallPublicIpAddress string = firewallPublicIp.properties.ipAddress
output bastionId string = bastion.id
output firewallPolicyId string = firewallPolicy.id
