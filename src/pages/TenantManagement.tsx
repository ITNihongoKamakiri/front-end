import React, { useEffect, useState, useRef } from 'react';
import { User, AlertTriangle, Calendar, Upload, Plus, X } from 'lucide-react';
import '../styles/TenantManagement.css';
import '../styles/ContractManagement.css';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import {
  ContractResponse,
  ContractCreateRequest,
  getContractsByRoomId,
  createContract
} from '../service/contract.service';
import { uploadImageToCloudinary } from '../service/cloudinary.service';
import { createTenant, TenantCreateRequest, getAllTenants, Tenant } from '../service/tenant.service';
import { handleApiError, showSuccessToast } from '../utils/apiErrorHandler';

enum ViewMode {
  TENANT = 'tenant',
  CONTRACT = 'contract'
}

interface TenantManagementProps {
  roomId: number;
}

const TenantManagement: React.FC<TenantManagementProps> = ({ roomId }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [tenantError, setTenantError] = useState<string | null>(null);

  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState<boolean>(false);
  const [newTenant, setNewTenant] = useState<TenantCreateRequest>({
    fullName: '',
    phoneNumber: '',
    permanentAddress: '',
    gender: 'MALE',
    idCardNumber: ''
  });
  const [isCreatingTenant, setIsCreatingTenant] = useState<boolean>(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadTenants = async () => {
      try {
        setLoading(true);
        const data = await getAllTenants();
        setTenants(data);
        if (data.length > 0) {
          setSelectedTenantId(data[0].id);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách người thuê:', error);
        handleApiError(error, 'Không thể tải danh sách người thuê');
      } finally {
        setLoading(false);
      }
    };

    loadTenants();
  }, []);

  const selectedTenant = tenants.find(t => t.id === selectedTenantId) || null;

  const handleTenantSelect = (id: number) => {
    setSelectedTenantId(id);
  };

  const handleOpenAddTenantModal = () => {
    setIsAddTenantModalOpen(true);
    resetNewTenantForm();
  };

  const handleCloseAddTenantModal = () => {
    setIsAddTenantModalOpen(false);
    resetNewTenantForm();
  };

  const resetNewTenantForm = () => {
    setNewTenant({
      fullName: '',
      phoneNumber: '',
      permanentAddress: '',
      gender: 'MALE',
      idCardNumber: ''
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setTenantError(null);
  };

  const handleNewTenantChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTenant(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Kiểm tra kích thước file (tối đa 5MB)
      if (file.size > 5 * 1024 * 1024) {
        handleApiError(new Error('Kích thước file không được vượt quá 5MB'));
        return;
      }
      
      // Kiểm tra định dạng file
      if (!file.type.match('image.*')) {
        handleApiError(new Error('Vui lòng chọn file hình ảnh (jpg, png, gif, etc.)'));
        return;
      }
      
      setSelectedFile(file);
      
      // Tạo URL tạm thời để xem trước
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    // Kiểm tra số điện thoại Việt Nam
    const phoneRegex = /^(0|\+84)(\d{9,10})$/;
    return phoneRegex.test(phoneNumber);
  };

  const validateIdCardNumber = (idCardNumber: string): boolean => {
    // Kiểm tra CMND/CCCD (9 hoặc 12 số)
    const idRegex = /^\d{9}(\d{3})?$/;
    return idRegex.test(idCardNumber);
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setTenantError(null);
    
    // Kiểm tra dữ liệu đầu vào
    if (!newTenant.fullName.trim()) {
      setTenantError('Vui lòng nhập họ tên người thuê');
      return;
    }
    
    if (!validatePhoneNumber(newTenant.phoneNumber)) {
      setTenantError('Số điện thoại không hợp lệ');
      return;
    }
    
    if (newTenant.idCardNumber && !validateIdCardNumber(newTenant.idCardNumber)) {
      setTenantError('Số CMND/CCCD không hợp lệ (phải có 9 hoặc 12 số)');
      return;
    }
    
    setIsCreatingTenant(true);
    
    try {
      // Upload avatar if selected
      let avatarUrl = '';
      if (selectedFile) {
        avatarUrl = await uploadImageToCloudinary(selectedFile);
      }
      
      const tenantData = {
        ...newTenant,
        avatar: avatarUrl
      };
      
      const createdTenant = await createTenant(tenantData);
      
      // Update tenants list
      setTenants(prev => [...prev, createdTenant]);
      setSelectedTenantId(createdTenant.id);
      
      // Close modal and reset form
      handleCloseAddTenantModal();
      showSuccessToast('Tạo người thuê mới thành công');
    } catch (error) {
      console.error('Lỗi khi tạo người thuê:', error);
      handleApiError(error, 'Có lỗi xảy ra khi tạo người thuê');
    } finally {
      setIsCreatingTenant(false);
    }
  };

  const getGenderLabel = (gender?: string): string => {
    switch (gender) {
      case 'MALE':
        return 'Nam';
      case 'FEMALE':
        return 'Nữ';
      case 'OTHER':
        return 'Khác';
      default:
        return 'Không xác định';
    }
  };

  if (loading) {
    return <div className="loading">Đang tải thông tin người thuê...</div>;
  }

  return (
    <div className="tenant-management">
      <div className="tenant-container">
        {/* Tenant List Panel */}
        <div className="tenant-list-panel">
          <div className="panel-header">
            <h3>Danh sách người thuê</h3>
            <button className="add-tenant-btn" onClick={handleOpenAddTenantModal}>
              <Plus size={18} />
              <span>Thêm người thuê</span>
            </button>
          </div>

          <div className="tenant-list">
            {tenants.length === 0 ? (
              <div className="no-tenants">Chưa có người thuê nào</div>
            ) : (
              tenants.map(tenant => (
                <div
                  key={tenant.id}
                  className={`tenant-card ${selectedTenantId === tenant.id ? 'selected' : ''}`}
                  onClick={() => handleTenantSelect(tenant.id)}
                >
                  <div className="tenant-avatar">
                    {tenant.avatar ? (
                      <img src={tenant.avatar} alt={tenant.fullName} />
                    ) : (
                      <div className="avatar-placeholder">
                        <User size={24} />
                      </div>
                    )}
                  </div>
                  <div className="tenant-card-info">
                    <div className="tenant-name">{tenant.fullName}</div>
                    <div className="tenant-phone">{tenant.phoneNumber}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tenant Details Panel */}
        <div className="tenant-details-panel">
          {selectedTenant ? (
            <>
              <div className="panel-header">
                <h3>Thông tin chi tiết</h3>
              </div>
              
              <div className="tenant-details">
                <div className="tenant-profile">
                  <div className="tenant-avatar-large">
                    {selectedTenant.avatar ? (
                      <img src={selectedTenant.avatar} alt={selectedTenant.fullName} />
                    ) : (
                      <div className="avatar-placeholder-large">
                        <User size={64} />
                      </div>
                    )}
                  </div>
                  <h2 className="tenant-name-large">{selectedTenant.fullName}</h2>
                </div>
                
                <div className="tenant-info-grid">
                  <div className="tenant-info-field">
                    <label>Số điện thoại</label>
                    <div className="info-value">{selectedTenant.phoneNumber}</div>
                  </div>
                  
                  <div className="tenant-info-field">
                    <label>Địa chỉ thường trú</label>
                    <div className="info-value">{selectedTenant.permanentAddress}</div>
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
                
                <div className="tenant-actions">
                  <button className="edit-tenant-btn">
                    Chỉnh sửa thông tin
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="no-tenant-selected">
              <User size={64} />
              <p>Chọn một người thuê để xem thông tin chi tiết</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Tenant Modal */}
      {isAddTenantModalOpen && (
        <div className="modal-overlay">
          <div className="tenant-modal">
            <div className="modal-header">
              <h3>Thêm người thuê mới</h3>
              <button className="close-button" onClick={handleCloseAddTenantModal}>
                <X size={20} />
              </button>
            </div>
            
            {tenantError && (
              <div className="error-message">
                <AlertTriangle size={16} />
                {tenantError}
              </div>
            )}
            
            <form onSubmit={handleCreateTenant} className="tenant-form">
              <div className="avatar-upload">
                <div
                  className="avatar-preview"
                  onClick={handleFileSelect}
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Avatar preview" />
                  ) : (
                    <div className="avatar-placeholder">
                      <User size={40} />
                      <span>Tải lên ảnh</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="fullName">
                  Họ và tên <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  className="form-control"
                  value={newTenant.fullName}
                  onChange={handleNewTenantChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phoneNumber">
                  Số điện thoại <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  className="form-control"
                  value={newTenant.phoneNumber}
                  onChange={handleNewTenantChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="idCardNumber">
                  Số CMND/CCCD
                </label>
                <input
                  type="text"
                  id="idCardNumber"
                  name="idCardNumber"
                  className="form-control"
                  value={newTenant.idCardNumber}
                  onChange={handleNewTenantChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="gender">
                  Giới tính
                </label>
                <select
                  id="gender"
                  name="gender"
                  className="form-control"
                  value={newTenant.gender}
                  onChange={handleNewTenantChange}
                >
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="permanentAddress">
                  Địa chỉ thường trú <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="permanentAddress"
                  name="permanentAddress"
                  className="form-control"
                  value={newTenant.permanentAddress}
                  onChange={handleNewTenantChange}
                  required
                />
              </div>
              
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleCloseAddTenantModal}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="save-button"
                  disabled={isCreatingTenant}
                >
                  {isCreatingTenant ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManagement;
