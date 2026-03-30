import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Template } from '../types';
import { getTemplate } from '../services/api';

function TemplateDetail() {
  const { id } = useParams<{ id: string }>();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getTemplate(id)
        .then(setTemplate)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <p>Loading template...</p>;
  if (!template) return <p>Template not found.</p>;

  return (
    <div>
      <h2>{template.name}</h2>
      <p>{template.description}</p>
      <p><strong>Category:</strong> {template.category}</p>
      <p><strong>Complexity:</strong> {template.complexity}</p>
      <p><strong>Services:</strong> {template.services.join(', ')}</p>
      <a href={template.sourceUrl} target="_blank" rel="noreferrer">
        View Reference Architecture
      </a>
      <h3>Parameters</h3>
      <ul>
        {template.parameters.map((p) => (
          <li key={p.name}>
            <strong>{p.name}</strong> ({p.type}) — {p.description}
            {p.required && ' (required)'}
          </li>
        ))}
      </ul>
      <Link to={`/deploy/${template.id}`}>Deploy This Template</Link>
    </div>
  );
}

export default TemplateDetail;
