import { useEffect, useState, useMemo, useCallback } from 'react';
import { Template } from '../types';
import { getTemplates } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import TemplateCard from '../components/TemplateCard';

function Home() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const fetchTemplates = useCallback(() => {
    setLoading(true);
    setError(null);
    getTemplates()
      .then(setTemplates)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(templates.map((t) => t.category)))],
    [templates],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return templates.filter((t) => {
      const matchesCategory = category === 'all' || t.category === category;
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [templates, search, category]);

  if (loading) return <LoadingSpinner message="Loading templates…" />;

  if (error) return <ErrorAlert message={error} onRetry={fetchTemplates} />;

  return (
    <div>
      <div className="page-header">
        <h2>Template Catalog</h2>
        <p>Browse Azure reference architecture templates and deploy with one click.</p>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search templates…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search templates"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? 'All categories' : c}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">🔍</div>
          <h3>No templates found</h3>
          <p>Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="template-grid">
          {filtered.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
