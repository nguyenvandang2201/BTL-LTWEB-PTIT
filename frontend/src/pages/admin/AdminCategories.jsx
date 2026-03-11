import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, PlusCircle, Loader2 } from 'lucide-react';
import { getCategories } from '../../services/admin.service';
import { createCategory, deleteCategory } from '../../services/admin.service';

const QUERY_KEY = ['admin', 'categories'];

export default function AdminCategories() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ name: '', description: '' });
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');

  // ── Fetch ─────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getCategories,
  });

  const categories = data?.data || data || [];

  // ── Create ────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setForm({ name: '', description: '' });
      setFormError('');
    },
    onError: (err) => {
      setFormError(
        err?.response?.data?.message || err?.message || 'Không thể tạo danh mục.'
      );
    },
  });

  // ── Delete ────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setActionError('');
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message || err?.message || 'Không thể xóa danh mục.';
      setActionError(msg);
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('Tên danh mục không được để trống.');
      return;
    }
    setFormError('');
    createMutation.mutate(form);
  };

  const handleDelete = (category) => {
    setActionError('');
    if (!window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${category.name}"?`)) return;
    deleteMutation.mutate(category.category_id);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Danh mục</h2>
        <p className="text-sm text-gray-500 mt-1">Thêm, chỉnh sửa và xóa các danh mục khóa học.</p>
      </div>

      {/* Action error banner */}
      {actionError && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          <span className="shrink-0 mt-0.5">⚠️</span>
          <span>{actionError}</span>
        </div>
      )}

      {/* ── Add form ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <PlusCircle size={18} className="text-blue-600" />
          Thêm danh mục mới
        </h3>
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tên danh mục *"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Mô tả (tuỳ chọn)"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg transition-colors shrink-0"
          >
            {createMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <PlusCircle size={16} />
            )}
            {createMutation.isPending ? 'Đang lưu...' : 'Lưu'}
          </button>
        </form>
        {formError && <p className="text-red-500 text-xs mt-2">{formError}</p>}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-red-500 text-sm">
            Không thể tải danh sách danh mục.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5 w-16">ID</th>
                  <th className="px-5 py-3.5">Tên danh mục</th>
                  <th className="px-5 py-3.5 hidden md:table-cell">Mô tả</th>
                  <th className="px-5 py-3.5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-gray-400">
                      Chưa có danh mục nào. Hãy thêm danh mục đầu tiên!
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.category_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-gray-400 font-mono text-xs">
                        #{cat.category_id}
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-800">{cat.name}</td>
                      <td className="px-5 py-4 text-gray-500 hidden md:table-cell">
                        {cat.description || <span className="italic text-gray-300">Không có</span>}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleDelete(cat)}
                          disabled={deleteMutation.isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={13} />
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
    </div>
  );
}
