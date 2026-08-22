// Đối tượng React Context dùng chung cho trạng thái xác thực.
//
// Context được tách riêng khỏi `AuthContext.jsx` (nơi định nghĩa provider) và
// `useAuth.js` (nơi định nghĩa hook) để mỗi file chỉ export một loại giá trị.
// Nhờ vậy Fast Refresh của Vite hoạt động chính xác: file chứa component chỉ
// export component, file chứa hook chỉ export hook.

import { createContext } from 'react';

/**
 * Context lưu trữ trạng thái xác thực toàn ứng dụng.
 *
 * Giá trị context có dạng:
 *   { auth: { token, user } | null, login: Function, logout: Function }
 *
 * Mặc định là `null` khi component nằm ngoài `<AuthProvider>`.
 */
export const AuthContext = createContext(null);
