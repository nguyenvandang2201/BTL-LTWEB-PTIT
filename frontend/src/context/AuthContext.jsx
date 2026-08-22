// Provider quản lý trạng thái xác thực (Authentication) toàn ứng dụng.
//
// Cung cấp qua context:
//   - auth   : { token, user } hoặc null nếu chưa đăng nhập.
//   - login  : Lưu token + user vào localStorage và cập nhật state.
//   - logout : Xoá dữ liệu khỏi localStorage và reset state về null.
//
// Phiên đăng nhập được khôi phục từ localStorage ngay tại lần render đầu tiên
// (thông qua lazy initializer của useState) thay vì trong useEffect. Cách này
// tránh một lần render thừa với auth = null — vốn khiến các route được bảo vệ
// chớp nháy về trang đăng nhập khi người dùng tải lại trang.
//
// Sử dụng:
//   const { auth, login, logout } = useAuth();   // import từ './useAuth.js'

import { useCallback, useMemo, useState } from 'react';
import { AuthContext } from './authContext.js';

/**
 * Đọc phiên đăng nhập đã lưu trong localStorage.
 *
 * Hàm được truyền vào `useState` dưới dạng lazy initializer nên chỉ chạy đúng
 * một lần ở lần render đầu tiên, không lặp lại ở các lần render sau.
 *
 * @returns {{ token: string, user: object } | null} Phiên đã lưu, hoặc null nếu
 * chưa đăng nhập / dữ liệu lưu trữ bị hỏng.
 */
const readStoredAuth = () => {
  try {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) return null;

    return { token, user: JSON.parse(user) };
  } catch {
    // Dữ liệu localStorage bị hỏng (JSON không hợp lệ) hoặc trình duyệt chặn
    // truy cập storage → dọn sạch và coi như chưa đăng nhập.
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return null;
  }
};

/**
 * Provider bọc toàn bộ ứng dụng để chia sẻ trạng thái xác thực.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);

  /** Lưu thông tin đăng nhập vào localStorage và cập nhật state. */
  const login = useCallback((token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setAuth({ token, user: userData });
  }, []);

  /** Xoá thông tin đăng nhập và reset state về null. */
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth(null);
  }, []);

  // Ghi nhớ giá trị context để tham chiếu không đổi giữa các lần render,
  // tránh render lại không cần thiết ở mọi component đang dùng useAuth().
  const value = useMemo(() => ({ auth, login, logout }), [auth, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
