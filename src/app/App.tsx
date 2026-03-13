import React, { useState } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardPage } from './pages/dashboard.page';
import { ProductPage } from './pages/product.page';
import { LoginPage } from './pages/login.page';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActivePage('dashboard');
  };

  // If not authenticated, show Login Page
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'products':
        return <ProductPage />;
      default:
        return <div className="text-center py-20 text-mocha-500">Page under construction</div>;
    }
  };

  return (
    <MainLayout activePage={activePage} onNavigate={setActivePage} onLogout={handleLogout}>
      {renderPage()}
    </MainLayout>
  );
};

export default App;
