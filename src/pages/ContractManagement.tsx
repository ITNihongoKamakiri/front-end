import React, { useState, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import '../styles/ContractManagement.css';

// Mock data types
interface Contract {
  id: string;
  address: string;
  buildingName: string;
  roomNumber: string;
  expiryDate: string;
  nearExpiry: boolean;
}

// Sidebar button props
interface SidebarButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

// Sidebar button component
const SidebarButton: React.FC<SidebarButtonProps> = ({ label, isActive, onClick }) => {
  return (
    <button
      className={`sidebar-button ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

// Main Component
const ContractManagementInterface: React.FC = () => {
  const [selectedSection, setSelectedSection] = useState('contractDetails');
  const [daysToExtend, setDaysToExtend] = useState(30);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Mock contract data
  const contract: Contract = {
    id: 'HD-12345',
    address: 'xxx',
    buildingName: 'xxxxx',
    roomNumber: '00x',
    expiryDate: '20/05/2025',
    nearExpiry: true
  };

  const formattedLastUpdate = '05/05/2025';

  // Handle extension update
  const handleExtend = () => {
    alert(`Contract extended by ${daysToExtend} days`);
  };
  
  // Handle image click to trigger file input
  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle change button click
  const handleChangeButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="management-container">
      {/* Main layout container */}
      <div className="main-layout">
        {/* Left sidebar */}
        <div className="sidebar">
          <SidebarButton 
            label="QL Hợp đồng" 
            isActive={selectedSection === 'contracts'} 
            onClick={() => setSelectedSection('contracts')} 
          />
          <SidebarButton 
            label="QL thanh toán" 
            isActive={selectedSection === 'payments'} 
            onClick={() => setSelectedSection('payments')} 
          />
          <SidebarButton 
            label="QL nội thất" 
            isActive={selectedSection === 'furniture'} 
            onClick={() => setSelectedSection('furniture')} 
          />
          <SidebarButton 
            label="QL người thuê" 
            isActive={selectedSection === 'tenants'} 
            onClick={() => setSelectedSection('tenants')} 
          />
          <SidebarButton 
            label="Cài đặt" 
            isActive={selectedSection === 'settings'} 
            onClick={() => setSelectedSection('settings')} 
          />
        </div>

        {/* Main content area */}
        <div className="content-area">
          {/* Top header with logo and title */}
          <div className="header">
            <div className="logo">Logo</div>
            <div className="title">Quản lý hợp đồng</div>
          </div>

          {/* Content area */}
          <div className="main-content">
            <div className="contract-content">
              <h2 className="section-title">Chi tiết hợp đồng</h2>
              
              {/* Contract details layout */}
              <div className="contract-details">
                {/* Left part - image placeholder */}
                <div className="contract-image-section">
                  <div 
                    className="image-container" 
                    onClick={handleImageClick}
                  >
                    {selectedImage ? (
                      <img 
                        src={selectedImage} 
                        alt="Contract document" 
                        className="contract-image" 
                      />
                    ) : (
                      <div className="image-placeholder">
                        <img 
                          src="/api/placeholder/400/320" 
                          alt="Contract document" 
                          className="contract-image" 
                        />
                        <div className="upload-overlay">
                          <span>Click để chọn ảnh</span>
                        </div>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden-input"
                    />
                  </div>
                  
                  {/* Edit button */}
                  <div className="edit-button-container">
                    <button 
                      className="edit-button"
                      onClick={handleChangeButtonClick}
                    >
                      Thay đổi
                    </button>
                  </div>
                </div>
                
                {/* Right part - contract information */}
                <div className="contract-info-section">
                  <div className="contract-basic-info">
                    <p>Người đại diện: {contract.address}</p>
                    <p>Tên chung cư: {contract.buildingName}</p>
                    <p>Số phòng: {contract.roomNumber}</p>
                  </div>

                  {/* Expiry date */}
                  <div className="expiry-container">
                    <div className="expiry-date">
                      <div>Ngày hết hạn: {contract.expiryDate}</div>
                    </div>
                    
                    {contract.nearExpiry && (
                      <div className="expiry-warning">
                        <AlertTriangle size={16} className="warning-icon" />
                        <span>Sắp hết hạn</span>
                      </div>
                    )}
                  </div>

                  {/* Renewal section */}
                  <div className="renewal-section">
                    <h3 className="renewal-title">Cập nhật gia hạn</h3>
                    
                    {/* Extension input */}
                    <div className="extension-input">
                      <div className="input-label">Gia hạn thêm:</div>
                      <input 
                        type="number" 
                        className="days-input"
                        value={daysToExtend}
                        onChange={(e) => setDaysToExtend(parseInt(e.target.value))}
                      />
                      <div className="days-label">(ngày)</div>
                    </div>
                    
                    {/* Update button */}
                    <div className="update-button-container">
                      <button 
                        onClick={handleExtend}
                        className="update-button"
                      >
                        Cập nhật
                      </button>
                    </div>
                  </div>
                  
                  {/* Last updated information inside contract details */}
                  <div className="last-updated">
                    Cập nhật gần nhất: {formattedLastUpdate}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractManagementInterface;