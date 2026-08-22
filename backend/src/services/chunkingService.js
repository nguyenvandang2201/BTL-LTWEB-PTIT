import { env } from '../config/env.js';

const CHUNK_SIZE = env.RAG_CHUNK_SIZE;
const CHUNK_OVERLAP = env.RAG_CHUNK_OVERLAP;

export function splitIntoChunks(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  if (!text || !text.trim()) return [];

  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();

    if (chunk) chunks.push(chunk);
    if (end >= text.length) break;

    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}

export function buildLessonText(lesson) {
  const parts = [`Bai hoc: ${lesson.title}`];

  if (lesson.content && lesson.content.trim()) {
    parts.push(lesson.content.trim());
  }

  return parts.join('\n\n');
}

export function chunkLesson(lesson) {
  const fullText = buildLessonText(lesson);

  return splitIntoChunks(fullText).map((content, index) => ({
    content,
    lesson_id: lesson.lesson_id,
    course_id: lesson.course_id,
    chunk_index: index,
    token_count: Math.ceil(content.length / 4),
  }));
}
