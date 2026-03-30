// Axios instance dùng chung cho toàn bộ ứng dụng.
// Được cấu hình với baseURL và 2 interceptor:
//
// Request interceptor:
//   Tự động đính kèm JWT token vào header Authorization: "Bearer <token>"
//   cho mọi request nếu token tồn tại trong localStorage.
//
// Response interceptor:
//   Tự động unwrap response.data — trả thẳng phần data về cho caller
//   thay vì phải viết res.data ở mọi nơi.
//   Lỗi vẫn được reject để caller có thể catch bình thường.

import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api', // Base URL của backend API.
});

// Tự động gán token vào mọi request nếu người dùng đã đăng nhập.
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = 'Bearer ' + token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Unwrap response.data để caller nhận trực tiếp dữ liệu, không cần res.data.
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);

export default axiosInstance;
