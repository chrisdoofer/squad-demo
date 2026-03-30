interface CategoryFilterProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

function CategoryFilter({
  categories,
  selected,
  onSelect,
  search,
  onSearchChange,
}: CategoryFilterProps) {
  return (
    <div className="filter-bar">
      <input
        type="text"
        className="search-input"
        placeholder="Search templates…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Search templates"
      />
      <div className="category-chips">
        {categories.map((c) => (
          <button
            key={c}
            className={`chip ${selected === c ? 'chip-active' : ''}`}
            onClick={() => onSelect(c)}
            type="button"
            aria-pressed={selected === c}
          >
            {c === 'all' ? 'All' : c}
          </button>
        ))}
      </div>
    </div>
  );
}

export default CategoryFilter;
