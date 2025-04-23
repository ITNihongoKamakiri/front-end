import React, { useState } from 'react';
import { User } from 'lucide-react';
import '../styles/TenantManagement.css';
import apartmentImage from '../assets/images/profile_default.png';

interface Tenant {
  id: string;
  name: string;
  address: string;
  phone: string;
  birthdate: string;
  image?: string;
}

const TenantManagement: React.FC = () => {
  const tenants: Tenant[] = [
    {
      id: '1',
      name: 'Nguyễn Văn A',
      address: '123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh',
      phone: '0901234567',
      birthdate: '01/01/1990',
      image: apartmentImage
    },
    {
      id: '2',
      name: 'Trần Thị B',
      address: '456 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
      phone: '0907654321',
      birthdate: '15/05/1992',
      image: apartmentImage
    },
    {
      id: '3',
      name: 'Lê Văn C',
      address: '789 Đường Cách Mạng Tháng 8, Quận 3, TP. Hồ Chí Minh',
      phone: '0912345678',
      birthdate: '22/12/1985',
      image: undefined
    },
  ];

  // State để lưu trữ ID của người thuê được chọn
  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenants[0].id);

  // Tìm người thuê được chọn từ danh sách
  const selectedTenant = tenants.find(tenant => tenant.id === selectedTenantId) || tenants[0];

  return (
    <div className="tenant-management-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-item">
          <span>QL Hợp đồng</span>
        </div>
        <div className="sidebar-item">
          <span>QL thanh toán</span>
        </div>
        <div className="sidebar-item">
          <span>QL nội thất</span>
        </div>
        <div className="sidebar-item">
          <span>Cài đặt</span>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        {/* Header */}
        <div className="main-header">
          <h1>Quản lý người thuê</h1>
        </div>

        {/* Content wrapper */}
        <div className="content-wrapper">
          {/* Tenant list column */}
          <div className="tenants-list">
            {tenants.map((tenant, index) => (
              <div 
                key={tenant.id} 
                className={`tenant-list-item ${selectedTenantId === tenant.id ? 'active' : ''}`}
                onClick={() => setSelectedTenantId(tenant.id)}
              >
                <span className="tenant-number">({index + 1})</span> Người {index + 1}
              </div>
            ))}
          </div>

          {/* Tenant details */}
          <div className="tenant-details">
            <div className="tenant-info">
              <div className="tenant-info-field">
                <span className="field-number">(4)</span>
                <label>Họ và Tên</label>
                <div className="info-value">{selectedTenant.name}</div>
              </div>
              
              <div className="tenant-info-field">
                <span className="field-number">(5)</span>
                <label>Địa chỉ</label>
                <div className="info-value">{selectedTenant.address}</div>
              </div>
              
              <div className="tenant-info-field">
                <span className="field-number">(6)</span>
                <label>SĐT</label>
                <div className="info-value">{selectedTenant.phone}</div>
              </div>
              
              <div className="tenant-info-field">
                <span className="field-number">(7)</span>
                <label>Ngày sinh</label>
                <div className="info-value">{selectedTenant.birthdate}</div>
              </div>
            </div>
            
            <div className="tenant-photo">
              <span className="photo-number">(8)</span>
              <div className="photo-container">
                {selectedTenant.image ? (
                  <img src={selectedTenant.image} alt={selectedTenant.name} />
                ) : (
                  <div className="default-photo">
                    <User size={48} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantManagement;