import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

/**
 * Cấu hình kết nối tới tài khoản Cloudinary.
 *
 * Các giá trị được đọc từ biến môi trường (.env) nhằm:
 *  - Tránh hard-code thông tin nhạy cảm vào source code.
 *  - Dễ dàng chuyển đổi giữa các môi trường (local / staging / production).
 *  - Cho phép cùng một codebase trỏ tới nhiều tài khoản Cloudinary khác nhau.
 */
cloudinary.config({
  /** Tên cloud (namespace) của tài khoản Cloudinary. */
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,

  /** API Key dùng để xác thực ứng dụng với Cloudinary. */
  api_key: process.env.CLOUDINARY_API_KEY,

  /** API Secret dùng để ký / xác nhận các request quản trị lên Cloudinary. */
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Storage Cloudinary dành cho ảnh khoá học.
 *
 * `CloudinaryStorage` tích hợp với Multer, cho phép file upload đi thẳng lên
 * Cloudinary thay vì lưu tạm trên ổ đĩa của server.
 */
const imageStorage = new CloudinaryStorage({
  /** Sử dụng đối tượng cloudinary đã được cấu hình ở trên. */
  cloudinary,
  params: {
    /** Thư mục đích trên Cloudinary để phân loại và gom nhóm ảnh khoá học. */
    folder: 'courses',

    /**
     * Danh sách định dạng ảnh được phép upload.
     * Nếu người dùng upload sai định dạng, Multer / Cloudinary sẽ tự động từ chối.
     */
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

/**
 * Storage Cloudinary dành cho video bài học.
 *
 * Khác với `imageStorage`, storage này cần khai báo `resource_type = 'video'`
 * để Cloudinary xử lý metadata và chuyển mã theo pipeline video đúng cách.
 */
const videoStorage = new CloudinaryStorage({
  /** Sử dụng cùng cấu hình cloudinary đã xác thực ở trên. */
  cloudinary,
  params: {
    /** Thư mục lưu trữ video bài học trên Cloudinary. */
    folder: 'lessons',

    /**
     * Bắt buộc phải khai báo để Cloudinary nhận biết đây là tài nguyên video,
     * từ đó áp dụng pipeline xử lý (transcode, thumbnail, ...) phù hợp.
     */
    resource_type: 'video',

    /**
     * Danh sách định dạng video được phép upload.
     * Có thể bổ sung thêm nếu hệ thống cần hỗ trợ loại file mới.
     */
    allowed_formats: ['mp4', 'mov', 'avi', 'webm', 'mkv', 'm4v'],
  },
});

/**
 * Middleware Multer dùng cho endpoint upload ảnh khoá học.
 *
 * Thường được gắn vào route tạo / chỉnh sửa khoá học.
 * Khi request gửi kèm file, Multer sẽ đẩy file lên Cloudinary theo cấu hình
 * `imageStorage` và gắn thông tin kết quả vào `req.file`.
 *
 * @example
 * router.post('/courses', uploadCourseImage.single('image'), courseController.create);
 */
export const uploadCourseImage = multer({ storage: imageStorage });

/**
 * Middleware Multer dùng cho endpoint upload video bài học.
 *
 * Hoạt động tương tự `uploadCourseImage`, nhưng sử dụng `videoStorage`.
 * Kết quả upload thành công cũng được trả về qua `req.file`.
 *
 * @example
 * router.post('/lessons', uploadLessonVideo.single('video'), lessonController.create);
 */
export const uploadLessonVideo = multer({ storage: videoStorage });

/**
 * Export mặc định để giữ tính tương thích với các nơi đang import theo kiểu default.
 * Hiện tại trỏ tới middleware `uploadCourseImage`.
 */
export default uploadCourseImage;
