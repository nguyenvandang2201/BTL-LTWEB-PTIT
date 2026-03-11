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
        <h2 className="text-2xl font-bold text-zinc-100">Quản lý Danh mục</h2>
        <p className="text-sm text-zinc-400 mt-1">Thêm, chỉnh sửa và xóa các danh mục khóa học.</p>
      </div>

      {/* Action error banner */}
      {actionError && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-950/40 border border-red-900 text-red-400 text-sm rounded-lg">
          <span className="shrink-0 mt-0.5">⚠️</span>
          <span>{actionError}</span>
        </div>
      )}

      {/* ── Add form ── */}
      <div className="bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 p-5">
        <h3 className="text-base font-semibold text-zinc-200 mb-4 flex items-center gap-2">
          <PlusCircle size={18} className="text-[#c0392b]" />
          Thêm danh mục mới
        </h3>
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tên danh mục *"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#8b0000]"
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Mô tả (tuỳ chọn)"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#8b0000]"
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#8b0000] hover:bg-[#a01828] disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors shrink-0"
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
      <div className="bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={32} className="animate-spin text-[#c0392b]" />
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-red-500 text-sm">
            Không thể tải danh sách danh mục.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-800 text-xs uppercase text-zinc-400 border-b border-zinc-700">
                <tr>
                  <th className="px-5 py-3.5 w-16">ID</th>
                  <th className="px-5 py-3.5">Tên danh mục</th>
                  <th className="px-5 py-3.5 hidden md:table-cell">Mô tả</th>
                  <th className="px-5 py-3.5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-zinc-500">
                      Chưa có danh mục nào. Hãy thêm danh mục đầu tiên!
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.category_id} className="hover:bg-zinc-800 transition-colors">
                      <td className="px-5 py-4 text-zinc-500 font-mono text-xs">
                        #{cat.category_id}
                      </td>
                      <td className="px-5 py-4 font-medium text-zinc-200">{cat.name}</td>
                      <td className="px-5 py-4 text-zinc-400 hidden md:table-cell">
                        {cat.description || <span className="italic text-zinc-600">Không có</span>}
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
