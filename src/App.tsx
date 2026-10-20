import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Dashboard } from './pages/Dashboard';
import { SimplePage } from './pages/SimplePage';
import { MultiplePage } from './pages/MultiplePage';
import { LogisticPage } from './pages/LogisticPage';
import { TreePage } from './pages/TreePage';
import { ComparePage } from './pages/ComparePage';
import { LabPage } from './pages/LabPage';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#060810' }}>
    <div className="text-center">
      <h1 className="text-2xl font-black text-white">Esa ruta no existe</h1>
      <Link to="/" className="inline-block mt-4 text-sm font-bold text-indigo-300">Volver al panel</Link>
    </div>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/regresion-simple" element={<SimplePage />} />
          <Route path="/regresion-multiple" element={<MultiplePage />} />
          <Route path="/regresion-logistica" element={<LogisticPage />} />
          <Route path="/arboles" element={<TreePage />} />
          <Route path="/comparacion" element={<ComparePage />} />
          <Route path="/laboratorio" element={<LabPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
