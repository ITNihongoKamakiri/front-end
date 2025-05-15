import axios from 'axios';

const API_BASE_URL = '/api';

export interface Room {
  id: number;
  name: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  price: number;
  area: number;
  apartmentId: number;
  description?: string;
  imageUrl?: string;
}

export const getRoomById = async (id: number): Promise<Room> => {
  const response = await axios.get(`${API_BASE_URL}/rooms/${id}`);
  return response.data;
};

export const getRoomsByApartmentId = async (apartmentId: number): Promise<Room[]> => {
  const response = await axios.get(`${API_BASE_URL}/rooms/apartment/${apartmentId}`);
  return response.data;
};

export const addRoom = async (room: Omit<Room, 'id'>): Promise<Room> => {
  const response = await axios.post(`${API_BASE_URL}/rooms`, room);
  return response.data;
};

export const updateRoom = async (room: Room): Promise<Room> => {
  const response = await axios.put(`${API_BASE_URL}/rooms/${room.id}`, room);
  return response.data;
};

export const deleteRoom = async (roomId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/rooms/${roomId}`);
};
