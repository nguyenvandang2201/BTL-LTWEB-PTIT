import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Xóa dữ liệu cũ theo thứ tự tránh lỗi khóa ngoại
  await prisma.review.deleteMany();
  console.log('✓ Đã xóa Reviews');
  await prisma.enrollment.deleteMany();
  console.log('✓ Đã xóa Enrollments');
  await prisma.lesson.deleteMany();
  console.log('✓ Đã xóa Lessons');
  await prisma.course.deleteMany();
  console.log('✓ Đã xóa Courses');
  await prisma.category.deleteMany();
  console.log('✓ Đã xóa Categories');
  await prisma.user.deleteMany();
  console.log('✓ Đã xóa Users');

  // 2. Hash mật khẩu
  const hashedPassword = await bcrypt.hash('123456', 10);

  // 3. Tạo Admin
  const admin = await prisma.user.create({
    data: {
      full_name: 'Admin',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin',
    },
  });
  console.log(`✓ Đã tạo Admin: ${admin.email}`);

  // 4. Tạo Student
  const student = await prisma.user.create({
    data: {
      full_name: 'Học Viên',
      email: 'student@test.com',
      password: hashedPassword,
      role: 'student',
    },
  });
  console.log(`✓ Đã tạo Student: ${student.email}`);

  // 5. Tạo Category
  const category = await prisma.category.create({
    data: { name: 'Lập trình Web' },
  });
  console.log(`✓ Đã tạo Category: ${category.name}`);

  // 6. Tạo Course
  const course = await prisma.course.create({
    data: {
      title: 'Khoá học Node.js cơ bản',
      price: 500000,
      category_id: category.category_id,
    },
  });
  console.log(`✓ Đã tạo Course: ${course.title}`);

  // 7. Tạo 2 Lessons
  const lesson1 = await prisma.lesson.create({
    data: {
      course_id: course.course_id,
      title: 'Bài 1: Cài đặt',
      video_url: 'https://www.youtube.com/watch?v=lesson1',
      order_index: 1,
    },
  });
  console.log(`✓ Đã tạo Lesson: ${lesson1.title}`);

  const lesson2 = await prisma.lesson.create({
    data: {
      course_id: course.course_id,
      title: 'Bài 2: ExpressJS',
      video_url: 'https://www.youtube.com/watch?v=lesson2',
      order_index: 2,
    },
  });
  console.log(`✓ Đã tạo Lesson: ${lesson2.title}`);

  console.log('\n🎉 Seed dữ liệu hoàn tất!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
