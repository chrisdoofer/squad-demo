interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedComplexity: string;
  onComplexityChange: (complexity: string) => void;
  resultCount: number;
  totalCount: number;
}

const categories = [
  'All',
  'Web',
  'Containers',
  'Networking',
  'Serverless',
  'Integration',
  'Data',
  'AI/ML',
];

const complexities = ['All', 'beginner', 'intermediate', 'advanced'];

export function SearchFilter({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedComplexity,
  onComplexityChange,
  resultCount,
  totalCount,
}: SearchFilterProps) {
  return (
    <div className="search-filter">
      <div className="search-input-wrapper">
        <span className="search-icon" aria-hidden="true">
          🔍
        </span>
        <input
          type="text"
          className="search-input"
          placeholder="Search patterns by name, description, or tags…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search patterns"
        />
        {searchQuery && (
          <button
            className="search-clear"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      <div className="filter-group">
        <label className="filter-label">Category</label>
        <div className="filter-buttons">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-btn${selectedCategory === cat ? ' filter-btn-active' : ''}`}
              onClick={() => onCategoryChange(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <label className="filter-label">Complexity</label>
        <div className="filter-buttons">
          {complexities.map((c) => (
            <button
              key={c}
              className={`filter-btn${selectedComplexity === c ? ' filter-btn-active' : ''}`}
              onClick={() => onComplexityChange(c)}
            >
              {c === 'All' ? c : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <p className="result-count">
        Showing <strong>{resultCount}</strong> of <strong>{totalCount}</strong>{' '}
        patterns
      </p>
    </div>
  );
}
