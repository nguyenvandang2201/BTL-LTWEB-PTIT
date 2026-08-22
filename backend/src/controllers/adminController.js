// =============================================================================
// Import Prisma Client - ORM dùng để giao tiếp với cơ sở dữ liệu PostgreSQL.
// Mọi thao tác CRUD (Create, Read, Update, Delete) đều đi qua đối tượng này.
// =============================================================================
import prisma from '../config/prisma.js';
import { indexCourse, getCourseIndexStatus } from '../services/indexingService.js';

/**
 * @file adminController.js
 * @description Controller xử lý các logic nghiệp vụ dành cho quyền Admin.
 * Bao gồm quản lý khóa học, danh mục, bài giảng, quản lý học viên và thống kê hệ thống.
 */

// =============================================================================
// SECTION 1: THỐNG KÊ HỆ THỐNG (STATISTICS)
// Các API cung cấp dữ liệu tổng hợp cho Dashboard quản trị.
// =============================================================================

/**
 * API lấy danh sách 10 khóa học được mua nhiều nhất.
 * Sử dụng raw query SQL để tính toán tổng số lượt mua từ bảng mãng (enrollments).
 *
 * Lý do dùng $queryRaw thay vì Prisma ORM thông thường:
 *  - Cần dùng hàm tổng hợp COUNT() kết hợp GROUP BY phức tạp.
 *  - Cần ép kiểu ::int (PostgreSQL casting) để COUNT trả về số nguyên thay vì BigInt.
 *  - Prisma ORM thuần túy không hỗ trợ trực tiếp cú pháp casting kiểu này.
 *
 * @param {Object} req - Express Request object
 * @param {Object} res - Express Response object
 * @returns {Promise<Object>} Danh sách 10 khóa học có lượt mua cao nhất
 *   Mỗi phần tử trả về gồm: { course_id, title, total_purchases }
 *
 * @example Response 200:
 *   [
 *     { "course_id": 1, "title": "NodeJS cơ bản", "total_purchases": 42 },
 *     ...
 *   ]
 */
export const getTopPurchasedCourses = async (req, res) => {
  try {
    // Dùng raw query để giữ chính xác logic SQL thống kê top khóa học đã mua.
    // Biến topCourses dùng để chứa danh sách kết quả truy vấn trả về từ database.
    const topCourses = await prisma.$queryRaw`
      SELECT
          c.course_id,
          c.title,
          COUNT(e.enrollment_id)::int AS total_purchases
      FROM
          courses c
      JOIN
          enrollments e ON c.course_id = e.course_id
      WHERE
          e.is_paid = true
      GROUP BY
          c.course_id,
          c.title
      ORDER BY
          total_purchases DESC
      LIMIT 10;
    `;

    // Trả về HTTP 200 cùng dữ liệu topCourses cho frontend dashboard.
    return res.status(200).json(topCourses);
  } catch (error) {
    // Nếu có lỗi, trả về HTTP 500 và message lỗi để dễ debug.
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// =============================================================================
// SECTION 2: QUẢN LÝ DANH MỤC (CATEGORY MANAGEMENT)
// CRUD cho thực thể Category - dùng để phân loại các khóa học.
// Lưu ý: Danh mục có ràng buộc 1-N với khóa học (1 danh mục - nhiều khóa học).
// =============================================================================

/**
 * API tạo danh mục (Category) mới.
 * Kiểm tra trùng lặp tên danh mục trước khi tạo để tránh dữ liệu rác.
 *
 * Luồng xử lý:
 *  1. Lấy { name, description } từ req.body.
 *  2. Tra cứu DB xem đã có danh mục cùng tên chưa.
 *  3. Nếu trùng => từ chối, trả về 400.
 *  4. Nếu chưa có => tạo mới, trả về 201.
 *
 * @param {Object} req - Express Request object (chứa name, description)
 * @param {Object} res - Express Response object
 * @returns {Promise<Object>} Thông báo tạo thành công hoặc lỗi
 *
 * @example Request body:
 *   { "name": "Lập trình Web", "description": "Các khóa học về HTML, CSS, JS..." }
 */
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Kiểm tra xem danh mục đã tồn tại trong database chưa (dựa theo tên)
    const existing = await prisma.category.findFirst({ where: { name } });
    if (existing) {
      return res.status(400).json({ message: 'Tên danh mục đã tồn tại' });
    }

    // Tạo bản ghi danh mục mới trong database
    await prisma.category.create({ data: { name, description } });

    return res.status(201).json({ message: 'Thêm danh mục thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

/**
 * API cập nhật thông tin danh mục hiện có.
 *
 * Ghi chú: Không có kiểm tra trùng tên khi cập nhật (khác với createCategory).
 * Toàn bộ các trường trong req.body sẽ được truyền thẳng vào data của Prisma update.
 * Frontend cần đảm bảo chỉ gửi những trường thực sự muốn thay đổi.
 *
 * @param {Object} req - Express Request object (chứa mục data cần cập nhật)
 *   req.params.id  - ID (số nguyên) của danh mục cần sửa
 *   req.body       - Object chứa các trường cần cập nhật (name, description, ...)
 * @param {Object} res - Express Response object
 * @returns {Promise<Object>} Thông báo cập nhật thành công
 */
export const updateCategory = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Cập nhật toàn bộ các trường (field) gửi lên trong req.body
    await prisma.category.update({ where: { category_id: id }, data: req.body });

    return res.status(200).json({ message: 'Cập nhật danh mục thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

/**
 * API xóa một danh mục.
 * Ràng buộc bảo vệ (Constraint): Không cho phép xóa danh mục nếu đang có khóa học
 * thuộc về danh mục đó, để đảm bảo tính toàn vẹn dư liệu.
 *
 * Luồng xử lý:
 *  1. Parse ID từ URL params.
 *  2. Tìm danh mục trong DB, đồng thời JOIN lấy luôn danh sách khóa học con.
 *  3. Nếu không tìm thấy danh mục => 404 Not Found.
 *  4. Nếu danh mục đang có ít nhất 1 khóa học => 400 Bad Request (vi phạm ràng buộc).
 *  5. Qua được 2 bước kiểm tra => DELETE an toàn, trả về 200.
 *
 * @param {Object} req - Express Request object
 *   req.params.id - ID danh mục cần xóa
 * @param {Object} res - Express Response object
 * @returns {Promise<Object>} Thông báo xóa thành công hoặc lỗi ràng buộc
 */
export const deleteCategory = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Tìm danh mục và lấy luôn danh sách khóa học liên quan để kiểm tra ràng buộc
    const category = await prisma.category.findUnique({
      where: { category_id: id },
      include: { courses: true },
    });

    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }

    // Khởi chặn việc xóa nếu danh mục này đang chứa ít nhất 1 khóa học
    if (category.courses.length > 0) {
      return res.status(400).json({ message: 'Không thể xóa danh mục đang chứa khóa học. Vui lòng xóa khóa học trước' });
    }

    // Xóa an toàn khi điều kiện ràng buộc thỏa mãn
    await prisma.category.delete({ where: { category_id: id } });

    return res.status(200).json({ message: 'Xóa danh mục thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// =============================================================================
// SECTION 3: QUẢN LÝ KHÓA HỌC (COURSE MANAGEMENT)
// CRUD cho thực thể Course.
// Khóa học có quan hệ phụ thuộc với: Category (N-1), Lesson (1-N),
// Enrollment (1-N) và Review (1-N).
// Khi xóa khóa học phải xóa sạch toàn bộ dữ liệu con trước.
// =============================================================================

/**
 * API tạo khóa học (Course) mới.
 * Nhận thông tin từ body và đường dẫn ảnh từ file upload (Multer/Cloudinary).
 *
 * Ghi chú về req.file:
 *  - File ảnh được xử lý bởi Multer middleware (uploadCourseImage) trước khi vào controller.
 *  - Cloudinary sẽ upload ảnh và trả về URL thông qua `req.file.path`.
 *  - Nếu không có ảnh đính kèm, image_url được lưu là null.
 *
 * @param {Object} req - Express Request object
 *   req.body.title        - Tên khóa học
 *   req.body.description  - Mô tả khóa học
 *   req.body.price        - Giá khóa học (string, sẽ được ép kiểu sang Number)
 *   req.body.category_id  - ID danh mục (string, sẽ được ép kiểu sang Int)
 *   req.file              - File ảnh thumbnail (tuỳ chọn, do Multer xử lý)
 * @param {Object} res - Express Response object
 * @returns {Promise<Object>} Thông báo tạo thành công và ID của khóa học
 */
export const createCourse = async (req, res) => {
  try {
    const { title, description } = req.body;

    // Ép kiểu các trường số học để lưu vào DB
    const price = Number(req.body.price);
    const category_id = parseInt(req.body.category_id);

    // Nếu có file ảnh đính kèm (qua middleware uploadCourseImage), lấy đường dẫn trả về
    const image_url = req.file ? req.file.path : null;

    // Lưu khóa học vào DB
    const course = await prisma.course.create({
      data: { title, price, description, category_id, image_url },
    });

    return res.status(201).json({ message: 'Tạo khóa học thành công', course_id: course.course_id });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

/**
 * API lấy thông tin chi tiết một khóa học dành cho phía Admin quản trị.
 * Có join (include) các bài học và danh mục tương ứng.
 * Sắp xếp các bài học theo thứ tự `order_index`.
 *
 * Dữ liệu trả về bao gồm:
 *  - Thông tin cơ bản của khóa học (title, price, description, image_url, ...)
 *  - `category`: chỉ lấy trường `name` của danh mục
 *  - `lessons`: mảng bài giảng, sắp xếp theo order_index tăng dần
 *
 * @param {Object} req - Express Request object
 *   req.params.id - ID khóa học cần xem
 * @param {Object} res - Express Response object
 * @returns {Promise<Object>} Dữ liệu chi tiết khóa học
 */
export const getCourseAdmin = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const course = await prisma.course.findUnique({
      where: { course_id: id },
      include: {
        category: { select: { name: true } }, // Lấy tên danh mục
        lessons: { // Lấy danh sách bài giảng với điều kiện sắp xếp đúng thứ tự
          select: { lesson_id: true, title: true, video_url: true, order_index: true, content: true },
          orderBy: { order_index: 'asc' },
        },
      },
    });

    if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });

    return res.status(200).json(course);
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

/**
 * API Cập nhật thông tin của khóa học.
 * Hỗ trợ cập nhật từng phần (những trường không gửi hoặc undefined sẽ không bị ghi đè).
 *
 * Cơ chế Partial Update:
 *  - Khởi tạo object `data` với title và description (có thể undefined nếu không gửi).
 *  - Kiểm tra từng trường tùy chọn (price, category_id, image_url) trước khi gán vào data.
 *  - Dọn dẹp tất cả key có giá trị undefined khỏi data trước khi gọi Prisma update.
 *    => Đảm bảo Prisma chỉ UPDATE đúng những cột thực sự thay đổi.
 *
 * Logic xử lý ảnh (image_url):
 *  - Ưu tiên 1: Có file upload mới (req.file) => dùng URL Cloudinary mới.
 *  - Ưu tiên 2: Không có file nhưng req.body.image_url là chuỗi rỗng '' => xóa ảnh (null).
 *  - Ưu tiên 3: req.body.image_url có giá trị => giữ nguyên URL cũ đó.
 *  - Không gửi gì => không thay đổi ảnh (key không có trong data).
 *
 * @param {Object} req - Express Request object
 *   req.params.id         - ID khóa học cần cập nhật
 *   req.body.title        - (tuỳ chọn) Tên mới
 *   req.body.description  - (tuỳ chọn) Mô tả mới
 *   req.body.price        - (tuỳ chọn) Giá mới
 *   req.body.category_id  - (tuỳ chọn) ID danh mục mới
 *   req.body.image_url    - (tuỳ chọn) URL ảnh hoặc chuỗi rỗng để xóa ảnh
 *   req.file              - (tuỳ chọn) File ảnh thumbnail mới
 * @param {Object} res - Express Response object
 * @returns {Promise<Object>} Thông báo cập nhật thành công
 */
export const updateCourse = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description } = req.body;

    const data = { title, description };

    // Ép kiểu các trường khóa ngoại, số
    if (req.body.price !== undefined) data.price = Number(req.body.price);
    if (req.body.category_id !== undefined) data.category_id = parseInt(req.body.category_id);

    // Xử lý cập nhật ảnh đại diện:
    // Nếu có upload file mới => dùng đường dẫn file upload đó
    if (req.file) {
      data.image_url = req.file.path;
    } else if (req.body.image_url !== undefined) {
      // Nếu xóa ảnh thì chuyển thành null, nếu giữ nguyên dạng string thì để yên
      data.image_url = req.body.image_url === '' ? null : req.body.image_url;
    }

    // Xóa các key có giá trị `undefined` để không cập nhật những thông tin không bị thay đổi trong body
    Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);

    // Thực thi update khóa học
    await prisma.course.update({ where: { course_id: id }, data });

    return res.status(200).json({ message: 'Cập nhật khóa học thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

/**
 * API Xóa hoàn toàn một khóa học.
 * Do thiết kế schema có thể chưa cấu hình ON DELETE CASCADE hoặc để tường minh,
 * Admin cần xóa tuần tự các bản ghi phụ thuộc chứa khóa ngoại tới course_id này (Review, Enrollment, Lesson)
 * trước khi xóa khóa học.
 *
 * Thứ tự xóa bắt buộc (tránh lỗi foreign key constraint):
 *  1. reviews     (FK: course_id → courses.course_id)
 *  2. enrollments (FK: course_id → courses.course_id)
 *  3. lessons     (FK: course_id → courses.course_id)
 *  4. course      (bản ghi chính)
 *
 * Lưu ý: Nếu schema PostgreSQL đã cấu hình ON DELETE CASCADE thì các bước 1-3
 * là dư thừa nhưng không gây lỗi. Cách viết tường minh này an toàn hơn.
 *
 * @param {Object} req - Express Request object
 *   req.params.id - ID khóa học cần xóa
 * @param {Object} res - Express Response object
 * @returns {Promise<Object>} Thông báo xóa thành công
 */
export const deleteCourse = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Xác nhận khóa học thưc sự tồn tại
    const course = await prisma.course.findUnique({
      where: { course_id: id },
    });

    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học' });
    }

    // Xóa các lượt đánh giá liên quan
    await prisma.review.deleteMany({
      where: { course_id: id },
    });

    // Xóa các đăng ký khóa học của học viên
    await prisma.enrollment.deleteMany({
      where: { course_id: id },
    });

    // Xóa các bài giảng trong khóa học
    await prisma.lesson.deleteMany({
      where: { course_id: id },
    });

    // Sau khi giải quyết xong mọi phụ thuộc ngoại, tiến hành xóa khóa học đó
    await prisma.course.delete({
      where: { course_id: id },
    });

    return res.status(200).json({ message: 'Xóa khóa học thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// =============================================================================
// SECTION 4: QUẢN LÝ BÀI GIẢNG (LESSON MANAGEMENT)
// CRUD cho thực thể Lesson - bài giảng nằm bên trong một khóa học.
// Mỗi bài giảng có order_index để xác định thứ tự hiển thị trong khóa học.
// File video bắt buộc khi tạo mới, tùy chọn khi cập nhật.
// =============================================================================

/**
 * API tạo bài giảng (Lesson) mới.
 * Yêu cầu phải có file video đính kèm.
 *
 * Ghi chú về order_index:
 *  - Đây là số thứ tự của bài học trong khóa học, do Admin nhập vào thủ công.
 *  - Frontend nên hiển thị các bài học theo thứ tự tăng dần của order_index.
 *  - Không có cơ chế tự động tăng, Admin cần tự quản lý thứ tự.
 *
 * @param {Object} req - Express Request object
 *   req.body.course_id   - ID khóa học chứa bài giảng này
 *   req.body.title       - Tên bài giảng
 *   req.body.order_index - Số thứ tự hiển thị (ví dụ: 1, 2, 3...)
 *   req.file             - File video bắt buộc (xử lý bởi Multer/Cloudinary middleware)
 * @param {Object} res - Express Response object
 * @returns {Promise<Object>} Thông báo tạo thành công và dữ liệu bài giảng
 */
export const createLesson = async (req, res) => {
  try {
    const course_id = Number(req.body.course_id);
    const title = req.body.title;
    const order_index = Number(req.body.order_index); // Thứ tự hiển thị của bài học
    const content = req.body.content?.trim() || null;

    // Lấy link video từ file payload upload lên (via middleware ngầm)
    const video_url = req.file?.path;

    // Video bài giảng là bắt buộc phải có
    if (!video_url) {
      return res.status(400).json({ message: 'Vui lòng tải file video cho bài giảng.' });
    }

    // Lưu thông tin bài giảng mới vào database
    const lesson = await prisma.lesson.create({
      data: { course_id, title, video_url, order_index, content },
    });

    return res.status(201).json({ message: 'Thêm bài giảng thành công', lesson });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

/**
 * API cập nhật thông tin bài giảng.
 * Cập nhật động theo cơ chế check `undefined`.
 *
 * Cơ chế Partial Update (tương tự updateCourse):
 *  - Chỉ gán trường vào `data` nếu req.body có chứa trường đó (không phải undefined).
 *  - Nếu có file upload mới thì cập nhật video_url; nếu không thì giữ nguyên video cũ.
 *  - Sau đó lọc thêm lần nữa bằng forEach để loại bỏ undefined sót lại.
 *
 * @param {Object} req - Express Request object
 *   req.params.id            - ID bài giảng cần cập nhật
 *   req.body.title           - (tuỳ chọn) Tên mới cho bài giảng
 *   req.body.order_index     - (tuỳ chọn) Thứ tự hiển thị mới
 *   req.file                 - (tuỳ chọn) File video mới
 * @param {Object} res - Express Response object
 * @returns {Promise<Object>} Thông báo cập nhật thành công
 */
export const updateLesson = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = {};

    if (req.body.title !== undefined) data.title = req.body.title;
    if (req.body.order_index !== undefined) data.order_index = Number(req.body.order_index);
    if (req.body.content !== undefined) data.content = req.body.content?.trim() || null;

    // Cập nhật video nếu có upload video mới
    if (req.file) data.video_url = req.file.path;

    // Loại bỏ các trường undefined để Prisma không báo lỗi
    Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);

    await prisma.lesson.update({ where: { lesson_id: id }, data });

    return res.status(200).json({ message: 'Cập nhật bài giảng thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

/**
 * API xóa một bài giảng cụ thể.
 *
 * Ghi chú: Bài giảng (Lesson) hiện không có bảng con nào tham chiếu tới nó
 * (không có FK trỏ vào lesson_id từ bảng khác), nên có thể xóa trực tiếp
 * mà không cần xóa dữ liệu phụ thuộc trước như deleteCourse.
 *
 * @param {Object} req - Express Request object
 *   req.params.id - ID bài giảng cần xóa
 * @param {Object} res - Express Response object
 * @returns {Promise<Object>} Thông báo xóa thành công
 */
export const deleteLesson = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await prisma.lesson.delete({ where: { lesson_id: id } });

    return res.status(200).json({ message: 'Xóa bài giảng thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// =============================================================================
// SECTION 5: QUẢN LÝ HỌC VIÊN (STUDENT MANAGEMENT)
// Các API dành riêng cho Admin để xem và theo dõi học viên trong hệ thống.
// Chỉ truy vấn những user có role = 'student' (phân biệt với admin).
// =============================================================================

/**
 * API Lấy danh sách toàn bộ học viên.
 * Hỗ trợ sắp xếp theo thời gian (cũ nhất hoặc mới nhất).
 * Dùng phân quyền role: 'student' để lọc học viên.
 *
 * Tham số query:
 *  - ?sort=oldest  → sắp xếp theo ngày tạo tài khoản tăng dần (cũ nhất trước)
 *  - ?sort=newest  → sắp xếp theo ngày tạo tài khoản giảm dần (mới nhất trước) [mặc định]
 *
 * Các trường trả về: user_id, full_name, email, created_at
 * (Không trả về password hay các thông tin nhạy cảm khác)
 *
 * @param {Object} req - Express Request object (query.sort: 'oldest' | 'newest')
 * @param {Object} res - Express Response object
 * @returns {Promise<Object>} Danh sách thông tin cơ bản học viên
 */
export const getStudents = async (req, res) => {
  try {
    const sort = req.query.sort === 'oldest' ? 'oldest' : 'newest';

    const students = await prisma.user.findMany({
      where: { role: 'student' },
      select: { user_id: true, full_name: true, email: true, created_at: true },
      // Sắp xếp theo ngày tham gia (tạo tài khoản)
      orderBy: { created_at: sort === 'oldest' ? 'asc' : 'desc' },
    });

    return res.status(200).json(students);
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

/**
 * API Lấy chi tiết thông tin một học viên.
 * Bao gồm các thông tin cơ bản, danh sách khóa đã đăng ký (enrollments),
 * và danh sách tất cả đánh giá bình luận (reviews) của học viên này.
 *
 * Dữ liệu trả về:
 *  - Thông tin cá nhân: user_id, full_name, email, role, created_at
 *  - enrollments[]: Toàn bộ lịch sử đăng ký khóa học (kèm thông tin khóa học)
 *  - reviews[]: Toàn bộ đánh giá đã viết, sắp xếp mới nhất trước
 *    + Mỗi review gồm: review_id, course_id, rating, comment, created_at
 *    + Kèm tên khóa học (course.title) để dễ tham chiếu
 *
 * Lưu ý: Dùng findFirst thay vì findUnique vì lọc theo cả user_id VÀ role.
 * Điều này ngăn Admin tra cứu thông tin chi tiết của một Admin khác.
 *
 * @param {Object} req - Express Request object
 *   req.params.id - ID học viên cần xem chi tiết
 * @param {Object} res - Express Response object
 * @returns {Promise<Object>} Chi tiết học viên beserta lịch sử học tập
 */
export const getStudentDetail = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const student = await prisma.user.findFirst({
      where: { user_id: id, role: 'student' },
      select: {
        user_id: true,
        full_name: true,
        email: true,
        role: true,
        created_at: true,
        // Include khóa học đã đăng ký
        enrollments: {
          include: { course: true },
        },
        // Include đánh giá của sinh viên (sắp xếp mới nhất)
        reviews: {
          select: {
            review_id: true,
            course_id: true,
            rating: true,
            comment: true,
            created_at: true,
            course: {
              select: {
                course_id: true,
                title: true, // Chỉ lấy tiêu đề để tham chiếu
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ message: 'Không tìm thấy học viên' });
    }

    return res.status(200).json(student);
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// =============================================================================
// SECTION 6: QUẢN LÝ ĐÁNH GIÁ (REVIEW MODERATION)
// Admin có quyền xóa bất kỳ đánh giá/bình luận nào vi phạm tiêu chuẩn cộng đồng.
// =============================================================================

/**
 * API dọn dẹp (xóa) bình luận/đánh giá (Review) không phù hợp.
 * Thuần túy là tác vụ quản trị để kiểm duyệt nội dung.
 *
 * Ghi chú:
 *  - Đây là xóa cứng (hard delete) - dữ liệu bị xóa vĩnh viễn khỏi DB.
 *  - Không có bước xác nhận hay soft delete (đánh dấu ẩn).
 *  - Admin chịu trách nhiệm hoàn toàn khi thực hiện hành động này.
 *  - Nếu review_id không tồn tại, Prisma sẽ throw lỗi và trả về 500.
 *
 * @param {Object} req - Express Request object
 *   req.params.id - ID của review cần xóa
 * @param {Object} res - Express Response object
 * @returns {Promise<Object>} Thông báo xóa bình luận thành công
 */
// =============================================================================
// SECTION 7: DRA INDEXING
// =============================================================================

export const triggerCourseIndex = async (req, res, next) => {
  try {
    const courseId = Number(req.params.id);

    const course = await prisma.course.findUnique({
      where: { course_id: courseId },
    });

    if (!course) {
      return res.status(404).json({ message: 'Khong tim thay khoa hoc' });
    }

    const result = await indexCourse(courseId);

    return res.status(200).json({
      message: `Da index thanh cong khoa hoc "${course.title}"`,
      ...result,
    });
  } catch (error) {
    console.error('[Admin] Loi index khoa hoc:', error.message);
    next(error);
  }
};

export const getCourseIndexStatusHandler = async (req, res, next) => {
  try {
    const courseId = Number(req.params.id);
    const status = await getCourseIndexStatus(courseId);

    return res.status(200).json(status);
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await prisma.review.delete({ where: { review_id: id } });

    return res.status(200).json({ message: 'Đã xóa bình luận/đánh giá' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};
