import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { CatalogPage } from './pages/CatalogPage';
import { PatternDetailPage } from './pages/PatternDetailPage';
import { GettingStartedPage } from './pages/GettingStartedPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/pattern/:id" element={<PatternDetailPage />} />
          <Route path="/getting-started" element={<GettingStartedPage />} />
        </Routes>
      </main>
      <footer className="footer">
        <p>Azure Dev Platform — Internal Developer Portal</p>
        <p>Powered by Azure Architecture Center patterns</p>
      </footer>
    </BrowserRouter>
  );
}

export default App;
