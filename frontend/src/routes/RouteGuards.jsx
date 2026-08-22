// Các component bảo vệ route (Route Guards) dựa trên trạng thái xác thực.
//
// ProtectedRoute : Yêu cầu đăng nhập (có token). Dùng cho các trang của học viên.
//                  Nếu chưa đăng nhập → redirect về /login.
//
// AdminRoute     : Yêu cầu đăng nhập VÀ role='admin'. Dùng cho khu vực quản trị.
//                  Nếu chưa đăng nhập → redirect về /login.
//                  Nếu đã đăng nhập nhưng không phải admin → redirect về trang chủ /.
//
// Cả hai đều dùng <Outlet /> để render các route con khi điều kiện được thỏa mãn.

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';

// Bảo vệ các route yêu cầu đăng nhập (dành cho học viên).
export function ProtectedRoute() {
  const { auth } = useAuth();

  // Chưa đăng nhập → chuyển về trang đăng nhập.
  if (!auth?.token) {
    return <Navigate to="/login" replace />;
  }

  // Đã đăng nhập → render route con.
  return <Outlet />;
}

// Bảo vệ các route chỉ dành cho quản trị viên.
export function AdminRoute() {
  const { auth } = useAuth();

  // Chưa đăng nhập → chuyển về trang đăng nhập.
  if (!auth?.token) {
    return <Navigate to="/login" replace />;
  }

  // Đã đăng nhập nhưng không phải admin → chuyển về trang chủ.
  if (auth.user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Là admin → render route con (AdminLayout + các trang admin).
  return <Outlet />;
}
