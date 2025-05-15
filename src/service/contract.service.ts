import axios from 'axios';

const API_BASE_URL = '/api';

export interface ContractResponse {
    id: number;
    tenantId?: number;
    tenantName?: string;
    roomId: number;
    roomNumber: string;
    buildingId?: number;
    buildingName?: string;
    startDate: string;
    endDate: string;
    depositAmount: number;
    status: string;
    contractImageUrl?: string;
    contractNotes?: string;
    contractImage?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ContractCreateRequest {
    roomId: number;
    representativeTenantId: number;
    startDate: string;
    endDate: string;
    depositAmount: number;
    contractNotes?: string;
    contractImageUrl?: string;
}

export interface ContractUpdateRequest {
    id: number;
    startDate: string;
    endDate: string;
    depositAmount: number;
    status: ContractStatus;
    contractNotes: string;
    representativeTenantId: number;
}

export interface ContractExtendRequest {
    contractId: number;
    months?: number;
    years?: number;
    contractImageUrl?: string;
    contractNotes?: string;
}

export enum ContractStatus {
    PENDING = 'PENDING',
    ACTIVE = 'ACTIVE',
    EXPIRED = 'EXPIRED',
    TERMINATED = 'TERMINATED'
}

export interface ApiResponse<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data: T;
}

// Lấy danh sách hợp đồng theo roomId
export const getContractsByRoomId = async (roomId: number): Promise<ContractResponse[]> => {
    try {
        const response = await axios.get<ApiResponse<ContractResponse[]>>(
            `${API_BASE_URL}/contracts/room/${roomId}`
        );
        
        if (!response.data.success) {
            throw new Error(response.data.message || 'Không thể lấy danh sách hợp đồng');
        }
        
        return response.data.data || [];
    } catch (error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Lấy hợp đồng đang hoạt động theo roomId
export const getActiveContractsByRoomId = async (roomId: number): Promise<ContractResponse[]> => {
    try {
        const response = await axios.get<ApiResponse<ContractResponse[]>>(
            `${API_BASE_URL}/contracts/room/${roomId}/active`
        );
        return response.data.success ? response.data.data : [];
    } catch (error) {
        console.error('Error fetching active contracts:', error);
        return [];
    }
};

// Tạo hợp đồng mới
export const createContract = async (
    contract: ContractCreateRequest
): Promise<ContractResponse | null> => {
    try {
        const response = await axios.post<ApiResponse<ContractResponse>>(
            `${API_BASE_URL}/contracts`,
            contract
        );
        
        if (!response.data.success) {
            throw new Error(response.data.message || 'Không thể tạo hợp đồng');
        }
        
        return response.data.data;
    } catch (error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Cập nhật thông tin cơ bản của hợp đồng
export const updateContract = async (
    contract: ContractUpdateRequest
): Promise<ContractResponse | null> => {
    try {
        const response = await axios.put<ApiResponse<ContractResponse>>(
            `${API_BASE_URL}/contracts`,
            contract
        );
        
        if (!response.data.success) {
            throw new Error(response.data.message || 'Không thể cập nhật hợp đồng');
        }
        
        return response.data.data;
    } catch (error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Cập nhật ảnh hợp đồng
export const updateContractImage = async (
    contractId: number,
    imageUrl: string
): Promise<ContractResponse | null> => {
    try {
        const response = await axios.post<ApiResponse<ContractResponse>>(
            `${API_BASE_URL}/contracts/${contractId}/image?imageUrl=${encodeURIComponent(imageUrl)}`
        );
        
        if (!response.data.success) {
            throw new Error(response.data.message || 'Không thể cập nhật ảnh hợp đồng');
        }
        
        return response.data.data;
    } catch (error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Gia hạn hợp đồng
export const extendContract = async (
    extendData: ContractExtendRequest
): Promise<ContractResponse | null> => {
    try {
        const response = await axios.post<ApiResponse<ContractResponse>>(
            `${API_BASE_URL}/contracts/extend`,
            extendData
        );
        
        if (!response.data.success) {
            throw new Error(response.data.message || 'Không thể gia hạn hợp đồng');
        }
        
        return response.data.data;
    } catch (error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};