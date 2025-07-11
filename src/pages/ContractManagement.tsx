import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Calendar, Upload, UserPlus, X } from 'lucide-react';
import '../styles/ContractManagement.css';
import { useParams } from 'react-router-dom';
import {
  ContractResponse,
  ContractStatus,
  getContractsByRoomId,
  updateContract,
  updateContractImage,
  extendContract,
  createContract,
  ContractCreateRequest
} from '../service/contract.service';
import { uploadImageToCloudinary } from '../service/cloudinary.service';
import { handleApiError, showSuccessToast } from '../utils/apiErrorHandler';
import { TenantCreateRequest, createTenant, getAllTenants, Tenant } from '../service/tenant.service';

interface ContractManagementProps {
  roomId: number;
}

const ContractManagementInterface: React.FC<ContractManagementProps> = ({ roomId }) => {
  const [contract, setContract] = useState<ContractResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [extendMode, setExtendMode] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Thêm state cho tạo người đại diện mới
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [newTenant, setNewTenant] = useState<TenantCreateRequest>({
    fullName: '',
    phoneNumber: '',
    permanentAddress: '',
    idCardNumber: '',
    gender: 'MALE'
  });

  // Form states
  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    depositAmount: 0,
    status: ContractStatus.ACTIVE,
    contractNotes: '',
    representativeTenantId: 0
  });
  
  // Form tạo hợp đồng mới
  const [createForm, setCreateForm] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 12)).toISOString().split('T')[0],
    depositAmount: 0,
    contractNotes: '',
    representativeTenantId: 0
  });

  // Form gia hạn hợp đồng
  const [extendForm, setExtendForm] = useState({
    months: 0,
    years: 0,
    contractNotes: ''
  });

  // Fetch contract data
  useEffect(() => {
    const fetchContract = async () => {
      if (!roomId) return;
      
      setLoading(true);
      setError(null);
      try {
        console.log("Fetching contracts for roomId:", roomId);
        const contracts = await getContractsByRoomId(roomId);
        console.log("Contracts received:", contracts);
        if (contracts.length > 0) {
          setContract(contracts[0]);
          setForm({
            startDate: contracts[0].startDate.split('T')[0],
            endDate: contracts[0].endDate.split('T')[0],
            depositAmount: contracts[0].depositAmount,
            status: contracts[0].status as ContractStatus,
            contractNotes: contracts[0].contractNotes || '',
            representativeTenantId: contracts[0].tenantId || 0
          });
          setSelectedImage(contracts[0]?.contractImageUrl || null);
        }
      } catch (err: any) {
        const errorMsg = handleApiError(err, 'Không thể tải hợp đồng.');
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    
    fetchContract();
  }, [roomId]);

  // Lấy danh sách người thuê
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const data = await getAllTenants();
        setTenants(data);
      } catch (err: any) {
        console.error('Error fetching tenants:', err);
      }
    };
    
    fetchTenants();
  }, []);

  // Handle form changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'depositAmount' ? parseFloat(value) : value }));
  };
  
  const handleExtendFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setExtendForm(prev => ({ ...prev, [name]: name === 'months' || name === 'years' ? parseInt(value) : value }));
  };

  // Handle image click
  const handleImageClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };
  
  // Handle file select
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
      const reader = new FileReader();
      reader.onload = (ev) => setSelectedImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };
  
  // Update contract info
  const handleUpdateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;
    
    // Validate input
    if (new Date(form.endDate) < new Date(form.startDate)) {
      handleApiError(new Error('Ngày kết thúc phải sau ngày bắt đầu'));
      return;
    }
    
    if (form.depositAmount < 0) {
      handleApiError(new Error('Tiền đặt cọc không thể là số âm'));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const payload = {
        id: contract.id,
        ...form
      };
      console.log("Updating contract with payload:", payload);
      const updated = await updateContract(payload);
      showSuccessToast('Cập nhật hợp đồng thành công');
      setContract(updated);
      toggleEditMode();
    } catch (err: any) {
      handleApiError(err, 'Có lỗi khi cập nhật hợp đồng.');
    } finally {
      setLoading(false);
    }
  };

  // Upload image and update contract image
  const handleUpdateImage = async () => {
    if (!contract || !selectedFile) return;
    setIsUploading(true);
    setError(null);
    
    try {
      const url = await uploadImageToCloudinary(selectedFile, setUploadProgress);
      console.log("Image uploaded to:", url);
      const updated = await updateContractImage(contract.id, url);
      showSuccessToast('Cập nhật ảnh hợp đồng thành công');
      setContract(updated);
      setSelectedImage(url);
      setSelectedFile(null);
    } catch (err: any) {
      handleApiError(err, 'Có lỗi khi cập nhật ảnh hợp đồng.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  // Extend contract
  const handleExtendContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let imageUrl = undefined;
      if (selectedFile) {
        // Check file size (max 5MB)
        if (selectedFile.size > 5 * 1024 * 1024) {
          handleApiError(new Error('Kích thước file không được vượt quá 5MB'));
          setLoading(false);
          return;
        }
        
        imageUrl = await uploadImageToCloudinary(selectedFile, setUploadProgress);
      }
      
      const payload = {
        contractId: contract.id,
        months: extendForm.months,
        years: extendForm.years,
        contractNotes: extendForm.contractNotes,
        contractImageUrl: imageUrl
      };
      
      // Kiểm tra nếu cả hai giá trị months và years đều là 0
      if (extendForm.months === 0 && extendForm.years === 0) {
        handleApiError(new Error('Số tháng hoặc số năm gia hạn phải lớn hơn 0'));
        setLoading(false);
        return;
      }
      
      const updated = await extendContract(payload);
      showSuccessToast('Gia hạn hợp đồng thành công');
      setContract(updated);
      toggleExtendMode();
      setExtendForm({ months: 0, years: 0, contractNotes: '' });
      setSelectedFile(null);
    } catch (err: any) {
      handleApiError(err, 'Có lỗi khi gia hạn hợp đồng.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Kiểm tra xem hợp đồng có sắp hết hạn không (trong vòng 30 ngày)
  const isNearExpiry = (endDate?: string): boolean => {
    if (!endDate) return false;
    
    const today = new Date();
    const expiryDate = new Date(endDate);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 30 && diffDays >= 0;
  };

  // Hiển thị trạng thái hợp đồng bằng tiếng Việt
  const getStatusLabel = (status?: string): string => {
    switch (status) {
      case ContractStatus.PENDING:
        return 'Đang chờ xử lý';
      case ContractStatus.ACTIVE:
        return 'Đang hoạt động';
      case ContractStatus.EXPIRED:
        return 'Đã hết hạn';
      case ContractStatus.TERMINATED:
        return 'Đã chấm dứt';
      default:
        return status || 'Không xác định';
    }
  };

  // Hàm chuyển đổi trạng thái
  const toggleEditMode = () => {
    console.log("Toggle edit mode, current state:", editMode);
    setEditMode(prevState => !prevState);
    if (extendMode) setExtendMode(false);
  };

  const toggleExtendMode = () => {
    console.log("Toggle extend mode, current state:", extendMode);
    setExtendMode(prevState => !prevState);
    if (editMode) setEditMode(false);
  };

  // Toggle create mode
  const toggleCreateMode = () => {
    console.log("Toggle create mode");
    setCreateMode(prevState => !prevState);
    if (editMode) setEditMode(false);
    if (extendMode) setExtendMode(false);
  };

  // Handle create form changes
  const handleCreateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCreateForm(prev => ({ ...prev, [name]: name === 'depositAmount' ? parseFloat(value) : value }));
  };

  // Create new contract
  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return;
    
    // Validate input
    if (new Date(createForm.endDate) < new Date(createForm.startDate)) {
      handleApiError(new Error('Ngày kết thúc phải sau ngày bắt đầu'));
      return;
    }
    
    if (createForm.depositAmount < 0) {
      handleApiError(new Error('Tiền đặt cọc không thể là số âm'));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let imageUrl = undefined;
      
      if (selectedFile) {
        setIsUploading(true);
        imageUrl = await uploadImageToCloudinary(selectedFile, setUploadProgress);
        setIsUploading(false);
      }
      
      const payload: ContractCreateRequest = {
        roomId: roomId,
        representativeTenantId: createForm.representativeTenantId,
        startDate: createForm.startDate,
        endDate: createForm.endDate,
        depositAmount: createForm.depositAmount,
        contractNotes: createForm.contractNotes,
        contractImageUrl: imageUrl
      };
      
      console.log("Creating contract with payload:", payload);
      const created = await createContract(payload);
      showSuccessToast('Tạo hợp đồng thành công');
      setContract(created);
      setCreateMode(false);
      setSelectedFile(null);
    } catch (err: any) {
      handleApiError(err, 'Có lỗi khi tạo hợp đồng.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Xử lý thay đổi trong form tạo người thuê mới
  const handleTenantFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTenant(prev => ({ ...prev, [name]: value }));
  };

  // Xử lý tạo người thuê mới
  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!newTenant.fullName || !newTenant.phoneNumber || !newTenant.permanentAddress) {
      handleApiError(new Error('Vui lòng nhập đầy đủ thông tin bắt buộc'));
      return;
    }
    
    setLoading(true);
    
    try {
      const created = await createTenant(newTenant);
      showSuccessToast('Tạo người đại diện thành công');
      
      // Cập nhật danh sách người thuê
      setTenants(prev => [...prev, created]);
      
      // Cập nhật ID người đại diện trong form tạo hợp đồng
      setCreateForm(prev => ({ ...prev, representativeTenantId: created.id }));
      
      // Đóng modal
      setShowTenantModal(false);
      
      // Reset form
      setNewTenant({
        fullName: '',
        phoneNumber: '',
        permanentAddress: '',
        idCardNumber: '',
        gender: 'MALE'
      });
    } catch (err: any) {
      handleApiError(err, 'Có lỗi khi tạo người đại diện mới');
    } finally {
      setLoading(false);
    }
  };

  // Toggle modal tạo người thuê
  const toggleTenantModal = () => {
    setShowTenantModal(prev => !prev);
  };

  if (loading) return <div className="loading">Đang tải thông tin hợp đồng...</div>;

  return (
    <div className="contract-management">
      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Input file ẩn cho tất cả mọi nơi trong component */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Modal tạo người đại diện mới */}
      {showTenantModal && (
        <div className="modal-overlay">
          <div className="modal tenant-modal">
            <div className="modal-header">
              <h3>Thêm người đại diện mới</h3>
              <button type="button" className="close-button" onClick={toggleTenantModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateTenant}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label htmlFor="fullName" style={{ display: 'block', marginBottom: '8px' }}>
                    Họ và tên <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={newTenant.fullName}
                    onChange={handleTenantFormChange}
                    className="form-control"
                    required
                    placeholder="Nhập họ và tên"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                  />
                </div>
                
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label htmlFor="idCardNumber" style={{ display: 'block', marginBottom: '8px' }}>
                    Số CMND/CCCD
                  </label>
                  <input
                    type="text"
                    id="idCardNumber"
                    name="idCardNumber"
                    value={newTenant.idCardNumber}
                    onChange={handleTenantFormChange}
                    className="form-control"
                    placeholder="Nhập số CMND/CCCD"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                  />
                </div>
                
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label htmlFor="phoneNumber" style={{ display: 'block', marginBottom: '8px' }}>
                    Số điện thoại <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={newTenant.phoneNumber}
                    onChange={handleTenantFormChange}
                    className="form-control"
                    required
                    placeholder="Nhập số điện thoại"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                  />
                </div>
                
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label htmlFor="gender" style={{ display: 'block', marginBottom: '8px' }}>Giới tính</label>
                  <select
                    id="gender"
                    name="gender"
                    value={newTenant.gender}
                    onChange={handleTenantFormChange}
                    className="form-control"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
                
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label htmlFor="permanentAddress" style={{ display: 'block', marginBottom: '8px' }}>
                    Địa chỉ thường trú <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="permanentAddress"
                    name="permanentAddress"
                    value={newTenant.permanentAddress}
                    onChange={handleTenantFormChange}
                    className="form-control"
                    required
                    placeholder="Nhập địa chỉ thường trú"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                  />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="button"
                    onClick={toggleTenantModal}
                    style={{ 
                      padding: '10px 16px', 
                      backgroundColor: 'white', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '4px', 
                      cursor: 'pointer' 
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ 
                      padding: '10px 16px', 
                      backgroundColor: '#3b82f6', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer' 
                    }}
                  >
                    {loading ? 'Đang lưu...' : 'Thêm người đại diện'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {!contract ? (
        <div className="no-contract">
          {createMode ? (
            <div className="create-contract-form">
              <h3>Tạo hợp đồng mới</h3>
              <form onSubmit={handleCreateContract}>
                <div className="form-group">
                  <label htmlFor="startDate">Ngày bắt đầu</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={createForm.startDate}
                    onChange={handleCreateFormChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endDate">Ngày kết thúc</label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={createForm.endDate}
                    onChange={handleCreateFormChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="depositAmount">Tiền đặt cọc (VND)</label>
                  <input
                    type="number"
                    id="depositAmount"
                    name="depositAmount"
                    value={createForm.depositAmount}
                    onChange={handleCreateFormChange}
                    min="0"
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="representativeTenantId">Người đại diện</label>
                  <div className="representative-selector">
                    <select
                      id="representativeTenantId"
                      name="representativeTenantId"
                      value={createForm.representativeTenantId}
                      onChange={handleCreateFormChange}
                      className="form-control representative-select"
                      required
                    >
                      <option value="">-- Chọn người đại diện --</option>
                      {tenants.map(tenant => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.fullName} - {tenant.phoneNumber}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="add-tenant-button"
                      onClick={toggleTenantModal}
                    >
                      <UserPlus size={16} />
                      Thêm mới
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="contractNotes">Ghi chú</label>
                  <textarea
                    id="contractNotes"
                    name="contractNotes"
                    value={createForm.contractNotes}
                    onChange={handleCreateFormChange}
                    className="form-control"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Tải lên ảnh hợp đồng (nếu có)</label>
                  <div
                    className="extend-image-upload"
                    onClick={!isUploading ? handleImageClick : undefined}
                    style={{ 
                      border: '2px dashed #d1d5db', 
                      borderRadius: '8px', 
                      padding: '20px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      cursor: 'pointer',
                      height: '200px',
                      backgroundColor: '#f9fafb'
                    }}
                  >
                    {selectedImage ? (
                      <img
                        src={selectedImage}
                        alt="Contract document"
                        className="preview-image"
                        style={{ maxHeight: '160px', maxWidth: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#6b7280' }}>
                        <Upload size={40} />
                        <span>Tải lên ảnh hợp đồng</span>
                      </div>
                    )}
                    {isUploading && (
                      <div className="upload-overlay">
                        <div className="progress-container">
                          <div
                            className="progress-bar"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <div className="progress-text">{uploadProgress}%</div>
                      </div>
                    )}
                  </div>
                  {selectedFile && (
                    <div style={{ 
                      marginTop: '8px', 
                      fontSize: '14px', 
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}>
                      <CheckCircle2 size={16} />
                      <span>Đã chọn: {selectedFile.name}</span>
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={toggleCreateMode}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="save-button"
                    disabled={loading}
                  >
                    {loading ? 'Đang tạo...' : 'Tạo hợp đồng'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div className="message">
                <Calendar size={48} />
                <h3>Chưa có hợp đồng</h3>
                <p>Phòng này chưa có hợp đồng. Vui lòng tạo hợp đồng mới.</p>
              </div>
              <button className="create-button" onClick={toggleCreateMode}>Tạo hợp đồng mới</button>
            </>
          )}
        </div>
      ) : (
        <div className="contract-container">
          {/* Contract Image Section */}
          <div className="contract-image-section">
            <div className="image-header">
              <h3>Hình ảnh hợp đồng</h3>
            </div>
            <div
              className="image-container"
              onClick={!isUploading ? handleImageClick : undefined}
            >
              {selectedImage ? (
                <img src={selectedImage} alt="Contract document" className="contract-image" />
              ) : (
                <div className="image-placeholder">
                  <Upload size={40} />
                  <span>Tải lên ảnh hợp đồng</span>
                </div>
              )}
              {isUploading && (
                <div className="upload-overlay">
                  <div className="progress-container">
                    <div
                      className="progress-bar"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">{uploadProgress}%</div>
                </div>
              )}
            </div>
            {selectedFile && !isUploading && (
              <button
                className="upload-button"
                onClick={handleUpdateImage}
                disabled={isUploading}
              >
                <Upload size={16} />
                Cập nhật ảnh
              </button>
            )}
          </div>

          {/* Contract Info Section */}
          <div className="contract-info-section">
            <div className="info-header">
              <h3>Thông tin hợp đồng</h3>
              {!editMode && !extendMode && (
                <div className="action-buttons">
                  <button
                    className="edit-button"
                    onClick={toggleEditMode}
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    className="extend-button"
                    onClick={toggleExtendMode}
                  >
                    Gia hạn
                  </button>
                </div>
              )}
            </div>

            {/* Contract details or edit form */}
            {editMode ? (
              <form onSubmit={handleUpdateContract} className="edit-form">
                <div className="form-group">
                  <label htmlFor="startDate">Ngày bắt đầu</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleFormChange}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endDate">Ngày kết thúc</label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={form.endDate}
                    onChange={handleFormChange}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="depositAmount">Tiền đặt cọc (VND)</label>
                  <input
                    type="number"
                    id="depositAmount"
                    name="depositAmount"
                    value={form.depositAmount}
                    onChange={handleFormChange}
                    min="0"
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="status">Trạng thái</label>
                  <select
                    id="status"
                    name="status"
                    value={form.status}
                    onChange={handleFormChange}
                    className="form-control"
                  >
                    <option value={ContractStatus.PENDING}>Đang chờ xử lý</option>
                    <option value={ContractStatus.ACTIVE}>Đang hoạt động</option>
                    <option value={ContractStatus.EXPIRED}>Đã hết hạn</option>
                    <option value={ContractStatus.TERMINATED}>Đã chấm dứt</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="contractNotes">Ghi chú</label>
                  <textarea
                    id="contractNotes"
                    name="contractNotes"
                    value={form.contractNotes}
                    onChange={handleFormChange}
                    className="form-control"
                    rows={3}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={toggleEditMode}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="save-button"
                    disabled={loading}
                  >
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            ) : extendMode ? (
              <form onSubmit={handleExtendContract} className="extend-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="years">Số năm gia hạn</label>
                    <input
                      type="number"
                      id="years"
                      name="years"
                      value={extendForm.years}
                      onChange={handleExtendFormChange}
                      min="0"
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="months">Số tháng gia hạn</label>
                    <input
                      type="number"
                      id="months"
                      name="months"
                      value={extendForm.months}
                      onChange={handleExtendFormChange}
                      min="0"
                      max="11"
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="contractNotes">Ghi chú gia hạn</label>
                  <textarea
                    id="contractNotes"
                    name="contractNotes"
                    value={extendForm.contractNotes}
                    onChange={handleExtendFormChange}
                    className="form-control"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Tải lên ảnh phụ lục (nếu có)</label>
                  <div
                    className="extend-image-upload"
                    onClick={!isUploading ? handleImageClick : undefined}
                  >
                    {selectedImage ? (
                      <img
                        src={selectedImage}
                        alt="Contract appendix"
                        className="preview-image"
                      />
                    ) : (
                      <div className="upload-placeholder">
                        <Upload size={24} />
                        <span>Tải lên ảnh phụ lục</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => {
                      toggleExtendMode();
                      setSelectedFile(null);
                      setSelectedImage(contract?.contractImageUrl || null);
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="save-button"
                    disabled={loading}
                  >
                    {loading ? 'Đang lưu...' : 'Xác nhận gia hạn'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="contract-details-view">
                <div className="status-bar">
                  <div className={`status-label ${contract.status?.toLowerCase()}`}>
                    {getStatusLabel(contract.status)}
                  </div>
                  {isNearExpiry(contract.endDate) && (
                    <div className="expiry-warning">
                      <AlertCircle size={16} />
                      Sắp hết hạn
                    </div>
                  )}
                </div>

                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">Người đại diện:</div>
                    <div className="info-value">{contract.tenantName}</div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">Ngày bắt đầu:</div>
                    <div className="info-value">
                      {new Date(contract.startDate).toLocaleDateString('vi-VN')}
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">Ngày kết thúc:</div>
                    <div className="info-value">
                      {new Date(contract.endDate).toLocaleDateString('vi-VN')}
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">Tiền đặt cọc:</div>
                    <div className="info-value">
                      {contract.depositAmount.toLocaleString('vi-VN')} VND
                    </div>
                  </div>

                  {contract.createdAt && (
                    <div className="info-item">
                      <div className="info-label">Ngày tạo:</div>
                      <div className="info-value">
                        {new Date(contract.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  )}

                  {contract.updatedAt && (
                    <div className="info-item">
                      <div className="info-label">Cập nhật lần cuối:</div>
                      <div className="info-value">
                        {new Date(contract.updatedAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  )}
                </div>

                {contract.contractNotes && (
                  <div className="notes-section">
                    <div className="notes-label">Ghi chú:</div>
                    <div className="notes-content">{contract.contractNotes}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractManagementInterface;