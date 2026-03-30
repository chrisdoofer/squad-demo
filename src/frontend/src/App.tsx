import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import TemplateDetail from './pages/TemplateDetail';
import Deploy from './pages/Deploy';
import Deployments from './pages/Deployments';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/templates/:id" element={<TemplateDetail />} />
        <Route path="/deploy/:templateId" element={<Deploy />} />
        <Route path="/deployments" element={<Deployments />} />
      </Routes>
    </Layout>
  );
}

export default App;
