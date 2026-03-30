import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Template } from '../types';
import { getTemplate } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

function TemplateDetail() {
  const { id } = useParams<{ id: string }>();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) return <LoadingSpinner message="Loading template…" />;
  if (error) return <ErrorAlert message={error} onRetry={fetchTemplate} />;
  if (!template) return <ErrorAlert message="Template not found." />;

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
      </div>

      {/* Architecture diagram placeholder */}
      <section className="detail-section">
        <h3>Architecture Diagram</h3>
        <div className="architecture-placeholder" aria-label="Architecture diagram placeholder">
          <p>📐 Architecture diagram will be rendered here</p>
          <p style={{ marginTop: 8 }}>
            <a href={template.sourceUrl} target="_blank" rel="noreferrer">
              View Reference Architecture on Microsoft Learn →
            </a>
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="detail-section">
        <h3>Azure Services ({template.services.length})</h3>
        <div className="services-list">
          {template.services.map((s) => (
            <span key={s} className="badge badge-service">{s}</span>
          ))}
        </div>
      </section>

      {/* Parameters */}
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

      {/* Actions */}
      <div className="detail-actions">
        <Link to={`/deploy/${template.id}`} className="btn btn-primary btn-lg">
          Deploy This Template
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
    </div>
  );
}

export default TemplateDetail;
