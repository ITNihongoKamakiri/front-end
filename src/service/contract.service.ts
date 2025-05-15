import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

export interface ContractResponse {
    contractImage: any;
    contractImageUrl?: string;
    id: number;
    startDate: string;
    endDate: string;
    depositAmount: number;
    status: string;
    createdAt: string;
    roomId: number;
    roomNumber: string;
    buildingId?: number;
    buildingName?: string;
    tenantId?: number;
    tenantName?: string;
    tenantPhone?: string;
    contractNotes?: string;
}

export interface ContractCreateRequest {
    roomId: number;
    representativeTenantId: number;
    startDate: string;
    endDate: string;
    depositAmount: number;
    contractImageUrl?: string;
    contractNotes?: string;
}

export interface ContractUpdateRequest {
    id: number;
    startDate?: string;
    endDate?: string;
    depositAmount?: number;
    status?: ContractStatus;
    contractNotes?: string;
    representativeTenantId?: number;
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
    status: number;
    message: string;
    data: T;
}

// Lấy danh sách hợp đồng theo roomId
export const getContractsByRoomId = async (roomId: number): Promise<ContractResponse[]> => {
    try {
        const response = await axios.get<ApiResponse<ContractResponse[]>>(
            `${API_BASE_URL}/contracts/room/${roomId}`
        );
        return response.data.success ? response.data.data : [];
    } catch (error) {
        console.error('Error fetching contracts:', error);
        return [];
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
    contractData: ContractCreateRequest
): Promise<ContractResponse | null> => {
    try {
        const response = await axios.post<ApiResponse<ContractResponse>>(
            `${API_BASE_URL}/contracts`,
            contractData
        );
        return response.data.success ? response.data.data : null;
    } catch (error) {
        console.error('Error creating contract:', error);
        throw error;
    }
};

// Cập nhật thông tin cơ bản của hợp đồng
export const updateContract = async (
    contractData: ContractUpdateRequest
): Promise<ContractResponse | null> => {
    try {
        const response = await axios.put<ApiResponse<ContractResponse>>(
            `${API_BASE_URL}/contracts`,
            contractData
        );
        return response.data.success ? response.data.data : null;
    } catch (error: any) {
        if (error.response && error.response.data && error.response.data.message) {
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
        const encodedImageUrl = encodeURIComponent(imageUrl);
        const response = await axios.put<ApiResponse<ContractResponse>>(
            `${API_BASE_URL}/contracts/${contractId}/image?imageUrl=${encodedImageUrl}`
        );
        return response.data.success ? response.data.data : null;
    } catch (error: any) {
        if (error.response && error.response.data && error.response.data.message) {
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
        return response.data.success ? response.data.data : null;
    } catch (error: any) {
        if (error.response && error.response.data && error.response.data.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};