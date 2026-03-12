import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, Star, BookOpen, User, ShoppingCart, Trash2, PlayCircle } from 'lucide-react';
import { getCourseDetail } from '../services/public.service';
import { enrollCourse } from '../services/student.service';
import { deleteReview } from '../services/admin.service';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { resolveImageUrl } from '../utils';

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
  const queryClient = useQueryClient();
  const isAdmin = auth?.user?.role === 'admin';
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

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId) => deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    },
    onError: (err) => {
      alert(err?.response?.data?.message || 'Không thể xóa đánh giá.');
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
        <div className="w-10 h-10 border-4 border-[#8b0000] border-t-transparent rounded-full animate-spin" />
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
    <div className="max-w-6xl mx-auto px-4 py-10 page-enter">

      {/* ===== TOP: Course info ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Left: image + description */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl overflow-hidden aspect-video bg-zinc-800">
            <img
              src={resolveImageUrl(course.image_url) || 'https://placehold.co/800x450?text=No+Image'}
              alt={course.title}
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://placehold.co/800x450?text=No+Image'; }}
            />
          </div>
          <div>
            <span className="text-xs font-medium text-[#c0392b] bg-zinc-800 px-3 py-1 rounded-full">
              {course.category?.name || 'Khóa học'}
            </span>
            <h1 className="text-3xl font-extrabold text-zinc-100 mt-3 mb-3 leading-tight">
              {course.title}
            </h1>
            <p className="text-zinc-300 leading-relaxed">
              {course.description || 'Chưa có mô tả cho khóa học này.'}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-zinc-400">
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
          <div className="sticky top-20 bg-zinc-900/80 backdrop-blur-md border border-zinc-700/60 rounded-2xl shadow-xl shadow-black/40 p-6 space-y-5">
            <div className="text-4xl font-extrabold text-[#c0392b]">
              {formatPrice(course.price)}
            </div>

            {/* Feedback messages */}
            {enrollMsg && (
              <div className="px-3 py-2 bg-green-950/40 border border-green-900 text-green-400 text-sm rounded-lg">
                {enrollMsg}
              </div>
            )}
            {enrollError && (
              <div className="px-3 py-2 bg-red-950/40 border border-red-900 text-red-400 text-sm rounded-lg">
                {enrollError}
              </div>
            )}

            <button
              onClick={handleEnroll}
              disabled={enrollMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-[#8b0000] hover:bg-[#a01828] disabled:opacity-60 text-white font-semibold text-lg py-3.5 rounded-xl transition-colors shadow-md hover:shadow-lg"
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
            <p className="text-xs text-zinc-400 text-center">
              Truy cập trọn đời sau khi đăng ký
            </p>
            <ul className="text-sm text-zinc-300 space-y-2">
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
        <h2 className="text-2xl font-bold text-zinc-100 mb-4">Nội dung khóa học</h2>
        {lessons.length === 0 ? (
          <p className="text-zinc-500 py-6 text-center">Chưa có bài giảng nào.</p>
        ) : (
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            {lessons.map((lesson, index) => (
              <div
                key={lesson.lesson_id}
                className="flex justify-between items-center p-4 border-b border-zinc-800 last:border-b-0 bg-zinc-900 hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-800 text-[#c0392b] text-xs font-bold shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-zinc-200 text-sm font-medium">{lesson.title}</span>
                </div>
                {lesson.is_locked ? (
                  <div className="flex items-center gap-1.5 text-zinc-500 text-xs shrink-0">
                    <Lock size={14} />
                    <span>Đã khóa</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-green-500 text-xs shrink-0">
                    <PlayCircle size={14} />
                    <span>Xem thử</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== BOTTOM: Reviews ===== */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 mb-6">
          Đánh giá ({reviews.length})
        </h2>
        {reviews.length === 0 ? (
          <p className="text-zinc-500 py-6 text-center">Chưa có đánh giá nào.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.review_id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-[#8b0000] text-white flex items-center justify-center font-bold text-sm uppercase">
                      {review.user?.full_name?.[0] || 'U'}
                    </div>
                    <span className="font-semibold text-zinc-100 text-sm">
                      {review.user?.full_name || 'Học viên ẩn danh'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StarRating rating={review.rating} />
                    {isAdmin && (
                      <button
                        onClick={() => {
                          if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
                          deleteReviewMutation.mutate(review.review_id);
                        }}
                        disabled={deleteReviewMutation.isPending}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-400 bg-red-950/30 hover:bg-red-950/60 border border-red-900/60 rounded-lg transition-colors disabled:opacity-50"
                        title="Xóa đánh giá (Admin)"
                      >
                        <Trash2 size={12} />
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed pl-11">
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

