@description('Name of the AKS cluster')
param clusterName string

@description('Azure region for resources')
param location string

@description('Tags to apply to all resources')
param tags object = {}

@description('Number of agent nodes')
param nodeCount int = 3

@description('VM size for agent nodes')
param nodeVmSize string = 'Standard_D4s_v3'

@description('Resource ID of the subnet for AKS nodes')
param subnetId string

@description('Resource ID of the Log Analytics workspace for Container Insights')
param logAnalyticsWorkspaceId string

@description('Kubernetes version')
param kubernetesVersion string = '1.29'

resource aksCluster 'Microsoft.ContainerService/managedClusters@2024-02-01' = {
  name: clusterName
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    dnsPrefix: '${clusterName}-dns'
    kubernetesVersion: kubernetesVersion
    enableRBAC: true
    networkProfile: {
      networkPlugin: 'azure'
      networkPolicy: 'calico'
      serviceCidr: '172.16.0.0/16'
      dnsServiceIP: '172.16.0.10'
    }
    agentPoolProfiles: [
      {
        name: 'systempool'
        count: nodeCount
        vmSize: nodeVmSize
        mode: 'System'
        osType: 'Linux'
        osSKU: 'Ubuntu'
        vnetSubnetID: subnetId
        enableAutoScaling: true
        minCount: 1
        maxCount: nodeCount * 2
      }
    ]
    addonProfiles: {
      omsagent: {
        enabled: true
        config: {
          logAnalyticsWorkspaceResourceID: logAnalyticsWorkspaceId
        }
      }
    }
  }
}

@description('Resource ID of the AKS cluster')
output aksClusterId string = aksCluster.id

@description('Name of the AKS cluster')
output aksClusterName string = aksCluster.name

@description('FQDN of the AKS cluster')
output aksClusterFqdn string = aksCluster.properties.fqdn

@description('Principal ID of the AKS managed identity')
output aksPrincipalId string = aksCluster.identity.principalId

@description('Object ID of the kubelet identity')
output kubeletIdentityObjectId string = aksCluster.properties.identityProfile.kubeletidentity.objectId
