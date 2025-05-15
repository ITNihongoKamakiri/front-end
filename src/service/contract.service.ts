import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

export interface ContractResponse {
    contractImage: any;
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
}

export interface ContractCreateRequest {
    roomId: number;
    representativeTenantId: number;
    startDate: string;
    endDate: string;
    depositAmount: number;
    contractImage?: string;
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