import { useState, useMemo } from 'react';
import { patterns } from '../data/patterns';
import { PatternCard } from '../components/PatternCard';
import { SearchFilter } from '../components/SearchFilter';

export function CatalogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedComplexity, setSelectedComplexity] = useState('All');

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return patterns.filter((p) => {
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (selectedComplexity !== 'All' && p.complexity !== selectedComplexity) return false;
      if (q) {
        const haystack = `${p.title} ${p.description} ${p.tags.join(' ')}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [searchQuery, selectedCategory, selectedComplexity]);

  return (
    <div className="catalog-page">
      <section className="hero">
        <h1 className="hero-title">Azure Infrastructure Demo Marketplace</h1>
        <p className="hero-subtitle">
          Explore, evaluate, and deploy production-ready Azure infrastructure demos
        </p>
      </section>

      <SearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedComplexity={selectedComplexity}
        onComplexityChange={setSelectedComplexity}
        resultCount={filtered.length}
        totalCount={patterns.length}
      />

      {filtered.length > 0 ? (
        <div className="pattern-grid">
          {filtered.map((p) => (
            <PatternCard key={p.id} pattern={p} />
          ))}
        </div>
      ) : (
        <div className="no-results">
          <span className="no-results-icon" aria-hidden="true">
            🔎
          </span>
          <h3>No patterns found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
