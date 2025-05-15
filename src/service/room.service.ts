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

/**
 * Lấy thông tin phòng theo ID
 * @param id ID của phòng cần lấy thông tin
 * @returns Thông tin phòng
 */
export const getRoomById = async (id: number): Promise<Room> => {
  const response = await axios.get(`${API_BASE_URL}/rooms/${id}`);
  return response.data;
};

/**
 * Lấy danh sách phòng thuộc căn hộ
 * @param apartmentId ID của căn hộ
 * @returns Danh sách phòng
 */
export const getRoomsByApartmentId = async (apartmentId: number): Promise<Room[]> => {
  const response = await axios.get(`${API_BASE_URL}/rooms/apartment/${apartmentId}`);
  return response.data;
}; 