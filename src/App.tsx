import React, { useState } from 'react';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Kegiatan from './pages/Kegiatan';
import Rekap from './pages/Rekap';
import Database from './pages/Database';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <Dashboard />;
      case 'kegiatan':
        return <Kegiatan onNavigate={setActiveMenu} />;
      case 'rekap':
        return <Rekap />;
      case 'database':
        return <Database />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout 
      activeMenu={activeMenu} 
      onNavigate={setActiveMenu}
      onLogout={() => {
        setIsAuthenticated(false);
        setActiveMenu('dashboard');
      }}
    >
      {renderContent()}
    </Layout>
  );
}

