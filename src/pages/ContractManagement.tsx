import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Calendar } from 'lucide-react';
import '../styles/ContractManagement.css';
import { useParams } from 'react-router-dom';
import {
  ContractResponse,
  ContractStatus,
  getContractsByRoomId,
  updateContract,
  updateContractImage,
  extendContract
} from '../service/contract.service';
import { uploadImageToCloudinary } from '../service/cloudinary.service';

interface ContractManagementProps {
  roomId?: number;
}

const ContractManagementInterface: React.FC<ContractManagementProps> = ({ roomId: propRoomId }) => {
  const { id } = useParams<{ id: string }>();
  const contractId = propRoomId || (id ? parseInt(id) : 0);
  const [contract, setContract] = useState<ContractResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [extendMode, setExtendMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    depositAmount: 0,
    status: ContractStatus.ACTIVE,
    contractNotes: '',
    representativeTenantId: 0
  });
  const [extendForm, setExtendForm] = useState({
    months: 0,
    years: 0,
    contractNotes: ''
  });

  // Fetch contract data
  useEffect(() => {
    const fetchContract = async () => {
      setLoading(true);
      setError(null);
      try {
        // For demo, get first contract by roomId = contractId
        const contracts = await getContractsByRoomId(contractId);
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
          setSelectedImage(contracts[0].contractImageUrl || null);
        }
      } catch (err: any) {
        setError(err.message || 'Không thể tải hợp đồng.');
      } finally {
        setLoading(false);
      }
    };
    if (contractId) fetchContract();
  }, [contractId]);

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
      setError('Ngày kết thúc phải sau ngày bắt đầu');
      return;
    }
    
    if (form.depositAmount < 0) {
      setError('Tiền đặt cọc không thể là số âm');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const payload = {
        id: contract.id,
        ...form
      };
      const updated = await updateContract(payload);
      setSuccess('Cập nhật hợp đồng thành công');
      setContract(updated);
      setEditMode(false);
    } catch (err: any) {
      setError(err.message || 'Có lỗi khi cập nhật hợp đồng.');
    } finally {
      setLoading(false);
    }
  };

  // Upload image and update contract image
  const handleUpdateImage = async () => {
    if (!contract || !selectedFile) return;
    setIsUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const url = await uploadImageToCloudinary(selectedFile, setUploadProgress);
      const updated = await updateContractImage(contract.id, url);
      setSuccess('Cập nhật ảnh hợp đồng thành công');
      setContract(updated);
      setSelectedImage(url);
      setSelectedFile(null);
    } catch (err: any) {
      setError(err.message || 'Có lỗi khi cập nhật ảnh hợp đồng.');
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
    setSuccess(null);
    
    try {
      let imageUrl = undefined;
      if (selectedFile) {
        // Check file size (max 5MB)
        if (selectedFile.size > 5 * 1024 * 1024) {
          setError('Kích thước file không được vượt quá 5MB');
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
      const updated = await extendContract(payload);
      setSuccess('Cập nhật hợp đồng thành công');
      setContract(updated);
      setExtendMode(false);
      setExtendForm({ months: 0, years: 0, contractNotes: '' });
      setSelectedFile(null);
    } catch (err: any) {
      setError(err.message || 'Có lỗi khi cập nhật hợp đồng.');
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

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div className="contract-content">
      {error && (
        <div className="error-message">
          <AlertCircle size={18} strokeWidth={2} />
          {error}
        </div>
      )}
      {success && (
        <div className="success-message">
          <CheckCircle2 size={18} strokeWidth={2} />
          {success}
        </div>
      )}
      {contract && (
        <div className="contract-details">
          {/* Image section */}
          <div className="contract-image-section">
            <div className="image-container" onClick={handleImageClick}>
              {selectedImage ? (
                <img src={selectedImage} alt="Contract" className="contract-image" />
              ) : (
                <div className="image-placeholder">
                  <Calendar size={48} />
                  <div className="upload-overlay">
                    <span>Click để chọn ảnh</span>
                  </div>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden-input" />
              {selectedFile && (
                <button className="edit-button" onClick={handleUpdateImage} disabled={isUploading}>
                  {isUploading ? `Đang tải lên... (${uploadProgress}%)` : 'Lưu ảnh'}
                </button>
              )}
            </div>
          </div>
          {/* Info section */}
          <div className="contract-info-section">
            {!editMode && !extendMode && (
              <>
                <div className="contract-basic-info">
                  <p>Người đại diện: {contract.tenantName}</p>
                  <p>Tên chung cư: {contract.buildingName}</p>
                  <p>Số phòng: {contract.roomNumber}</p>
                  <p>Ngày bắt đầu: {contract.startDate?.split('T')[0]}</p>
                  <p>Ngày kết thúc: {contract.endDate?.split('T')[0]}</p>
                  <p>Tiền đặt cọc: {contract.depositAmount?.toLocaleString('vi-VN')} VNĐ</p>
                  <p>Trạng thái: {getStatusLabel(contract.status)}</p>
                  {contract.contractNotes && <p>Ghi chú: {contract.contractNotes}</p>}
                </div>
                <div className="expiry-container">
                  <div className="expiry-date">
                    <div>Ngày hết hạn: {contract.endDate?.split('T')[0]}</div>
                  </div>
                  {isNearExpiry(contract.endDate) && (
                    <div className="expiry-warning">
                      <AlertCircle size={16} className="warning-icon" />
                      <span>Sắp hết hạn</span>
                    </div>
                  )}
                </div>
                <div className="last-updated">
                  Cập nhật gần nhất: {contract.createdAt?.split('T')[0]}
                </div>
                
                <div className="action-buttons-container">
                  <button className="action-button edit" onClick={() => setEditMode(true)}>
                    <i className="icon"></i> Chỉnh sửa thông tin
                  </button>
                  <button className="action-button extend" onClick={() => setExtendMode(true)}>
                    <i className="icon"></i> Gia hạn hợp đồng
                  </button>
                </div>
              </>
            )}
            {editMode && (
              <form onSubmit={handleUpdateContract} className="contract-edit-form">
                <div className="form-group">
                  <label>Ngày bắt đầu</label>
                  <input type="date" name="startDate" value={form.startDate} onChange={handleFormChange} required className="form-control" />
                </div>
                <div className="form-group">
                  <label>Ngày kết thúc</label>
                  <input type="date" name="endDate" value={form.endDate} onChange={handleFormChange} required className="form-control" />
                </div>
                <div className="form-group">
                  <label>Tiền đặt cọc</label>
                  <input type="number" name="depositAmount" value={form.depositAmount} onChange={handleFormChange} min={0} required className="form-control" />
                </div>
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select name="status" value={form.status} onChange={handleFormChange} className="form-control">
                    <option value={ContractStatus.PENDING}>Đang chờ xử lý</option>
                    <option value={ContractStatus.ACTIVE}>Đang hoạt động</option>
                    <option value={ContractStatus.EXPIRED}>Đã hết hạn</option>
                    <option value={ContractStatus.TERMINATED}>Đã chấm dứt</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Ghi chú</label>
                  <textarea name="contractNotes" value={form.contractNotes} onChange={handleFormChange} className="form-control" />
                </div>
                <div className="form-group">
                  <label>ID người đại diện</label>
                  <input type="number" name="representativeTenantId" value={form.representativeTenantId} onChange={handleFormChange} min={1} required className="form-control" />
                </div>
                <div className="form-actions">
                  <button type="button" className="cancel-button" onClick={() => setEditMode(false)}>Hủy</button>
                  <button type="submit" className="submit-button" disabled={loading}>Lưu</button>
                </div>
              </form>
            )}
            {extendMode && (
              <form onSubmit={handleExtendContract} className="contract-extend-form">
                <div className="form-group">
                  <label>Số tháng gia hạn</label>
                  <input type="number" name="months" value={extendForm.months} onChange={handleExtendFormChange} min={0} className="form-control" />
                </div>
                <div className="form-group">
                  <label>Số năm gia hạn</label>
                  <input type="number" name="years" value={extendForm.years} onChange={handleExtendFormChange} min={0} className="form-control" />
                </div>
                <div className="form-group">
                  <label>Ghi chú gia hạn</label>
                  <textarea name="contractNotes" value={extendForm.contractNotes} onChange={handleExtendFormChange} className="form-control" />
                </div>
                <div className="form-group">
                  <label>Hình ảnh hợp đồng mới (tùy chọn)</label>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="form-control" />
                </div>
                <div className="form-actions">
                  <button type="button" className="cancel-button" onClick={() => setExtendMode(false)}>Hủy</button>
                  <button type="submit" className="submit-button" disabled={loading || isUploading}>Gia hạn</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractManagementInterface;