// Context quản lý trạng thái xác thực (Authentication) toàn ứng dụng.
//
// Cung cấp:
//   - auth   : { token, user } hoặc null nếu chưa đăng nhập.
//   - login  : Lưu token + user vào localStorage và cập nhật state.
//   - logout : Xóa dữ liệu khỏi localStorage và reset state về null.
//
// Khi app khởi động, useEffect tự đọc localStorage để khôi phục phiên đăng nhập
// nếu người dùng đã đăng nhập trước đó (F5, đóng/mở lại tab).
//
// Sử dụng:
//   const { auth, login, logout } = useAuth();

import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(null);

  // Khôi phục phiên từ localStorage khi app load lần đầu.
  // Nếu dữ liệu bị hỏng (JSON parse thất bại), xóa sạch để reset.
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        setAuth({ token, user: parsedUser });
      } catch {
        // Dữ liệu localStorage bị hỏng, xóa đi để reset
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Lưu thông tin đăng nhập vào localStorage và cập nhật state.
  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setAuth({ token, user: userData });
  };

  // Xóa thông tin đăng nhập và reset state về null.
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth(null);
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook tiện ích để lấy context xác thực trong bất kỳ component nào.
export function useAuth() {
  return useContext(AuthContext);
}
