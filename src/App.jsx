import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import FormFiller from './pages/FormFiller';
import History from './pages/History';
import Gramvani from './pages/Gramvani';
import Adhikar from './pages/Adhikar';
import Shikayat from './pages/Shikayat';
import Scene3D from './components/Scene3D';
import './index.css';

// Shared layout for simple pages (Gramvani, Adhikar, Shikayat)
function PageLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <Scene3D variant="home" />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <nav style={{ padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Link to="/" style={{ color: '#00ffaa', fontWeight: 800, fontSize: '1.1rem', textDecoration: 'none' }}>📋 Jan-Sahayak</Link>
          <Link to="/gramvani" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.9rem' }}>📰 ग्रामवाणी</Link>
          <Link to="/adhikar" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.9rem' }}>⚖️ अधिकार</Link>
          <Link to="/shikayat" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.9rem' }}>📣 शिकायत</Link>
          <Link to="/form" style={{ marginLeft: 'auto', background: 'linear-gradient(135deg,#7c3aed,#00ffaa)', color: '#fff', padding: '0.45rem 1.1rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem' }}>🚀 Fill Form</Link>
        </nav>
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/form" element={<FormFiller />} />
        <Route path="/history" element={<History />} />
        <Route path="/gramvani" element={<PageLayout><Gramvani /></PageLayout>} />
        <Route path="/adhikar" element={<PageLayout><Adhikar /></PageLayout>} />
        <Route path="/shikayat" element={<PageLayout><Shikayat /></PageLayout>} />
      </Routes>
    </Router>
  );
}

export default App;
