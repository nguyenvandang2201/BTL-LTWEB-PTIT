// Trang đăng ký tài khoản mới.
// Gửi form tới auth.service.register → hiển thị thông báo thành công →
// tự động chuyển hướng về /login sau 1.5 giây.
//
// State:
//   form    : Giá trị các ô input (full_name, email, password).
//   error   : Thông báo lỗi từ API (ví dụ: email đã tồn tại).
//   success : Thông báo thành công trước khi redirect.
//   loading : Trạng thái đang gửi request (disable nút submit).

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerApi } from '../services/auth.service';

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Cập nhật field tương ứng và xóa thông báo lỗi/thành công cũ.
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  };

  // Gửi form đăng ký. Nếu thành công: hiển thị thông báo và redirect về login sau 1.5s.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await registerApi(form);
      setSuccess('Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Đăng ký thất bại. Email có thể đã được sử dụng.'
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
            <h2 className="text-xl font-semibold text-zinc-200 mt-2">Tạo tài khoản mới</h2>
            <p className="text-sm text-zinc-400 mt-1">Tham gia cùng hàng nghìn học viên</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-950/40 border border-red-900 text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-5 px-4 py-3 bg-green-950/40 border border-green-900 text-green-400 text-sm rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Họ và tên
              </label>
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                required
                placeholder="Nguyễn Văn A"
                className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8b0000] focus:border-transparent transition placeholder:text-zinc-500"
              />
            </div>

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
                minLength={6}
                className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8b0000] focus:border-transparent transition placeholder:text-zinc-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8b0000] hover:bg-[#a01828] disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Đang đăng ký...' : 'Tạo tài khoản'}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-400 mt-6">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-[#c0392b] font-medium hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

