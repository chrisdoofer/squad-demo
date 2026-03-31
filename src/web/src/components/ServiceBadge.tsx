import type { AzureService } from '../data/patterns';

export function ServiceBadge({ service }: { service: AzureService }) {
  return (
    <span className="service-tag">
      <span className="service-icon" aria-hidden="true">
        {service.icon}
      </span>
      {service.name}
    </span>
  );
}
