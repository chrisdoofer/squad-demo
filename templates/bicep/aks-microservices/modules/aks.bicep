@description('Azure region for all resources')
param location string

@description('Cluster name prefix')
param clusterName string

@description('Environment name')
param environment string

@description('Resource tags')
param tags object

@description('Subnet ID for AKS nodes and pods')
param aksSubnetId string

@description('Initial node count for the user node pool')
param nodeCount int

@description('VM size for node pools')
param nodeVmSize string

@description('Log Analytics workspace ID for Container Insights')
param logAnalyticsWorkspaceId string

var aksClusterName = 'aks-${clusterName}-${environment}'
var dnsPrefix = 'aks-${clusterName}-${environment}'

resource aksCluster 'Microsoft.ContainerService/managedClusters@2024-02-01' = {
  name: aksClusterName
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    dnsPrefix: dnsPrefix
    kubernetesVersion: '1.29'
    networkProfile: {
      networkPlugin: 'azure'
      networkPolicy: 'azure'
      serviceCidr: '172.16.0.0/16'
      dnsServiceIP: '172.16.0.10'
      loadBalancerSku: 'standard'
    }
    agentPoolProfiles: [
      {
        name: 'systempool'
        mode: 'System'
        vmSize: 'Standard_D4s_v3'
        count: 2
        minCount: 2
        maxCount: 5
        enableAutoScaling: true
        availabilityZones: [
          '1'
          '2'
          '3'
        ]
        osType: 'Linux'
        osSKU: 'Ubuntu'
        vnetSubnetID: aksSubnetId
        type: 'VirtualMachineScaleSets'
      }
      {
        name: 'userpool'
        mode: 'User'
        vmSize: nodeVmSize
        count: nodeCount
        minCount: 1
        maxCount: 10
        enableAutoScaling: true
        availabilityZones: [
          '1'
          '2'
          '3'
        ]
        osType: 'Linux'
        osSKU: 'Ubuntu'
        vnetSubnetID: aksSubnetId
        type: 'VirtualMachineScaleSets'
      }
    ]
    addonProfiles: {
      azurepolicy: {
        enabled: true
      }
      omsagent: {
        enabled: true
        config: {
          logAnalyticsWorkspaceResourceID: logAnalyticsWorkspaceId
        }
      }
    }
    securityProfile: {
      defender: {
        securityMonitoring: {
          enabled: true
        }
        logAnalyticsWorkspaceResourceId: logAnalyticsWorkspaceId
      }
    }
    autoUpgradeProfile: {
      upgradeChannel: 'stable'
    }
  }
}

output aksClusterName string = aksCluster.name
output aksClusterId string = aksCluster.id
output kubeletIdentityObjectId string = aksCluster.properties.identityProfile.kubeletidentity.objectId
output controlPlaneIdentityPrincipalId string = aksCluster.identity.principalId
