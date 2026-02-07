import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import FormFiller from './pages/FormFiller';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/form" element={<FormFiller />} />
      </Routes>
    </Router>
  );
}

export default App;
