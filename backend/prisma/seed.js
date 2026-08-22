/**
 * @file seed.js
 * @description Script khởi tạo dữ liệu mẫu cho cơ sở dữ liệu.
 *
 * Script được thiết kế **idempotent**: có thể chạy lại nhiều lần mà không tạo
 * bản ghi trùng lặp. Với những bảng có ràng buộc unique (users.email) thì dùng
 * `upsert`; với những bảng không có unique key phù hợp (categories, courses,
 * lessons) thì kiểm tra tồn tại trước khi tạo.
 *
 * Cách chạy:
 *   npm run seed          (tương đương: npx prisma db seed)
 *
 * Dữ liệu được tạo:
 *   - 1 tài khoản quản trị viên và 2 tài khoản học viên.
 *   - 4 danh mục khoá học.
 *   - 6 khoá học kèm bài giảng mẫu.
 *   - Một số enrollment (đã thanh toán) và review để dashboard có dữ liệu hiển thị.
 *
 * CẢNH BÁO: Mật khẩu mặc định trong file này chỉ dành cho môi trường phát triển.
 * Tuyệt đối không chạy seed với dữ liệu này trên môi trường production.
 */

import bcrypt from 'bcrypt';
import prisma from '../src/config/prisma.js';

/** Số vòng salt của bcrypt, giữ đồng bộ với authController. */
const SALT_ROUNDS = 10;

/** Video mẫu công khai, dùng làm placeholder cho bài giảng khi seed. */
const SAMPLE_VIDEO =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

/**
 * Danh sách tài khoản mẫu.
 * Mật khẩu để ở dạng plain text tại đây và sẽ được hash trước khi ghi vào CSDL.
 */
const USERS = [
  { full_name: 'Quản Trị Viên', email: 'admin@ptit.edu.vn', password: 'Admin@123', role: 'admin' },
  { full_name: 'Nguyễn Văn An', email: 'an.nguyen@ptit.edu.vn', password: 'Student@123', role: 'student' },
  { full_name: 'Trần Thị Bình', email: 'binh.tran@ptit.edu.vn', password: 'Student@123', role: 'student' },
];

/**
 * Cây dữ liệu danh mục → khoá học → bài giảng.
 * Cấu trúc lồng nhau giúp seed theo đúng thứ tự phụ thuộc khoá ngoại.
 */
const CATALOG = [
  {
    name: 'Lập trình Web',
    description: 'Các khoá học về phát triển ứng dụng web từ cơ bản đến nâng cao.',
    courses: [
      {
        title: 'HTML & CSS cho người mới bắt đầu',
        description:
          'Nắm vững cấu trúc HTML ngữ nghĩa, CSS Flexbox/Grid và kỹ thuật responsive để tự tay dựng giao diện web hoàn chỉnh.',
        price: 299000,
        lessons: [
          'Giới thiệu HTML và cấu trúc tài liệu',
          'Thẻ ngữ nghĩa và biểu mẫu',
          'CSS Selector và Box Model',
          'Dàn trang với Flexbox',
          'Thiết kế responsive với Media Query',
        ],
      },
      {
        title: 'JavaScript hiện đại (ES6+)',
        description:
          'Làm chủ cú pháp ES6+, bất đồng bộ với Promise/async-await và thao tác DOM để xây dựng ứng dụng web tương tác.',
        price: 499000,
        lessons: [
          'Biến, kiểu dữ liệu và scope',
          'Hàm, closure và arrow function',
          'Thao tác DOM và xử lý sự kiện',
          'Promise và async/await',
          'Module ES6 và công cụ build',
        ],
      },
      {
        title: 'React từ cơ bản đến thực chiến',
        description:
          'Xây dựng ứng dụng React hoàn chỉnh với Hooks, React Router và React Query, kèm dự án cuối khoá.',
        price: 799000,
        lessons: [
          'Component và JSX',
          'State, Props và luồng dữ liệu',
          'useEffect và vòng đời component',
          'Định tuyến với React Router',
          'Quản lý dữ liệu server với React Query',
          'Dự án cuối khoá: Trang thương mại điện tử',
        ],
      },
    ],
  },
  {
    name: 'Backend & Cơ sở dữ liệu',
    description: 'Xây dựng API, thiết kế cơ sở dữ liệu và triển khai hệ thống phía máy chủ.',
    courses: [
      {
        title: 'Node.js & Express RESTful API',
        description:
          'Thiết kế và triển khai REST API chuẩn mực với Express 5, xác thực JWT, validate dữ liệu và xử lý lỗi tập trung.',
        price: 699000,
        lessons: [
          'Tổng quan Node.js và mô hình bất đồng bộ',
          'Routing và middleware trong Express',
          'Xác thực với JWT',
          'Validate dữ liệu đầu vào bằng Zod',
          'Xử lý lỗi tập trung và logging',
        ],
      },
      {
        title: 'PostgreSQL & Prisma ORM',
        description:
          'Thiết kế lược đồ quan hệ, viết truy vấn hiệu quả và quản lý migration an toàn với Prisma ORM.',
        price: 599000,
        lessons: [
          'Mô hình quan hệ và chuẩn hoá dữ liệu',
          'Truy vấn SQL nền tảng',
          'Prisma Schema và migration',
          'Quan hệ 1-n, n-n trong Prisma',
          'Tối ưu truy vấn và đánh index',
        ],
      },
    ],
  },
  {
    name: 'Khoa học dữ liệu',
    description: 'Phân tích dữ liệu, trực quan hoá và các mô hình học máy nền tảng.',
    courses: [
      {
        title: 'Python cho phân tích dữ liệu',
        description:
          'Sử dụng Pandas, NumPy và Matplotlib để làm sạch, phân tích và trực quan hoá dữ liệu thực tế.',
        price: 549000,
        lessons: [
          'Python cơ bản cho dữ liệu',
          'Làm việc với NumPy',
          'Xử lý bảng dữ liệu với Pandas',
          'Trực quan hoá với Matplotlib',
        ],
      },
    ],
  },
  {
    name: 'Kỹ năng mềm',
    description: 'Các kỹ năng bổ trợ giúp lập trình viên làm việc hiệu quả trong đội nhóm.',
    courses: [],
  },
];

/**
 * @function seedUsers
 * @description Tạo hoặc cập nhật các tài khoản mẫu.
 *
 * Dùng `upsert` theo email (trường unique) nên chạy lại nhiều lần vẫn an toàn.
 *
 * @returns {Promise<Array<object>>} Danh sách user đã được ghi vào CSDL.
 */
const seedUsers = async () => {
  const users = [];

  for (const user of USERS) {
    const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);

    const record = await prisma.user.upsert({
      where: { email: user.email },
      // Cập nhật tên và vai trò để seed lại luôn đưa dữ liệu về trạng thái chuẩn.
      update: { full_name: user.full_name, role: user.role },
      create: {
        full_name: user.full_name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
      },
    });

    users.push(record);
  }

  console.log(`[seed] Đã tạo/cập nhật ${users.length} tài khoản.`);
  return users;
};

/**
 * @function seedCatalog
 * @description Tạo danh mục, khoá học và bài giảng theo cây dữ liệu `CATALOG`.
 *
 * Vì `categories.name` và `courses.title` không có ràng buộc unique trong schema,
 * hàm này chủ động `findFirst` trước khi `create` để tránh nhân bản dữ liệu
 * mỗi lần chạy lại seed.
 *
 * @returns {Promise<Array<object>>} Danh sách khoá học tồn tại sau khi seed.
 */
const seedCatalog = async () => {
  const courses = [];

  for (const category of CATALOG) {
    // Tìm danh mục theo tên; nếu chưa có thì tạo mới.
    let categoryRecord = await prisma.category.findFirst({
      where: { name: category.name },
    });

    if (!categoryRecord) {
      categoryRecord = await prisma.category.create({
        data: { name: category.name, description: category.description },
      });
    }

    for (const course of category.courses) {
      // Mỗi khoá học được nhận diện bằng cặp (tiêu đề, danh mục).
      let courseRecord = await prisma.course.findFirst({
        where: { title: course.title, category_id: categoryRecord.category_id },
      });

      if (!courseRecord) {
        courseRecord = await prisma.course.create({
          data: {
            category_id: categoryRecord.category_id,
            title: course.title,
            description: course.description,
            price: course.price,
            image_url: `https://placehold.co/600x400/1e293b/ffffff?text=${encodeURIComponent(
              course.title
            )}`,
          },
        });
      }

      // Chỉ seed bài giảng khi khoá học chưa có bài nào, tránh tạo trùng.
      const lessonCount = await prisma.lesson.count({
        where: { course_id: courseRecord.course_id },
      });

      if (lessonCount === 0) {
        await prisma.lesson.createMany({
          data: course.lessons.map((title, index) => ({
            course_id: courseRecord.course_id,
            title: `Bài ${index + 1}: ${title}`,
            video_url: SAMPLE_VIDEO,
            order_index: index + 1,
          })),
        });
      }

      courses.push(courseRecord);
    }
  }

  console.log(
    `[seed] Đã tạo/cập nhật ${CATALOG.length} danh mục và ${courses.length} khoá học kèm bài giảng.`
  );
  return courses;
};

/**
 * @function seedEnrollmentsAndReviews
 * @description Tạo dữ liệu ghi danh và đánh giá mẫu cho các tài khoản học viên.
 *
 * Mỗi học viên được ghi danh (đã thanh toán) vào 2 khoá học và để lại đánh giá,
 * giúp trang "Khoá học của tôi" và dashboard thống kê có dữ liệu hiển thị ngay
 * sau khi seed.
 *
 * @param {Array<object>} users   - Danh sách user đã seed.
 * @param {Array<object>} courses - Danh sách khoá học đã seed.
 * @returns {Promise<void>}
 */
const seedEnrollmentsAndReviews = async (users, courses) => {
  /** Chỉ học viên mới được ghi danh; tài khoản admin bị loại trừ. */
  const students = users.filter((user) => user.role === 'student');

  /** Nội dung đánh giá mẫu, gán luân phiên cho từng lượt ghi danh. */
  const comments = [
    'Khoá học rất dễ hiểu, giảng viên trình bày mạch lạc và có nhiều ví dụ thực tế.',
    'Nội dung bám sát thực tế, sau khi học mình đã tự làm được dự án nhỏ.',
    'Chất lượng video tốt, bài tập vừa sức. Mong có thêm phần nâng cao.',
    'Kiến thức nền tảng chắc chắn, rất đáng tiền cho người mới bắt đầu.',
  ];

  let enrollmentCount = 0;
  let reviewCount = 0;

  for (const [studentIndex, student] of students.entries()) {
    // Mỗi học viên nhận 2 khoá học, lệch nhau theo chỉ số để dữ liệu đa dạng hơn.
    const selectedCourses = courses.slice(studentIndex, studentIndex + 2);

    for (const [courseIndex, course] of selectedCourses.entries()) {
      const existingEnrollment = await prisma.enrollment.findFirst({
        where: { user_id: student.user_id, course_id: course.course_id },
      });

      if (!existingEnrollment) {
        await prisma.enrollment.create({
          data: {
            user_id: student.user_id,
            course_id: course.course_id,
            is_paid: true,
          },
        });
        enrollmentCount += 1;
      }

      const existingReview = await prisma.review.findFirst({
        where: { user_id: student.user_id, course_id: course.course_id },
      });

      if (!existingReview) {
        await prisma.review.create({
          data: {
            user_id: student.user_id,
            course_id: course.course_id,
            // Điểm dao động 4–5 sao để dữ liệu thống kê trông tự nhiên.
            rating: 4 + ((studentIndex + courseIndex) % 2),
            comment: comments[(studentIndex + courseIndex) % comments.length],
          },
        });
        reviewCount += 1;
      }
    }
  }

  console.log(
    `[seed] Đã tạo ${enrollmentCount} lượt ghi danh và ${reviewCount} đánh giá.`
  );
};

/**
 * @function main
 * @description Điều phối toàn bộ quy trình seed theo đúng thứ tự phụ thuộc khoá ngoại.
 * @returns {Promise<void>}
 */
const main = async () => {
  console.log('[seed] Bắt đầu khởi tạo dữ liệu mẫu...\n');

  const users = await seedUsers();
  const courses = await seedCatalog();
  await seedEnrollmentsAndReviews(users, courses);

  console.log('\n[seed] Hoàn tất. Tài khoản đăng nhập thử:');
  console.log('  - Quản trị viên : admin@ptit.edu.vn / Admin@123');
  console.log('  - Học viên      : an.nguyen@ptit.edu.vn / Student@123');
};

main()
  .catch((error) => {
    console.error('[seed] Seed thất bại:', error);
    // Thoát với mã lỗi khác 0 để CI/CD nhận biết bước seed đã thất bại.
    process.exit(1);
  })
  .finally(async () => {
    // Luôn đóng connection pool để tiến trình Node không bị treo.
    await prisma.$disconnect();
  });
