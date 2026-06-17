import OpenAI from 'openai';

export const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

export function assertDeepSeekConfigured() {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY chua duoc cau hinh trong backend/.env');
  }
}

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'missing-deepseek-api-key',
  baseURL: 'https://api.deepseek.com/v1',
});

export default deepseek;
