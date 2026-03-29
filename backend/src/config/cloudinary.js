import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Cau hinh ket noi toi tai khoan Cloudinary.
// Gia tri duoc doc tu bien moi truong de:
// 1) Tranh hard-code thong tin nhay cam trong source code.
// 2) De dang doi qua cac moi truong (local/staging/production).
// 3) Dam bao cung mot codebase nhung co the tro toi nhieu tai khoan cloud khac nhau.
cloudinary.config({
  // Ten cloud (namespace) cua tai khoan Cloudinary.
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  // API key de xac thuc ung dung voi Cloudinary.
  api_key: process.env.CLOUDINARY_API_KEY,
  // API secret de ky/xac nhan cac request quan tri len Cloudinary.
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage cho anh khoa hoc.
// CloudinaryStorage tich hop voi multer, giup file upload di thang len Cloudinary
// thay vi luu tam tren o dia server.
const imageStorage = new CloudinaryStorage({
  // Su dung doi tuong cloudinary da duoc config ben tren.
  cloudinary,
  params: {
    // Thu muc dich tren Cloudinary de gom nhom anh khoa hoc.
    folder: 'courses',
    // Gioi han dinh dang file anh hop le.
    // Neu upload sai dinh dang, multer/cloudinary se tu choi file.
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

// Storage cho video bai hoc.
// Khac voi imageStorage, storage nay can khai bao resource_type = 'video'
// de Cloudinary xu ly metadata/chuyen doi theo pipeline video.
const videoStorage = new CloudinaryStorage({
  // Su dung cung cau hinh cloudinary da xac thuc.
  cloudinary,
  params: {
    // Thu muc luu video bai hoc tren Cloudinary.
    folder: 'lessons',
    // Bat buoc de Cloudinary nhan biet day la tai nguyen video.
    resource_type: 'video',
    // Danh sach dinh dang video duoc phep upload.
    // Co the bo sung them neu he thong can ho tro loai file moi.
    allowed_formats: ['mp4', 'mov', 'avi', 'webm', 'mkv', 'm4v'],
  },
});

// Middleware multer cho endpoint upload anh khoa hoc.
// Thuong duoc dung trong route/controller tao/sua course.
// Khi request toi endpoint kem file, multer se dua file len Cloudinary
// theo cau hinh imageStorage va gan ket qua vao req.file.
export const uploadCourseImage = multer({ storage: imageStorage });

// Middleware multer cho endpoint upload video bai hoc.
// Tuong tu uploadCourseImage, nhung dung cau hinh videoStorage.
// Ket qua upload thanh cong cung duoc tra ve qua req.file.
export const uploadLessonVideo = multer({ storage: videoStorage });

// Default export de giu tinh tuong thich voi cac noi dang import mac dinh.
// Hien tai default tro toi middleware uploadCourseImage.
export default uploadCourseImage;
