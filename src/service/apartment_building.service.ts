import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

export interface ApartmentBuilding {
    id: number;
    name: string;
    image: string;
    address: string;
    ownerId: number;
    ownerName: string;
    // Thêm các trường tính toán cho giao diện
    totalRooms?: number;
    availableRooms?: number;
}

export interface ApartmentBuildingCreateRequest {
    name: string;
    image: string;
    address: string;
    ownerId: number;
}

export interface ApiResponse<T> {
    success: boolean;
    status: number;
    message: string;
    data: T;
}

export const fetchApartmentsByOwner = async (ownerId: number): Promise<ApartmentBuilding[]> => {
    try {
        const response = await axios.get<ApiResponse<ApartmentBuilding[]>>(
            `${API_BASE_URL}/apartment-building/owner/${ownerId}`
        );
        return response.data.success ? response.data.data : [];
    } catch (error) {
        console.error('Error fetching apartments:', error);
        return [];
    }
};

// Thêm hàm để tạo căn hộ mới
export const createApartment = async (
    apartmentData: ApartmentBuildingCreateRequest
): Promise<ApartmentBuilding | null> => {
    try {
        const response = await axios.post<ApiResponse<ApartmentBuilding>>(
            `${API_BASE_URL}/apartment-building/create`,
            apartmentData
        );

        if (response.data.success) {
            console.log('Apartment created successfully:', response.data.data);
            return response.data.data;
        }

        console.error('Failed to create apartment:', response.data.message);
        return null;
    } catch (error) {
        console.error('Error creating apartment:', error);
        throw error;
    }
};