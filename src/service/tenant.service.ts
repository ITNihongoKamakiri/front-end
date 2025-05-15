import axios from 'axios';

const API_BASE_URL = '/api';

export interface Tenant {
    id: number;
    fullName: string;
    idCardNumber?: string;
    phoneNumber: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    avatar?: string;
    permanentAddress: string;
}

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
    avatar?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    status: number;
    message: string;
    data: T;
}

/**
 * Lấy danh sách tất cả người thuê
 * @returns Danh sách người thuê
 */
export const getAllTenants = async (): Promise<Tenant[]> => {
    try {
        const response = await axios.get<Tenant[]>(`${API_BASE_URL}/tenants`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching tenants:', error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

/**
 * Lấy thông tin người thuê theo ID
 * @param id ID của người thuê
 * @returns Thông tin người thuê
 */
export const getTenantById = async (id: number): Promise<Tenant> => {
    try {
        const response = await axios.get<Tenant>(`${API_BASE_URL}/tenants/${id}`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching tenant:', error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

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