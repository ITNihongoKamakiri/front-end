import { toast } from 'react-toastify';
import axios, { AxiosError } from 'axios';

interface ApiError {
  success: boolean;
  statusCode: number;
  message: string;
  data: null;
}

/**
 * Xử lý lỗi từ API và hiển thị thông báo lỗi dưới dạng toast
 * @param error Lỗi từ API (AxiosError hoặc bất kỳ lỗi nào)
 * @param defaultMessage Thông báo mặc định nếu không có thông báo lỗi cụ thể
 * @returns Thông báo lỗi đã được xử lý
 */
export const handleApiError = (error: unknown, defaultMessage = 'Có lỗi xảy ra. Vui lòng thử lại sau.'): string => {
  // Khởi tạo biến lưu thông báo lỗi
  let errorMessage = defaultMessage;

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    
    // Lấy thông báo lỗi từ phản hồi API nếu có
    if (axiosError.response?.data) {
      if (typeof axiosError.response.data === 'string') {
        errorMessage = axiosError.response.data;
      } else if (axiosError.response.data.message) {
        errorMessage = axiosError.response.data.message;
      }
    } else if (axiosError.message) {
      // Nếu không có phản hồi từ API, sử dụng thông báo lỗi từ Axios
      if (axiosError.message === 'Network Error') {
        errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối của bạn.';
      } else {
        errorMessage = axiosError.message;
      }
    }
    
    // Log lỗi cho việc debug
    console.error('API Error:', {
      status: axiosError.response?.status,
      url: axiosError.config?.url,
      method: axiosError.config?.method,
      data: axiosError.response?.data
    });
  } else if (error instanceof Error) {
    // Xử lý các lỗi JavaScript thông thường
    errorMessage = error.message;
    console.error('General Error:', error);
  } else {
    // Xử lý các lỗi không xác định
    console.error('Unknown Error:', error);
  }

  // Hiển thị thông báo lỗi dưới dạng toast
  toast.error(errorMessage);
  
  return errorMessage;
};

/**
 * Hiển thị thông báo thành công dưới dạng toast
 * @param message Thông báo thành công
 */
export const showSuccessToast = (message: string): void => {
  toast.success(message);
};

/**
 * Hiển thị thông báo cảnh báo dưới dạng toast
 * @param message Thông báo cảnh báo
 */
export const showWarningToast = (message: string): void => {
  toast.warning(message);
};

/**
 * Hiển thị thông báo thông tin dưới dạng toast
 * @param message Thông báo thông tin
 */
export const showInfoToast = (message: string): void => {
  toast.info(message);
}; 