import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ApartmentListings from './pages/dashboard';
import ApartmentManagement from './pages/ApartmentManagement';
import RoomDashboard from './pages/RoomDashboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Layout from './components/Layout';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ApartmentListings />} />
          <Route path="/apartments/:id" element={<ApartmentManagement />} />
          <Route path="/room/:id" element={<RoomDashboard />} />
          {/* Không sử dụng trực tiếp TenantManagement và ContractManagement vì cần roomId */}
          {/* Add other routes here */}
        </Route>
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </BrowserRouter>
  );
};

export default App;