import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getCourses, getCategories } from '../services/public.service';

function formatPrice(price) {
  if (price === 0 || price === null || price === undefined) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function CourseCard({ course }) {
  return (
    <Link
      to={`/courses/${course.course_id}`}
      className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100"
    >
      <div className="aspect-video w-full overflow-hidden bg-gray-100">
        <img
          src={course.image_url || 'https://placehold.co/640x360?text=No+Image'}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {course.category?.name || 'Khóa học'}
        </span>
        <h3 className="font-semibold text-gray-800 text-base line-clamp-2 leading-snug mt-2 mb-3">
          {course.title}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-blue-600 font-bold text-sm">
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
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-1">Danh sách khóa học</h1>
      <p className="text-gray-500 mb-8">Tìm kiếm và khám phá các khóa học phù hợp với bạn.</p>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm khóa học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div className="text-center py-20 text-red-500">
          Không thể tải danh sách khóa học. Vui lòng thử lại sau.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <p className="text-sm text-gray-400 mb-4">{filtered.length} khóa học</p>
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
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

