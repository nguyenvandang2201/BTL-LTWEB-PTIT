import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, PlayCircle } from 'lucide-react';
import { getMyCourses } from '../services/student.service';

export default function MyCourses() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-courses'],
    queryFn: getMyCourses,
  });

  const enrollments = data?.data || data || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-1">Khóa học của tôi</h1>
      <p className="text-gray-500 mb-8">Danh sách các khóa học bạn đã đăng ký.</p>

      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div className="text-center py-20 text-red-500">
          Không thể tải danh sách khóa học. Vui lòng thử lại sau.
        </div>
      )}

      {!isLoading && !isError && enrollments.length === 0 && (
        <div className="text-center py-20">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-400 text-lg mb-4">Bạn chưa có khóa học nào.</p>
          <Link
            to="/courses"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
          >
            Khám phá khóa học ngay
          </Link>
        </div>
      )}

      {!isLoading && !isError && enrollments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => {
            const course = enrollment.course || enrollment;
            return (
              <div
                key={enrollment.enrollment_id || course.course_id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group"
              >
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  <img
                    src={course.image_url || 'https://placehold.co/640x360?text=No+Image'}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://placehold.co/640x360?text=No+Image'; }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-2">
                    {course.title}
                  </h3>
                  {enrollment.enrolled_at && (
                    <p className="text-xs text-gray-400 mb-3">
                      Đăng ký:{' '}
                      {new Date(enrollment.enrolled_at).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                  <Link
                    to={`/learning/${course.course_id}`}
                    className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                  >
                    <PlayCircle size={16} />
                    Tiếp tục học
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

