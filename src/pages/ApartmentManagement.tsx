import React, { useEffect, useState } from 'react';
import { User, Mail, LogOut } from 'lucide-react';
import { useParams } from 'react-router-dom';
import '../styles/ApartmentManagement.css';

interface Room {
    id: number;
    roomNumber: string;
    floor: number;
    status: 'available' | 'occupied' | 'maintenance';
    baseRentAmount: number;
}

const statusMap: Record<string, Room['status']> = {
    EMPTY: 'available',
    RENTED: 'occupied',
    REPAIRING: 'maintenance'
};

const ApartmentManagement: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');
    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
    const [selectedTab, setSelectedTab] = useState<'add' | 'edit'>('add');
    const [newRoom, setNewRoom] = useState<Room>({
        id: 0,
        roomNumber: '',
        floor: 1,
        status: 'available',
        baseRentAmount: 0
    });
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log('Apartment ID from useParams:', id);
        if (!id) {
            setError('Không tìm thấy ID tòa nhà.');
            return;
        }
        fetch(`http://localhost:8080/api/rooms?buildingId=${id}`)
            .then(res => {
                if (!res.ok) throw new Error(`Failed to fetch rooms: ${res.statusText}`);
                return res.json();
            })
            .then(res => {
                if (!Array.isArray(res.data)) {
                    throw new Error('Invalid API response: data is not an array');
                }
                const fetchedRooms = res.data
                    .filter((room: any) => 
                        room && 
                        typeof room.id === 'number' &&
                        typeof room.roomNumber === 'string' &&
                        typeof room.floor === 'number' &&
                        typeof room.status === 'string' &&
                        typeof room.baseRentAmount === 'number'
                    )
                    .map((room: any) => ({
                        id: room.id,
                        roomNumber: room.roomNumber,
                        floor: room.floor,
                        status: statusMap[room.status.toUpperCase()] || 'available',
                        baseRentAmount: room.baseRentAmount
                    }));
                setRooms(fetchedRooms);
            })
            .catch(err => {
                console.error('Error fetching rooms:', err);
                setError('Không thể tải danh sách phòng. Vui lòng thử lại sau.');
            });
    }, [id]);

    const filteredRooms = selectedFloor === 'all'
        ? rooms
        : rooms.filter(room => room.floor === selectedFloor);

    const floors = Array.from(new Set(rooms.map(room => room.floor))).sort();

    const getRoomStatusColor = (status: Room['status']) => {
        switch (status) {
            case 'available':
                return '#10B981';
            case 'occupied':
                return '#EF4444';
            case 'maintenance':
                return '#F59E0B';
            default:
                return '#6B7280';
        }
    };

    const handleTabChange = (tab: 'add' | 'edit') => {
        setSelectedTab(tab);
        if (tab === 'add') {
            setNewRoom({
                id: 0,
                roomNumber: '',
                floor: 1,
                status: 'available',
                baseRentAmount: 0
            });
            setSelectedRoomId(null);
        } else {
            const selectedRoom = rooms.find(room => room.id === selectedRoomId);
            if (selectedRoom) {
                setNewRoom(selectedRoom);
            } else {
                setNewRoom({
                    id: 0,
                    roomNumber: '',
                    floor: 1,
                    status: 'available',
                    baseRentAmount: 0
                });
                setSelectedRoomId(null);
            }
        }
        setIsModalVisible(true);
        setError(null);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedTab === 'edit' && (!selectedRoomId || newRoom.id === 0)) {
            setError('Vui lòng chọn một phòng để chỉnh sửa.');
            return;
        }

        const apiUrl = 'http://localhost:8080/api/rooms';
        const payload = {
            roomNumber: newRoom.roomNumber,
            floor: newRoom.floor,
            status: Object.keys(statusMap).find(
                key => statusMap[key] === newRoom.status
            ) || 'EMPTY',
            baseRentAmount: newRoom.baseRentAmount,
            buildingId: id
        };

        console.log('Submitting payload:', payload, 'for', selectedTab === 'add' ? 'POST' : `PUT /rooms/${newRoom.id}`);

        try {
            let response;
            if (selectedTab === 'add') {
                response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                response = await fetch(`${apiUrl}/${newRoom.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (!response.ok) {
                let errorMessage = response.statusText;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
                    console.error('Server error response:', errorData);
                } catch (jsonError) {
                    console.error('Failed to parse error response:', jsonError);
                }
                throw new Error(`Failed to ${selectedTab === 'add' ? 'add' : 'update'} room: ${errorMessage}`);
            }

            const data = await response.json();
            const updatedRoom = {
                id: data.data.id,
                roomNumber: data.data.roomNumber,
                floor: data.data.floor,
                status: statusMap[data.data.status.toUpperCase()] || 'available',
                baseRentAmount: data.data.baseRentAmount
            };

            if (selectedTab === 'add') {
                setRooms([...rooms, updatedRoom]);
            } else {
                setRooms(rooms.map(room => 
                    room.id === newRoom.id ? updatedRoom : room
                ));
            }

            setIsModalVisible(false);
            setSelectedRoomId(null);
            setNewRoom({
                id: 0,
                roomNumber: '',
                floor: 1,
                status: 'available',
                baseRentAmount: 0
            });
            setError(null);
        } catch (err: any) {
            console.error('Error submitting form:', err);
            setError(`Lỗi: ${err.message}`);
        }
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setSelectedRoomId(null);
        setNewRoom({
            id: 0,
            roomNumber: '',
            floor: 1,
            status: 'available',
            baseRentAmount: 0
        });
        setError(null);
    };

    return (
        <div className="apartment-detail-container">
            {id === undefined && (
                <div className="error-message">
                    Cảnh báo: Không tìm thấy ID căn hộ. Sử dụng apartmentId mặc định là 1.
                </div>
            )}
            <div className="detail-header">
                <div className="header-left">
                    <div className="logo">Logo</div>
                    <h1 className="apartment-title">Quản lý phòng căn hộ {id || '1'}</h1>
                </div>
                <div className="header-right">
                    <button className="icon-button"><User className="h-6 w-6" /></button>
                    <button className="icon-button"><Mail className="h-6 w-6" /></button>
                    <button className="logout-button"><LogOut className="h-5 w-5" /><span>Đăng xuất</span></button>
                </div>
            </div>

            <div className="room-management-button">
                <button onClick={() => handleTabChange('add')}>Thêm phòng mới</button>
                <button onClick={() => handleTabChange('edit')}>Chỉnh sửa phòng</button>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {isModalVisible && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{selectedTab === 'add' ? 'Thêm phòng mới' : 'Chỉnh sửa phòng'}</h2>
                            <button className="close-button" onClick={closeModal}>×</button>
                        </div>

                        {selectedTab === 'edit' && (
                            <div className="form-group">
                                <label>Chọn phòng:</label>
                                <select
                                    value={selectedRoomId || ''}
                                    onChange={(e) => {
                                        const roomId = +e.target.value;
                                        setSelectedRoomId(roomId);
                                        const selectedRoom = rooms.find((room) => room.id === roomId);
                                        if (selectedRoom) setNewRoom(selectedRoom);
                                    }}
                                    className="form-select"
                                >
                                    <option value="">Chọn phòng</option>
                                    {rooms.map((room) => (
                                        <option key={room.id} value={room.id}>
                                            {room.roomNumber} - Tầng {room.floor}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <form onSubmit={handleFormSubmit}>
                            <div className="form-group">
                                <label>Số phòng:</label>
                                <input
                                    type="text"
                                    value={newRoom.roomNumber}
                                    onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Tầng:</label>
                                <input
                                    type="number"
                                    value={newRoom.floor}
                                    onChange={(e) => setNewRoom({ ...newRoom, floor: +e.target.value })}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Trạng thái:</label>
                                <select
                                    value={newRoom.status}
                                    onChange={(e) => setNewRoom({ ...newRoom, status: e.target.value as Room['status'] })}
                                    className="form-select"
                                >
                                    <option value="available">Available</option>
                                    <option value="occupied">Occupied</option>
                                    <option value="maintenance">Maintenance</option>
                                </select>
                            </div>
                            <div className="form-group">
                            <label>Giá thuê cơ bản:</label>
                            <input
                                type="text" // Đổi từ "number" sang "text" để loại bỏ mũi tên
                                value={newRoom.baseRentAmount || ''} // Cho phép xóa giá trị mặc định
                                onChange={(e) => {
                                const value = e.target.value;
                                setNewRoom({ 
                                    ...newRoom, 
                                baseRentAmount: value === '' ? 0 : parseFloat(value) || 0 
                            });
                            }}
                            className="form-input"
                            placeholder="Nhập giá thuê cơ bản" // Thêm placeholder để hướng dẫn người dùng
                            />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="cancel-button" onClick={closeModal}>Hủy</button>
                                <button type="submit" className="submit-button">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="floor-filter">
                {floors.map((floor) => (
                    <div key={floor} className="floor-row">
                        <h2 className="floor-title">Tầng {floor}</h2>
                        <div className="rooms-container">
                            {filteredRooms
                                .filter((room) => room.floor === floor)
                                .map((room) => (
                                    <div
                                        key={room.id}
                                        className="room-item"
                                        onClick={() => (window.location.href = `/tenants/${room.id}`)}
                                        style={{ borderColor: getRoomStatusColor(room.status) }}
                                    >
                                        <div className="room-door"><div className="door-handle"></div></div>
                                        <p className="room-number">{room.roomNumber}</p>
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