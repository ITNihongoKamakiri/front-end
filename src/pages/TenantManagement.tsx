import React, { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import '../styles/TenantManagement.css';
import axios from 'axios';

interface Tenant {
  id: number;
  fullName: string;
  avatar?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  idCardNumber?: string;
  permanentAddress: string;
  phoneNumber: string;
}

const getGenderLabel = (gender?: string): string => {
  switch (gender) {
    case 'MALE':
      return 'Nam';
    case 'FEMALE':
      return 'Nữ';
    case 'OTHER':
      return 'Khác';
    default:
      return 'Không rõ';
  }
};

const TenantManagement: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    axios.get('http://localhost:8080/api/tenants')
      .then(res => {
        setTenants(res.data);
        if (res.data.length > 0) {
          setSelectedTenantId(res.data[0].id);
        }
      })
      .catch(err => {
        console.error('Lỗi khi lấy danh sách người thuê:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const selectedTenant = tenants.find(t => t.id === selectedTenantId);

  return (
    <div className="tenant-management-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-item">QL Hợp đồng</div>
        <div className="sidebar-item">QL thanh toán</div>
        <div className="sidebar-item">QL nội thất</div>
        <div className="sidebar-item">Cài đặt</div>
      </div>

      {/* Main content */}
      <div className="main-content">
        <div className="main-header">
          <h1>Quản lý người thuê</h1>
        </div>

        <div className="content-wrapper">
          {/* Danh sách người thuê */}
          <div className="tenants-list">
            {loading ? (
              <div>Đang tải danh sách...</div>
            ) : tenants.length === 0 ? (
              <div>Không có người thuê nào</div>
            ) : (
              tenants.map((tenant, index) => (
                <div 
                  key={tenant.id} 
                  className={`tenant-list-item ${tenant.id === selectedTenantId ? 'active' : ''}`}
                  onClick={() => setSelectedTenantId(tenant.id)}
                >
                  Người {index + 1}
                </div>
              ))
            )}
          </div>

          {/* Chi tiết người thuê */}
          <div className="tenant-details">
            {selectedTenant ? (
              <>
                <div className="tenant-info">
                  <div className="tenant-info-field">
                    <label>Họ và Tên</label>
                    <div className="info-value">{selectedTenant.fullName}</div>
                  </div>

                  <div className="tenant-info-field">
                    <label>Địa chỉ</label>
                    <div className="info-value">{selectedTenant.permanentAddress}</div>
                  </div>

                  <div className="tenant-info-field">
                    <label>SĐT</label>
                    <div className="info-value">{selectedTenant.phoneNumber}</div>
                  </div>

                  <div className="tenant-info-field">
                    <label>Số CMND/CCCD</label>
                    <div className="info-value">{selectedTenant.idCardNumber || 'Chưa có'}</div>
                  </div>

                  <div className="tenant-info-field">
                    <label>Giới tính</label>
                    <div className="info-value">{getGenderLabel(selectedTenant.gender)}</div>
                  </div>
                </div>

                <div className="tenant-photo">
                  <div className="photo-container">
                    {selectedTenant.avatar ? (
                      <img src={selectedTenant.avatar} alt={selectedTenant.fullName} />
                    ) : (
                      <div className="default-photo">
                        <User size={48} />
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div>Chưa có người thuê được chọn</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantManagement;
