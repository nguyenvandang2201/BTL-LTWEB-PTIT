import prisma from '../config/prisma.js';
import deepseek, { DEEPSEEK_MODEL, assertDeepSeekConfigured } from '../config/deepseek.js';
import { embedText } from './embeddingService.js';
import { findTopKChunks } from './vectorUtils.js';

const TOP_K = parseInt(process.env.RAG_TOP_K, 10) || 3;

function buildRagSystemPrompt(lesson, course, retrievedContext) {
  return `Ban la tro ly AI giup hoc sinh hoc tap tren nen tang hoc truc tuyen.
Ban dang ho tro bai hoc: "${lesson.title}" thuoc khoa hoc "${course.title}".

MO TA KHOA HOC:
${course.description || 'Khong co mo ta.'}

NGU CANH LIEN QUAN:
---
${retrievedContext}
---

HUONG DAN:
- Chi tra loi dua tren ngu canh duoc cung cap o tren.
- Neu ngu canh khong du thong tin, hay noi ro rang rang ban khong tim thay thong tin trong tai lieu.
- Tra loi bang tieng Viet, ngan gon, ro rang va de hieu.
- Khong bia dat thong tin ngoai ngu canh da cho.`;
}

function normalizeHistory(messageHistory) {
  return messageHistory
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

export async function runRag(lessonId, userQuery, messageHistory = []) {
  const lesson = await prisma.lesson.findUnique({
    where: { lesson_id: lessonId },
    include: { course: true },
  });

  if (!lesson) throw new Error(`Khong tim thay bai hoc id=${lessonId}`);

  const allChunks = await prisma.lessonChunk.findMany({
    where: { course_id: lesson.course_id },
    select: {
      lesson_chunk_id: true,
      content: true,
      embedding: true,
      lesson_id: true,
    },
  });

  let retrievedContext = '';
  let sourceChunks = [];

  if (allChunks.length === 0) {
    retrievedContext = `Khoa hoc: ${lesson.course.title}\nBai hoc: ${lesson.title}\nNoi dung bai hoc: ${lesson.content || 'Chua co noi dung text.'}`;
    console.warn(`[RAG] Khoa hoc ${lesson.course_id} chua duoc index. Dung metadata toi thieu.`);
  } else {
    const queryEmbedding = await embedText(userQuery);
    const topChunks = findTopKChunks(queryEmbedding, allChunks, TOP_K);

    retrievedContext = topChunks
      .map(({ chunk, score }) => `[Do lien quan: ${score.toFixed(2)}]\n${chunk.content}`)
      .join('\n\n---\n\n');

    sourceChunks = topChunks.map(({ chunk }) => chunk.content.slice(0, 120));
  }

  assertDeepSeekConfigured();

  const completion = await deepseek.chat.completions.create({
    model: DEEPSEEK_MODEL,
    temperature: 0.3,
    messages: [
      { role: 'system', content: buildRagSystemPrompt(lesson, lesson.course, retrievedContext) },
      ...normalizeHistory(messageHistory),
      { role: 'user', content: userQuery },
    ],
  });

  return {
    answer: completion.choices[0]?.message?.content?.trim() || 'Toi chua tao duoc cau tra loi.',
    sourceChunks,
  };
}
