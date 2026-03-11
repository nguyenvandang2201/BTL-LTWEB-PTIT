import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Lock, Star, BookOpen, User, ShoppingCart } from 'lucide-react';
import { getCourseDetail } from '../services/public.service';
import { enrollCourse } from '../services/student.service';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

function formatPrice(price) {
  if (!price || price === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-300'}
        />
      ))}
    </div>
  );
}

export default function CourseDetail() {
  const { id } = useParams();
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [enrollMsg, setEnrollMsg] = useState('');
  const [enrollError, setEnrollError] = useState('');

  const enrollMutation = useMutation({
    mutationFn: () => enrollCourse(Number(id)),
    onSuccess: (res) => {
      const msg = res?.data?.message || res?.message || '';
      setEnrollMsg('Mua thành công! Đang chuyển hướng...');
      setTimeout(() => navigate(`/my-courses`), 1500);
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Đã xảy ra lỗi khi đăng ký khóa học.';
      setEnrollError(msg);
    },
  });

  const handleEnroll = () => {
    setEnrollMsg('');
    setEnrollError('');
    if (!auth?.token) {
      navigate('/login');
      return;
    }
    enrollMutation.mutate();
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['course', id],
    queryFn: () => getCourseDetail(id),
    enabled: !!id,
  });

  const course = data?.data || data;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-40">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="text-center py-40 text-red-500 text-lg">
        Không thể tải thông tin khóa học. Vui lòng thử lại sau.
      </div>
    );
  }

  const lessons = course.lessons || [];
  const reviews = course.reviews || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* ===== TOP: Course info ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Left: image + description */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl overflow-hidden aspect-video bg-gray-100">
            <img
              src={course.image_url || 'https://placehold.co/800x450?text=No+Image'}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {course.category?.name || 'Khóa học'}
            </span>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-3 mb-3 leading-tight">
              {course.title}
            </h1>
            <p className="text-gray-600 leading-relaxed">
              {course.description || 'Chưa có mô tả cho khóa học này.'}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <BookOpen size={16} />
              {lessons.length} bài giảng
            </span>
            <span className="flex items-center gap-1.5">
              <User size={16} />
              {reviews.length} đánh giá
            </span>
          </div>
        </div>

        {/* Right: price + enroll */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 bg-white border border-gray-200 rounded-2xl shadow-lg p-6 space-y-5">
            <div className="text-4xl font-extrabold text-blue-600">
              {formatPrice(course.price)}
            </div>

            {/* Feedback messages */}
            {enrollMsg && (
              <div className="px-3 py-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
                {enrollMsg}
              </div>
            )}
            {enrollError && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                {enrollError}
              </div>
            )}

            <button
              onClick={handleEnroll}
              disabled={enrollMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-lg py-3.5 rounded-xl transition-colors shadow-md hover:shadow-lg"
            >
              {enrollMutation.isPending ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <ShoppingCart size={20} />
                  {auth?.token ? 'Mua ngay' : 'Đăng nhập để mua'}
                </>
              )}
            </button>
            <p className="text-xs text-gray-400 text-center">
              Truy cập trọn đời sau khi đăng ký
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> {lessons.length} bài giảng
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Học mọi lúc, mọi nơi
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Cấp chứng chỉ hoàn thành
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ===== MIDDLE: Lessons list ===== */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Nội dung khóa học</h2>
        {lessons.length === 0 ? (
          <p className="text-gray-400 py-6 text-center">Chưa có bài giảng nào.</p>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            {lessons.map((lesson, index) => (
              <div
                key={lesson.lesson_id}
                className="flex justify-between items-center p-4 border-b last:border-b-0 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 text-sm font-medium">{lesson.title}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs shrink-0">
                  <Lock size={14} />
                  <span>Đã khóa</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== BOTTOM: Reviews ===== */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Đánh giá ({reviews.length})
        </h2>
        {reviews.length === 0 ? (
          <p className="text-gray-400 py-6 text-center">Chưa có đánh giá nào.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.review_id}
                className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm uppercase">
                      {review.student?.full_name?.[0] || 'U'}
                    </div>
                    <span className="font-semibold text-gray-800 text-sm">
                      {review.student?.full_name || 'Học viên ẩn danh'}
                    </span>
                  </div>
                  <StarRating rating={review.rating} />
                </div>
                <p className="text-gray-600 text-sm leading-relaxed pl-11">
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

