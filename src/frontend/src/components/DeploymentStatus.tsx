import type { Deployment } from '../types';

interface DeploymentStatusProps {
  status: Deployment['status'];
  large?: boolean;
}

const STATUS_CONFIG: Record<
  Deployment['status'],
  { label: string; icon: string }
> = {
  pending: { label: 'Pending', icon: '⏳' },
  in_progress: { label: 'Deploying', icon: '⚙' },
  succeeded: { label: 'Succeeded', icon: '✓' },
  failed: { label: 'Failed', icon: '✗' },
};

function DeploymentStatus({ status, large }: DeploymentStatusProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`badge badge-status badge-${status} ${large ? 'badge-lg' : ''} ${status === 'in_progress' ? 'badge-animated' : ''}`}
      aria-label={`Status: ${config.label}`}
    >
      <span className={status === 'in_progress' ? 'spin-icon' : ''} aria-hidden="true">
        {config.icon}
      </span>
      {' '}{config.label}
    </span>
  );
}

export default DeploymentStatus;
