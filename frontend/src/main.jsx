// Điểm khởi động của ứng dụng React.
// Cấu hình và render cây component vào DOM element có id="root".
//
// Thứ tự bọc providers từ ngoài vào trong:
//   StrictMode          → kích hoạt kiểm tra bổ sung của React trong development.
//   ErrorBoundary       → bắt lỗi render không mong muốn, hiển thị fallback UI.
//   QueryClientProvider → cung cấp React Query client cho toàn app (cache, refetch, ...).
//   AuthProvider        → cung cấp trạng thái xác thực (token, user) cho toàn app.
//   App                 → component gốc chứa toàn bộ routing.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'
import App from './App.jsx'

// Khởi tạo React Query client với cấu hình tắt refetch khi focus lại tab,
// tránh gọi API không cần thiết khi người dùng chuyển qua lại tab trình duyệt.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
