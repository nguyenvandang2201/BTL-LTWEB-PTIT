// Cấu hình routing toàn ứng dụng bằng React Router v6.
//
// Có 3 nhóm route chính:
//   1. Public + Student routes dùng chung MainLayout (navbar + footer).
//      - Public: Home, CourseList, CourseDetail, Login, Register — ai cũng truy cập được.
//      - Student (bọc trong ProtectedRoute): MyCourses, Profile, Learning — yêu cầu đăng nhập.
//
//   2. Admin routes bọc trong AdminRoute (yêu cầu role='admin') + AdminLayout (sidebar).
//      - Dashboard, Categories, Courses, Lessons, Students.
//      - Truy cập /admin sẽ tự redirect sang /admin/dashboard.
//
//   3. Wildcard "*": Hiển thị trang NotFound (404) cho mọi URL không khớp.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import { ProtectedRoute, AdminRoute } from './routes/RouteGuards';

// Public pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CourseList from './pages/CourseList';
import CourseDetail from './pages/CourseDetail';
import NotFound from './pages/NotFound';

// Student pages
import MyCourses from './pages/MyCourses';
import Profile from './pages/Profile';
import Learning from './pages/Learning';

// Admin pages
import AdminDashboard from './pages/AdminDashboard';
import AdminCategories from './pages/admin/AdminCategories';
import AdminCourses from './pages/admin/AdminCourses';
import AdminCourseForm from './pages/admin/AdminCourseForm';
import AdminLessons from './pages/AdminLessons';
import AdminStudents from './pages/admin/AdminStudents';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ===== PUBLIC + STUDENT routes (MainLayout) ===== */}
        <Route element={<MainLayout />}>
          {/* Public */}
          <Route index element={<Home />} />
          <Route path="/courses" element={<CourseList />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student (requires login) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/my-courses" element={<MyCourses />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/learning/:lessonId" element={<Learning />} />
          </Route>
        </Route>

        {/* ===== ADMIN routes ===== */}
        <Route path="/admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="courses/new" element={<AdminCourseForm />} />
            <Route path="courses/:id/edit" element={<AdminCourseForm />} />
            <Route path="lessons" element={<AdminLessons />} />
            <Route path="students" element={<AdminStudents />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
