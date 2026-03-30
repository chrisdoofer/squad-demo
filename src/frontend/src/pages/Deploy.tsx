import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Template, Deployment } from '../types';
import { createDeployment, getTemplate } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import ParameterForm from '../components/ParameterForm';
import DeploymentStatus from '../components/DeploymentStatus';

const STEP_LABELS = ['Template', 'Parameters', 'Target', 'Review', 'Deploy'];

interface AzureConfig {
  subscriptionId: string;
  resourceGroup: string;
  location: string;
}

interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
}

function Deploy() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState(0);
  const [target, setTarget] = useState<'azure' | 'github'>('azure');
  const [paramValues, setParamValues] = useState<Record<string, string | number | boolean>>({});
  const [azureConfig, setAzureConfig] = useState<AzureConfig>({
    subscriptionId: '',
    resourceGroup: '',
    location: 'uksouth',
  });
  const [githubConfig, setGithubConfig] = useState<GitHubConfig>({
    owner: '',
    repo: '',
    branch: 'main',
  });

  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<Deployment | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);

  // Read target from query params
  useEffect(() => {
    const t = searchParams.get('target');
    if (t === 'azure' || t === 'github') setTarget(t);
  }, [searchParams]);

  const fetchTemplate = useCallback(() => {
    if (!templateId) return;
    setLoading(true);
    setError(null);
    getTemplate(templateId)
      .then((t) => {
        setTemplate(t);
        // Initialize parameter defaults
        const defaults: Record<string, string | number | boolean> = {};
        t.parameters.forEach((p) => {
          if (p.default !== undefined) defaults[p.name] = p.default;
        });
        setParamValues(defaults);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [templateId]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const handleParamChange = (name: string, value: string | number | boolean) => {
    setParamValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeploy = async () => {
    if (!templateId) return;
    try {
      setDeploying(true);
      setDeployError(null);
      const result = await createDeployment({
        templateId,
        target,
        parameters: paramValues,
        azureConfig: target === 'azure' ? azureConfig : undefined,
        githubConfig: target === 'github' ? githubConfig : undefined,
      });
      setDeployResult(result);
      setStep(4);
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : 'Deployment failed.');
    } finally {
      setDeploying(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading template…" />;
  if (error) return <ErrorAlert message={error} onRetry={fetchTemplate} />;
  if (!template) return <ErrorAlert message="Template not found." />;

  return (
    <div className="deploy-form">
      <Link to={`/templates/${template.id}`} className="back-link">
        ← Back to {template.name}
      </Link>

      <div className="page-header">
        <h2>Deploy Template</h2>
        <p>{template.name}</p>
      </div>

      {/* Step indicator */}
      <div className="wizard-steps">
        {STEP_LABELS.map((label, i) => (
          <div
            key={label}
            className={`wizard-step ${i === step ? 'wizard-step-active' : ''} ${i < step ? 'wizard-step-complete' : ''}`}
          >
            <span className="wizard-step-number">{i < step ? '✓' : i + 1}</span>
            <span className="wizard-step-label">{label}</span>
          </div>
        ))}
      </div>

      {deployError && (
        <div className="mb-4">
          <ErrorAlert message={deployError} onRetry={() => setDeployError(null)} />
        </div>
      )}

      {/* Step 0: Confirm template */}
      {step === 0 && (
        <div className="form-card">
          <h3>Confirm Template</h3>
          <p style={{ marginBottom: 12, color: 'var(--color-gray-600)' }}>
            {template.description}
          </p>
          <div className="detail-meta" style={{ marginBottom: 16 }}>
            <span className="badge badge-category">{template.category}</span>
            <span className={`badge badge-${template.complexity}`}>
              {template.complexity}
            </span>
          </div>
          <div className="services-list" style={{ marginBottom: 16 }}>
            {template.services.map((s) => (
              <span key={s} className="badge badge-service">{s}</span>
            ))}
          </div>
          <div className="wizard-nav">
            <div />
            <button className="btn btn-primary" onClick={() => setStep(1)} type="button">
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Parameters */}
      {step === 1 && (
        <div className="form-card">
          <h3>Configure Parameters</h3>
          <ParameterForm
            parameters={template.parameters}
            values={paramValues}
            onChange={handleParamChange}
          />
          <div className="wizard-nav">
            <button className="btn btn-secondary" onClick={() => setStep(0)} type="button">
              ← Back
            </button>
            <button className="btn btn-primary" onClick={() => setStep(2)} type="button">
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Target configuration */}
      {step === 2 && (
        <div className="form-card">
          <h3>Configure Target</h3>
          <div className="form-group">
            <label htmlFor="deploy-target">Deployment Target</label>
            <select
              id="deploy-target"
              value={target}
              onChange={(e) => setTarget(e.target.value as 'azure' | 'github')}
            >
              <option value="azure">Azure Subscription</option>
              <option value="github">GitHub Repository</option>
            </select>
          </div>

          {target === 'azure' && (
            <>
              <div className="form-group">
                <label htmlFor="azure-sub">Subscription ID</label>
                <input
                  id="azure-sub"
                  type="text"
                  value={azureConfig.subscriptionId}
                  onChange={(e) =>
                    setAzureConfig((c) => ({ ...c, subscriptionId: e.target.value }))
                  }
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="azure-rg">Resource Group</label>
                <input
                  id="azure-rg"
                  type="text"
                  value={azureConfig.resourceGroup}
                  onChange={(e) =>
                    setAzureConfig((c) => ({ ...c, resourceGroup: e.target.value }))
                  }
                  placeholder="rg-my-project"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="azure-loc">Location</label>
                <select
                  id="azure-loc"
                  value={azureConfig.location}
                  onChange={(e) =>
                    setAzureConfig((c) => ({ ...c, location: e.target.value }))
                  }
                >
                  <option value="uksouth">UK South</option>
                  <option value="ukwest">UK West</option>
                  <option value="eastus">East US</option>
                  <option value="eastus2">East US 2</option>
                  <option value="westus2">West US 2</option>
                  <option value="westeurope">West Europe</option>
                  <option value="northeurope">North Europe</option>
                </select>
              </div>
            </>
          )}

          {target === 'github' && (
            <>
              <div className="form-group">
                <label htmlFor="gh-owner">Repository Owner</label>
                <input
                  id="gh-owner"
                  type="text"
                  value={githubConfig.owner}
                  onChange={(e) =>
                    setGithubConfig((c) => ({ ...c, owner: e.target.value }))
                  }
                  placeholder="my-org"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="gh-repo">Repository Name</label>
                <input
                  id="gh-repo"
                  type="text"
                  value={githubConfig.repo}
                  onChange={(e) =>
                    setGithubConfig((c) => ({ ...c, repo: e.target.value }))
                  }
                  placeholder="my-repo"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="gh-branch">Branch</label>
                <input
                  id="gh-branch"
                  type="text"
                  value={githubConfig.branch}
                  onChange={(e) =>
                    setGithubConfig((c) => ({ ...c, branch: e.target.value }))
                  }
                  placeholder="main"
                />
              </div>
            </>
          )}

          <div className="wizard-nav">
            <button className="btn btn-secondary" onClick={() => setStep(1)} type="button">
              ← Back
            </button>
            <button className="btn btn-primary" onClick={() => setStep(3)} type="button">
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="form-card">
          <h3>Review &amp; Confirm</h3>

          <div className="review-section">
            <h4>Template</h4>
            <p>{template.name}</p>
          </div>

          <div className="review-section">
            <h4>Target</h4>
            <p style={{ textTransform: 'capitalize' }}>{target}</p>
            {target === 'azure' && (
              <ul className="review-list">
                <li><strong>Subscription:</strong> {azureConfig.subscriptionId || '(not set)'}</li>
                <li><strong>Resource Group:</strong> {azureConfig.resourceGroup || '(not set)'}</li>
                <li><strong>Location:</strong> {azureConfig.location}</li>
              </ul>
            )}
            {target === 'github' && (
              <ul className="review-list">
                <li><strong>Owner:</strong> {githubConfig.owner || '(not set)'}</li>
                <li><strong>Repo:</strong> {githubConfig.repo || '(not set)'}</li>
                <li><strong>Branch:</strong> {githubConfig.branch}</li>
              </ul>
            )}
          </div>

          {Object.keys(paramValues).length > 0 && (
            <div className="review-section">
              <h4>Parameters</h4>
              <ul className="review-list">
                {Object.entries(paramValues).map(([key, val]) => (
                  <li key={key}>
                    <strong>{key}:</strong>{' '}
                    {template.parameters.find((p) => p.name === key)?.type === 'secureString'
                      ? '••••••••'
                      : String(val)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="wizard-nav">
            <button className="btn btn-secondary" onClick={() => setStep(2)} type="button">
              ← Back
            </button>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleDeploy}
              disabled={deploying}
              type="button"
            >
              {deploying ? 'Deploying…' : 'Start Deployment'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Deploying / Result */}
      {step === 4 && (
        <div className="form-card" style={{ textAlign: 'center' }}>
          <h3>Deployment {deployResult ? 'Submitted' : 'In Progress'}</h3>
          {deployResult && (
            <>
              <div style={{ margin: '24px 0' }}>
                <DeploymentStatus status={deployResult.status} large />
              </div>
              <p style={{ color: 'var(--color-gray-600)', marginBottom: 24 }}>
                Deployment <code style={{ fontFamily: 'var(--font-mono)' }}>{deployResult.id.slice(0, 8)}</code> has been created.
                Track its progress on the deployments page.
              </p>
              <div className="detail-actions" style={{ justifyContent: 'center' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/deployments')}
                  type="button"
                >
                  View Deployments
                </button>
                <Link to="/" className="btn btn-secondary">
                  Browse Templates
                </Link>
              </div>
            </>
          )}
          {!deployResult && deploying && (
            <LoadingSpinner message="Submitting deployment…" />
          )}
        </div>
      )}
    </div>
  );
}

export default Deploy;
