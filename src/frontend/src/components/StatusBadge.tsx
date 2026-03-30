import type { Deployment } from '../types';

interface StatusBadgeProps {
  status: Deployment['status'];
}

const LABELS: Record<Deployment['status'], string> = {
  pending: 'Pending',
  in_progress: 'Deploying',
  succeeded: 'Succeeded',
  failed: 'Failed',
};

function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`badge badge-status badge-${status}`} aria-label={`Status: ${LABELS[status]}`}>
      {LABELS[status]}
    </span>
  );
}

export default StatusBadge;
