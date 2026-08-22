// Axios instance dùng chung cho toàn bộ ứng dụng.
//
// Cấu hình:
//   baseURL — Đọc từ biến môi trường VITE_API_URL (xem file .env.example).
//             Nhờ vậy có thể trỏ frontend sang backend local, staging hay
//             production mà không phải sửa mã nguồn.
//   timeout — Giới hạn 30 giây, tránh để request treo vô hạn khi mạng lỗi.
//
// Request interceptor:
//   Tự động đính kèm JWT token vào header Authorization: "Bearer <token>"
//   cho mọi request nếu token tồn tại trong localStorage.
//
// Response interceptor:
//   - Unwrap response.data — trả thẳng phần data về cho caller thay vì
//     phải viết res.data ở mọi nơi.
//   - Với lỗi 401 (token hết hạn hoặc không hợp lệ): xoá phiên đăng nhập
//     và điều hướng về trang đăng nhập.
//   - Chuẩn hoá thông điệp lỗi vào `error.friendlyMessage` để UI hiển thị
//     mà không phải tự đào sâu vào cấu trúc response của backend.

import axios from 'axios';

/**
 * Base URL của backend API.
 * Fallback về localhost để dự án vẫn chạy được ngay cả khi lập trình viên
 * chưa kịp tạo file `.env` ở lần clone đầu tiên.
 */
const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
});

// Tự động gán token vào mọi request nếu người dùng đã đăng nhập.
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Trích xuất thông điệp lỗi thân thiện nhất có thể từ một lỗi Axios.
 *
 * Thứ tự ưu tiên:
 *   1. `message` do backend trả về (thông điệp tiếng Việt đã được biên soạn).
 *   2. Lỗi validate đầu tiên từ Zod (mảng `errors`).
 *   3. Thông báo mặc định theo loại sự cố (timeout / mất mạng).
 *
 * @param {import('axios').AxiosError} error - Lỗi do Axios ném ra.
 * @returns {string} Thông điệp sẵn sàng hiển thị cho người dùng.
 */
const resolveErrorMessage = (error) => {
  const data = error.response?.data;

  if (data?.message) return data.message;
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors[0].message ?? 'Dữ liệu gửi lên không hợp lệ.';
  }
  if (error.code === 'ECONNABORTED') {
    return 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.';
  }
  if (!error.response) {
    return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng.';
  }
  return 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
};

// Unwrap response.data để caller nhận trực tiếp dữ liệu, không cần res.data.
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;

    // Token hết hạn hoặc không hợp lệ → dọn phiên đăng nhập và quay về trang login.
    // Bỏ qua chính các request đăng nhập/đăng ký, vì ở đó 401 nghĩa là "sai mật khẩu"
    // chứ không phải "phiên đã hết hạn".
    const isAuthRequest = error.config?.url?.includes('/auth/');

    if (status === 401 && !isAuthRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Chỉ điều hướng khi chưa ở sẵn trang đăng nhập, tránh vòng lặp reload.
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }

    // Gắn thông điệp đã chuẩn hoá để component chỉ cần đọc `error.friendlyMessage`.
    error.friendlyMessage = resolveErrorMessage(error);
    return Promise.reject(error);
  }
);

export default axiosInstance;
