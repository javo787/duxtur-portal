import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_AI_KEY;

// 1. Очищаем ключ от кавычек и пробелов (частая проблема при копировании)
const cleanKey = apiKey ? apiKey.replace(/["']/g, '').trim() : "";

// ЛОГ: Проверяем, какой ключ видит система
console.log("--- [GEMINI INIT] Key Length:", cleanKey.length);
if (cleanKey.length > 5) {
    console.log("--- [GEMINI INIT] Key Start:", cleanKey.substring(0, 5) + "...");
} else {
    console.error("--- [GEMINI INIT] 🚨 ERROR: API Key is invalid or empty!");
}

const genAI = new GoogleGenerativeAI(cleanKey);

// 2. Используем модель, которая работает в вашем HTML-проекте
export const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash" 
});
