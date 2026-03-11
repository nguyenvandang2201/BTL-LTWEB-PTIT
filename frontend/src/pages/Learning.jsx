import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Lock, PlayCircle, X, ChevronRight } from 'lucide-react';
import { getCourseDetail } from '../services/public.service';
import { getLessonVideo, createReview } from '../services/student.service';
import { useAuth } from '../context/AuthContext';

// ── Star picker ──────────────────────────────────────────────
function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="focus:outline-none"
        >
          <Star
            size={24}
            className={
              s <= (hover || value)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300 fill-gray-300'
            }
          />
        </button>
      ))}
    </div>
  );
}

// ── Modal / Popup ──────────────────────────────────────────────
function Modal({ message, type = 'error', onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-zinc-900/90 border border-zinc-700 rounded-2xl shadow-2xl shadow-black/60 p-8 max-w-sm w-full text-center space-y-4">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto text-2xl ${
            type === 'success'
              ? 'bg-green-900/40 text-green-400 border border-green-800'
              : 'bg-red-900/40 text-red-400 border border-red-800'
          }`}
        >
          {type === 'success' ? '✓' : '🔒'}
        </div>
        <p className="text-zinc-200 font-medium">{message}</p>
        <button
          onClick={onClose}
          className="mt-2 px-6 py-2 bg-[#8b0000] hover:bg-[#a01828] text-white rounded-lg transition-colors text-sm font-medium"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function Learning() {
  const { lessonId } = useParams();
  const { auth } = useAuth();
  const queryClient = useQueryClient();

  // Lấy course_id từ lessonId (route /learning/:lessonId có thể là course id)
  const courseId = lessonId;

  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [activeLesson, setActiveLesson] = useState(null);
  const [loadingLesson, setLoadingLesson] = useState(null);
  const [modal, setModal] = useState(null); // { message, type }

  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // Fetch course detail
  const { data, isLoading, isError } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => getCourseDetail(courseId),
    enabled: !!courseId,
  });

  const course = data?.data || data;
  const lessons = course?.lessons || [];
  const reviews = course?.reviews || [];

  // Mutation: get video URL
  const videoMutation = useMutation({
    mutationFn: (id) => getLessonVideo(id),
    onMutate: (id) => setLoadingLesson(id),
    onSuccess: (res, id) => {
      const url = res?.data?.video_url || res?.video_url || '';
      if (url) {
        setCurrentVideoUrl(url);
        setActiveLesson(id);
      }
      setLoadingLesson(null);
    },
    onError: (err, id) => {
      setLoadingLesson(null);
      const status = err?.response?.status;
      const msg =
        status === 403
          ? 'Vui lòng mua khóa học để xem bài giảng này.'
          : err?.response?.data?.message || 'Không thể tải video. Vui lòng thử lại.';
      setModal({ message: msg, type: 'error' });
    },
  });

  // Mutation: submit review
  const reviewMutation = useMutation({
    mutationFn: (data) => createReview(data),
    onSuccess: () => {
      setModal({ message: 'Cảm ơn đánh giá của bạn!', type: 'success' });
      setRating(5);
      setComment('');
      // Refetch để hiển thị review mới ngay lập tức
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể gửi đánh giá. Vui lòng thử lại.';
      setModal({ message: msg, type: 'error' });
    },
  });

  const handleLessonClick = (lesson) => {
    if (loadingLesson) return;
    videoMutation.mutate(lesson.lesson_id);
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    reviewMutation.mutate({ course_id: Number(courseId), rating, comment });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-10 h-10 border-4 border-[#8b0000] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="text-center py-32 text-red-400">
        Không thể tải dữ liệu khóa học. Vui lòng thử lại.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Modal popup */}
      {modal && (
        <Modal
          message={modal.message}
          type={modal.type}
          onClose={() => setModal(null)}
        />
      )}

      <h1 className="text-xl font-bold text-zinc-100 mb-5">{course.title}</h1>

      {/* ===== Main split layout ===== */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* LEFT: Video + Review */}
        <div className="flex-1 space-y-6">
          {/* Video player */}
          <div className="bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center">
            {currentVideoUrl ? (
              <video
                key={currentVideoUrl}
                src={currentVideoUrl}
                controls
                autoPlay
                className="w-full h-full"
              />
            ) : (
              <div className="text-center text-gray-400 space-y-3">
                <PlayCircle size={56} className="mx-auto opacity-40" />
                <p className="text-sm">Vui lòng chọn bài học để bắt đầu xem</p>
              </div>
            )}
          </div>

          {activeLesson && (
            <p className="text-sm text-zinc-400">
              Đang xem:{' '}
              <span className="font-medium text-zinc-200">
                {lessons.find((l) => l.lesson_id === activeLesson)?.title}
              </span>
            </p>
          )}

          {/* Review form */}
          <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-700/60 rounded-xl p-5">
            <h3 className="font-semibold text-zinc-200 mb-4">Viết đánh giá của bạn</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Số sao</label>
                <StarPicker value={rating} onChange={setRating} />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Nội dung</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  rows={3}
                  placeholder="Chia sẻ trải nghiệm học của bạn..."
                  className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700/60 text-zinc-200 placeholder-zinc-500 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#8b0000] focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={reviewMutation.isPending}
                className="px-6 py-2.5 bg-[#8b0000] hover:bg-[#a01828] disabled:bg-[#8b0000]/50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {reviewMutation.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </form>
          </div>

          {/* Reviews list */}
          {reviews.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-zinc-200">Đánh giá ({reviews.length})</h3>
              {reviews.map((r) => (
                <div key={r.review_id} className="bg-zinc-900/80 backdrop-blur-md border border-zinc-700/60 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-[#8b0000] text-white flex items-center justify-center text-xs font-bold uppercase">
                      {r.user?.full_name?.[0] || 'U'}
                    </div>
                    <span className="text-sm font-semibold text-zinc-200">{r.user?.full_name || 'Ẩn danh'}</span>
                    <div className="flex gap-0.5 ml-auto">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} size={12} className={s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-600 fill-zinc-600'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 pl-10">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Lesson list */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-700/60 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-zinc-800/60 border-b border-zinc-700/60">
              <h3 className="font-semibold text-zinc-200 text-sm">
                Nội dung khóa học ({lessons.length} bài)
              </h3>
            </div>
            <ul className="divide-y divide-zinc-800/60 max-h-[70vh] overflow-y-auto">
              {lessons.map((lesson, index) => {
                const isActive = activeLesson === lesson.lesson_id;
                const isLoadingThis = loadingLesson === lesson.lesson_id;
                return (
                  <li key={lesson.lesson_id}>
                    <button
                      onClick={() => handleLessonClick(lesson)}
                      disabled={isLoadingThis}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3.5 hover:bg-[#8b0000]/20 transition-colors ${
                        isActive ? 'bg-[#8b0000]/25 border-l-4 border-[#c0392b]' : ''
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isActive
                            ? 'bg-[#8b0000] text-white'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {isLoadingThis ? (
                          <span className="w-3 h-3 border-2 border-[#c0392b] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span className={`text-sm flex-1 line-clamp-2 ${isActive ? 'text-[#c0392b] font-medium' : 'text-zinc-300'}`}>
                        {lesson.title}
                      </span>
                      {lesson.is_locked && !isActive ? (
                        <Lock size={14} className="text-zinc-500 shrink-0" />
                      ) : (
                        <ChevronRight size={14} className="text-zinc-500 shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


