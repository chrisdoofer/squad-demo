import { Link, useLocation } from 'react-router-dom';

export function Header() {
  const location = useLocation();

  return (
    <header className="header">
      <div className="header-gradient" />
      <div className="header-inner">
        <Link to="/" className="header-brand">
          <span className="header-logo">☁️</span>
          <span className="header-title">Azure Demo Marketplace</span>
        </Link>
        <nav className="header-nav">
          <Link
            to="/"
            className={`header-link${location.pathname === '/' ? ' header-link-active' : ''}`}
          >
            Catalog
          </Link>
          <Link
            to="/getting-started"
            className={`header-link${location.pathname === '/getting-started' ? ' header-link-active' : ''}`}
          >
            Getting Started
          </Link>
        </nav>
      </div>
    </header>
  );
}
