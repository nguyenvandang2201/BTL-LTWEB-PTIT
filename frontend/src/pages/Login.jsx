// Trang đăng nhập.
// Gửi form tới auth.service → lưu token + role vào AuthContext → redirect theo role:
//   - admin   → /admin
//   - student → / (trang chủ)
//
// State:
//   form    : Giá trị các ô input (email, password).
//   error   : Thông báo lỗi từ API hoặc mặc định.
//   loading : Trạng thái đang gửi request (disable nút submit).

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../services/auth.service';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Cập nhật field tương ứng khi người dùng gõ và xóa thông báo lỗi cũ.
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  // Gửi form đăng nhập, lưu session và redirect theo role.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await loginApi(form);
      const { token, role } = res.data || res;
      const user = { role };
      login(token, user); // Lưu vào AuthContext + localStorage.
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Email hoặc mật khẩu không đúng. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900/70 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/60 p-8 border border-zinc-700/50">
          {/* Logo / Title */}
          <div className="text-center mb-8">
            <Link to="/" className="text-2xl font-extrabold text-[#c0392b]">OnlineCourse</Link>
            <h2 className="text-xl font-semibold text-zinc-200 mt-2">Đăng nhập vào tài khoản</h2>
            <p className="text-sm text-zinc-400 mt-1">Chào mừng bạn trở lại!</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-950/40 border border-red-900 text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8b0000] focus:border-transparent transition placeholder:text-zinc-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Mật khẩu
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8b0000] focus:border-transparent transition placeholder:text-zinc-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8b0000] hover:bg-[#a01828] disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-400 mt-6">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-[#c0392b] font-medium hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

