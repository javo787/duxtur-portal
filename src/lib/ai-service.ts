import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_AI_KEY;
const cleanKey = apiKey ? apiKey.replace(/["']/g, '').trim() : "";

if (cleanKey.length <= 5) {
    console.error("--- [AI SERVICE] 🚨 ERROR: API Key is invalid or empty!");
}

const genAI = new GoogleGenerativeAI(cleanKey);

export const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash"
});

export async function generateContent(prompt: string, options?: { signal?: AbortSignal }) {
    try {
        const result = await model.generateContent(prompt, { signal: options?.signal } as any);
        return result.response.text();
    } catch (error) {
        console.error("--- [AI SERVICE] Error generating content:", error);
        throw error;
    }
}
