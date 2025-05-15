import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ApartmentListings from './pages/dashboard';
import ApartmentManagement from './pages/ApartmentManagement';
import TenantManagement from './pages/TenantManagement';
import Layout from './components/Layout';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ApartmentListings />} />
          <Route path="/apartments/:id" element={<ApartmentManagement />} />
          <Route path="/tenants/:id" element={<TenantManagement />} />
          {/* Add other routes here */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;