import React from 'react';
import { Navigate } from 'react-router-dom';

export const ProductCatalogSettingsPage: React.FC = () => (
  <Navigate to="/admin/settings/catalog/product-pricing" replace />
);
