// Layout chung cho các trang người dùng (public + student).
// Bao gồm: Navbar cố định trên cùng, nội dung trang (Outlet), Footer.
//
// Navbar thay đổi theo trạng thái đăng nhập:
//   - Chưa đăng nhập : Hiển thị "Đăng nhập" và "Đăng ký".
//   - Đã đăng nhập   : Hiển thị "Khóa học của tôi", "Hồ sơ", "Đăng xuất".
//                      Nếu là admin: thêm nút "Quản trị" dẫn tới /admin.
//
// Background có 3 animated orb decorative được xử lý bằng CSS (trong index.css).

import { Link } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import { BookOpen } from 'lucide-react';

export default function MainLayout() {
  const { auth, logout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* ── Animated background orbs ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: -1 }}>
        <div className="bg-orb bg-orb-1" style={{ top: '-15%', right: '-8%' }} />
        <div className="bg-orb bg-orb-2" style={{ bottom: '-10%', left: '-10%' }} />
        <div className="bg-orb bg-orb-3" style={{ top: '35%', left: '25%' }} />
      </div>

      {/* Navbar */}
      <header className="bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-[#c0392b]">
            <BookOpen size={24} />
            OnlineCourse
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-zinc-300">
            <Link to="/" className="hover:text-[#c0392b] transition-colors">Trang chủ</Link>
            <Link to="/courses" className="hover:text-[#c0392b] transition-colors">Khóa học</Link>
            <a href="https://vandang0.wordpress.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[#c0392b] transition-colors">Blog</a>
            {auth ? (
              <>
                <Link to="/my-courses" className="hover:text-[#c0392b] transition-colors">Khóa học của tôi</Link>
                <Link to="/profile" className="hover:text-[#c0392b] transition-colors">Hồ sơ</Link>
                {/* Nút Quản trị chỉ hiển thị nếu user có role='admin' */}
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

      {/* Page content — Outlet render component tương ứng với route hiện tại */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-black/60 backdrop-blur-md border-t border-zinc-800/60 text-zinc-400 text-sm text-center py-6 mt-auto">
        <p>&copy; {new Date().getFullYear()} OnlineCourse. All rights reserved.</p>
      </footer>
    </div>
  );
}
