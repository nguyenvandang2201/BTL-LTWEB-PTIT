// Hook truy cập trạng thái xác thực từ bất kỳ component nào trong cây React.

import { useContext } from 'react';
import { AuthContext } from './authContext.js';

/**
 * Lấy trạng thái và các hành động xác thực từ `AuthContext`.
 *
 * @returns {{
 *   auth: { token: string, user: object } | null,
 *   login: (token: string, userData: object) => void,
 *   logout: () => void
 * }} Giá trị context xác thực.
 *
 * @throws {Error} Nếu hook được gọi bên ngoài `<AuthProvider>` — lỗi này giúp
 * phát hiện sớm việc quên bọc provider thay vì nhận `null` khó truy vết.
 *
 * @example
 * const { auth, login, logout } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error('useAuth phải được sử dụng bên trong <AuthProvider>.');
  }

  return context;
}
