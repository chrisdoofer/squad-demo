import { useParams, Link } from 'react-router-dom';
import { patterns } from '../data/patterns';
import { ServiceBadge } from '../components/ServiceBadge';
import { DeployButton } from '../components/DeployButton';

export function PatternDetailPage() {
  const { id } = useParams<{ id: string }>();
  const pattern = patterns.find((p) => p.id === id);

  if (!pattern) {
    return (
      <div className="detail-page">
        <div className="detail-not-found">
          <h2>Demo not found</h2>
          <p>The demo you're looking for doesn't exist.</p>
          <Link to="/" className="btn-secondary">
            ← Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <Link to="/" className="back-link">
        ← Back to Catalog
      </Link>

      <div className="detail-header">
        <div>
          <h1 className="detail-title">{pattern.title}</h1>
          <div className="detail-badges">
            <span className="card-category">{pattern.category}</span>
            <span
              className={`card-complexity card-complexity-${pattern.complexity}`}
            >
              {pattern.complexity}
            </span>
          </div>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-main">
          <section className="detail-section">
            <h2>Overview</h2>
            {pattern.longDescription.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </section>

          <section className="detail-section">
            <h2>Architecture Diagram</h2>
            <div className="architecture-diagram" role="img" aria-label={`${pattern.title} architecture diagram`}>
              <span className="diagram-placeholder-icon" aria-hidden="true">
                🏗️
              </span>
              <span>{pattern.title} — Architecture Diagram</span>
            </div>
          </section>

          <section className="detail-section">
            <h2>Azure Services</h2>
            <div className="detail-services">
              {pattern.services.map((svc) => (
                <ServiceBadge key={svc.name} service={svc} />
              ))}
            </div>
          </section>

          <section className="detail-section">
            <h2>Tags</h2>
            <div className="tag-list">
              {pattern.tags.map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </section>
        </div>

        <aside className="detail-sidebar">
          <div className="detail-section sidebar-deploy">
            <h2>Deploy This Demo</h2>
            <p>
              Click the button below to deploy this demo to your Azure
              subscription using a pre-built Bicep template.
            </p>
            <DeployButton
              deployUrl={pattern.deployUrl}
              patternName={pattern.title}
              size="large"
            />
          </div>

          <div className="detail-section">
            <h2>Bicep Template</h2>
            <div className="file-list">
              <div className="file-item">
                📄 <code>infra/main.bicep</code>
              </div>
              <div className="file-item">
                📄 <code>infra/modules/{pattern.id}.bicep</code>
              </div>
              <div className="file-item">
                📄 <code>infra/parameters.json</code>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h2>GitHub Actions Workflows</h2>
            <div className="file-list">
              <div className="file-item">
                ⚙️ <code>.github/workflows/deploy-{pattern.id}.yml</code>
              </div>
              <div className="file-item">
                ⚙️ <code>.github/workflows/validate-{pattern.id}.yml</code>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h2>Learn More</h2>
            <a
              href={pattern.architectureUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary btn-block"
            >
              📖 Azure Architecture Center
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
