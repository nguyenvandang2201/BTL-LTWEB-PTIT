import { useQuery } from '@tanstack/react-query';
import { BookOpen, Users, Tag, TrendingUp } from 'lucide-react';
import { getAdminCourses, getCategories, getStudents } from '../services/admin.service';

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: coursesData } = useQuery({
    queryKey: ['admin', 'courses'],
    queryFn: getAdminCourses,
  });
  const { data: categoriesData } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: getCategories,
  });
  const { data: studentsData } = useQuery({
    queryKey: ['admin', 'students'],
    queryFn: getStudents,
  });

  const courses = coursesData?.data || coursesData || [];
  const categories = categoriesData?.data || categoriesData || [];
  const students = studentsData?.data || studentsData || [];

  const stats = [
    { label: 'Tổng khóa học', value: courses.length, icon: BookOpen, color: 'bg-blue-500' },
    { label: 'Học viên', value: students.length, icon: Users, color: 'bg-green-500' },
    { label: 'Danh mục', value: categories.length, icon: Tag, color: 'bg-purple-500' },
    {
      label: 'Khóa học có phí',
      value: courses.filter((c) => c.price > 0).length,
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">Tổng quan hệ thống học trực tuyến.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Recent courses */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-base font-semibold text-gray-700 mb-4">Khóa học mới nhất</h3>
        {courses.length === 0 ? (
          <p className="text-gray-400 text-sm py-6 text-center">Chưa có khóa học nào.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {courses.slice(0, 5).map((course) => (
              <li key={course.course_id} className="py-3.5 flex items-center gap-3">
                {course.image_url && (
                  <img
                    src={course.image_url}
                    alt={course.title}
                    className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{course.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {course.category?.name || '—'}
                  </p>
                </div>
                <span className="text-xs text-blue-600 font-semibold shrink-0">
                  {course.price > 0 ? formatPrice(course.price) : 'Miễn phí'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recent students */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-base font-semibold text-gray-700 mb-4">Học viên mới nhất</h3>
        {students.length === 0 ? (
          <p className="text-gray-400 text-sm py-6 text-center">Chưa có học viên nào.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {students.slice(0, 5).map((student) => (
              <li key={student.user_id} className="py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
                  {student.full_name?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {student.full_name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{student.email}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0 hidden sm:block">
                  {student.created_at
                    ? new Date(student.created_at).toLocaleDateString('vi-VN')
                    : '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

