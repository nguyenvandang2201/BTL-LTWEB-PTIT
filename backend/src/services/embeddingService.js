import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';

function getEmbeddingModel() {
  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY chưa được cấu hình trong backend/.env');
  }

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: 'text-embedding-004' });
}

export async function embedText(text) {
  try {
    const model = getEmbeddingModel();
    const truncated = String(text || '').slice(0, 8000);
    const result = await model.embedContent(truncated);
    return result.embedding.values;
  } catch (error) {
    console.error('[EmbeddingService] Loi tao embedding:', error.message);
    // Giữ lại lỗi gốc ở `cause` để không mất stack trace khi truy vết sự cố.
    throw new Error(`Không thể tạo embedding: ${error.message}`, { cause: error });
  }
}

export async function embedTexts(texts) {
  const embeddings = [];

  for (const text of texts) {
    embeddings.push(await embedText(text));
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return embeddings;
}
