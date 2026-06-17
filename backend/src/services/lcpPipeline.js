import prisma from '../config/prisma.js';
import deepseek, { DEEPSEEK_MODEL, assertDeepSeekConfigured } from '../config/deepseek.js';
import { buildLessonText } from './chunkingService.js';

const LCP_MAX_CHARS = parseInt(process.env.LCP_MAX_CHARS, 10) || 200000;

function buildLcpSystemPrompt(lesson, course, fullCourseContent) {
  return `Ban la tro ly AI giup hoc sinh hoc tap tren nen tang hoc truc tuyen.
Ban dang ho tro bai hoc: "${lesson.title}" thuoc khoa hoc "${course.title}".

TOAN BO NOI DUNG KHOA HOC:
===========================
${fullCourseContent}
===========================

HUONG DAN:
- Cau hoi nay doi hoi tong hop thong tin tu nhieu phan cua khoa hoc.
- Hay doc ky toan bo noi dung va tra loi dung trong pham vi tai lieu.
- Tra loi bang tieng Viet, co cau truc ro rang.
- Neu thong tin nao khong co trong tai lieu, hay noi ro dieu do.`;
}

function normalizeHistory(messageHistory) {
  return messageHistory
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

export async function runLcp(lessonId, userQuery, messageHistory = []) {
  const lesson = await prisma.lesson.findUnique({
    where: { lesson_id: lessonId },
    include: {
      course: {
        include: {
          lessons: {
            orderBy: { order_index: 'asc' },
            select: {
              lesson_id: true,
              title: true,
              content: true,
              course_id: true,
            },
          },
        },
      },
    },
  });

  if (!lesson) throw new Error(`Khong tim thay bai hoc id=${lessonId}`);

  let fullCourseContent = `Mo ta khoa hoc: ${lesson.course.description || 'Khong co mo ta.'}\n\n`;

  for (const item of lesson.course.lessons) {
    fullCourseContent += `${buildLessonText(item)}\n${'-'.repeat(40)}\n\n`;
  }

  if (fullCourseContent.length > LCP_MAX_CHARS) {
    fullCourseContent = `${fullCourseContent.slice(0, LCP_MAX_CHARS)}\n\n[Noi dung bi cat do gioi han context]`;
    console.warn(`[LCP] Context bi cat tai ${LCP_MAX_CHARS} ky tu cho khoa hoc ${lesson.course_id}`);
  }

  assertDeepSeekConfigured();

  const completion = await deepseek.chat.completions.create({
    model: DEEPSEEK_MODEL,
    temperature: 0.35,
    messages: [
      { role: 'system', content: buildLcpSystemPrompt(lesson, lesson.course, fullCourseContent) },
      ...normalizeHistory(messageHistory),
      { role: 'user', content: userQuery },
    ],
  });

  return {
    answer: completion.choices[0]?.message?.content?.trim() || 'Toi chua tao duoc cau tra loi.',
    contextSize: fullCourseContent.length,
  };
}
