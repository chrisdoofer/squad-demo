import { ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="app">
      <header className="app-header" role="banner">
        <div className="header-inner">
          <Link to="/" className="logo" aria-label="Home">
            <span className="logo-icon" aria-hidden="true">ID</span>
            Internal Developer Platform
          </Link>
          <nav aria-label="Main navigation">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
              Templates
            </NavLink>
            <NavLink to="/deployments" className={({ isActive }) => isActive ? 'active' : ''}>
              Deployments
            </NavLink>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="app-footer" role="contentinfo">
        IDP v0.1.0 · Built with React + Azure
      </footer>
    </div>
  );
}

export default Layout;
