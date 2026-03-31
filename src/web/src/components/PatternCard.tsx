import { Link } from 'react-router-dom';
import type { ArchitecturePattern } from '../data/patterns';

export function PatternCard({ pattern }: { pattern: ArchitecturePattern }) {
  return (
    <article className="pattern-card">
      <div className="card-header">
        <span className="card-category">{pattern.category}</span>
        <span className={`card-complexity card-complexity-${pattern.complexity}`}>
          {pattern.complexity}
        </span>
      </div>

      <h3 className="card-title">{pattern.title}</h3>
      <p className="card-description">{pattern.description}</p>

      <div className="card-services">
        {pattern.services.slice(0, 4).map((svc) => (
          <span className="service-tag" key={svc.name}>
            <span aria-hidden="true">{svc.icon}</span> {svc.name}
          </span>
        ))}
        {pattern.services.length > 4 && (
          <span className="service-tag service-tag-more">
            +{pattern.services.length - 4} more
          </span>
        )}
      </div>

      <div className="card-actions">
        <Link to={`/pattern/${pattern.id}`} className="btn-secondary">
          View Details
        </Link>
        <a
          href={pattern.deployUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          🚀 Deploy
        </a>
      </div>
    </article>
  );
}
