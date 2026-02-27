import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Checklists from './pages/Checklists';
import Maintenance from './pages/Maintenance';
import Fuel from './pages/Fuel';
import Reports from './pages/Reports';
import Trips from './pages/Trips';
import Fines from './pages/Fines';
import AccessControl from './pages/AccessControl';
import { supabase } from './services/supabase';

import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/registrar" element={!user ? <Register /> : <Navigate to="/" />} />

        {/* Protected Routes */}
        <Route element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/veiculos" element={<Vehicles />} />
          <Route path="/condutores" element={<Drivers />} />
          <Route path="/checklists" element={<Checklists />} />
          <Route path="/multas" element={<Fines />} />
          <Route path="/manutencao" element={<Maintenance />} />
          <Route path="/abastecimento" element={<Fuel />} />
          <Route path="/relatorios" element={<Reports />} />
          <Route path="/rotas" element={<Trips />} />
          <Route path="/acessos" element={<AccessControl />} />
        </Route>
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
