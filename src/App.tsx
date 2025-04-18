import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ApartmentListings from './pages/dashboard';
import ApartmentManagement from './pages/ApartmentManagement';
import TenantManagement from './pages/TenantManagement';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ApartmentListings />} />
        <Route path="/apartments/:id" element={<ApartmentManagement />} />
        <Route path="/tenants/:id" element={<TenantManagement />} />
        {/* Add other routes here */}
      </Routes>
    </BrowserRouter>
  );
};

export default App;