// Trang chủ (Landing Page) của ứng dụng.
// Hiển thị các section marketing: Hero, Khóa học nổi bật, Kỹ năng,
// Lý do chọn, Các bước đăng ký, Thống kê số liệu, Testimonial, CTA Banner.
//
// Dữ liệu khóa học được fetch bằng React Query để hiển thị tối đa 6 khóa học nổi bật.
// Các dữ liệu tĩnh (skills, reasons, steps, testimonials, stats)
// được khai báo trực tiếp dưới dạng mảng constant để dễ bảo trì.

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Star, CheckCircle, PlayCircle, Award, Clock, TrendingUp, ChevronRight, Monitor, Code, Database, Globe } from 'lucide-react';
import { getCourses } from '../services/public.service';
import { resolveImageUrl } from '../utils';

function formatPrice(price) {
  if (price === 0 || price === null || price === undefined) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function CourseCard({ course }) {
  return (
    <Link
      to={`/courses/${course.course_id}`}
      className="group bg-zinc-900/70 backdrop-blur-sm rounded-xl overflow-hidden border border-zinc-800/60 hover:border-[#8b0000]/60 hover:shadow-lg hover:shadow-red-900/20 transition-all duration-300"
    >
      <div className="aspect-video w-full overflow-hidden bg-zinc-800 relative">
        <img
          src={resolveImageUrl(course.image_url) || 'https://placehold.co/640x360?text=No+Image'}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://placehold.co/640x360?text=No+Image'; }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <PlayCircle size={48} className="text-white opacity-0 group-hover:opacity-80 transition-opacity" />
        </div>
      </div>
      <div className="p-4">
        <span className="text-xs text-[#c0392b] bg-[#8b0000]/10 border border-[#8b0000]/20 px-2 py-0.5 rounded-full">
          {course.category?.name || 'Khóa học'}
        </span>
        <h3 className="font-semibold text-zinc-100 text-sm line-clamp-2 leading-snug mt-2 mb-3">
          {course.title}
        </h3>
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <span className="text-[#c0392b] font-bold text-base">
            {formatPrice(course.price)}
          </span>
          <span className="text-xs text-zinc-400 flex items-center gap-1">
            <BookOpen size={12} /> Xem ngay
          </span>
        </div>
      </div>
    </Link>
  );
}

const skills = [
  { icon: Code, text: 'Tư duy lập trình và giải quyết vấn đề' },
  { icon: Monitor, text: 'Xây dựng ứng dụng thực tế từ đầu' },
  { icon: Database, text: 'Thiết kế cơ sở dữ liệu và API' },
  { icon: Globe, text: 'Phát triển web full-stack hiện đại' },
  { icon: TrendingUp, text: 'Tối ưu hiệu suất và bảo mật ứng dụng' },
];

const reasons = [
  {
    icon: BookOpen,
    title: 'Chất lượng cao',
    desc: 'Nội dung bài giảng được xây dựng bài bản, cập nhật liên tục theo xu hướng công nghệ mới nhất.',
    color: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    iconColor: 'text-blue-400',
  },
  {
    icon: Users,
    title: 'Cung cấp chứng chỉ quan trọng',
    desc: 'Nhận chứng chỉ hoàn thành được công nhận, giúp bạn nổi bật trong mắt nhà tuyển dụng.',
    color: 'bg-green-500/10 border-green-500/20 text-green-400',
    iconColor: 'text-green-400',
  },
  {
    icon: Award,
    title: 'Bảo đảm chuyển việc làm',
    desc: 'Cam kết hỗ trợ học viên kết nối với hàng trăm doanh nghiệp đối tác tuyển dụng trực tiếp.',
    color: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    iconColor: 'text-purple-400',
  },
];

const steps = [
  { num: '01', title: 'Chọn khóa học', desc: 'Tìm kiếm và chọn khóa học phù hợp với mục tiêu của bạn.' },
  { num: '02', title: 'Thanh toán đơn giản', desc: 'Thanh toán nhanh chóng, an toàn và nhận quyền truy cập ngay lập tức.' },
  { num: '03', title: 'Bắt đầu học ngay', desc: 'Học theo tốc độ của riêng bạn, mọi lúc, mọi nơi, trên mọi thiết bị.' },
];

const testimonials = [
  {
    name: 'Nguyễn Văn Tùng',
    role: 'Backend Developer',
    content: 'Khóa học rất thực tế và dễ hiểu. Sau khi hoàn thành tôi đã tìm được công việc mơ ước chỉ trong 2 tháng.',
    rating: 5,
  },
  {
    name: 'Trần Thị Mai',
    role: 'Frontend Developer',
    content: 'Nội dung chi tiết, giảng viên nhiệt tình. Tôi đã từ zero lên hero với React chỉ trong vài tuần!',
    rating: 5,
  },
  {
    name: 'Lê Minh Hoàng',
    role: 'Fullstack Developer',
    content: 'Đây là nền tảng học lập trình tốt nhất tôi từng dùng. Giá cả hợp lý, nội dung chất lượng cao.',
    rating: 5,
  },
];

const stats = [
  { value: '3,000+', label: 'Học viên đã tốt nghiệp', icon: Users },
  { value: '30+', label: 'Khóa học đa dạng', icon: BookOpen },
  { value: '100+', label: 'Giờ nội dung video', icon: Clock },
  { value: '20,000+', label: 'Lượt học hoàn thành', icon: TrendingUp },
];

export default function Home() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  });

  const courses = data?.data || data || [];

  return (
    <div className="bg-zinc-950">

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-[#1a0000] to-zinc-950 border-b border-zinc-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#8b0000]/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <span className="inline-block bg-[#8b0000]/20 border border-[#8b0000]/30 text-[#c0392b] text-xs font-semibold px-4 py-1.5 rounded-full mb-5 uppercase tracking-widest">
                🎓 Nền tảng học trực tuyến #1
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-5">
                Học lập trình <span className="text-[#c0392b]">thực chiến</span> cùng các chuyên gia hàng đầu
              </h1>
              <p className="text-zinc-400 text-lg leading-relaxed mb-8">
                Hàng trăm khóa học chất lượng cao, được xây dựng bởi các kỹ sư thực tế. Học mọi lúc, mọi nơi và bắt đầu sự nghiệp IT của bạn ngay hôm nay.
              </p>
              <div className="flex flex-wrap gap-4 mb-10">
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-2 bg-[#8b0000] hover:bg-[#a01828] text-white font-semibold px-7 py-3.5 rounded-xl transition-colors shadow-lg shadow-red-900/30 text-sm"
                >
                  Khám phá khóa học
                  <ChevronRight size={18} />
                </Link>
              </div>
              {/* Mini stats */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Users size={16} className="text-[#c0392b]" />
                  <span><strong className="text-zinc-100">3,000+</strong> học viên</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <BookOpen size={16} className="text-[#c0392b]" />
                  <span><strong className="text-zinc-100">30+</strong> khóa học</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Star size={16} className="text-yellow-400 fill-yellow-400" />
                  <span><strong className="text-zinc-100">4.9/5</strong> đánh giá</span>
                </div>
              </div>
            </div>
            {/* Right - decorative card */}
            <div className="hidden lg:flex justify-center">
              <div className="relative w-full max-w-sm">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#8b0000] flex items-center justify-center">
                      <Monitor size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-zinc-100 font-semibold text-sm">OnlineCourse</p>
                      <p className="text-zinc-500 text-xs">Học mọi lúc, mọi nơi</p>
                    </div>
                  </div>
                  <div className="space-y-3 mb-5">
                    {['Lập trình Web', 'Lập trình Mobile', 'Data Science', 'DevOps & Cloud'].map((item) => (
                      <div key={item} className="flex items-center gap-3 bg-zinc-800/60 rounded-lg px-3 py-2.5">
                        <div className="w-2 h-2 rounded-full bg-[#c0392b] shrink-0" />
                        <span className="text-zinc-300 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                  <Link to="/courses" className="block w-full text-center bg-[#8b0000] hover:bg-[#a01828] text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
                    Bắt đầu học ngay →
                  </Link>
                </div>
                {/* Floating badge */}
                <div className="absolute -top-4 -right-4 bg-yellow-400 text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  🔥 HOT
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURED COURSES ===== */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-100">Khóa học nổi bật</h2>
            <p className="text-zinc-400 mt-1 text-sm">Được lựa chọn nhiều nhất bởi học viên</p>
          </div>
          <Link to="/courses" className="hidden sm:inline-flex items-center gap-1.5 text-sm text-[#c0392b] hover:text-[#e74c3c] font-medium transition-colors">
            Xem tất cả <ChevronRight size={16} />
          </Link>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-[#8b0000] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {isError && (
          <div className="text-center py-20 text-red-500">Không thể tải danh sách khóa học. Vui lòng thử lại sau.</div>
        )}
        {!isLoading && !isError && courses.length === 0 && (
          <div className="text-center py-20 text-zinc-500">Chưa có khóa học nào.</div>
        )}
        {!isLoading && !isError && courses.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {courses.slice(0, 6).map((course) => (
                <CourseCard key={course.course_id} course={course} />
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/courses" className="inline-flex items-center gap-2 border border-zinc-700 hover:border-[#8b0000] text-zinc-300 hover:text-white font-medium px-6 py-2.5 rounded-xl transition-colors text-sm">
                Xem tất cả khóa học <ChevronRight size={16} />
              </Link>
            </div>
          </>
        )}
      </section>

      {/* ===== SKILLS SECTION ===== */}
      <section className="bg-zinc-900 border-y border-zinc-800 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-zinc-100 mb-3">
                Những kỹ năng mà khóa học <span className="text-[#c0392b]">mang lại</span> cho học viên
              </h2>
              <p className="text-zinc-400 mb-8 leading-relaxed">
                Chương trình học được thiết kế bởi các kỹ sư công nghệ giàu kinh nghiệm, đảm bảo bạn nắm vững kỹ năng thực tế được thị trường lao động yêu cầu.
              </p>
              <ul className="space-y-4">
                {skills.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#8b0000]/20 border border-[#8b0000]/30 flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-[#c0392b]" />
                    </div>
                    <span className="text-zinc-300 text-sm">{text}</span>
                  </li>
                ))}
              </ul>
              <Link to="/courses" className="inline-flex items-center gap-2 mt-8 bg-[#8b0000] hover:bg-[#a01828] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
                Xem Chi Tiết <ChevronRight size={16} />
              </Link>
            </div>
            {/* Right visual */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Code, label: 'Lập trình', count: '15+ khóa', color: 'from-blue-900/40 to-blue-800/20 border-blue-800/40' },
                { icon: Globe, label: 'Web Dev', count: '10+ khóa', color: 'from-green-900/40 to-green-800/20 border-green-800/40' },
                { icon: Database, label: 'Database', count: '5+ khóa', color: 'from-purple-900/40 to-purple-800/20 border-purple-800/40' },
                { icon: Monitor, label: 'Mobile', count: '8+ khóa', color: 'from-orange-900/40 to-orange-800/20 border-orange-800/40' },
              ].map(({ icon: Icon, label, count, color }) => (
                <div key={label} className={`bg-gradient-to-br ${color} border rounded-xl p-5 flex flex-col items-center text-center gap-2`}>
                  <Icon size={28} className="text-zinc-300" />
                  <p className="font-semibold text-zinc-100 text-sm">{label}</p>
                  <p className="text-zinc-500 text-xs">{count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHY US ===== */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-100 mb-3">
            Tại sao bạn nên học với <span className="text-[#c0392b]">OnlineCourse</span>?
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto text-sm">
            Chúng tôi cam kết mang đến trải nghiệm học tập tốt nhất, giúp bạn đạt được mục tiêu sự nghiệp nhanh nhất.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reasons.map(({ icon: Icon, title, desc, color, iconColor }) => (
            <div key={title} className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors`}>
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${color}`}>
                <Icon size={22} className={iconColor} />
              </div>
              <h3 className="font-bold text-zinc-100 mb-2">{title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== STEPS ===== */}
      <section className="bg-gradient-to-r from-[#1a0000] via-zinc-900 to-[#1a0000] border-y border-zinc-800 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-100 mb-3">Các bước đăng ký học?</h2>
            <p className="text-zinc-400 text-sm">Chỉ 3 bước đơn giản để bắt đầu hành trình học tập của bạn</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {steps.map((step, i) => (
              <div key={step.num} className="flex flex-col items-center text-center relative">
                <div className="w-16 h-16 rounded-2xl bg-[#8b0000] text-white text-2xl font-extrabold flex items-center justify-center mb-5 shadow-lg shadow-red-900/30">
                  {step.num}
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+40px)] right-[calc(-50%+40px)] h-0.5 bg-gradient-to-r from-[#8b0000]/50 to-zinc-700" />
                )}
                <h3 className="font-bold text-zinc-100 mb-2">{step.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(({ value, label, icon: Icon }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
              <Icon size={28} className="text-[#c0392b] mx-auto mb-3" />
              <p className="text-3xl font-extrabold text-zinc-100 mb-1">{value}</p>
              <p className="text-zinc-400 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="bg-zinc-900 border-y border-zinc-800 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-100 mb-3">Cảm nhận của học viên</h2>
            <p className="text-zinc-400 text-sm">Hàng nghìn học viên đã thay đổi sự nghiệp nhờ OnlineCourse</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} size={14} className={s <= t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-600'} />
                  ))}
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed mb-5">"{t.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#8b0000] text-white flex items-center justify-center text-sm font-bold uppercase shrink-0">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-zinc-100 font-semibold text-sm">{t.name}</p>
                    <p className="text-zinc-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-[#8b0000] via-[#a01828] to-[#8b0000] rounded-3xl p-10 md:p-14 text-center shadow-2xl shadow-red-900/20">
          <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
            Tham gia học tập và phát triển kỹ năng lập trình của bạn ngay hôm nay!
          </h2>
          <p className="text-red-200 text-sm md:text-base mb-8 max-w-xl mx-auto">
            Chúng tôi cam kết giúp bạn kết nối với 1 công ty công nghệ trong vòng 6 tháng sau khi hoàn thành khóa học.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 bg-white text-[#8b0000] font-bold px-8 py-3.5 rounded-xl hover:bg-red-50 transition-colors text-sm shadow-lg"
            >
              Xem tất cả khóa học <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

