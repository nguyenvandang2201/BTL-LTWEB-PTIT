import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PlusCircle, Trash2, Loader2, Pencil, Check, X } from 'lucide-react';
import {
  getAdminCourses,
  getAdminLessons,
  createLesson,
  updateLesson,
  deleteLesson,
} from '../services/admin.service';
import { resolveVideoUrl } from '../utils';

export default function AdminLessons() {
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [form, setForm] = useState({ title: '', video_url: '', order_index: '' });
  const [formError, setFormError] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', video_url: '', order_index: '' });
  const [editError, setEditError] = useState('');

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
        err?.response?.data?.errors?.[0]?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Không thể thêm bài giảng.'
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

  // ── Update lesson ─────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateLesson(id, data),
    onSuccess: () => {
      refetch();
      setEditingId(null);
      setEditError('');
    },
    onError: (err) => {
      setEditError(
        err?.response?.data?.errors?.[0]?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Không thể cập nhật bài giảng.'
      );
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
      video_url: resolveVideoUrl(form.video_url),
      order_index: Number(form.order_index),
    });
  };

  const handleEditStart = (lesson) => {
    setEditingId(lesson.lesson_id);
    setEditForm({
      title: lesson.title,
      video_url: lesson.video_url || '',
      order_index: lesson.order_index ?? '',
    });
    setEditError('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditError('');
  };

  const handleEditSave = (id) => {
    if (!editForm.title.trim()) {
      setEditError('Tên bài giảng không được để trống.');
      return;
    }
    updateMutation.mutate({
      id,
      data: {
        title: editForm.title,
        video_url: resolveVideoUrl(editForm.video_url) || undefined,
        order_index: editForm.order_index ? Number(editForm.order_index) : undefined,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Quản lý Bài giảng</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Chọn khóa học để xem và quản lý bài giảng.
        </p>
      </div>

      {/* Course selector */}
      <div className="bg-zinc-900/70 backdrop-blur-sm rounded-xl shadow-sm border border-zinc-800/60 p-5">
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Chọn khóa học
        </label>
        {loadingCourses ? (
          <Loader2 size={20} className="animate-spin text-[#c0392b]" />
        ) : (
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full sm:w-96 px-4 py-2.5 border border-zinc-700 rounded-lg text-sm bg-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#8b0000]"
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
          <div className="bg-zinc-900/70 backdrop-blur-sm rounded-xl shadow-sm border border-zinc-800/60 p-5">
            <h3 className="text-base font-semibold text-zinc-200 mb-4 flex items-center gap-2">
              <PlusCircle size={18} className="text-[#c0392b]" />
              Thêm bài giảng mới
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Tên bài giảng *"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="px-4 py-2.5 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#8b0000]"
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Thứ tự *"
                  value={form.order_index}
                  onChange={(e) => setForm((p) => ({ ...p, order_index: e.target.value }))}
                  className="px-4 py-2.5 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#8b0000]"
                />
              </div>
              <div>
                <textarea
                  rows={3}
                  placeholder="Dán mã nhúng iframe YouTube hoặc link video trực tiếp *"
                  value={form.video_url}
                  onChange={(e) => setForm((p) => ({ ...p, video_url: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg text-sm placeholder:text-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-[#8b0000] font-mono"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Chấp nhận: mã nhúng{' '}
                  <code className="text-zinc-400">&lt;iframe …&gt;</code>, link{' '}
                  <code className="text-zinc-400">youtube.com/watch?v=…</code>, hoặc{' '}
                  <code className="text-zinc-400">youtu.be/…</code>.
                </p>
              </div>
              {formError && <p className="text-red-500 text-xs">{formError}</p>}
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#8b0000] hover:bg-[#a01828] disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
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
          <div className="bg-zinc-900/70 backdrop-blur-sm rounded-xl shadow-sm border border-zinc-800/60 overflow-hidden">
            {loadingLessons ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 size={28} className="animate-spin text-[#c0392b]" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-800 text-xs uppercase text-zinc-400 border-b border-zinc-700">
                    <tr>
                      <th className="px-5 py-3.5 w-16">Thứ tự</th>
                      <th className="px-5 py-3.5">Tên bài giảng</th>
                      <th className="px-5 py-3.5 hidden md:table-cell">URL Video</th>
                      <th className="px-5 py-3.5 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {lessons.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-12 text-center text-zinc-500">
                          Khóa học này chưa có bài giảng nào.
                        </td>
                      </tr>
                    ) : (
                      lessons.map((lesson, index) => (
                        <tr
                          key={lesson.lesson_id}
                          className="hover:bg-zinc-800 transition-colors"
                        >
                          {editingId === lesson.lesson_id ? (
                            <>
                              <td className="px-3 py-3">
                                <input
                                  type="number"
                                  min="1"
                                  value={editForm.order_index}
                                  onChange={(e) => setEditForm((p) => ({ ...p, order_index: e.target.value }))}
                                  className="w-16 px-2 py-1.5 border border-zinc-600 bg-zinc-800 text-zinc-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#8b0000]"
                                />
                              </td>
                              <td className="px-3 py-3">
                                <input
                                  type="text"
                                  value={editForm.title}
                                  onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                                  className="w-full px-3 py-1.5 border border-zinc-600 bg-zinc-800 text-zinc-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8b0000]"
                                />
                                {editError && (
                                  <p className="text-red-500 text-xs mt-1">{editError}</p>
                                )}
                              </td>
                              <td className="px-3 py-3 hidden md:table-cell">
                                <textarea
                                  rows={2}
                                  value={editForm.video_url}
                                  onChange={(e) => setEditForm((p) => ({ ...p, video_url: e.target.value }))}
                                  placeholder="iframe / youtube URL"
                                  className="w-full px-3 py-1.5 border border-zinc-600 bg-zinc-800 text-zinc-100 rounded-lg text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[#8b0000]"
                                />
                              </td>
                              <td className="px-3 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleEditSave(lesson.lesson_id)}
                                    disabled={updateMutation.isPending}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-400 bg-green-950/30 hover:bg-green-950/60 border border-green-900/60 rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    {updateMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                    Lưu
                                  </button>
                                  <button
                                    onClick={handleEditCancel}
                                    disabled={updateMutation.isPending}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    <X size={12} />
                                    Hủy
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-5 py-4 text-zinc-400 font-mono text-xs">
                                {lesson.order_index ?? index + 1}
                              </td>
                              <td className="px-5 py-4 font-medium text-zinc-200">
                                {lesson.title}
                              </td>
                              <td className="px-5 py-4 text-zinc-500 text-xs hidden md:table-cell max-w-xs truncate">
                                {lesson.video_url || '—'}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleEditStart(lesson)}
                                    disabled={deleteMutation.isPending}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-950/30 hover:bg-blue-950/60 border border-blue-900/60 rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    <Pencil size={12} />
                                    Sửa
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (
                                        !window.confirm(`Xóa bài giảng "${lesson.title}"?`)
                                      )
                                        return;
                                      deleteMutation.mutate(lesson.lesson_id);
                                    }}
                                    disabled={deleteMutation.isPending}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-950/30 hover:bg-red-950/60 border border-red-900/60 rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    <Trash2 size={12} />
                                    Xóa
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
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

