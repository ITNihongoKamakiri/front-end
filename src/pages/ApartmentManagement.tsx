import React, { useState } from 'react';
import { User, Mail, LogOut } from 'lucide-react';
import { useParams } from 'react-router-dom';
import '../styles/ApartmentManagement.css';

// Interface cho dữ liệu phòng
interface Room {
    id: string;
    number: string;
    floor: number;
    status: 'available' | 'occupied' | 'maintenance';
}

// Interface cho dữ liệu căn hộ
interface ApartmentManagement {
    id: string;
    name: string;
    totalRooms: number;
    availableRooms: number;
    rooms: Room[];
}

const ApartmentManagement: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    // State cho việc lọc tầng
    const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');

    // Dữ liệu mẫu cho căn hộ
    const apartmentData: ApartmentManagement = {
        id: id || 'a1',
        name: 'Căn hộ A',
        totalRooms: 12,
        availableRooms: 5,
        rooms: [
            { id: 'p101', number: 'P101', floor: 1, status: 'available' },
            { id: 'p102', number: 'P102', floor: 1, status: 'occupied' },
            { id: 'p103', number: 'P103', floor: 1, status: 'occupied' },
            { id: 'p104', number: 'P104', floor: 1, status: 'available' },
            { id: 'p101', number: 'P101', floor: 1, status: 'available' },
            { id: 'p102', number: 'P102', floor: 1, status: 'occupied' },
            { id: 'p103', number: 'P103', floor: 1, status: 'occupied' },
            { id: 'p104', number: 'P104', floor: 1, status: 'available' },
            { id: 'p101', number: 'P101', floor: 1, status: 'available' },
            { id: 'p102', number: 'P102', floor: 1, status: 'occupied' },
            { id: 'p103', number: 'P103', floor: 1, status: 'occupied' },
            { id: 'p104', number: 'P104', floor: 1, status: 'available' },
            
            { id: 'p201', number: 'P201', floor: 2, status: 'occupied' },
            { id: 'p202', number: 'P202', floor: 2, status: 'maintenance' },
            { id: 'p203', number: 'P203', floor: 2, status: 'available' },
            { id: 'p204', number: 'P204', floor: 2, status: 'available' },
            { id: 'p301', number: 'P301', floor: 3, status: 'occupied' },
            { id: 'p302', number: 'P302', floor: 3, status: 'available' },
            { id: 'p303', number: 'P303', floor: 3, status: 'occupied' },
            { id: 'p304', number: 'P304', floor: 3, status: 'maintenance' },
        ]
    };

    // Lọc phòng theo tầng
    const filteredRooms = selectedFloor === 'all'
        ? apartmentData.rooms
        : apartmentData.rooms.filter(room => room.floor === selectedFloor);

    // Lấy danh sách các tầng độc nhất
    const floors = Array.from(new Set(apartmentData.rooms.map(room => room.floor))).sort();

    // Nhóm các phòng theo tầng
    const roomsByFloor = floors.map(floor => {
        return {
            floor,
            rooms: filteredRooms.filter(room => room.floor === floor)
        };
    });

    // Hàm xác định màu sắc theo trạng thái phòng
    const getRoomStatusColor = (status: Room['status']) => {
        switch (status) {
            case 'available':
                return '#10B981'; // Xanh lá - phòng trống
            case 'occupied':
                return '#EF4444'; // Đỏ - phòng đã thuê
            case 'maintenance':
                return '#F59E0B'; // Vàng cam - phòng đang bảo trì
            default:
                return '#6B7280'; // Xám - mặc định
        }
    };

    return (
        <div className="apartment-detail-container">
            {/* Header */}
            <div className="detail-header">
                <div className="header-left">
                    <div className="logo">Logo</div>
                    <h1 className="apartment-title">Quản lý phòng căn hộ {apartmentData.name}</h1>
                </div>
                <div className="header-right">
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

            {/* Filter options */}
            <div className="floor-filter">
                <div className="filter-option">
                    <input
                        type="radio"
                        id="all-floors"
                        name="floor"
                        checked={selectedFloor === 'all'}
                        onChange={() => setSelectedFloor('all')}
                    />
                    <label htmlFor="all-floors">Tất cả các phòng</label>
                </div>

                {floors.map(floor => (
                    <div key={floor} className="floor-row">
                        <h2 className="floor-title">
                            Tầng {floor}
                        </h2>
                        <div className="rooms-container">
                            {apartmentData.rooms
                                .filter(room => room.floor === floor)
                                .map(room => (
                                    <div
                                        key={room.id}
                                        className="room-item"
                                        onClick={() => (window.location.href = `/tenants/${apartmentData.id}`)}
                                        style={{ borderColor: getRoomStatusColor(room.status) }}
                                    >
                                        <div className="room-door">
                                            <div className="door-handle"></div>
                                        </div>
                                        <p className="room-number">{room.number}</p>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ApartmentManagement;