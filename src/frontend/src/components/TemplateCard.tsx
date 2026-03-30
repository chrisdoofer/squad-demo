import { Link } from 'react-router-dom';
import type { Template } from '../types';

interface TemplateCardProps {
  template: Template;
}

function TemplateCard({ template }: TemplateCardProps) {
  return (
    <article className="card template-card">
      <h3>{template.name}</h3>
      <p className="card-description">{template.description}</p>
      <div className="card-meta">
        <span className="badge badge-category">{template.category}</span>
        <span className={`badge badge-${template.complexity}`}>
          {template.complexity}
        </span>
      </div>
      <p className="service-count">
        {template.services.length} Azure service{template.services.length !== 1 ? 's' : ''}
      </p>
      <div className="card-footer">
        <Link to={`/templates/${template.id}`} className="card-link">
          View details →
        </Link>
      </div>
    </article>
  );
}

export default TemplateCard;
