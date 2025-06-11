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

export interface ApiErrorData {
    timestamp: string;
    path: string;
    error: string;
    message: string;
}

export interface ApartmentBuildingUpdateRequest {
    id: number;
    name?: string;
    image?: string;
    address?: string;
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


export const updateApartmentBuilding = async (
    apartmentData: ApartmentBuildingUpdateRequest
): Promise<ApartmentBuilding | null> => {
    try {
        const response = await axios.put<ApiResponse<ApartmentBuilding>>(
            `${API_BASE_URL}/apartment-building/${apartmentData.id}`,
            apartmentData
        );

        if (response.data.success) {
            console.log('Apartment updated successfully:', response.data.data);
            return response.data.data;
        }

        console.error('Failed to update apartment:', response.data.message);
        return null;
    } catch (error) {
        console.error('Error updating apartment:', error);
        throw error;
    }
};

export const deleteApartmentBuilding = async (id: number): Promise<boolean> => {
    try {
        const response = await axios.delete<ApiResponse<void>>(
            `${API_BASE_URL}/apartment-building/${id}`
        );

        if (response.data.success) {
            console.log('Apartment building deleted successfully');
            return true;
        }

        console.error('Failed to delete apartment building:', response.data.message);
        // Ném lỗi với message từ API khi response.success = false
        throw new Error(response.data.message || 'Không thể xóa căn hộ');
    } catch (error) {
        console.error('Error deleting apartment building:', error);
        if (axios.isAxiosError(error) && error.response?.data) {
            // Xử lý lỗi từ API response
            const apiResponse = error.response.data;
            
            // Lấy message từ data.message (message chi tiết từ API)
            if (apiResponse.data && apiResponse.data.message) {
                throw new Error(apiResponse.data.message);
            } 
            // Fallback về message chính nếu không có data.message
            else if (apiResponse.message) {
                throw new Error(apiResponse.message);
            }
        }
        throw error;
    }
};