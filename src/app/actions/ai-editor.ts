'use server';

import { model } from '@/lib/gemini';
import { requireRole } from '@/lib/authGuards';
import { rateLimit } from '@/lib/rate-limit';
import { INPUT_LIMITS, processPrompt, translatePrompt, writePrompt } from '@/lib/ai-prompts';
import { parseModelJson } from '@/lib/ai-json';
import { aiDataToCheckable, checkArticleQuality, sanitizeReferences, type AiMode, type QualityReport } from '@/lib/article-quality';

type AiResult =
  | { success: true; data: Record<string, unknown>; quality: QualityReport; droppedReferences: string[] }
  | { success: false; error: string };

async function guard() {
  const { email } = await requireRole('doctor', 'portal_admin');
  const { success } = await rateLimit(email, 20, 10 * 60 * 1000); // 20 запросов / 10 минут на врача
  if (!success) throw new Error('Слишком много запросов. Попробуйте через несколько минут.');
}

const clip = (text: string, limit: number) => (text.length > limit ? text.substring(0, limit) + '…' : text);

async function run(mode: AiMode, text: string, language: string, prompt: string): Promise<AiResult> {
  console.log(`--- [AI ${mode.toUpperCase()}] Язык: ${language}, Длина: ${text.length}`);
  const result = await callGemini(prompt);
  if (!result.success) return result;

  // Фильтры кодом: убираем выдуманные ссылки-«заглушки», возвращаем ссылки автора, считаем качество.
  const { references, dropped } = sanitizeReferences(result.data.references, text);
  const data = { ...result.data, references };
  const quality = checkArticleQuality(aiDataToCheckable(data), language, text, mode);
  if (dropped.length) console.log(`--- [AI ${mode.toUpperCase()}] Убраны источники без конкретной ссылки: ${dropped.length}`);
  return { success: true, data, quality, droppedReferences: dropped };
}

// ─── РЕЖИМ 1: Написать статью из черновика ───
export async function processMedicalDraft(draftText: string, language: string = 'ru') {
  await guard();
  const text = clip(draftText, INPUT_LIMITS.write);
  return run('write', text, language, writePrompt(text, language));
}

// ─── РЕЖИМ 2: Обработать готовую статью ───
export async function processMedicalArticle(articleText: string, language: string = 'ru') {
  await guard();
  const text = clip(articleText, INPUT_LIMITS.process);
  return run('process', text, language, processPrompt(text, language));
}

// ─── РЕЖИМ 3: Перевести статью ───
export async function translateMedicalArticle(articleText: string, language: string = 'ru') {
  await guard();
  const text = clip(articleText, INPUT_LIMITS.translate);
  return run('translate', text, language, translatePrompt(text, language));
}

// ─── Общая функция вызова Gemini ───

async function callGemini(prompt: string): Promise<{ success: true; data: Record<string, unknown> } | { success: false; error: string }> {
  let rawText = '';
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      // JSON mode: модель обязана вернуть JSON; невысокая температура — меньше «фантазий» в медицинском тексте.
      generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
    });
    rawText = result.response.text();
    return { success: true, data: parseModelJson(rawText) };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('AI Error:', message);
    if (!rawText) return { success: false, error: message || 'AI недоступен' };

    // Попытка 2 — попросить модель исправить её же JSON.
    try {
      const fixPrompt = `The following text should be valid JSON but has errors. Fix it and return ONLY valid JSON, nothing else:\n\n${rawText}`;
      const retry = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fixPrompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0 },
      });
      return { success: true, data: parseModelJson(retry.response.text()) };
    } catch {
      return { success: false, error: message || 'Не удалось разобрать ответ AI' };
    }
  }
}
