import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, X, Loader2, BookOpen, Star, Trash2 } from 'lucide-react';
import { getStudents, getStudentDetail, deleteReview } from '../../services/admin.service';
import { resolveImageUrl } from '../../utils';

// ── Student Detail Modal ──────────────────────────────────────
function StudentModal({ studentId, onClose }) {
  const [activeTab, setActiveTab] = useState('courses');
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'student', studentId],
    queryFn: () => getStudentDetail(studentId),
    enabled: !!studentId,
  });

  const student = data?.data || data;
  const enrollments = student?.enrollments || [];
  const reviews = student?.reviews || [];

  const deleteReviewMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'student', studentId] });
    },
    onError: (err) => {
      alert(err?.response?.data?.message || 'Không thể xóa đánh giá.');
    },
  });

  const handleDeleteReview = (review) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận vi phạm này?')) return;
    deleteReviewMutation.mutate(review.review_id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-zinc-800">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h3 className="text-lg font-bold text-zinc-100">Chi tiết học viên</h3>
            {student && (
              <p className="text-sm text-zinc-400 mt-0.5">
                {student.full_name} — {student.email}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Loading / Error */}
        {isLoading && (
          <div className="flex justify-center items-center flex-1 py-16">
            <Loader2 size={32} className="animate-spin text-[#c0392b]" />
          </div>
        )}

        {isError && (
          <div className="text-center py-16 text-red-500 text-sm flex-1">
            Không thể tải thông tin học viên.
          </div>
        )}

        {!isLoading && !isError && student && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-zinc-800 px-6">
              <button
                onClick={() => setActiveTab('courses')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'courses'
                    ? 'border-[#c0392b] text-[#c0392b]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <BookOpen size={15} />
                Khóa học đã mua ({enrollments.length})
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'reviews'
                    ? 'border-[#c0392b] text-[#c0392b]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Star size={15} />
                Đánh giá ({reviews.length})
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Enrollments tab */}
              {activeTab === 'courses' && (
                <div>
                  {enrollments.length === 0 ? (
                    <p className="text-center text-zinc-500 py-10 text-sm">
                      Học viên chưa mua khóa học nào.
                    </p>
                  ) : (
                    <ul className="divide-y divide-zinc-800">
                      {enrollments.map((enroll) => {
                        const course = enroll.course || enroll;
                        return (
                          <li key={enroll.enrollment_id || course.course_id} className="py-3.5 flex items-center gap-4">
                            {course.image_url && (
                              <img
                                src={resolveImageUrl(course.image_url)}
                                alt={course.title}
                                className="w-12 h-12 rounded-lg object-cover border border-zinc-700 shrink-0"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-zinc-200 text-sm truncate">
                                {course.title}
                              </p>
                              {enroll.enrolled_at && (
                                <p className="text-xs text-zinc-500 mt-0.5">
                                  Đăng ký:{' '}
                                  {new Date(enroll.enrolled_at).toLocaleDateString('vi-VN')}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-green-400 bg-green-950/40 border border-green-900 px-2.5 py-1 rounded-full font-medium shrink-0">
                              Đã mua
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}

              {/* Reviews tab */}
              {activeTab === 'reviews' && (
                <div>
                  {reviews.length === 0 ? (
                    <p className="text-center text-zinc-500 py-10 text-sm">
                      Học viên chưa có đánh giá nào.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {reviews.map((review) => (
                        <li
                          key={review.review_id}
                          className="border border-zinc-700 rounded-xl p-4 bg-zinc-800"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-zinc-300">
                                  {review.course?.title || `Khóa #${review.course_id}`}
                                </span>
                                <span className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      size={11}
                                      className={
                                        s <= review.rating
                                          ? 'text-yellow-400 fill-yellow-400'
                                          : 'text-gray-300 fill-gray-300'
                                      }
                                    />
                                  ))}
                                </span>
                              </div>
                              <p className="text-sm text-zinc-300">{review.comment}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteReview(review)}
                              disabled={deleteReviewMutation.isPending}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                            >
                              <Trash2 size={12} />
                              Xóa
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function AdminStudents() {
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'students'],
    queryFn: getStudents,
  });

  const students = data?.data || data || [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Quản lý Học viên</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Xem danh sách và lịch sử mua khóa học của từng học viên.
        </p>
      </div>

      {/* Student detail modal */}
      {selectedStudentId && (
        <StudentModal
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}

      {/* Table */}
      <div className="bg-zinc-900/70 backdrop-blur-sm rounded-xl shadow-sm border border-zinc-800/60 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={32} className="animate-spin text-[#c0392b]" />
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-red-500 text-sm">
            Không thể tải danh sách học viên.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-800 text-xs uppercase text-zinc-400 border-b border-zinc-700">
                <tr>
                  <th className="px-5 py-3.5 w-14">ID</th>
                  <th className="px-5 py-3.5">Họ tên</th>
                  <th className="px-5 py-3.5 hidden sm:table-cell">Email</th>
                  <th className="px-5 py-3.5 hidden md:table-cell">Ngày đăng ký</th>
                  <th className="px-5 py-3.5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-zinc-500">
                      Chưa có học viên nào.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr
                      key={student.user_id}
                      className="hover:bg-zinc-800 transition-colors"
                    >
                      <td className="px-5 py-4 text-zinc-500 font-mono text-xs">
                        #{student.user_id}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#8b0000] text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
                            {student.full_name?.[0] || 'U'}
                          </div>
                          <span className="font-medium text-zinc-200">
                            {student.full_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-zinc-400 hidden sm:table-cell">
                        {student.email}
                      </td>
                      <td className="px-5 py-4 text-zinc-500 text-xs hidden md:table-cell">
                        {student.created_at
                          ? new Date(student.created_at).toLocaleDateString('vi-VN')
                          : '—'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedStudentId(student.user_id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors"
                        >
                          <Eye size={13} />
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
