import React from 'react';
import { Search, User, Mail, LogOut, Eye, Plus, SlidersHorizontal } from 'lucide-react';
import '../styles/dashboard.css';
import apartmentImage from '../assets/images/apartment.png';

// Define apartment data type
interface Apartment {
  id: string;
  name: string;
  vacantRooms: number;
  upcomingContracts: string[];
  imageUrl: string;
}

const Dashboard: React.FC = () => {
  // Mock data (hardcoded for now)
  const apartments: Apartment[] = [
    {
      id: 'a1',
      name: 'Căn hộ A',
      vacantRooms: 5,
      upcomingContracts: ['Hợp đồng #1234', 'Hợp đồng #5678'],
      imageUrl: apartmentImage
    },
    {
      id: 'b1',
      name: 'Căn hộ B',
      vacantRooms: 3,
      upcomingContracts: ['Hợp đồng #2345'],
      imageUrl: apartmentImage
    },
    {
      id: 'c1',
      name: 'Căn hộ C',
      vacantRooms: 7,
      upcomingContracts: ['Hợp đồng #3456', 'Hợp đồng #7890', 'Hợp đồng #1122'],
      imageUrl: apartmentImage
    },
  ];

  return (
    <div className="dashboard-container">
      {/* Navigation Bar */}
      <div className="navbar">
        <div className="navbar-left">
          <div className="logo">Logo</div>
          <div className="search-container">
            <input
              type="text"
              placeholder="Thanh tìm kiếm"
              className="search-input"
            />
            <Search className="search-icon" />
          </div>
        </div>
        <div className="navbar-right">
          <button className="icon-button">
            <User className="h-6 w-6" style={{ color: '#4B5563' }} />
          </button>
          <button className="icon-button">
            <Mail className="h-6 w-6" style={{ color: '#4B5563' }} />
          </button>
          <button className="logout-button">
            <LogOut className="h-5 w-5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

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
          <button className="add-button">
            <Plus className="h-5 w-5" />
            <span>Thêm căn hộ</span>
          </button>
        </div>
      </div>

      {/* Apartment Cards Grid */}
      <div className="apartment-grid">
        {apartments.map((apartment) => (
          <div key={apartment.id} className="apartment-card">
            <div className="apartment-card-content" onClick={() => window.location.href = `/apartments/${apartment.id}`}>
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
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;