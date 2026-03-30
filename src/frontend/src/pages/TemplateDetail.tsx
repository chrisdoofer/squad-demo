import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Template } from '../types';
import { getTemplate, getTemplateBicep, getTemplateWorkflow } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import CodePreview from '../components/CodePreview';

type TabKey = 'overview' | 'bicep' | 'workflow';

function TemplateDetail() {
  const { id } = useParams<{ id: string }>();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [bicepContent, setBicepContent] = useState<string | null>(null);
  const [workflowContent, setWorkflowContent] = useState<string | null>(null);
  const [tabLoading, setTabLoading] = useState(false);

  const fetchTemplate = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getTemplate(id)
      .then(setTemplate)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  // Lazy-load tab content
  useEffect(() => {
    if (!id) return;

    if (activeTab === 'bicep' && bicepContent === null) {
      setTabLoading(true);
      getTemplateBicep(id)
        .then(setBicepContent)
        .catch(() => setBicepContent('// Failed to load Bicep template'))
        .finally(() => setTabLoading(false));
    }

    if (activeTab === 'workflow' && workflowContent === null) {
      setTabLoading(true);
      getTemplateWorkflow(id)
        .then(setWorkflowContent)
        .catch(() => setWorkflowContent('# Failed to load workflow'))
        .finally(() => setTabLoading(false));
    }
  }, [activeTab, bicepContent, workflowContent, id]);

  if (loading) return <LoadingSpinner message="Loading template…" />;
  if (error) return <ErrorAlert message={error} onRetry={fetchTemplate} />;
  if (!template) return <ErrorAlert message="Template not found." />;

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'bicep', label: 'Bicep Template' },
    { key: 'workflow', label: 'Workflow' },
  ];

  return (
    <div className="detail-page">
      <Link to="/" className="back-link">← Back to catalog</Link>

      <div className="page-header">
        <h2>{template.name}</h2>
        <p>{template.description}</p>
      </div>

      <div className="detail-meta">
        <span className="badge badge-category">{template.category}</span>
        <span className={`badge badge-${template.complexity}`}>
          {template.complexity}
        </span>
        <a
          href={template.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="badge badge-service"
          style={{ textDecoration: 'none' }}
        >
          View on Microsoft Learn ↗
        </a>
      </div>

      {/* Services */}
      <section className="detail-section">
        <h3>Azure Services ({template.services.length})</h3>
        <div className="services-list">
          {template.services.map((s) => (
            <span key={s} className="badge badge-service">{s}</span>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <div className="tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`tab ${activeTab === tab.key ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content" role="tabpanel">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            <section className="detail-section">
              <h3>Parameters</h3>
              {template.parameters.length === 0 ? (
                <p style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
                  No configurable parameters.
                </p>
              ) : (
                <div className="table-wrapper">
                  <table className="param-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Required</th>
                        <th>Default</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {template.parameters.map((p) => (
                        <tr key={p.name}>
                          <td><code>{p.name}</code></td>
                          <td><code>{p.type}</code></td>
                          <td>{p.required ? 'Yes' : 'No'}</td>
                          <td>{p.default !== undefined ? <code>{String(p.default)}</code> : '—'}</td>
                          <td>{p.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <div className="detail-actions">
              <Link
                to={`/deploy/${template.id}?target=azure`}
                className="btn btn-primary btn-lg"
              >
                Deploy to Azure
              </Link>
              <Link
                to={`/deploy/${template.id}?target=github`}
                className="btn btn-secondary btn-lg"
              >
                Push to GitHub
              </Link>
              <a
                href={template.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-lg"
              >
                View Source
              </a>
            </div>
          </>
        )}

        {/* Bicep Tab */}
        {activeTab === 'bicep' && (
          tabLoading ? (
            <LoadingSpinner message="Loading Bicep template…" />
          ) : bicepContent ? (
            <CodePreview code={bicepContent} language="Bicep" />
          ) : null
        )}

        {/* Workflow Tab */}
        {activeTab === 'workflow' && (
          tabLoading ? (
            <LoadingSpinner message="Loading workflow…" />
          ) : workflowContent ? (
            <CodePreview code={workflowContent} language="YAML" />
          ) : null
        )}
      </div>
    </div>
  );
}

export default TemplateDetail;
