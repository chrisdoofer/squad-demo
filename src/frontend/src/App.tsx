import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TemplateDetail from './pages/TemplateDetail';
import Deploy from './pages/Deploy';
import Deployments from './pages/Deployments';

function App() {
  return (
    <div className="app">
      <header>
        <h1>Internal Developer Platform</h1>
        <nav>
          <a href="/">Templates</a>
          <a href="/deployments">Deployments</a>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/templates/:id" element={<TemplateDetail />} />
          <Route path="/deploy/:templateId" element={<Deploy />} />
          <Route path="/deployments" element={<Deployments />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
