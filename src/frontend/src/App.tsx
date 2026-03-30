import { Routes, Route, NavLink, Link } from 'react-router-dom';
import Home from './pages/Home';
import TemplateDetail from './pages/TemplateDetail';
import Deploy from './pages/Deploy';
import Deployments from './pages/Deployments';

function App() {
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
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/templates/:id" element={<TemplateDetail />} />
          <Route path="/deploy/:templateId" element={<Deploy />} />
          <Route path="/deployments" element={<Deployments />} />
        </Routes>
      </main>
      <footer className="app-footer" role="contentinfo">
        IDP v0.1.0 · Built with React + Azure
      </footer>
    </div>
  );
}

export default App;
