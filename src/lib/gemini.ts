import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_AI_KEY;

// Очищаем ключ от кавычек и пробелов (частая проблема при копировании)
const cleanKey = apiKey ? apiKey.replace(/["']/g, '').trim() : '';

// Ключ (даже его начало) в логи не пишем — логи хостинга видят многие сервисы.
if (cleanKey.length <= 5) console.error('--- [GEMINI INIT] 🚨 ERROR: API Key is invalid or empty!');

const genAI = new GoogleGenerativeAI(cleanKey);

export const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
});
