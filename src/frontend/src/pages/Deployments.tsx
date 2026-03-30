import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Deployment } from '../types';
import { getDeployments } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import StatusBadge from '../components/StatusBadge';

const POLL_INTERVAL = 10_000;

function Deployments() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDeployments = useCallback((isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    }
    setError(null);
    getDeployments()
      .then(setDeployments)
      .catch((err: Error) => setError(err.message))
      .finally(() => {
        if (isInitial) setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchDeployments(true);
  }, [fetchDeployments]);

  // Auto-refresh when there are active deployments
  useEffect(() => {
    const hasActive = deployments.some(
      (d) => d.status === 'pending' || d.status === 'in_progress',
    );

    if (hasActive) {
      intervalRef.current = setInterval(() => fetchDeployments(false), POLL_INTERVAL);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [deployments, fetchDeployments]);

  if (loading) return <LoadingSpinner message="Loading deployments…" />;
  if (error) return <ErrorAlert message={error} onRetry={() => fetchDeployments(true)} />;

  return (
    <div>
      <div className="page-header">
        <h2>Deployments</h2>
        <p>Track your infrastructure deployments.</p>
      </div>

      {deployments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">🚀</div>
          <h3>No deployments yet</h3>
          <p>Deploy a template from the catalog to see it here.</p>
          <Link to="/" className="btn btn-primary">Browse Templates</Link>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Template</th>
                <th>Target</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {deployments.map((d) => (
                <tr key={d.id}>
                  <td className="mono">{d.id.slice(0, 8)}</td>
                  <td>{d.templateId}</td>
                  <td style={{ textTransform: 'capitalize' }}>{d.target}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td>{new Date(d.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Deployments;
