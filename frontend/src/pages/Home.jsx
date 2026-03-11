import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getCourses } from '../services/public.service';

function formatPrice(price) {
  if (price === 0 || price === null || price === undefined) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function CourseCard({ course }) {
  return (
    <Link
      to={`/courses/${course.course_id}`}
      className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100"
    >
      <div className="aspect-video w-full overflow-hidden bg-gray-100">
        <img
          src={course.image_url || 'https://placehold.co/640x360?text=No+Image'}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 text-base line-clamp-2 leading-snug mb-3">
          {course.title}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-blue-600 font-bold text-sm">
            {formatPrice(course.price)}
          </span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {course.category?.name || 'Khóa học'}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  });

  const courses = data?.data || data || [];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Khám phá các khóa học chất lượng
          </h1>
          <p className="text-blue-100 text-lg mb-8">
            Học mọi lúc, mọi nơi với hàng trăm khóa học từ các chuyên gia hàng đầu.
          </p>
          <Link
            to="/courses"
            className="inline-block bg-white text-blue-700 font-semibold px-8 py-3 rounded-full hover:bg-blue-50 transition-colors"
          >
            Xem tất cả khóa học
          </Link>
        </div>
      </section>

      {/* Course list */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Khóa học nổi bật</h2>

        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {isError && (
          <div className="text-center py-20 text-red-500">
            Không thể tải danh sách khóa học. Vui lòng thử lại sau.
          </div>
        )}

        {!isLoading && !isError && courses.length === 0 && (
          <div className="text-center py-20 text-gray-400">Chưa có khóa học nào.</div>
        )}

        {!isLoading && !isError && courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.course_id} course={course} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

