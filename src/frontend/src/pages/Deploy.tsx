import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Template, DeploymentRequest } from '../types';
import { createDeployment, getTemplate } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

function Deploy() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [target, setTarget] = useState<'azure' | 'github'>('azure');
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);

  const fetchTemplate = useCallback(() => {
    if (!templateId) return;
    setLoading(true);
    setError(null);
    getTemplate(templateId)
      .then(setTemplate)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [templateId]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateId) return;

    const request: DeploymentRequest = {
      templateId,
      target,
      parameters: {},
    };

    try {
      setDeploying(true);
      setDeployError(null);
      await createDeployment(request);
      navigate('/deployments');
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : 'Deployment failed. Please try again.');
    } finally {
      setDeploying(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading template…" />;
  if (error) return <ErrorAlert message={error} onRetry={fetchTemplate} />;

  return (
    <div className="deploy-form">
      <Link to={template ? `/templates/${template.id}` : '/'} className="back-link">
        ← Back to {template ? template.name : 'catalog'}
      </Link>

      <div className="page-header">
        <h2>Deploy Template</h2>
        {template && <p>{template.name}</p>}
      </div>

      {deployError && (
        <div className="mb-4">
          <ErrorAlert message={deployError} onRetry={() => setDeployError(null)} />
        </div>
      )}

      <form onSubmit={handleDeploy}>
        <div className="form-card">
          <h3>Deployment Target</h3>
          <div className="form-group">
            <label htmlFor="deploy-target">Where should this template be deployed?</label>
            <select
              id="deploy-target"
              value={target}
              onChange={(e) => setTarget(e.target.value as 'azure' | 'github')}
              disabled={deploying}
            >
              <option value="azure">Azure Subscription</option>
              <option value="github">GitHub Repository</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={deploying}
          aria-busy={deploying}
        >
          {deploying ? 'Deploying…' : 'Start Deployment'}
        </button>
      </form>
    </div>
  );
}

export default Deploy;
