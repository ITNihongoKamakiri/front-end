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
import { createTenant, TenantCreateRequest } from '../service/tenant.service';

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

enum ViewMode {
  TENANT = 'tenant',
  CONTRACT = 'contract'
}

const TenantManagement: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.TENANT);
  const [contracts, setContracts] = useState<ContractResponse[]>([]);
  const [contractLoading, setContractLoading] = useState<boolean>(false);
  const [contractError, setContractError] = useState<string | null>(null);

  const [newContract, setNewContract] = useState<ContractCreateRequest>({
    roomId: 0,
    representativeTenantId: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 12)).toISOString().split('T')[0],
    depositAmount: 0
  });


  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lấy roomId từ URL
  const { id } = useParams<{ id: string }>();
  const roomId = id ? parseInt(id) : 0;

  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState<boolean>(false);
  const [newTenant, setNewTenant] = useState<TenantCreateRequest>({
    fullName: '',
    phoneNumber: '',
    permanentAddress: '',
    gender: 'MALE',
    idCardNumber: ''
  });
  const [tenantError, setTenantError] = useState<string | null>(null);
  const [isCreatingTenant, setIsCreatingTenant] = useState<boolean>(false);

  useEffect(() => {
    axios.get('http://localhost:8080/api/tenants')
      .then(res => {
        setTenants(res.data);
        if (res.data.length > 0) {
          setSelectedTenantId(res.data[0].id);

          // Set representative tenant id for new contract
          setNewContract(prev => ({
            ...prev,
            representativeTenantId: res.data[0].id,
            roomId: roomId
          }));
        }
      })
      .catch(err => {
        console.error('Lỗi khi lấy danh sách người thuê:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [roomId]);

  const selectedTenant = tenants.find(t => t.id === selectedTenantId);

  const loadContracts = async () => {
    if (!roomId) return;

    setContractLoading(true);
    setContractError(null);

    try {
      const data = await getContractsByRoomId(roomId);
      setContracts(data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách hợp đồng:', error);
      setContractError('Không thể tải danh sách hợp đồng. Vui lòng thử lại sau.');
    } finally {
      setContractLoading(false);
    }
  };

  const handleSwitchView = (mode: ViewMode) => {
    setViewMode(mode);

    if (mode === ViewMode.CONTRACT) {
      loadContracts();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra loại file
    if (!file.type.match('image.*')) {
      setContractError('Vui lòng chọn file hình ảnh (jpg, png, gif, etc.)');
      return;
    }

    // Giới hạn kích thước file (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setContractError('Kích thước file không được vượt quá 5MB');
      return;
    }

    // Lưu file đã chọn
    setSelectedFile(file);

    // Tạo URL preview
    const fileReader = new FileReader();
    fileReader.onload = () => {
      setPreviewUrl(fileReader.result as string);
    };
    fileReader.readAsDataURL(file);

    // Xóa thông báo lỗi
    setContractError(null);
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleContractInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewContract(prev => ({
      ...prev,
      [name]: name === 'depositAmount' ? parseFloat(value) : value
    }));
  };


  const handleContractSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setContractError(null);

    try {
      // Upload image if selected
      let contractImage = '';
      if (selectedFile) {
        contractImage = await uploadImageToCloudinary(selectedFile);
      }

      // Create contract data
      const contractData: ContractCreateRequest = {
        ...newContract,
        contractImage
      };

      // Submit form
      await createContract(contractData);

      // Reload contracts list
      loadContracts();

      // Reset form
      setPreviewUrl(null);
      setSelectedFile(null);
      setNewContract({
        roomId: roomId,
        representativeTenantId: selectedTenantId || 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 12)).toISOString().split('T')[0],
        depositAmount: 0
      });

    } catch (error: any) {
      console.error('Lỗi khi tạo hợp đồng:', error);
      setContractError(
        error.response?.data?.message ||
        'Có lỗi xảy ra khi tạo hợp đồng. Vui lòng thử lại.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };


  const isNearExpiry = (endDate: string) => {
    const today = new Date();
    const expiryDate = new Date(endDate);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };


    const handleOpenAddTenantModal = () => {
    setIsAddTenantModalOpen(true);
    setTenantError(null);
    setNewTenant({
      fullName: '',
      phoneNumber: '',
      permanentAddress: '',
      gender: 'MALE',
      idCardNumber: ''
    });
  };

    const handleCloseAddTenantModal = () => {
    setIsAddTenantModalOpen(false);
  };

    const handleTenantInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTenant(prev => ({
      ...prev,
      [name]: value
    }));
  };

   const handleTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingTenant(true);
    setTenantError(null);

    try {
      // Validate dữ liệu
      if (!newTenant.fullName || !newTenant.phoneNumber || !newTenant.permanentAddress) {
        setTenantError('Vui lòng nhập đầy đủ thông tin bắt buộc');
        setIsCreatingTenant(false);
        return;
      }

      // Gọi API tạo người thuê mới
      const createdTenant = await createTenant(newTenant);
      
      // Thêm người thuê mới vào danh sách
      setTenants(prev => [...prev, createdTenant]);
      
      // Cập nhật selectedTenantId và representativeTenantId trong newContract
      setSelectedTenantId(createdTenant.id);
      setNewContract(prev => ({
        ...prev,
        representativeTenantId: createdTenant.id
      }));
      
      // Đóng modal
      handleCloseAddTenantModal();
      
    } catch (error: any) {
      console.error('Lỗi khi tạo người thuê mới:', error);
      setTenantError(error.message || 'Có lỗi xảy ra khi tạo người thuê mới');
    } finally {
      setIsCreatingTenant(false);
    }
  };


  return (
    <div className="tenant-management-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div
          className={`sidebar-item ${viewMode === ViewMode.CONTRACT ? 'active' : ''}`}
          onClick={() => handleSwitchView(ViewMode.CONTRACT)}
        >
          QL Hợp đồng
        </div>
        <div className="sidebar-item">QL thanh toán</div>
        <div className="sidebar-item">QL nội thất</div>
        <div
          className={`sidebar-item ${viewMode === ViewMode.TENANT ? 'active' : ''}`}
          onClick={() => handleSwitchView(ViewMode.TENANT)}
        >
          QL người thuê
        </div>
        <div className="sidebar-item">Cài đặt</div>
      </div>

      {/* Main content */}
      <div className="main-content">
        <div className="main-header">
          <h1>{viewMode === ViewMode.TENANT ? 'Quản lý người thuê' : 'Quản lý hợp đồng'}</h1>
        </div>

        {/* Nội dung chính */}
        {viewMode === ViewMode.TENANT ? (
          // Nội dung quản lý người thuê
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
        ) : (
          // Nội dung quản lý hợp đồng
          <div className="contract-content">
            {contractError && <div className="error-message">{contractError}</div>}

            {contractLoading ? (
              <div className="loading">Đang tải thông tin hợp đồng...</div>
            ) : contracts.length > 0 ? (
              // Hiển thị thông tin hợp đồng
              <div className="contract-details">
                {/* Left part - image placeholder */}
                <div className="contract-image-section">
                  <div
                    className="image-container"
                    onClick={handleImageClick}
                  >
                    {contracts[0].contractImage ? (
                      <img
                        src={contracts[0].contractImage}
                        alt="Contract document"
                        className="contract-image"
                      />
                    ) : (
                      <div className="image-placeholder">
                        <Calendar size={48} />
                        <div className="upload-overlay">
                          <span>Click để cập nhật ảnh</span>
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
                      onClick={handleImageClick}
                    >
                      Thay đổi
                    </button>
                  </div>
                </div>

                {/* Right part - contract information */}
                <div className="contract-info-section">
                  <div className="contract-basic-info">
                    <p>Người đại diện: {contracts[0].tenantName}</p>
                    <p>Tên chung cư: {contracts[0].buildingName}</p>
                    <p>Số phòng: {contracts[0].roomNumber}</p>
                  </div>

                  {/* Expiry date */}
                  <div className="expiry-container">
                    <div className="expiry-date">
                      <div>Ngày hết hạn: {formatDate(contracts[0].endDate)}</div>
                    </div>

                    {isNearExpiry(contracts[0].endDate) && (
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
                        min="1"
                        defaultValue="30"
                      />
                      <div className="days-label">(ngày)</div>
                    </div>

                    {/* Update button */}
                    <div className="update-button-container">
                      <button className="update-button">
                        Cập nhật
                      </button>
                    </div>
                  </div>

                  {/* Last updated information */}
                  <div className="last-updated">
                    Cập nhật gần nhất: {formatDate(contracts[0].createdAt)}
                  </div>
                </div>
              </div>
            ) : (
              // Form tạo hợp đồng mới
              <div className="create-contract-form">
                <h2 className="form-title">Tạo hợp đồng mới</h2>

                <form onSubmit={handleContractSubmit}>
                 <div className="form-group">
                  <label>Người đại diện</label>
                  <div className="representative-selector">
                    <select 
                      className="form-control representative-select"
                      name="representativeTenantId"
                      value={newContract.representativeTenantId || ''}
                      onChange={handleContractInputChange}
                      required
                    >
                      <option value="">Chọn người đại diện</option>
                      {tenants.map(tenant => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.fullName}
                        </option>
                      ))}
                    </select>
                    <button 
                      type="button" 
                      className="add-tenant-button"
                      onClick={handleOpenAddTenantModal}
                    >
                      <Plus size={16} /> Thêm người thuê
                    </button>
                  </div>
                </div>
                
                  <div className="form-group">
                    <label>Ngày bắt đầu</label>
                    <input
                      type="date"
                      className="form-control"
                      name="startDate"
                      value={newContract.startDate}
                      onChange={handleContractInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Ngày kết thúc</label>
                    <input
                      type="date"
                      className="form-control"
                      name="endDate"
                      value={newContract.endDate}
                      onChange={handleContractInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Số tiền đặt cọc</label>
                    <input
                      type="number"
                      className="form-control"
                      name="depositAmount"
                      value={newContract.depositAmount}
                      onChange={handleContractInputChange}
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Hình ảnh hợp đồng</label>
                    <div
                      className="image-container"
                      onClick={handleImageClick}
                      style={{ height: '150px' }}
                    >
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Contract preview"
                          className="contract-image"
                        />
                      ) : (
                        <div className="image-placeholder">
                          <Upload size={36} />
                          <p>Nhấp để tải ảnh lên</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden-input"
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => setViewMode(ViewMode.TENANT)}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="submit-button"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Đang xử lý...' : 'Tạo hợp đồng'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>



            {/* Modal thêm người thuê mới */}
      {isAddTenantModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container tenant-modal">
            <div className="modal-header">
              <h2>Thêm người thuê mới</h2>
              <button className="close-button" onClick={handleCloseAddTenantModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {tenantError && <div className="error-message">{tenantError}</div>}
              
              <form onSubmit={handleTenantSubmit}>
                <div className="form-group">
                  <label htmlFor="fullName">Họ và tên <span className="required">*</span></label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={newTenant.fullName}
                    onChange={handleTenantInputChange}
                    placeholder="Nhập họ và tên"
                    required
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="idCardNumber">Số CMND/CCCD</label>
                  <input
                    type="text"
                    id="idCardNumber"
                    name="idCardNumber"
                    value={newTenant.idCardNumber || ''}
                    onChange={handleTenantInputChange}
                    placeholder="Nhập số CMND/CCCD"
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phoneNumber">Số điện thoại <span className="required">*</span></label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={newTenant.phoneNumber}
                    onChange={handleTenantInputChange}
                    placeholder="Nhập số điện thoại"
                    required
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="gender">Giới tính</label>
                  <select
                    id="gender"
                    name="gender"
                    value={newTenant.gender || 'MALE'}
                    onChange={handleTenantInputChange}
                    className="form-control"
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="permanentAddress">Địa chỉ thường trú <span className="required">*</span></label>
                  <input
                    type="text"
                    id="permanentAddress"
                    name="permanentAddress"
                    value={newTenant.permanentAddress}
                    onChange={handleTenantInputChange}
                    placeholder="Nhập địa chỉ thường trú"
                    required
                    className="form-control"
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
                    className="submit-button"
                    disabled={isCreatingTenant}
                  >
                    {isCreatingTenant ? 'Đang xử lý...' : 'Thêm người thuê'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManagement;
