import { Link } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MainLayout() {
  const { auth, logout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-blue-600">
            EduShop
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link to="/" className="hover:text-blue-600 transition-colors">Trang chủ</Link>
            <Link to="/courses" className="hover:text-blue-600 transition-colors">Khóa học</Link>
            {auth ? (
              <>
                <Link to="/my-courses" className="hover:text-blue-600 transition-colors">Khóa học của tôi</Link>
                <button
                  onClick={logout}
                  className="bg-red-500 text-white px-4 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-600 transition-colors">Đăng nhập</Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 text-sm text-center py-6 mt-auto">
        <p>&copy; {new Date().getFullYear()} EduShop. All rights reserved.</p>
      </footer>
    </div>
  );
}
