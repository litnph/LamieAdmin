import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/inter/wght.css';
import '@/index.css';
import '@/app/modules/registry';
import { AppRouter } from '@/app/router/AppRouter';
import { initAdminTheme } from '@/shared/theme/adminTheme';
import { ThemeProvider } from '@/shared/theme/ThemeContext';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { NavigationProvider } from '@/features/navigation/context/NavigationContext';
import { apiClient } from '@/services/apiClient';
import { attachInterceptors } from '@/services/axiosInterceptor';

initAdminTheme();
attachInterceptors(apiClient);

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <NavigationProvider>
            <ThemeProvider>
              <AppRouter />
            </ThemeProvider>
          </NavigationProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}
