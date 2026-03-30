import { useEffect, useState, useMemo, useCallback } from 'react';
import { Template } from '../types';
import { getTemplates } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import TemplateCard from '../components/TemplateCard';
import CategoryFilter from '../components/CategoryFilter';

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
        t.description.toLowerCase().includes(q) ||
        t.services.some((s) => s.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [templates, search, category]);

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <h1>Internal Developer Platform</h1>
        <p>
          Deploy Azure reference architectures with one click. Browse templates,
          configure parameters, and deploy to Azure or push to GitHub.
        </p>
      </section>

      {loading && <LoadingSpinner message="Loading templates…" />}

      {error && <ErrorAlert message={error} onRetry={fetchTemplates} />}

      {!loading && !error && (
        <>
          <CategoryFilter
            categories={categories}
            selected={category}
            onSelect={setCategory}
            search={search}
            onSearchChange={setSearch}
          />

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
        </>
      )}
    </div>
  );
}

export default Home;
