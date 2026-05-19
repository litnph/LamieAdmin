import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from '@/app/router/AppRouter';
import { initAdminPrimaryTheme } from '@/shared/theme/adminPrimary';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { apiClient } from '@/services/apiClient';
import { attachInterceptors } from '@/services/axiosInterceptor';

initAdminPrimaryTheme();
attachInterceptors(apiClient);

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}
