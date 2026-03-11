import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';
import {
  getAdminCourses,
  getAdminLessons,
  createLesson,
  deleteLesson,
} from '../services/admin.service';

export default function AdminLessons() {
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [form, setForm] = useState({ title: '', video_url: '', order_index: '' });
  const [formError, setFormError] = useState('');

  // ── Fetch courses list (to populate selector) ────────────────
  const { data: coursesData, isLoading: loadingCourses } = useQuery({
    queryKey: ['admin', 'courses'],
    queryFn: getAdminCourses,
  });
  const courses = coursesData?.data || coursesData || [];

  // ── Fetch lessons for selected course ────────────────────────
  const {
    data: courseData,
    isLoading: loadingLessons,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'lessons', selectedCourseId],
    queryFn: () => getAdminLessons(selectedCourseId),
    enabled: !!selectedCourseId,
  });
  // getAdminLessons returns full course object; lessons are inside it
  const lessons = courseData?.lessons || [];

  // ── Create lesson ─────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: createLesson,
    onSuccess: () => {
      refetch();
      setForm({ title: '', video_url: '', order_index: '' });
      setFormError('');
    },
    onError: (err) => {
      setFormError(
        err?.response?.data?.message || err?.message || 'Không thể thêm bài giảng.'
      );
    },
  });

  // ── Delete lesson ─────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: deleteLesson,
    onSuccess: () => refetch(),
    onError: (err) => {
      alert(err?.response?.data?.message || 'Không thể xóa bài giảng.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim()) {
      setFormError('Tên bài giảng không được để trống.');
      return;
    }
    if (!form.video_url.trim()) {
      setFormError('URL video không được để trống.');
      return;
    }
    if (!form.order_index) {
      setFormError('Thứ tự bài giảng không được để trống.');
      return;
    }
    createMutation.mutate({
      course_id: Number(selectedCourseId),
      title: form.title,
      video_url: form.video_url,
      order_index: Number(form.order_index),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Bài giảng</h2>
        <p className="text-sm text-gray-500 mt-1">
          Chọn khóa học để xem và quản lý bài giảng.
        </p>
      </div>

      {/* Course selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chọn khóa học
        </label>
        {loadingCourses ? (
          <Loader2 size={20} className="animate-spin text-blue-500" />
        ) : (
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full sm:w-96 px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Chọn khóa học --</option>
            {courses.map((c) => (
              <option key={c.course_id} value={c.course_id}>
                {c.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedCourseId && (
        <>
          {/* Add lesson form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <PlusCircle size={18} className="text-blue-600" />
              Thêm bài giảng mới
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Tên bài giảng *"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="url"
                  placeholder="URL video *"
                  value={form.video_url}
                  onChange={(e) => setForm((p) => ({ ...p, video_url: e.target.value }))}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Thứ tự *"
                  value={form.order_index}
                  onChange={(e) => setForm((p) => ({ ...p, order_index: e.target.value }))}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {formError && <p className="text-red-500 text-xs">{formError}</p>}
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {createMutation.isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <PlusCircle size={15} />
                )}
                {createMutation.isPending ? 'Đang lưu...' : 'Thêm bài giảng'}
              </button>
            </form>
          </div>

          {/* Lessons table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loadingLessons ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 size={28} className="animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3.5 w-16">Thứ tự</th>
                      <th className="px-5 py-3.5">Tên bài giảng</th>
                      <th className="px-5 py-3.5 hidden md:table-cell">URL Video</th>
                      <th className="px-5 py-3.5 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lessons.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-12 text-center text-gray-400">
                          Khóa học này chưa có bài giảng nào.
                        </td>
                      </tr>
                    ) : (
                      lessons.map((lesson, index) => (
                        <tr
                          key={lesson.lesson_id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-5 py-4 text-gray-500 font-mono text-xs">
                            {lesson.order_index ?? index + 1}
                          </td>
                          <td className="px-5 py-4 font-medium text-gray-800">
                            {lesson.title}
                          </td>
                          <td className="px-5 py-4 text-gray-400 text-xs hidden md:table-cell max-w-xs truncate">
                            {lesson.video_url || '—'}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => {
                                if (
                                  !window.confirm(`Xóa bài giảng "${lesson.title}"?`)
                                )
                                  return;
                                deleteMutation.mutate(lesson.lesson_id);
                              }}
                              disabled={deleteMutation.isPending}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Trash2 size={12} />
                              Xóa
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
        </>
      )}
    </div>
  );
}

