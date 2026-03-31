# Hub-Spoke Network — Demo Guide

> This demo deploys a hub-spoke network topology with centralized security and connectivity services in the hub (Azure Firewall, VPN Gateway, Azure Bastion) and workload-isolated spoke virtual networks connected via peering, with Network Security Groups enforcing micro-segmentation.

## Component Breakdown

### Virtual Network

#### Customer Value

Azure Virtual Network (VNet) is the fundamental networking building block in Azure. It provides a logically isolated network space where customers deploy VMs, containers, databases, and other resources with full control over IP addressing, DNS, routing, and network segmentation. VNets are free — customers pay only for specific features like peering, NAT gateways, or VPN connections.

In a hub-spoke topology, VNets enable clean separation of concerns. The hub VNet hosts shared services (firewall, VPN, bastion) while spoke VNets isolate individual workloads or business units. VNet peering connects them with low-latency, high-bandwidth links over the Azure backbone — no encryption overhead, no public internet exposure, no additional hops.

For customers, VNets provide the network foundation for Zero Trust architectures. Every resource is placed in a subnet with explicit routing and security rules. There is no implicit connectivity — traffic flows only where it is explicitly permitted. This model mirrors enterprise on-premises network design, making it familiar to network engineers while adding cloud-native flexibility like instant provisioning and global reach.

#### Competitive Advantage

| Feature | Azure (Virtual Network) | AWS (VPC) | GCP (VPC) |
|---------|------------------------|-----------|-----------|
| Pricing | Free (peering and features billed separately) | Free (peering and features billed separately) | Free (peering and features billed separately) |
| Global peering | Cross-region VNet peering | Cross-region VPC peering | Global VPC (single network spans regions) |
| DNS | Azure DNS Private Zones (integrated) | Route 53 Private Hosted Zones | Cloud DNS Private Zones |
| Service endpoints | Direct, fast-path to PaaS services | VPC endpoints (Gateway and Interface) | Private Google Access / Private Service Connect |
| Private Link | Unified private endpoint for PaaS services | PrivateLink (similar) | Private Service Connect |
| Network model | Regional VNets with peering | Regional VPCs with peering | Global VPC with regional subnets |

GCP's global VPC model — where a single VPC spans all regions with regional subnets — is architecturally simpler than Azure and AWS's regional network model. However, Azure's regional VNet approach provides more explicit control over cross-region traffic flows, which is preferred by organizations with strict data residency or compliance requirements.

Azure's service endpoints and Private Link provide a comprehensive mechanism for securing PaaS service access from within a VNet. Service endpoints route traffic directly over the Azure backbone without requiring a public IP, while Private Link assigns a private IP address within the VNet to the PaaS service. This combination is mature and well-integrated across the Azure PaaS catalog.

#### Common Use Cases

- **Enterprise network segmentation** — Isolating production, development, and shared-services workloads into separate VNets with controlled peering.
- **Hub-spoke topology** — Centralizing network security appliances and connectivity services in a hub VNet with spoke VNets for individual applications or teams.
- **Hybrid connectivity** — Extending on-premises networks into Azure using VPN Gateway or ExpressRoute with seamless IP routing.
- **PaaS network security** — Using Private Link and service endpoints to ensure database, storage, and key vault traffic never traverses the public internet.
- **Multi-region architectures** — Deploying VNets in multiple regions with global peering for low-latency cross-region communication.

---

### Azure Firewall

#### Customer Value

Azure Firewall is a cloud-native, fully managed network security service that provides centralized network and application-level traffic filtering. It operates as a stateful firewall with built-in high availability, unrestricted cloud scalability, and no infrastructure to manage. In a hub-spoke topology, Azure Firewall sits in the hub VNet and inspects all traffic flowing between spokes, to the internet, and to on-premises networks.

The service provides L3-L7 filtering with application rules (FQDN-based), network rules (IP/port-based), NAT rules, and threat intelligence-based filtering. The Premium tier adds TLS inspection, IDPS (intrusion detection and prevention), URL filtering, and web categories — capabilities that traditionally require expensive dedicated appliances and specialized staff.

For customers, Azure Firewall replaces a patchwork of network virtual appliances (NVAs) with a single managed service. There are no VMs to patch, no licenses to manage, no clustering to configure. It scales automatically with traffic and integrates with Azure Monitor for logging, Azure Policy for governance, and Azure Firewall Manager for multi-firewall policy management across regions and subscriptions.

#### Competitive Advantage

| Feature | Azure (Azure Firewall) | AWS (Network Firewall / WAF) | GCP (Cloud Firewall / Cloud Armor) |
|---------|------------------------|------------------------------|-------------------------------------|
| Management model | Fully managed, auto-scaling | Managed, manual capacity planning | Managed, distributed |
| TLS inspection | Premium tier (native) | Not supported in Network Firewall | Not available |
| IDPS | Premium tier (signature-based) | Suricata-compatible rules | Not available natively |
| FQDN filtering | Application rules with FQDN tags | Domain list rules | Not available natively |
| Threat intelligence | Built-in Microsoft Threat Intelligence feed | GuardDuty (separate service) | Threat Intelligence (Cloud Armor) |
| Multi-firewall management | Azure Firewall Manager | AWS Firewall Manager | Hierarchical policies |
| DNS proxy | Built-in DNS proxy for FQDN resolution | Route 53 Resolver rules | Cloud DNS |

Azure Firewall Premium's TLS inspection capability is a significant differentiator. It can decrypt, inspect, and re-encrypt HTTPS traffic inline — a capability that AWS Network Firewall does not offer. For organizations that require deep packet inspection of encrypted traffic for compliance or threat detection, this eliminates the need for third-party NVAs.

The built-in Microsoft Threat Intelligence feed, informed by trillions of signals from Microsoft's security ecosystem (Defender, Sentinel, Microsoft 365), provides threat detection quality that is difficult to replicate. Traffic matching known malicious IPs and domains is automatically blocked or alerted, with no additional configuration or subscription required.

#### Common Use Cases

- **Centralized egress control** — Filtering all outbound internet traffic from spoke VNets through the hub firewall, enforcing FQDN-based allowlists for regulatory compliance.
- **East-west traffic inspection** — Inspecting traffic between spoke VNets to detect lateral movement and enforce micro-segmentation policies.
- **Hybrid network security** — Securing traffic between Azure and on-premises networks with consistent firewall policies across the hybrid boundary.
- **Threat protection** — Leveraging threat intelligence and IDPS to block known malicious traffic and detect intrusion attempts.
- **Compliance enforcement** — Meeting regulatory requirements for network traffic logging, inspection, and centralized security policy management.

---

### Azure Bastion

#### Customer Value

Azure Bastion provides secure, seamless RDP and SSH access to virtual machines directly through the Azure portal — without exposing VMs to the public internet. There are no public IP addresses on VMs, no jump box servers to maintain, and no VPN client software required. Users connect through their browser via TLS, and Bastion handles the protocol translation.

This fundamentally changes the security posture of VM management. Traditional approaches — public IP with NSG rules, jump boxes, VPN connections — all have attack surface. Public RDP/SSH endpoints are among the most targeted entry points for attackers. Bastion eliminates this vector entirely by proxying management traffic through a hardened, Azure-managed service inside the VNet.

For customers, Bastion reduces both security risk and operational complexity. Network teams no longer maintain jump box infrastructure or manage VPN client deployments. Security teams get centralized audit logging of all management sessions. And developers get instant, browser-based access to any VM in the network — even in spoke VNets routed through the hub.

#### Competitive Advantage

| Feature | Azure (Bastion) | AWS (Systems Manager Session Manager) | GCP (Identity-Aware Proxy TCP Tunneling) |
|---------|-----------------|---------------------------------------|------------------------------------------|
| Protocol support | RDP and SSH (native) | SSH and PowerShell (no native RDP) | SSH (TCP tunnel for RDP) |
| Client requirement | Browser only (HTML5) | AWS CLI or browser console | gcloud CLI |
| File transfer | Native file upload/download | S3 bucket intermediary | SCP through tunnel |
| Session recording | Audit logs via Diagnostic Logs | Session logging to S3/CloudWatch | Audit logs |
| VNet integration | Deploys into VNet subnet (AzureBastionSubnet) | No VPC resource needed | No VPC resource needed |
| Shareable links | Premium SKU (shareable URL) | Not available | Not available |
| Pricing | Per-hour + data transfer | Free (included with SSM) | Free (included with IAP) |

Azure Bastion's native RDP support through the browser is a genuine differentiator for Windows-heavy environments. AWS Session Manager provides excellent SSH access but requires workarounds for RDP (typically Fleet Manager or third-party tools). GCP's IAP TCP tunneling requires the gcloud CLI and local RDP client configuration. For organizations managing hundreds of Windows servers, Bastion's browser-based RDP is significantly more accessible.

It should be noted that AWS Session Manager and GCP IAP are both free services, while Azure Bastion incurs per-hour charges. For cost-sensitive customers with primarily Linux workloads, the free alternatives may be more attractive. Bastion's value proposition is strongest in Windows-heavy, enterprise environments where browser-based RDP and native file transfer justify the premium.

#### Common Use Cases

- **Secure VM management** — Replacing public IP addresses and jump boxes with browser-based RDP/SSH access through the Azure portal.
- **Compliance-driven access** — Meeting regulatory requirements that prohibit public IP addresses on VMs and require audit logging of all management sessions.
- **Developer access** — Providing development teams with instant, VPN-free access to VMs in development and testing environments.
- **Emergency access** — Maintaining management access to VMs even when VPN infrastructure is unavailable, using only a web browser.
- **Vendor and partner access** — Using shareable links (Premium SKU) to grant time-limited VM access to external parties without Azure portal accounts.

---

### VPN Gateway

#### Customer Value

Azure VPN Gateway provides encrypted connectivity between Azure virtual networks and on-premises networks (site-to-site), between Azure and individual client devices (point-to-site), or between Azure regions (VNet-to-VNet). It supports industry-standard protocols (IKEv2, OpenVPN, SSTP) and integrates with most enterprise VPN appliances.

In a hub-spoke topology, VPN Gateway sits in the hub VNet and serves as the single point of hybrid connectivity. All spoke VNets access on-premises resources through the hub's gateway, centralizing routing configuration and security policy. This eliminates the need for individual VPN connections per workload and reduces the number of tunnels the on-premises network must manage.

For customers, VPN Gateway makes hybrid cloud networking accessible without dedicated network engineering staff. The managed service handles high availability (active-active configuration), automatic failover, and integration with Azure routing. Combined with BGP support, it can dynamically exchange routes with on-premises networks, automatically adapting as new subnets are added on either side.

#### Competitive Advantage

| Feature | Azure (VPN Gateway) | AWS (Site-to-Site VPN / Client VPN) | GCP (Cloud VPN) |
|---------|---------------------|-------------------------------------|-----------------|
| Max throughput | Up to 10 Gbps (VpnGw5) | Up to 5 Gbps (per tunnel) | Up to 3 Gbps (per tunnel) |
| Active-active | Native active-active mode | Two tunnels per connection | HA VPN (99.99% SLA) |
| Point-to-site | Native (OpenVPN, IKEv2, SSTP) | AWS Client VPN (OpenVPN) | No native P2S |
| BGP support | Full BGP support | Full BGP support | Full BGP support |
| Entra ID auth (P2S) | Native Entra ID authentication | Certificate or AD (via RADIUS) | N/A |
| Availability SLA | 99.95% (single) / 99.99% (AZ) | 99.95% | 99.99% (HA VPN) |

Azure VPN Gateway's point-to-site capability with Entra ID authentication is a standout feature. Remote users authenticate with their corporate identity — including MFA and conditional access policies — to establish VPN connections. AWS Client VPN supports Active Directory authentication but requires a separate AWS Directory Service or RADIUS server. GCP does not offer a native point-to-site VPN solution.

The VpnGw5 SKU's 10 Gbps throughput is the highest among the three providers for managed VPN services. For organizations with bandwidth-intensive hybrid workloads (data replication, backup, large file transfers), this reduces the gap between VPN and dedicated private connectivity (ExpressRoute/Direct Connect).

#### Common Use Cases

- **Hybrid cloud connectivity** — Connecting on-premises data centers to Azure hub VNets for workload migration, hybrid applications, and disaster recovery.
- **Remote workforce access** — Point-to-site VPN for remote employees to securely access Azure and on-premises resources with Entra ID authentication.
- **Multi-site networking** — Connecting multiple branch offices to Azure with individual site-to-site tunnels, using BGP for dynamic route management.
- **Disaster recovery** — Replicating workloads between on-premises and Azure with encrypted VPN connectivity as the network transport.
- **Dev/test connectivity** — Providing development teams with secure access to Azure-hosted test environments from corporate networks.

---

### Network Security Groups

#### Customer Value

Network Security Groups (NSGs) are stateful packet filters that control inbound and outbound traffic at the subnet and network interface level. They are the foundational micro-segmentation tool in Azure, allowing customers to define allow/deny rules based on source, destination, port, and protocol. NSGs are free — there is no charge for creating or applying them.

In a hub-spoke topology, NSGs provide defense in depth alongside Azure Firewall. While the firewall handles centralized traffic inspection at the VNet boundary, NSGs enforce granular rules within each subnet. A web tier subnet might allow only HTTPS from the load balancer, while a database subnet allows only SQL traffic from the application tier. This layered approach ensures that even if one control is bypassed, others remain in effect.

For customers, NSGs are the first line of network defense and the simplest security control to implement. They require no additional infrastructure, scale automatically, and are evaluated before traffic reaches the VM. Combined with Application Security Groups (ASGs), they enable role-based network rules (e.g., "web servers can talk to database servers") that are more intuitive and maintainable than IP-based rules.

#### Competitive Advantage

| Feature | Azure (Network Security Groups) | AWS (Security Groups / NACLs) | GCP (Firewall Rules) |
|---------|--------------------------------|-------------------------------|---------------------|
| Pricing | Free | Free | Free |
| Statefulness | Stateful | SG: Stateful; NACL: Stateless | Stateful |
| Scope | Subnet and NIC level | SG: Instance; NACL: Subnet | VPC or target-based |
| Priority-based rules | Yes (numbered priority) | SG: No priority; NACL: Priority-based | Priority-based |
| Service tags | 60+ Azure service tags | Prefix lists (less granular) | No equivalent |
| Flow logs | NSG Flow Logs (v2 with Traffic Analytics) | VPC Flow Logs | VPC Flow Logs |
| Augmented rules | Multiple IPs, ports, service tags in one rule | Multiple IPs/ports per rule | Multiple targets per rule |

Azure's service tags are a significant operational advantage. Instead of maintaining lists of IP ranges for Azure services (which change frequently), customers use tags like "AzureCloud", "Storage", "Sql" in NSG rules. When Microsoft adds or changes IP ranges, the service tags update automatically. AWS prefix lists offer partial equivalency, but the coverage is less comprehensive than Azure's 60+ service tags.

NSG Flow Logs with Traffic Analytics provide network visibility that goes beyond basic flow logging. Traffic Analytics processes flow data to show traffic patterns, top talkers, security threats, and network topology — all through Azure Monitor dashboards. AWS VPC Flow Logs provide raw data that requires additional processing (Athena, third-party tools) to achieve similar insights.

#### Common Use Cases

- **Subnet-level segmentation** — Restricting traffic between application tiers (web, app, database) to only the required ports and protocols.
- **Compliance enforcement** — Implementing network isolation rules required by PCI-DSS, HIPAA, and other regulatory frameworks.
- **Defense in depth** — Layering NSG rules with Azure Firewall to provide multiple independent security controls.
- **Traffic auditing** — Using NSG Flow Logs and Traffic Analytics to monitor traffic patterns, detect anomalies, and investigate security incidents.
- **Application Security Groups** — Grouping VMs by role (web servers, app servers) and writing rules based on application topology rather than IP addresses.

---

## Why This Architecture?

The hub-spoke network topology is the foundation of enterprise cloud networking in Azure. It provides the network isolation, centralized security, and hybrid connectivity that organizations require before deploying any workloads. Without this foundation, every application team would independently solve networking, security, and connectivity — leading to inconsistent security posture and operational sprawl.

The architecture separates concerns cleanly. Azure Firewall centralizes traffic inspection and policy enforcement. VPN Gateway handles hybrid connectivity. Azure Bastion provides secure management access. NSGs enforce micro-segmentation within each spoke. And Virtual Networks tie it all together with deterministic routing and IP address management. Each service has a clear role, and together they implement a defense-in-depth strategy.

For demo purposes, this architecture demonstrates Azure's network security story. Customers evaluating Azure — particularly those in regulated industries — need confidence that Azure can implement the network controls they already have on-premises. Hub-spoke with Azure Firewall, NSGs, and Bastion maps directly to familiar enterprise network concepts (DMZ, jump boxes, firewall zones) while eliminating the hardware procurement and maintenance that make those concepts expensive on-premises.
