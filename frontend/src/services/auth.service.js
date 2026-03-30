// Service xác thực — gọi các API đăng nhập và đăng ký.
// Tất cả request đi qua axiosInstance (đã có interceptor tự gán token).

import axiosInstance from '../utils/axiosInstance';

// Đăng nhập bằng email + password. Trả về { token, role }.
export const login = async (data) => axiosInstance.post('/auth/login', data);

// Đăng ký tài khoản mới. Trả về { message } khi thành công.
export const register = async (data) => axiosInstance.post('/auth/register', data);
