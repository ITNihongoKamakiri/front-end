import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Mail, LogOut, Eye, Plus, SlidersHorizontal, X, Upload, Image, Trash2, Check } from 'lucide-react';
import '../styles/dashboard.css';
import apartmentImage from '../assets/images/apartment.png';
import { ApartmentBuilding, fetchApartmentsByOwner, createApartment, deleteApartmentBuilding } from '../service/apartment_building.service';
import { uploadImageToCloudinary } from '../service/cloudinary.service';
import { Edit } from 'lucide-react';
import { ApartmentBuildingUpdateRequest, updateApartmentBuilding } from '../service/apartment_building.service';
import { toast } from 'react-toastify';
interface Apartment {
  id: string;
  name: string;
  vacantRooms: number;
  upcomingContracts: string[];
  imageUrl: string;
  address?: string;
}

// Interface cho form dữ liệu căn hộ mới
interface NewApartmentForm {
  name: string;
  address: string;
  image: string;
}

const Dashboard: React.FC = () => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Thêm các state trong Dashboard component
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [editedApartment, setEditedApartment] = useState<NewApartmentForm>({
    name: '',
    address: '',
    image: ''
  });

  // States cho modal thêm căn hộ
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [newApartment, setNewApartment] = useState<NewApartmentForm>({
    name: '',
    address: '',
    image: ''
  });

  // States cho upload ảnh
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  //state cho modal xóa căn hộ
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deletingApartment, setDeletingApartment] = useState<Apartment | null>(null);

  // State để lưu thông báo thành công
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Lấy ID người dùng (thay thế bằng logic xác thực thực tế sau này)
  const ownerId = 2;

  useEffect(() => {
    loadApartments();
  }, [ownerId]);

  // Tách hàm loadApartments để có thể tái sử dụng
  const loadApartments = async () => {
    try {
      setLoading(true);
      const data = await fetchApartmentsByOwner(ownerId);

      // Chuyển đổi dữ liệu từ API sang định dạng UI hiện tại
      const formattedApartments: Apartment[] = data.map(apt => ({
        id: String(apt.id),
        name: apt.name,
        vacantRooms: apt.availableRooms || 0,
        upcomingContracts: ['Hợp đồng #1234', 'Hợp đồng #5678'],
        imageUrl: apt.image || apartmentImage,
        address: apt.address
      }));

      setApartments(formattedApartments);
      setError(null);
    } catch (err) {
      setError('Không thể tải dữ liệu căn hộ. Vui lòng thử lại sau.');
      console.error('Error loading apartments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thay đổi giá trị trong form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewApartment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Xử lý khi chọn file ảnh
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra loại file (chỉ cho phép ảnh)
    if (!file.type.match('image.*')) {
      setError('Vui lòng chọn file hình ảnh (jpg, png, gif, etc.)');
      return;
    }

    // Giới hạn kích thước file (ví dụ: 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước file không được vượt quá 5MB');
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
    setError(null);
  };

  // Xử lý xóa file đã chọn
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Xử lý khi submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Kiểm tra dữ liệu
    if (!newApartment.name || !newApartment.address) {
      setError('Vui lòng nhập đầy đủ tên và địa chỉ căn hộ');
      return;
    }

    // Mở modal xác nhận
    setIsConfirmOpen(true);
  };

  // Xử lý khi xác nhận thêm căn hộ
  const handleConfirmCreate = async () => {
    try {
      setLoading(true);

      // Upload ảnh lên Cloudinary nếu có file được chọn
      let imageUrl = '';
      if (selectedFile) {
        setIsUploading(true);

        try {
          // Upload ảnh và lấy URL
          imageUrl = await uploadImageToCloudinary(selectedFile, (progress) => {
            setUploadProgress(progress);
          });

          // Đặt lại trạng thái upload
          setIsUploading(false);
          setUploadProgress(0);
        } catch (uploadError) {
          setError('Có lỗi xảy ra khi tải ảnh lên. Vui lòng thử lại.');
          setIsUploading(false);
          setLoading(false);
          return;
        }
      }

      // Gửi request API để tạo căn hộ mới với URL ảnh từ Cloudinary
      const response = await createApartment({
        name: newApartment.name,
        address: newApartment.address,
        image: imageUrl, // URL ảnh từ Cloudinary
        ownerId: ownerId
      });

      // Đóng modals
      setIsConfirmOpen(false);
      setIsModalOpen(false);

      // Reset form và trạng thái ảnh
      setNewApartment({
        name: '',
        address: '',
        image: ''
      });
      setSelectedFile(null);
      setPreviewUrl(null);

      // Hiển thị thông báo thành công
      setSuccessMessage('Thêm căn hộ thành công!');

      // Tự động ẩn thông báo sau 3 giây
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

      // Tải lại danh sách căn hộ
      await loadApartments();

    } catch (err) {
      setError('Có lỗi xảy ra khi tạo căn hộ mới. Vui lòng thử lại.');
      console.error('Error creating apartment:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reset form khi đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewApartment({
      name: '',
      address: '',
      image: ''
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setError(null);
  };


  //update apartment

  // Hàm mở modal chỉnh sửa
  const handleOpenEditModal = (apartment: Apartment, e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn chặn event bubbling lên thẻ cha
    setSelectedApartment(apartment);
    setEditedApartment({
      name: apartment.name,
      address: apartment.address || '',
      image: apartment.imageUrl
    });
    setPreviewUrl(apartment.imageUrl !== apartmentImage ? apartment.imageUrl : null);
    setIsEditModalOpen(true);
    setError(null);
  };

  // Hàm đóng modal chỉnh sửa
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedApartment(null);
    setEditedApartment({
      name: '',
      address: '',
      image: ''
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setError(null);
  };

  // Hàm xử lý submit form chỉnh sửa
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedApartment) return;

    // Kiểm tra dữ liệu
    if (!editedApartment.name || !editedApartment.address) {
      setError('Vui lòng nhập đầy đủ tên và địa chỉ căn hộ');
      return;
    }

    try {
      setLoading(true);

      // Upload ảnh mới nếu có
      let imageUrl = editedApartment.image;
      if (selectedFile) {
        setIsUploading(true);
        try {
          imageUrl = await uploadImageToCloudinary(selectedFile, (progress) => {
            setUploadProgress(progress);
          });
          setIsUploading(false);
          setUploadProgress(0);
        } catch (uploadError) {
          setError('Có lỗi xảy ra khi tải ảnh lên. Vui lòng thử lại.');
          setIsUploading(false);
          setLoading(false);
          return;
        }
      }

      // Gọi API để cập nhật thông tin
      const response = await updateApartmentBuilding({
        id: parseInt(selectedApartment.id),
        name: editedApartment.name,
        address: editedApartment.address,
        image: imageUrl
      });

      // Đóng modal
      handleCloseEditModal();

      // Hiển thị thông báo thành công
      setSuccessMessage('Cập nhật thông tin căn hộ thành công!');

      // Tự động ẩn thông báo sau 3 giây
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

      // Tải lại danh sách căn hộ
      await loadApartments();
    } catch (err) {
      setError('Có lỗi xảy ra khi cập nhật thông tin căn hộ. Vui lòng thử lại.');
      console.error('Error updating apartment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteModal = (apartment: Apartment, e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn chặn event bubbling lên thẻ cha
    setDeletingApartment(apartment);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingApartment(null);
  };

  const handleDeleteApartment = async () => {
    if (!deletingApartment) return;

    try {
      setLoading(true);
      await deleteApartmentBuilding(parseInt(deletingApartment.id));

      // Cập nhật state để xóa căn hộ khỏi danh sách
      setApartments(apartments.filter(apt => apt.id !== deletingApartment.id));

      // Hiển thị thông báo thành công bằng toastify
      toast.success('Xóa căn hộ thành công!');

      // Đóng modal xác nhận
      handleCloseDeleteModal();

    } catch (err: any) {
      // Hiển thị thông báo lỗi bằng toastify với message từ API
      toast.error(err.message || 'Có lỗi xảy ra khi xóa căn hộ. Vui lòng thử lại.');
      console.error('Error deleting apartment:', err);
      handleCloseDeleteModal();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-left">
          <SlidersHorizontal className="h-5 w-5" style={{ color: '#4B5563' }} />
          <span className="filter-text">Lọc theo số phòng trống</span>
        </div>
        <div className="filter-right">
          <button className="view-more-button">
            <Eye className="h-5 w-5" />
            <span>Xem thêm</span>
          </button>
          <button className="add-button" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-5 w-5" />
            <span>Thêm căn hộ</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="success-message">
          <Check size={18} strokeWidth={3} />
          {successMessage}
        </div>
      )}

      {/* Error message if any */}
      {error && <div className="error-message">{error}</div>}

      {/* Loading indicator */}
      {loading && apartments.length === 0 && (
        <div className="loading-message">Đang tải dữ liệu...</div>
      )}

      {/* Apartment Cards Grid */}
      <div className="apartment-grid">
        {apartments.map((apartment) => (
          <div key={apartment.id} className="apartment-card">
            <div className="apartment-card-content" onClick={() => window.location.href = `/apartments/${apartment.id}`}>

              <button
                className="edit-button"
                onClick={(e) => handleOpenEditModal(apartment, e)}
              >
                <Edit size={16} />
              </button>

              <button
                className="delete-button"
                onClick={(e) => handleOpenDeleteModal(apartment, e)}
                style={{ backgroundColor: 'white' }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  <line x1="10" x2="10" y1="11" y2="17"></line>
                  <line x1="14" x2="14" y1="11" y2="17"></line>
                </svg>
              </button>
              <div className="image-container">
                <div className="image-wrapper">
                  <img
                    src={apartment.imageUrl}
                    alt={apartment.name}
                    className="apartment-image"
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/300x200?text=Building+Image";
                    }}
                  />
                </div>
              </div>
              <h3 className="apartment-name">{apartment.name}</h3>
              <div className="apartment-details">
                <p className="apartment-detail-heading">Số phòng còn trống: {apartment.vacantRooms}</p>
                <div style={{ marginTop: '0.5rem' }}>
                  <p className="apartment-detail-heading">Các hợp đồng sắp đến hạn:</p>
                  <ul className="contract-list">
                    {apartment.upcomingContracts.map((contract, index) => (
                      <li key={index} className="contract-item">{contract}</li>
                    ))}
                  </ul>
                </div>
                {apartment.address && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <p className="apartment-detail-heading">Địa chỉ:</p>
                    <p className="apartment-address">{apartment.address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal thêm căn hộ */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Thêm căn hộ mới</h2>
              <button className="close-button" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Tên căn hộ <span className="required">*</span></label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newApartment.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên căn hộ"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">Địa chỉ <span className="required">*</span></label>
                  <textarea
                    id="address"
                    name="address"
                    value={newApartment.address}
                    onChange={handleInputChange}
                    placeholder="Nhập địa chỉ căn hộ"
                    required
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Hình ảnh</label>
                  <div className="image-upload-container">
                    <input
                      type="file"
                      id="image-upload"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="file-upload-input"
                      accept="image/*"
                    />

                    {!previewUrl && (
                      <label htmlFor="image-upload" className="image-upload-label">
                        <Upload className="image-upload-icon" size={36} />
                        <p className="image-upload-text">Nhấp để chọn hình ảnh</p>
                        <p className="image-upload-small">hoặc kéo thả file vào đây</p>
                        <p className="image-upload-small">PNG, JPG, JPEG (tối đa 5MB)</p>
                      </label>
                    )}

                    {previewUrl && (
                      <div className="image-preview">
                        <img src={previewUrl} alt="Preview" />
                        <div className="image-preview-info">
                          <span className="image-preview-name">
                            {selectedFile?.name} ({(selectedFile?.size || 0) / 1024 < 1000
                              ? `${Math.round((selectedFile?.size || 0) / 1024)} KB`
                              : `${Math.round((selectedFile?.size || 0) / 1024 / 1024 * 10) / 10} MB`})
                          </span>
                          <button
                            type="button"
                            className="image-preview-remove"
                            onClick={handleRemoveFile}
                          >
                            <Trash2 size={14} /> Xóa
                          </button>
                        </div>

                        {isUploading && (
                          <div className="image-upload-progress">
                            <div
                              className="image-upload-progress-bar"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="cancel-button" onClick={handleCloseModal}>
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="submit-button"
                    disabled={isUploading || loading}
                  >
                    {isUploading ? 'Đang tải lên...' : 'Tạo căn hộ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận */}
      {isConfirmOpen && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <div className="confirm-message">
              <h3>Xác nhận thêm căn hộ</h3>
              <p>Bạn có chắc chắn muốn tạo căn hộ mới với thông tin đã nhập?</p>
            </div>
            <div className="confirm-actions">
              <button className="cancel-button" onClick={() => setIsConfirmOpen(false)}>
                Hủy
              </button>
              <button
                className="confirm-button"
                onClick={handleConfirmCreate}
                disabled={isUploading || loading}
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Modal chỉnh sửa căn hộ */}
      {isEditModalOpen && selectedApartment && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Chỉnh sửa thông tin căn hộ</h2>
              <button className="close-button" onClick={handleCloseEditModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleEditSubmit}>
                <div className="form-group">
                  <label htmlFor="edit-name">Tên căn hộ <span className="required">*</span></label>
                  <input
                    type="text"
                    id="edit-name"
                    name="name"
                    value={editedApartment.name}
                    onChange={(e) => setEditedApartment({ ...editedApartment, name: e.target.value })}
                    placeholder="Nhập tên căn hộ"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-address">Địa chỉ <span className="required">*</span></label>
                  <textarea
                    id="edit-address"
                    name="address"
                    value={editedApartment.address}
                    onChange={(e) => setEditedApartment({ ...editedApartment, address: e.target.value })}
                    placeholder="Nhập địa chỉ căn hộ"
                    required
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Hình ảnh</label>
                  <div className="image-upload-container">
                    <input
                      type="file"
                      id="edit-image-upload"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="file-upload-input"
                      accept="image/*"
                    />

                    {!previewUrl && (
                      <label htmlFor="edit-image-upload" className="image-upload-label">
                        <Upload className="image-upload-icon" size={36} />
                        <p className="image-upload-text">Nhấp để chọn hình ảnh</p>
                        <p className="image-upload-small">hoặc kéo thả file vào đây</p>
                        <p className="image-upload-small">PNG, JPG, JPEG (tối đa 5MB)</p>
                      </label>
                    )}

                    {previewUrl && (
                      <div className="image-preview">
                        <img src={previewUrl} alt="Preview" />
                        <div className="image-preview-info">
                          <span className="image-preview-name">
                            {selectedFile?.name || "Ảnh hiện tại"}
                          </span>
                          <button
                            type="button"
                            className="image-preview-remove"
                            onClick={handleRemoveFile}
                          >
                            <Trash2 size={14} /> Xóa
                          </button>
                        </div>

                        {isUploading && (
                          <div className="image-upload-progress">
                            <div
                              className="image-upload-progress-bar"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="cancel-button" onClick={handleCloseEditModal}>
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="submit-button"
                    disabled={isUploading || loading}
                  >
                    {isUploading ? 'Đang tải lên...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa căn hộ */}
      {isDeleteModalOpen && deletingApartment && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <div className="confirm-message">
              <h3>Xác nhận xóa căn hộ</h3>
              <p>Bạn có chắc chắn muốn xóa căn hộ "{deletingApartment.name}" không?</p>
              <p className="warning-text">Lưu ý: Nếu tòa nhà vẫn còn phòng đang hoạt động, bạn sẽ không thể xóa được.</p>
            </div>
            <div className="confirm-actions">
              <button className="cancel-button" onClick={handleCloseDeleteModal}>
                Hủy
              </button>
              <button
                className="delete-confirm-button"
                onClick={handleDeleteApartment}
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;