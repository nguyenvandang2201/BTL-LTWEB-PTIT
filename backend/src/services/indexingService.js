import prisma from '../config/prisma.js';
import { embedText } from './embeddingService.js';
import { chunkLesson } from './chunkingService.js';

export async function indexCourse(courseId) {
  const lessons = await prisma.lesson.findMany({
    where: { course_id: courseId },
    orderBy: { order_index: 'asc' },
    select: {
      lesson_id: true,
      title: true,
      content: true,
      course_id: true,
    },
  });

  if (!lessons.length) {
    throw new Error(`Khoa hoc ${courseId} chua co bai hoc nao`);
  }

  await prisma.lessonChunk.deleteMany({
    where: { course_id: courseId },
  });

  console.log(`[IndexingService] Bat dau index khoa hoc ${courseId} - ${lessons.length} bai hoc`);

  let totalChunks = 0;
  let lessonsIndexed = 0;

  for (const lesson of lessons) {
    const rawChunks = chunkLesson(lesson);

    if (!rawChunks.length) {
      console.warn(`[IndexingService] Bai hoc "${lesson.title}" khong co noi dung`);
      continue;
    }

    let createdForLesson = 0;

    for (const chunkData of rawChunks) {
      try {
        const embedding = await embedText(chunkData.content);

        await prisma.lessonChunk.create({
          data: {
            course_id: chunkData.course_id,
            lesson_id: chunkData.lesson_id,
            chunk_index: chunkData.chunk_index,
            content: chunkData.content,
            embedding,
            token_count: chunkData.token_count,
          },
        });

        totalChunks++;
        createdForLesson++;
      } catch (error) {
        console.error(
          `[IndexingService] Loi tao chunk ${chunkData.chunk_index} cho bai "${lesson.title}":`,
          error.message,
        );
      }
    }

    if (createdForLesson > 0) lessonsIndexed++;
  }

  if (totalChunks === 0) {
    throw new Error('Khong tao duoc chunk nao. Kiem tra GEMINI_API_KEY va noi dung bai hoc.');
  }

  console.log(`[IndexingService] Hoan thanh: ${totalChunks} chunks tu ${lessonsIndexed} bai hoc`);

  return {
    chunksCreated: totalChunks,
    lessonsIndexed,
  };
}

export async function clearCourseIndex(courseId) {
  const { count } = await prisma.lessonChunk.deleteMany({
    where: { course_id: courseId },
  });

  return count;
}

export async function getCourseIndexStatus(courseId) {
  const chunkCount = await prisma.lessonChunk.count({
    where: { course_id: courseId },
  });

  return {
    isIndexed: chunkCount > 0,
    chunkCount,
  };
}
