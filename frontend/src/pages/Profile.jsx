// Trang hồ sơ cá nhân — gồm 2 card độc lập:
//   1. Cập nhật họ tên: gọi updateProfile, nếu thành công cập nhật lại AuthContext.
//   2. Đổi mật khẩu  : validate confirm_password ở client, gọi changePassword.
//
// Lưu ý thiết kế:
//   - Email bị disabled (không cho sửa) — phù hợp với updateProfileSchema bên backend.
//   - Sau khi đổi tên thành công, gọi login() để sync lại user trong localStorage + AuthContext
//     mà không cần đăng xuất lại.
//   - Trường confirm_password chỉ tồn tại ở client (không gửi lên backend),
//     chỉ dùng để so sánh với new_password trước khi submit.

import { useState } from 'react';
import { User, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword } from '../services/student.service';

export default function Profile() {
  const { auth, login } = useAuth();
  const user = auth?.user;

  // ── Profile form ────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({ full_name: user?.full_name || '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // ── Password form ───────────────────────────────────────────
  const [pwForm, setPwForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg('');
    setProfileError('');
    try {
      const res = await updateProfile(profileForm);
      const updatedUser = res?.user || res?.data?.user;
      if (updatedUser) {
        login(auth.token, updatedUser);
      }
      setProfileMsg('Cập nhật thông tin thành công!');
    } catch (err) {
      setProfileError(
        err?.response?.data?.message || err?.message || 'Cập nhật thất bại.'
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    setPwMsg('');
    setPwError('');
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError('Mật khẩu mới không khớp.');
      return;
    }
    setPwLoading(true);
    try {
      await changePassword({
        old_password: pwForm.old_password,
        new_password: pwForm.new_password,
      });
      setPwMsg('Đổi mật khẩu thành công!');
      setPwForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setPwError(
        err?.response?.data?.message || err?.message || 'Đổi mật khẩu thất bại.'
      );
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8 page-enter">
      <div>
        <h1 className="text-3xl font-bold text-zinc-100">Hồ sơ cá nhân</h1>
        <p className="text-zinc-400 mt-1">Quản lý thông tin tài khoản của bạn.</p>
      </div>

      {/* ── Profile card ── */}
      <div className="bg-zinc-900/70 backdrop-blur-sm rounded-xl shadow-sm border border-zinc-800/60 p-6 space-y-5">
        {/* Avatar + info */}
        <div className="flex items-center gap-4 pb-4 border-b border-zinc-800">
          <div className="w-14 h-14 rounded-full bg-[#8b0000] text-white flex items-center justify-center text-2xl font-bold uppercase shrink-0">
            {user?.full_name?.[0] || 'U'}
          </div>
          <div>
            <p className="font-semibold text-zinc-100">{user?.full_name}</p>
            <p className="text-sm text-zinc-400">{user?.email}</p>
            <span className="inline-block mt-1 text-xs bg-zinc-800 text-[#c0392b] border border-zinc-700 px-2.5 py-0.5 rounded-full">
              {user?.role === 'admin' ? 'Quản trị viên' : 'Học viên'}
            </span>
          </div>
        </div>

        {/* Update name form */}
        <h3 className="font-semibold text-zinc-200 flex items-center gap-2 text-sm">
          <User size={16} />
          Cập nhật họ tên
        </h3>

        {profileMsg && (
          <div className="flex items-center gap-2 text-green-400 text-sm bg-green-950/40 border border-green-900 px-4 py-2.5 rounded-lg">
            <CheckCircle2 size={15} />
            {profileMsg}
          </div>
        )}
        {profileError && (
          <div className="text-red-400 text-sm bg-red-950/40 border border-red-900 px-4 py-2.5 rounded-lg">
            {profileError}
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Họ và tên</label>
            <input
              type="text"
              value={profileForm.full_name}
              onChange={(e) => setProfileForm({ full_name: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8b0000]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2.5 border border-zinc-800 bg-zinc-900 text-zinc-500 rounded-lg text-sm cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            disabled={profileLoading}
            className="px-6 py-2.5 bg-[#8b0000] hover:bg-[#a01828] disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {profileLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>

      {/* ── Change password card ── */}
      <div className="bg-zinc-900/70 backdrop-blur-sm rounded-xl shadow-sm border border-zinc-800/60 p-6 space-y-5">
        <h3 className="font-semibold text-zinc-200 flex items-center gap-2 text-sm">
          <Lock size={16} />
          Đổi mật khẩu
        </h3>

        {pwMsg && (
          <div className="flex items-center gap-2 text-green-400 text-sm bg-green-950/40 border border-green-900 px-4 py-2.5 rounded-lg">
            <CheckCircle2 size={15} />
            {pwMsg}
          </div>
        )}
        {pwError && (
          <div className="text-red-400 text-sm bg-red-950/40 border border-red-900 px-4 py-2.5 rounded-lg">
            {pwError}
          </div>
        )}

        <form onSubmit={handlePwSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              value={pwForm.old_password}
              onChange={(e) => setPwForm((p) => ({ ...p, old_password: e.target.value }))}
              required
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8b0000] placeholder:text-zinc-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Mật khẩu mới
            </label>
            <input
              type="password"
              value={pwForm.new_password}
              onChange={(e) => setPwForm((p) => ({ ...p, new_password: e.target.value }))}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8b0000] placeholder:text-zinc-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              value={pwForm.confirm_password}
              onChange={(e) => setPwForm((p) => ({ ...p, confirm_password: e.target.value }))}
              required
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8b0000] placeholder:text-zinc-500"
            />
          </div>
          <button
            type="submit"
            disabled={pwLoading}
            className="px-6 py-2.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {pwLoading ? 'Đang lưu...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
}

