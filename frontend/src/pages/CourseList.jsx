import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getCourses, getCategories } from '../services/public.service';
import { resolveImageUrl } from '../utils';

function formatPrice(price) {
  if (price === 0 || price === null || price === undefined) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function CourseCard({ course }) {
  return (
    <Link
      to={`/courses/${course.course_id}`}
      className="group bg-zinc-900/70 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-xl hover:shadow-red-900/20 transition-all overflow-hidden border border-zinc-800/60 hover:border-[#8b0000]/50"
    >
      <div className="aspect-video w-full overflow-hidden bg-zinc-800">
        <img
          src={resolveImageUrl(course.image_url) || 'https://placehold.co/640x360?text=No+Image'}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://placehold.co/640x360?text=No+Image'; }}
        />
      </div>
      <div className="p-4">
        <span className="text-xs text-[#c0392b] bg-[#8b0000]/10 border border-[#8b0000]/20 px-2 py-0.5 rounded-full">
          {course.category?.name || 'Khóa học'}
        </span>
        <h3 className="font-semibold text-zinc-100 text-base line-clamp-2 leading-snug mt-2 mb-3">
          {course.title}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-[#c0392b] font-bold text-sm">
            {formatPrice(course.price)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function CourseList() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const { data: coursesData, isLoading, isError } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const courses = coursesData?.data || coursesData || [];
  const categories = categoriesData?.data || categoriesData || [];

  const filtered = courses.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory
      ? c.category_id === Number(selectedCategory)
      : true;
    return matchSearch && matchCategory;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 page-enter">
      <h1 className="text-3xl font-bold text-zinc-100 mb-1">Danh sách khóa học</h1>
      <p className="text-zinc-400 mb-8">Tìm kiếm và khám phá các khóa học phù hợp với bạn.</p>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm kiếm khóa học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-zinc-700 bg-zinc-900 text-zinc-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8b0000] placeholder:text-zinc-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2.5 border border-zinc-700 rounded-lg text-sm bg-zinc-900 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#8b0000]"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((cat) => (
            <option key={cat.category_id} value={cat.category_id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#8b0000] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div className="text-center py-20 text-red-500">
          Không thể tải danh sách khóa học. Vui lòng thử lại sau.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <p className="text-sm text-zinc-500 mb-4">{filtered.length} khóa học</p>
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">
              Không có khóa học nào phù hợp với tìm kiếm.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filtered.map((course) => (
                <CourseCard key={course.course_id} course={course} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

