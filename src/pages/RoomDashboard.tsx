import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import '../styles/RoomDashboard.css';
import { ArrowLeft } from 'lucide-react';

// Import các component 
import ContractManagementInterface from './ContractManagement';
import TenantManagement from './TenantManagement';
import { getRoomById } from '../service/room.service';
import { handleApiError } from '../utils/apiErrorHandler';

enum DashboardView {
  CONTRACT = 'contract',
  TENANT = 'tenant',
  PAYMENT = 'payment',
  FURNITURE = 'furniture',
  SETTINGS = 'settings'
}

const RoomDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<DashboardView>(DashboardView.CONTRACT);
  const { id } = useParams<{ id: string }>();
  const roomId = id ? parseInt(id) : 0;
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadRoomData = async () => {
      if (!roomId) return;
      
      try {
        setLoading(true);
        const data = await getRoomById(roomId);
        setRoomInfo(data);
      } catch (error) {
        handleApiError(error, 'Không thể tải thông tin phòng');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadRoomData();
  }, [roomId, navigate]);

  const handleViewChange = (view: DashboardView) => {
    setActiveView(view);
  };

  // Render đúng component con dựa trên activeView
  const renderContent = () => {
    switch (activeView) {
      case DashboardView.CONTRACT:
        return <ContractManagementInterface roomId={roomId} />;
      case DashboardView.TENANT:
        return <TenantManagement roomId={roomId} />;
      case DashboardView.PAYMENT:
        return <div className="placeholder-content">Quản lý thanh toán - Đang phát triển</div>;
      case DashboardView.FURNITURE:
        return <div className="placeholder-content">Quản lý nội thất - Đang phát triển</div>;
      case DashboardView.SETTINGS:
        return <div className="placeholder-content">Cài đặt - Đang phát triển</div>;
      default:
        return <ContractManagementInterface roomId={roomId} />;
    }
  };

  if (loading) {
    return <div className="loading-container">Đang tải thông tin phòng...</div>;
  }

  return (
    <div className="room-dashboard-container">
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <Link to="/dashboard" className="back-link">
            <ArrowLeft size={18} />
            <span>Trở về</span>
          </Link>
          {roomInfo && (
            <div className="room-info">
              <h3 className="room-name">{roomInfo.name}</h3>
            </div>
          )}
        </div>

        <div className="sidebar-menu">
          <div
            className={`sidebar-item ${activeView === DashboardView.CONTRACT ? 'active' : ''}`}
            onClick={() => handleViewChange(DashboardView.CONTRACT)}
          >
            QL Hợp đồng
          </div>
          <div
            className={`sidebar-item ${activeView === DashboardView.TENANT ? 'active' : ''}`}
            onClick={() => handleViewChange(DashboardView.TENANT)}
          >
            QL người thuê
          </div>
          <div
            className={`sidebar-item ${activeView === DashboardView.PAYMENT ? 'active' : ''}`}
            onClick={() => handleViewChange(DashboardView.PAYMENT)}
          >
            QL thanh toán
          </div>
          <div
            className={`sidebar-item ${activeView === DashboardView.FURNITURE ? 'active' : ''}`}
            onClick={() => handleViewChange(DashboardView.FURNITURE)}
          >
            QL nội thất
          </div>
          <div
            className={`sidebar-item ${activeView === DashboardView.SETTINGS ? 'active' : ''}`}
            onClick={() => handleViewChange(DashboardView.SETTINGS)}
          >
            Cài đặt
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>
            {activeView === DashboardView.CONTRACT && 'Quản lý hợp đồng'}
            {activeView === DashboardView.TENANT && 'Quản lý người thuê'}
            {activeView === DashboardView.PAYMENT && 'Quản lý thanh toán'}
            {activeView === DashboardView.FURNITURE && 'Quản lý nội thất'}
            {activeView === DashboardView.SETTINGS && 'Cài đặt'}
          </h1>
        </div>
        
        <div className="dashboard-main-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default RoomDashboard; 