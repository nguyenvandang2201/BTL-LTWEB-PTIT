import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Pencil, Trash2, Loader2 } from 'lucide-react';
import { getAdminCourses, deleteCourse } from '../../services/admin.service';

const QUERY_KEY = ['admin', 'courses'];

function formatPrice(price) {
  if (!price || price === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

export default function AdminCourses() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getAdminCourses,
  });

  const courses = data?.data || data || [];

  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    onError: (err) => {
      alert(
        err?.response?.data?.message || err?.message || 'Không thể xóa khóa học.'
      );
    },
  });

  const handleDelete = (course) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa khóa học "${course.title}"?`)) return;
    deleteMutation.mutate(course.course_id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Quản lý Khóa học</h2>
          <p className="text-sm text-zinc-400 mt-1">Tạo mới, chỉnh sửa và xóa khóa học.</p>
        </div>
        <button
          onClick={() => navigate('/admin/courses/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <PlusCircle size={16} />
          Tạo khóa học mới
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-red-500 text-sm">
            Không thể tải danh sách khóa học.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5 w-14">ID</th>
                  <th className="px-5 py-3.5">Tên khóa học</th>
                  <th className="px-5 py-3.5 hidden md:table-cell">Danh mục</th>
                  <th className="px-5 py-3.5 hidden sm:table-cell">Giá</th>
                  <th className="px-5 py-3.5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                      Chưa có khóa học nào. Hãy tạo khóa học đầu tiên!
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => (
                    <tr key={course.course_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-gray-400 font-mono text-xs">
                        #{course.course_id}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {course.image_url && (
                            <img
                              src={course.image_url}
                              alt={course.title}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0 hidden sm:block"
                            />
                          )}
                          <span className="font-medium text-gray-800 line-clamp-2">
                            {course.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500 hidden md:table-cell">
                        {course.category?.name || '—'}
                      </td>
                      <td className="px-5 py-4 text-blue-600 font-semibold hidden sm:table-cell">
                        {formatPrice(course.price)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => navigate(`/admin/courses/${course.course_id}/edit`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                          >
                            <Pencil size={13} />
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(course)}
                            disabled={deleteMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={13} />
                            Xóa
                          </button>
                        </div>
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
