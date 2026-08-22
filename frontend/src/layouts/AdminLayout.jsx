// Layout dành riêng cho khu vực quản trị (Admin).
// Bao gồm: Sidebar cố định bên trái, Top bar, Nội dung trang (Outlet).
//
// Sidebar chứa các NavLink điều hướng đến các trang admin:
//   Dashboard, Danh mục, Khóa học, Bài giảng, Học viên.
// NavLink tự động thêm class active (nền đỏ) cho route đang được chọn.
//
// Nút "Đăng xuất" gọi logout() từ AuthContext rồi redirect về /login.

import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import {
  LayoutDashboard,
  BookOpen,
  Tag,
  Users,
  LogOut,
  Video,
} from 'lucide-react';

// Danh sách các mục điều hướng trong sidebar — dễ mở rộng khi thêm trang mới.
const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/categories', label: 'Quản lý Danh mục', icon: Tag },
  { to: '/admin/courses', label: 'Quản lý Khóa học', icon: BookOpen },
  { to: '/admin/lessons', label: 'Quản lý Bài giảng', icon: Video },
  { to: '/admin/students', label: 'Quản lý Học viên', icon: Users },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Đăng xuất và chuyển hướng về trang login.
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* ── Animated background orbs ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: -1 }}>
        <div className="bg-orb bg-orb-1" style={{ top: '-20%', right: '-5%' }} />
        <div className="bg-orb bg-orb-2" style={{ bottom: '-15%', left: '-10%' }} />
        <div className="bg-orb bg-orb-3" style={{ top: '30%', left: '20%' }} />
      </div>

      {/* ── Sidebar ── */}
      <aside className="w-64 bg-zinc-900/80 backdrop-blur-md text-white flex flex-col shrink-0 h-screen border-r border-zinc-800/60">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">
            Hệ thống
          </p>
          <span className="text-lg font-bold text-white">Admin Dashboard</span>
        </div>

        {/* Nav — render từ mảng navItems, NavLink tự xử lý class active */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#8b0000] text-white'
                    : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-zinc-800 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Về trang chủ
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-zinc-800 hover:text-red-300 transition-colors"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800/60 px-6 py-4 shrink-0 flex items-center justify-between">
          <h1 className="text-base font-semibold text-zinc-200">Trang quản trị</h1>
          <span className="text-xs text-zinc-400 bg-zinc-800/80 px-3 py-1 rounded-full">
            Admin
          </span>
        </header>

        {/* Page content — Outlet render trang admin tương ứng với route */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

