import { GoogleGenerativeAI } from '@google/generative-ai';

function getEmbeddingModel() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY chua duoc cau hinh trong backend/.env');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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
    throw new Error(`Khong the tao embedding: ${error.message}`);
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
