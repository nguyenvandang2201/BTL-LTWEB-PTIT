import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Trash2, Loader2, ArrowLeft, CheckCircle2, Pencil, Check, X } from 'lucide-react';
import { resolveImageUrl, resolveVideoUrl } from '../../utils';
import {
  getCategories,
  createCourse,
  updateCourse,
  getAdminCourses,
  createLesson,
  updateLesson,
  deleteLesson,
  getAdminLessons,
} from '../../services/admin.service';

// ── Section wrapper ───────────────────────────────────────────
function Section({ title, subtitle, children }) {
  return (
    <div className="bg-zinc-900/70 backdrop-blur-sm rounded-xl shadow-sm border border-zinc-800/60 p-6 space-y-5">
      <div className="border-b border-zinc-700 pb-4">
        <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
        {subtitle && <p className="text-sm text-zinc-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export default function AdminCourseForm() {
  const { id } = useParams(); // undefined = create mode, defined = edit mode
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Course form state ─────────────────────────────────────
  const [courseForm, setCourseForm] = useState({
    title: '',
    price: '',
    category_id: '',
    description: '',
    image_url: '',
  });
  const [courseError, setCourseError] = useState('');
  const [savedCourseId, setSavedCourseId] = useState(isEdit ? Number(id) : null);

  // ── Lesson form state ─────────────────────────────────────
  const [lessonForm, setLessonForm] = useState({ title: '', video_url: '', order_index: '' });
  const [lessonError, setLessonError] = useState('');

  const [editingLessonId, setEditingLessonId] = useState(null);
  const [editLessonForm, setEditLessonForm] = useState({ title: '', video_url: '', order_index: '' });
  const [editLessonError, setEditLessonError] = useState('');

  // ── Fetch categories ──────────────────────────────────────
  const { data: catData } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: getCategories,
  });
  const categories = catData?.data || catData || [];

  // ── Fetch course detail (edit mode) ──────────────────────
  const { data: coursesData } = useQuery({
    queryKey: ['admin', 'courses'],
    queryFn: getAdminCourses,
    enabled: isEdit,
  });

  useEffect(() => {
    if (isEdit && coursesData) {
      const list = coursesData?.data || coursesData || [];
      const found = list.find((c) => c.course_id === Number(id));
      if (found) {
        setCourseForm({
          title: found.title || '',
          price: found.price ?? '',
          category_id: found.category_id ?? '',
          description: found.description || '',
          image_url: found.image_url || '',
        });
      }
    }
  }, [isEdit, coursesData, id]);

  // ── Fetch lessons of this course ──────────────────────────
  const { data: lessonsData, refetch: refetchLessons } = useQuery({
    queryKey: ['admin', 'lessons', savedCourseId],
    queryFn: () => getAdminLessons(savedCourseId),
    enabled: !!savedCourseId,
  });
  // getAdminLessons now returns the full course object; extract lessons from it
  const lessons = lessonsData?.lessons || [];

  // ── Create / Update course ────────────────────────────────
  const courseMutation = useMutation({
    mutationFn: (data) =>
      isEdit ? updateCourse(Number(id), data) : createCourse(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      setCourseError('');
      if (!isEdit) {
        const newId = res?.data?.course_id || res?.course_id;
        if (newId) setSavedCourseId(newId);
      }
    },
    onError: (err) => {
      setCourseError(
        err?.response?.data?.message || err?.message || 'Không thể lưu khóa học.'
      );
    },
  });

  // ── Create lesson ─────────────────────────────────────────
  const createLessonMutation = useMutation({
    mutationFn: createLesson,
    onSuccess: () => {
      refetchLessons();
      setLessonForm({ title: '', video_url: '', order_index: '' });
      setLessonError('');
    },
    onError: (err) => {
      setLessonError(
        err?.response?.data?.errors?.[0]?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Không thể thêm bài giảng.'
      );
    },
  });

  // ── Delete lesson ─────────────────────────────────────────
  const deleteLessonMutation = useMutation({
    mutationFn: deleteLesson,
    onSuccess: () => refetchLessons(),
    onError: (err) => {
      alert(err?.response?.data?.message || 'Không thể xóa bài giảng.');
    },
  });
  // ── Update lesson ─────────────────────────────────────────────
  const updateLessonMutation = useMutation({
    mutationFn: ({ id, data }) => updateLesson(id, data),
    onSuccess: () => {
      refetchLessons();
      setEditingLessonId(null);
      setEditLessonError('');
    },
    onError: (err) => {
      setEditLessonError(
        err?.response?.data?.errors?.[0]?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Không thể cập nhật bài giảng.'
      );
    },
  });
  // ── Handlers ──────────────────────────────────────────────
  const handleCourseSubmit = (e) => {
    e.preventDefault();
    if (!courseForm.title.trim()) {
      setCourseError('Tên khóa học không được để trống.');
      return;
    }
    const payload = {
      ...courseForm,
      price: courseForm.price === '' ? 0 : Number(courseForm.price),
      category_id: courseForm.category_id ? Number(courseForm.category_id) : undefined,
    };
    courseMutation.mutate(payload);
  };

  const handleLessonSubmit = (e) => {
    e.preventDefault();
    if (!lessonForm.title.trim()) {
      setLessonError('Tên bài giảng không được để trống.');
      return;
    }
    if (!lessonForm.video_url.trim()) {
      setLessonError('URL video không được để trống.');
      return;
    }
    if (!lessonForm.order_index) {
      setLessonError('Thứ tự bài giảng không được để trống.');
      return;
    }
    createLessonMutation.mutate({
      course_id: savedCourseId,
      title: lessonForm.title,
      video_url: resolveVideoUrl(lessonForm.video_url),
      order_index: Number(lessonForm.order_index),
    });
  };

  const handleDeleteLesson = (lesson) => {
    if (!window.confirm(`Xóa bài giảng "${lesson.title}"?`)) return;
    deleteLessonMutation.mutate(lesson.lesson_id);
  };

  const handleEditLessonStart = (lesson) => {
    setEditingLessonId(lesson.lesson_id);
    setEditLessonForm({
      title: lesson.title,
      video_url: lesson.video_url || '',
      order_index: lesson.order_index ?? '',
    });
    setEditLessonError('');
  };

  const handleEditLessonCancel = () => {
    setEditingLessonId(null);
    setEditLessonError('');
  };

  const handleEditLessonSave = (id) => {
    if (!editLessonForm.title.trim()) {
      setEditLessonError('Tên bài giảng không được để trống.');
      return;
    }
    updateLessonMutation.mutate({
      id,
      data: {
        title: editLessonForm.title,
        video_url: resolveVideoUrl(editLessonForm.video_url) || undefined,
        order_index: editLessonForm.order_index ? Number(editLessonForm.order_index) : undefined,
      },
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/courses')}
          className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-300"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">
            {isEdit ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}
          </h2>
          <p className="text-sm text-zinc-400 mt-0.5">
            {isEdit
              ? 'Cập nhật thông tin và quản lý bài giảng.'
              : 'Điền thông tin, lưu để mở khóa phần thêm bài giảng.'}
          </p>
        </div>
      </div>

      {/* ── PART 1: Course info ── */}
      <Section
        title="Thông tin khóa học"
        subtitle="Các trường có dấu * là bắt buộc."
      >
        {/* Success indicator (create mode) */}
        {savedCourseId && !isEdit && (
          <div className="flex items-center gap-2 px-4 py-3 bg-green-950/40 border border-green-900 text-green-400 text-sm rounded-lg">
            <CheckCircle2 size={16} />
            Khóa học đã được tạo (ID: #{savedCourseId}). Bạn có thể thêm bài giảng bên dưới.
          </div>
        )}

        <form onSubmit={handleCourseSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Tên khóa học *
            </label>
            <input
              type="text"
              value={courseForm.title}
              onChange={(e) => setCourseForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Ví dụ: Học React từ cơ bản đến nâng cao"
              className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#8b0000]"
            />
          </div>

          {/* Price + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Giá (VNĐ)
              </label>
              <input
                type="number"
                min="0"
                value={courseForm.price}
                onChange={(e) => setCourseForm((p) => ({ ...p, price: e.target.value }))}
                placeholder="0 = Miễn phí"
                className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#8b0000]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Danh mục
              </label>
              <select
                value={courseForm.category_id}
                onChange={(e) => setCourseForm((p) => ({ ...p, category_id: e.target.value }))}
                className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8b0000]"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Mô tả
            </label>
            <textarea
              rows={4}
              value={courseForm.description}
              onChange={(e) => setCourseForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Mô tả ngắn về nội dung và mục tiêu của khóa học..."
              className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg text-sm resize-none placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#8b0000]"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              URL ảnh bìa
            </label>
            <input
              type="text"
              value={courseForm.image_url}
              onChange={(e) => setCourseForm((p) => ({ ...p, image_url: e.target.value }))}
              placeholder="https://i.ibb.co/... hoặc https://ibb.co/..."
              className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#8b0000]"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Hỗ trợ ImgBB — nên dùng <span className="text-zinc-400">Direct link</span>{' '}
              (<code className="text-zinc-400">https://i.ibb.co/...</code>) để hiển thị chính xác nhất.
              Link chia sẻ thông thường (<code className="text-zinc-400">https://ibb.co/...</code>)
              cũng được hỗ trợ.
            </p>
            {/ibb\.co\//.test(courseForm.image_url) && !/i\.ibb\.co\//.test(courseForm.image_url) && (
              <p className="text-yellow-500 text-xs mt-1">
                ⚠️ Đây là link trang xem ảnh ImgBB. Hệ thống sẽ tự chuyển sang ảnh trực tiếp,
                nhưng để chắc chắn hãy dùng <strong>Direct link</strong> từ ImgBB
                (dạng <code>https://i.ibb.co/...</code>).
              </p>
            )}
            {courseForm.image_url && (
              <img
                src={resolveImageUrl(courseForm.image_url)}
                alt="preview"
                className="mt-2 h-28 rounded-lg object-cover border border-zinc-700"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            )}
          </div>

          {courseError && (
            <p className="text-red-500 text-sm">{courseError}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/admin/courses')}
              className="px-5 py-2.5 border border-zinc-700 text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={courseMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {courseMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              {courseMutation.isPending
                ? 'Đang lưu...'
                : isEdit
                ? 'Cập nhật khóa học'
                : 'Lưu & tiếp tục'}
            </button>
          </div>
        </form>
      </Section>

      {/* ── PART 2: Lessons (only when course exists) ── */}
      {savedCourseId && (
        <Section
          title="Quản lý Bài giảng"
          subtitle={`Thêm và xóa bài giảng cho khóa học #${savedCourseId}.`}
        >
          {/* Add lesson form */}
          <form onSubmit={handleLessonSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Tên bài giảng *"
                value={lessonForm.title}
                onChange={(e) => setLessonForm((p) => ({ ...p, title: e.target.value }))}
                className="col-span-1 sm:col-span-1 px-4 py-2.5 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#8b0000]"
              />
              <input
                type="number"
                min="1"
                placeholder="Thứ tự *"
                value={lessonForm.order_index}
                onChange={(e) => setLessonForm((p) => ({ ...p, order_index: e.target.value }))}
                className="px-4 py-2.5 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#8b0000]"
              />
            </div>
            <div>
              <textarea
                rows={3}
                placeholder="Dán mã nhúng iframe YouTube hoặc link video trực tiếp *"
                value={lessonForm.video_url}
                onChange={(e) => setLessonForm((p) => ({ ...p, video_url: e.target.value }))}
                className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg text-sm placeholder:text-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-[#8b0000] font-mono"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Chấp nhận: mã nhúng{' '}
                <code className="text-zinc-400">&lt;iframe …&gt;</code>, link{' '}
                <code className="text-zinc-400">youtube.com/watch?v=…</code>, hoặc link rút gọn{' '}
                <code className="text-zinc-400">youtu.be/…</code>.
              </p>
            </div>
            {lessonError && <p className="text-red-500 text-xs">{lessonError}</p>}
            <button
              type="submit"
              disabled={createLessonMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {createLessonMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <PlusCircle size={16} />
              )}
              {createLessonMutation.isPending ? 'Đang thêm...' : 'Thêm bài giảng'}
            </button>
          </form>

          {/* Lessons list */}
          <div className="mt-4 rounded-xl border border-zinc-800 overflow-hidden">
            {lessons.length === 0 ? (
              <p className="px-5 py-10 text-center text-zinc-500 text-sm">
                Chưa có bài giảng nào. Hãy thêm bài giảng đầu tiên!
              </p>
            ) : (
              <ul className="divide-y divide-zinc-800">
                {lessons.map((lesson, index) => (
                  <li
                    key={lesson.lesson_id}
                    className="px-4 py-3.5 hover:bg-zinc-800 transition-colors"
                  >
                    {editingLessonId === lesson.lesson_id ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-zinc-700 text-[#c0392b] text-xs font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <input
                            type="text"
                            value={editLessonForm.title}
                            onChange={(e) => setEditLessonForm((p) => ({ ...p, title: e.target.value }))}
                            className="flex-1 px-3 py-1.5 border border-zinc-600 bg-zinc-800 text-zinc-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8b0000]"
                          />
                          <input
                            type="number"
                            min="1"
                            value={editLessonForm.order_index}
                            onChange={(e) => setEditLessonForm((p) => ({ ...p, order_index: e.target.value }))}
                            placeholder="Thứ tự"
                            className="w-20 px-3 py-1.5 border border-zinc-600 bg-zinc-800 text-zinc-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8b0000]"
                          />
                        </div>
                        <textarea
                          rows={2}
                          value={editLessonForm.video_url}
                          onChange={(e) => setEditLessonForm((p) => ({ ...p, video_url: e.target.value }))}
                          placeholder="iframe / YouTube URL"
                          className="w-full px-3 py-1.5 border border-zinc-600 bg-zinc-800 text-zinc-100 rounded-lg text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[#8b0000]"
                        />
                        {editLessonError && (
                          <p className="text-red-500 text-xs">{editLessonError}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditLessonSave(lesson.lesson_id)}
                            disabled={updateLessonMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-400 bg-green-950/30 hover:bg-green-950/60 border border-green-900/60 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {updateLessonMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            Lưu
                          </button>
                          <button
                            onClick={handleEditLessonCancel}
                            disabled={updateLessonMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <X size={12} />
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-zinc-800 text-[#c0392b] text-xs font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-200 truncate">
                            {lesson.title}
                          </p>
                          {lesson.video_url && (
                            <p className="text-xs text-zinc-500 truncate">{lesson.video_url}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleEditLessonStart(lesson)}
                          disabled={deleteLessonMutation.isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-950/30 hover:bg-blue-950/60 border border-blue-900/60 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                        >
                          <Pencil size={12} />
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteLesson(lesson)}
                          disabled={deleteLessonMutation.isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-950/30 hover:bg-red-950/60 border border-red-900/60 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                        >
                          <Trash2 size={13} />
                          Xóa
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}
