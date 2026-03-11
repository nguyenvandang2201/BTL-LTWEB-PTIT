import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-6 page-enter">
        <div className="text-9xl font-black text-[#8b0000] opacity-80 select-none" style={{ textShadow: '0 0 60px rgba(139,0,0,0.6)' }}>
          404
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">Không tìm thấy trang</h1>
        <p className="text-zinc-400 max-w-md mx-auto">
          Trang bạn đang tìm không tồn tại hoặc đã bị di chuyển. Vui lòng kiểm tra lại đường dẫn.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-[#8b0000] hover:bg-[#a01828] text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-red-900/30"
        >
          ← Về trang chủ
        </Link>
      </div>
    </div>
  );
}

