import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Template } from '../types';
import { getTemplates } from '../services/api';

function Home() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTemplates()
      .then(setTemplates)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading templates...</p>;

  return (
    <div>
      <h2>Azure Reference Architecture Templates</h2>
      <div className="template-grid">
        {templates.map((t) => (
          <div key={t.id} className="template-card">
            <h3>{t.name}</h3>
            <p>{t.description}</p>
            <span className="complexity">{t.complexity}</span>
            <span className="category">{t.category}</span>
            <Link to={`/templates/${t.id}`}>View Details</Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
