// Error Boundary — bắt lỗi render JavaScript không được xử lý trong cây component con.
//
// React yêu cầu Error Boundary phải là Class Component vì sử dụng
// lifecycle method getDerivedStateFromError và componentDidCatch.
//
// Khi có lỗi xảy ra trong component con:
//   1. getDerivedStateFromError: cập nhật state để hiển thị fallback UI.
//   2. componentDidCatch: log lỗi ra console để debug.
//   3. render: nếu hasError=true → hiển thị thông báo lỗi + nút "Tải lại trang".
//
// Được bọc bên ngoài toàn bộ app trong main.jsx để bắt mọi lỗi không mong muốn.

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    // State lưu trạng thái lỗi và thông tin lỗi để hiển thị.
    this.state = { hasError: false, error: null };
  }

  // Được gọi khi component con throw lỗi trong quá trình render.
  // Trả về state mới để kích hoạt hiển thị fallback UI.
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // Được gọi sau khi lỗi được bắt — dùng để log thông tin chi tiết.
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI: hiển thị thông báo lỗi và nút reload trang.
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-8">
          <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg p-8 border border-red-200">
            <h1 className="text-xl font-bold text-red-600 mb-3">Đã xảy ra lỗi ứng dụng</h1>
            <pre className="text-xs text-gray-700 bg-gray-100 rounded p-4 overflow-x-auto whitespace-pre-wrap">
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    // Không có lỗi → render component con bình thường.
    return this.props.children;
  }
}
