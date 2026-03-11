import { Link } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen } from 'lucide-react';

export default function MainLayout() {
  const { auth, logout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">
      {/* Navbar */}
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-[#c0392b]">
            <BookOpen size={24} />
            OnlineCourse
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-zinc-300">
            <Link to="/" className="hover:text-[#c0392b] transition-colors">Trang chủ</Link>
            <Link to="/courses" className="hover:text-[#c0392b] transition-colors">Khóa học</Link>
            {auth ? (
              <>
                <Link to="/my-courses" className="hover:text-[#c0392b] transition-colors">Khóa học của tôi</Link>
                <Link to="/profile" className="hover:text-[#c0392b] transition-colors">Hồ sơ</Link>
                {auth.user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="bg-[#8b0000] text-white px-4 py-1.5 rounded-lg hover:bg-[#a01828] transition-colors"
                  >
                    Quản trị
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="bg-zinc-700 text-white px-4 py-1.5 rounded-lg hover:bg-zinc-600 transition-colors"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-[#c0392b] transition-colors">Đăng nhập</Link>
                <Link
                  to="/register"
                  className="bg-[#8b0000] text-white px-4 py-1.5 rounded-lg hover:bg-[#a01828] transition-colors"
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
      <footer className="bg-black border-t border-zinc-800 text-zinc-400 text-sm text-center py-6 mt-auto">
        <p>&copy; {new Date().getFullYear()} OnlineCourse. All rights reserved.</p>
      </footer>
    </div>
  );
}
