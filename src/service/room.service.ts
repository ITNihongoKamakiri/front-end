// service/room.service.ts
const API_BASE_URL = 'http://localhost:8080/api/rooms';

export interface Room {
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

export const fetchRooms = async (buildingId: string): Promise<Room[]> => {
    const response = await fetch(`${API_BASE_URL}?buildingId=${buildingId}`);
    if (!response.ok) throw new Error(`Failed to fetch rooms: ${response.statusText}`);

    const data = await response.json();
    if (!Array.isArray(data.data)) throw new Error('Invalid API response: data is not an array');

    return data.data.map((room: any) => ({
        id: room.id,
        roomNumber: room.roomNumber,
        floor: room.floor,
        status: statusMap[room.status.toUpperCase()] || 'available',
        baseRentAmount: room.baseRentAmount
    }));
};

export const addRoom = async (room: Room, buildingId: string): Promise<Room> => {
    const payload = {
        roomNumber: room.roomNumber,
        floor: room.floor,
        status: Object.keys(statusMap).find(key => statusMap[key] === room.status) || 'EMPTY',
        baseRentAmount: room.baseRentAmount,
        buildingId
    };

    const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`Failed to add room: ${response.statusText}`);

    const data = await response.json();
    return {
        id: data.data.id,
        roomNumber: data.data.roomNumber,
        floor: data.data.floor,
        status: statusMap[data.data.status.toUpperCase()] || 'available',
        baseRentAmount: data.data.baseRentAmount
    };
};

export const updateRoom = async (room: Room): Promise<Room> => {
    const payload = {
        roomNumber: room.roomNumber,
        floor: room.floor,
        status: Object.keys(statusMap).find(key => statusMap[key] === room.status) || 'EMPTY',
        baseRentAmount: room.baseRentAmount
    };

    const response = await fetch(`${API_BASE_URL}/${room.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`Failed to update room: ${response.statusText}`);

    const data = await response.json();
    return {
        id: data.data.id,
        roomNumber: data.data.roomNumber,
        floor: data.data.floor,
        status: statusMap[data.data.status.toUpperCase()] || 'available',
        baseRentAmount: data.data.baseRentAmount
    };
};

export const deleteRoom = async (roomId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/${roomId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error(`Failed to delete room: ${response.statusText}`);
};
