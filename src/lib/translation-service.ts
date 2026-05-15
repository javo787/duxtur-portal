import { generateContent } from './ai-service';

export interface MultilingualObject {
  ru: string;
  uz: string;
  kk: string;
  ky: string;
  tg: string;
}

/**
 * Translates a single text into all 5 portal languages.
 * Uses a strict JSON-only prompt and a robust extraction fallback.
 */
export async function translateText(text: string): Promise<MultilingualObject> {
  if (!text || !text.trim()) {
    return { ru: '', uz: '', kk: '', ky: '', tg: '' };
  }

  const prompt = `You are a professional medical translator for Central Asia.
Translate the following text into these 5 languages:
- ru: Russian
- uz: Uzbek (Latin script)
- kk: Kazakh (Cyrillic script)
- ky: Kyrgyz (Cyrillic script)
- tg: Tajik (Cyrillic script — NEVER use Arabic/Persian script)

Rules:
- Return ONLY a valid JSON object. No markdown, no backticks, no explanation.
- Keep translations concise and medically accurate.
- If the input is already in Russian, translate correctly to the other 4.
- JSON format: {"ru":"...","uz":"...","kk":"...","ky":"...","tg":"..."}

Text to translate: "${text.replace(/"/g, "'")}"`;

  try {
    const response = await generateContent(prompt);

    const start = response.indexOf('{');
    const end   = response.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('No JSON object found in AI response');
    }

    const parsed: MultilingualObject = JSON.parse(response.substring(start, end + 1));

    // Validate all 5 keys exist
    const keys: (keyof MultilingualObject)[] = ['ru', 'uz', 'kk', 'ky', 'tg'];
    for (const key of keys) {
      if (!parsed[key] || typeof parsed[key] !== 'string') {
        parsed[key] = text; // graceful fallback per key
      }
    }

    console.log(`[TRANSLATION] "${text}" → ru:"${parsed.ru}" tg:"${parsed.tg}"`);
    return parsed;

  } catch (error) {
    console.error('[TRANSLATION SERVICE] Error translating:', text, error);
    // Fallback: put original text in all languages
    return { ru: text, uz: text, kk: text, ky: text, tg: text };
  }
}

/**
 * Translates multiple fields in parallel.
 * Only translates fields that have a string value (skips undefined/null).
 */
export async function translateFields(
  fields: Record<string, string | undefined>,
): Promise<Record<string, MultilingualObject | undefined>> {
  const entries = Object.entries(fields).filter(
    ([, v]) => v !== undefined && v !== null && String(v).trim() !== '',
  );

  const results = await Promise.all(
    entries.map(([, v]) => translateText(v as string)),
  );

  const out: Record<string, MultilingualObject | undefined> = {};
  entries.forEach(([key], i) => {
    out[key] = results[i];
  });

  return out;
}
