import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

export interface TenantResponse {
    id: number;
    fullName: string;
    idCardNumber?: string;
    phoneNumber: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    avatar?: string;
    permanentAddress: string;
}

export interface TenantCreateRequest {
    fullName: string;
    idCardNumber?: string;
    phoneNumber: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    permanentAddress: string;
}

export interface ApiResponse<T> {
    success: boolean;
    status: number;
    message: string;
    data: T;
}

// Tạo người thuê mới
export const createTenant = async (tenantData: TenantCreateRequest): Promise<TenantResponse> => {
    try {
        const response = await axios.post<ApiResponse<TenantResponse>>(
            `${API_BASE_URL}/tenants`,
            tenantData
        );
        
        if (!response.data.success) {
            throw new Error(response.data.message || 'Không thể tạo người thuê mới');
        }
        
        return response.data.data;
    } catch (error: any) {
        console.error('Error creating tenant:', error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};