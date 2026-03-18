import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Trash2, Loader2, ArrowLeft, CheckCircle2, Pencil, Check, X, Upload, ImageOff } from 'lucide-react';
import { resolveImageUrl } from '../../utils';
import {
  getCategories,
  createCourse,
  updateCourse,
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
  const [imageFile, setImageFile] = useState(null);       // File object được chọn
  const [imagePreview, setImagePreview] = useState(null); // Object URL để preview
  const [removeImage, setRemoveImage] = useState(false);  // Xóa ảnh hiện có
  const formInitialized = useRef(false);
  const imageInputRef = useRef(null);

  // ── Lesson form state ─────────────────────────────────────
  const [lessonForm, setLessonForm] = useState({ title: '', order_index: '' });
  const [lessonError, setLessonError] = useState('');
  const [lessonVideoFile, setLessonVideoFile] = useState(null);
  const lessonVideoInputRef = useRef(null);

  const [editingLessonId, setEditingLessonId] = useState(null);
  const [editLessonForm, setEditLessonForm] = useState({ title: '', order_index: '' });
  const [editLessonError, setEditLessonError] = useState('');
  const [editLessonVideoFile, setEditLessonVideoFile] = useState(null);
  const editLessonVideoInputRef = useRef(null);

  // ── Fetch categories ──────────────────────────────────────
  const { data: catData } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: getCategories,
  });
  const categories = catData?.data || catData || [];

  // ── Cleanup object URL tránh memory leak ─────────────────
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // ── Fetch lessons (và full course info khi edit) ──────────
  const { data: lessonsData, refetch: refetchLessons } = useQuery({
    queryKey: ['admin', 'lessons', savedCourseId],
    queryFn: () => getAdminLessons(savedCourseId),
    enabled: !!savedCourseId,
  });
  const lessons = lessonsData?.lessons || [];

  // In edit mode: khởi tạo form từ course detail trả về bởi admin endpoint
  useEffect(() => {
    if (!isEdit || !lessonsData || formInitialized.current) return;
    formInitialized.current = true;
    setCourseForm({
      title: lessonsData.title || '',
      price: lessonsData.price ?? '',
      category_id: lessonsData.category_id ?? '',
      description: lessonsData.description || '',
      image_url: lessonsData.image_url || '',
    });
  }, [isEdit, lessonsData]);

  // ── Create / Update course ────────────────────────────────
  const courseMutation = useMutation({
    mutationFn: (data) =>
      isEdit ? updateCourse(Number(id), data) : createCourse(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'lessons', savedCourseId] });
      setCourseError('');
      setImageFile(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      setRemoveImage(false);
      if (isEdit) {
        // Cho phép effect re-init form sau khi refetch để cập nhật image_url mới
        formInitialized.current = false;
      } else {
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
      setLessonForm({ title: '', order_index: '' });
      setLessonVideoFile(null);
      if (lessonVideoInputRef.current) lessonVideoInputRef.current.value = '';
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

    const fd = new FormData();
    fd.append('title', courseForm.title);
    fd.append('price', courseForm.price === '' ? '0' : String(courseForm.price));
    if (courseForm.category_id) fd.append('category_id', String(courseForm.category_id));
    if (courseForm.description) fd.append('description', courseForm.description);
    if (imageFile) {
      fd.append('image', imageFile);
    } else if (isEdit && removeImage) {
      fd.append('image_url', ''); // signal backend to clear the image
    }

    courseMutation.mutate(fd);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false); // chọn ảnh mới → hủy trạng thái xóa ảnh cũ
  };

  const handleClearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleRemoveExistingImage = () => {
    setCourseForm((p) => ({ ...p, image_url: '' }));
    setRemoveImage(true);
  };

  const handleUndoRemoveImage = () => {
    setCourseForm((p) => ({ ...p, image_url: lessonsData?.image_url || '' }));
    setRemoveImage(false);
  };

  const handleLessonSubmit = (e) => {
    e.preventDefault();
    if (!lessonForm.title.trim()) {
      setLessonError('Tên bài giảng không được để trống.');
      return;
    }
    if (!lessonVideoFile) {
      setLessonError('Vui lòng tải file video cho bài giảng.');
      return;
    }
    if (!lessonForm.order_index) {
      setLessonError('Thứ tự bài giảng không được để trống.');
      return;
    }
    const fd = new FormData();
    fd.append('course_id', String(savedCourseId));
    fd.append('title', lessonForm.title);
    fd.append('order_index', String(Number(lessonForm.order_index)));
    fd.append('video', lessonVideoFile);

    createLessonMutation.mutate(fd);
  };

  const handleLessonVideoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLessonVideoFile(file);
    setLessonError('');
  };

  const handleClearLessonVideoFile = () => {
    setLessonVideoFile(null);
    if (lessonVideoInputRef.current) lessonVideoInputRef.current.value = '';
  };

  const handleDeleteLesson = (lesson) => {
    if (!window.confirm(`Xóa bài giảng "${lesson.title}"?`)) return;
    deleteLessonMutation.mutate(lesson.lesson_id);
  };

  const handleEditLessonStart = (lesson) => {
    setEditingLessonId(lesson.lesson_id);
    setEditLessonForm({
      title: lesson.title,
      order_index: lesson.order_index ?? '',
    });
    setEditLessonVideoFile(null);
    if (editLessonVideoInputRef.current) editLessonVideoInputRef.current.value = '';
    setEditLessonError('');
  };

  const handleEditLessonCancel = () => {
    setEditingLessonId(null);
    setEditLessonVideoFile(null);
    if (editLessonVideoInputRef.current) editLessonVideoInputRef.current.value = '';
    setEditLessonError('');
  };

  const handleEditLessonSave = (id) => {
    if (!editLessonForm.title.trim()) {
      setEditLessonError('Tên bài giảng không được để trống.');
      return;
    }
    const fd = new FormData();
    fd.append('title', editLessonForm.title);
    if (editLessonForm.order_index !== '') {
      fd.append('order_index', String(Number(editLessonForm.order_index)));
    }
    if (editLessonVideoFile) {
      fd.append('video', editLessonVideoFile);
    }

    updateLessonMutation.mutate({ id, data: fd });
  };

  const handleEditLessonVideoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditLessonVideoFile(file);
    setEditLessonError('');
  };

  const handleClearEditLessonVideoFile = () => {
    setEditLessonVideoFile(null);
    if (editLessonVideoInputRef.current) editLessonVideoInputRef.current.value = '';
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

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Ảnh bìa
            </label>

            <div className="rounded-lg border border-zinc-700 bg-zinc-800/40 p-3 space-y-3">
              <div className="flex items-center gap-3">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="preview mới"
                    className="h-14 w-24 rounded-md object-cover border border-zinc-700 shrink-0"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                ) : courseForm.image_url ? (
                  <img
                    src={resolveImageUrl(courseForm.image_url)}
                    alt="ảnh hiện tại"
                    className="h-14 w-24 rounded-md object-cover border border-zinc-700 shrink-0"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                ) : (
                  <div className="h-14 w-24 rounded-md border border-dashed border-zinc-700 bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                    <ImageOff size={16} />
                  </div>
                )}

                <div className="min-w-0">
                  <p className="text-sm text-zinc-300">
                    {imagePreview
                      ? 'Đã chọn ảnh mới'
                      : removeImage
                      ? 'Ảnh sẽ bị xóa khi lưu'
                      : courseForm.image_url
                      ? 'Đang dùng ảnh hiện tại'
                      : 'Chưa có ảnh bìa'}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {imageFile?.name || 'Hỗ trợ JPG, PNG, WebP'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-medium rounded-md cursor-pointer transition-colors border border-zinc-600">
                  <Upload size={14} />
                  Chọn ảnh
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>

                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-zinc-600 text-zinc-300 hover:bg-zinc-700 text-sm rounded-md transition-colors"
                  >
                    <X size={14} />
                    Bỏ ảnh mới
                  </button>
                )}

                {!imagePreview && isEdit && courseForm.image_url && !removeImage && (
                  <button
                    type="button"
                    onClick={handleRemoveExistingImage}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-red-800 text-red-300 hover:bg-red-950/40 text-sm rounded-md transition-colors"
                  >
                    <X size={14} />
                    Xóa ảnh hiện tại
                  </button>
                )}

                {removeImage && !imagePreview && (
                  <button
                    type="button"
                    onClick={handleUndoRemoveImage}
                    className="text-sm text-zinc-400 hover:text-zinc-200 underline underline-offset-2"
                  >
                    Hoàn tác
                  </button>
                )}
              </div>
            </div>
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
      {!isEdit && savedCourseId && (
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
              <div className="mt-2 rounded-lg border border-zinc-700 bg-zinc-800/40 p-3 space-y-2">
                <p className="text-xs text-zinc-500">
                  Tải file video trực tiếp từ máy tính.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-medium rounded-md cursor-pointer transition-colors border border-zinc-600">
                    <Upload size={14} />
                    Chọn video
                    <input
                      ref={lessonVideoInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/x-msvideo"
                      className="hidden"
                      onChange={handleLessonVideoFileChange}
                    />
                  </label>
                  {lessonVideoFile && (
                    <button
                      type="button"
                      onClick={handleClearLessonVideoFile}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-zinc-600 text-zinc-300 hover:bg-zinc-700 text-sm rounded-md transition-colors"
                    >
                      <X size={14} />
                      Bỏ file
                    </button>
                  )}
                  <span className="text-xs text-zinc-400 truncate max-w-[260px]">
                    {lessonVideoFile ? lessonVideoFile.name : 'Chưa chọn file video'}
                  </span>
                </div>
              </div>
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
                        <div className="rounded-lg border border-zinc-700 bg-zinc-800/40 p-2.5 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs font-medium rounded-md cursor-pointer transition-colors border border-zinc-600">
                              <Upload size={12} />
                              Chọn video mới
                              <input
                                ref={editLessonVideoInputRef}
                                type="file"
                                accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/x-msvideo"
                                className="hidden"
                                onChange={handleEditLessonVideoFileChange}
                              />
                            </label>
                            {editLessonVideoFile && (
                              <button
                                type="button"
                                onClick={handleClearEditLessonVideoFile}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-zinc-600 text-zinc-300 hover:bg-zinc-700 text-xs rounded-md transition-colors"
                              >
                                <X size={12} />
                                Bỏ file
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {editLessonVideoFile ? `Đã chọn: ${editLessonVideoFile.name}` : 'Giữ video hiện tại nếu không chọn file mới'}
                          </p>
                        </div>
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
