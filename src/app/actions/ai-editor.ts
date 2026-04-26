'use server';

import { model } from '@/lib/gemini';

const languageNames: Record<string, string> = {
  ru: 'Russian',
  uz: 'Uzbek',
  tg: 'Tajik (Тоҷикӣ) — use Cyrillic Tajik script only, NOT Persian/Farsi/Arabic',
  kk: 'Kazakh (Қазақша) — use Cyrillic Kazakh script only',
  ky: 'Kyrgyz (Кыргызча) — use Cyrillic Kyrgyz script only',
};

// ─── РЕЖИМ 1: Написать статью из черновика ───
export async function processMedicalDraft(draftText: string, language: string = 'ru') {
  console.log(`--- [WRITE MODE] Язык: ${language}`);
  const targetLanguage = languageNames[language] || 'Russian';

  const prompt = `
You are a senior medical editor at a top health portal (like WebMD or Healthline).

INPUT TEXT FROM DOCTOR:
"${draftText}"

TARGET LANGUAGE: ${targetLanguage}
CRITICAL: Write ALL text fields strictly in ${targetLanguage}. No English except imageQuery.

YOUR TASKS:
1. DETECT ARTICLE TYPE: disease / procedure / nutrition / mental_health / child_health / prevention / anatomy / other
2. CHOOSE BEST STRUCTURE based on type:
   - disease: symptoms + causes + diagnosis_treatment + prevention
   - procedure: preparation + how_it_works + recovery + risks
   - nutrition: benefits + how_to_use + who_needs_it + cautions
   - mental_health: signs + causes + coping_strategies + when_to_seek_help
   - child_health: age_norms + warning_signs + parent_tips + when_to_see_doctor
   - prevention: risk_factors + prevention_steps + lifestyle_tips + screening
   - anatomy: functions + common_problems + how_to_keep_healthy
   - other: key_points + practical_advice + conclusion
3. Use **bold** for terms, bullet points for lists, short paragraphs.
4. PROVIDE 3+ real sources (WHO, CDC, Mayo Clinic, PubMed, Lancet).

OUTPUT: Strictly valid JSON only. No text outside JSON. No markdown code blocks.
{
  "type": "article type",
  "title": "engaging title in ${targetLanguage}",
  "overview": "2-3 sentence intro in ${targetLanguage}",
  "section1_title": "section title in ${targetLanguage}",
  "section1_content": "content in ${targetLanguage}",
  "section2_title": "section title in ${targetLanguage}",
  "section2_content": "content in ${targetLanguage}",
  "section3_title": "section title in ${targetLanguage}",
  "section3_content": "content in ${targetLanguage}",
  "section4_title": "",
  "section4_content": "",
  "section5_title": "",
  "section5_content": "",
  "references": ["WHO: title - url", "Mayo Clinic: title - url", "PubMed: title - url"],
  "imageQuery": "english image search query"
}`;

  return await callGemini(prompt);
}

// ─── РЕЖИМ 2: Обработать готовую статью ───
export async function processMedicalArticle(articleText: string, language: string = 'ru') {
  console.log(`--- [PROCESS MODE] Язык: ${language}, Длина: ${articleText.length}`);
  const targetLanguage = languageNames[language] || 'Russian';

  // Обрезаем до 12000 символов
  const safeText = articleText.length > 12000
    ? articleText.substring(0, 12000) + '...'
    : articleText;

  const prompt = `
You are a senior medical editor. Your task is to take a complex medical/scientific text and adapt it into a clear, patient-friendly article.

ORIGINAL TEXT:
"${safeText}"

TARGET LANGUAGE: ${targetLanguage}
CRITICAL: Write ALL output fields strictly in ${targetLanguage}. No English except imageQuery.

YOUR TASKS:
1. Extract the KEY medical information patients need to know.
2. Simplify complex medical terminology — explain it in plain language.
3. Remove excessive scientific details, statistics, drug tables — keep only what's useful for patients.
4. Structure into 3-5 clear sections with informative titles.
5. Add a practical "What should I do?" or "When to see a doctor?" section.
6. PROVIDE 3+ real sources from the original text or add relevant ones.

OUTPUT: Strictly valid JSON only. No text outside JSON. No markdown code blocks.
{
  "type": "processed",
  "title": "patient-friendly title in ${targetLanguage}",
  "overview": "2-3 sentence summary in ${targetLanguage}",
  "section1_title": "section title in ${targetLanguage}",
  "section1_content": "simplified content in ${targetLanguage}",
  "section2_title": "section title in ${targetLanguage}",
  "section2_content": "simplified content in ${targetLanguage}",
  "section3_title": "section title in ${targetLanguage}",
  "section3_content": "simplified content in ${targetLanguage}",
  "section4_title": "",
  "section4_content": "",
  "section5_title": "",
  "section5_content": "",
  "references": ["source1", "source2", "source3"],
  "imageQuery": "english image search query"
}`;

  return await callGemini(prompt);
}

// ─── РЕЖИМ 3: Перевести статью ───
export async function translateMedicalArticle(articleText: string, language: string = 'ru') {
  console.log(`--- [TRANSLATE MODE] Язык: ${language}, Длина: ${articleText.length}`);
  const targetLanguage = languageNames[language] || 'Russian';

  const safeText = articleText.length > 12000
    ? articleText.substring(0, 12000) + '...'
    : articleText;

  const prompt = `
You are a professional medical translator specializing in Central Asian languages.

ORIGINAL TEXT:
"${safeText}"

TARGET LANGUAGE: ${targetLanguage}
CRITICAL RULES:
- Translate ALL content strictly into ${targetLanguage}
- Use Cyrillic script for Tajik/Kazakh/Kyrgyz — NEVER use Latin or Arabic/Persian script
- Preserve all medical terminology accurately
- Keep the same structure as the original
- Make it readable and natural in ${targetLanguage}

YOUR TASKS:
1. Translate the full text professionally into ${targetLanguage}.
2. Keep the original structure but organize into clear sections.
3. Preserve all important medical information.
4. Add sources if mentioned in original, otherwise add 2-3 relevant ones.

OUTPUT: Strictly valid JSON only. No text outside JSON. No markdown code blocks.
{
  "type": "translated",
  "title": "translated title in ${targetLanguage}",
  "overview": "translated introduction in ${targetLanguage}",
  "section1_title": "section title in ${targetLanguage}",
  "section1_content": "translated content in ${targetLanguage}",
  "section2_title": "section title in ${targetLanguage}",
  "section2_content": "translated content in ${targetLanguage}",
  "section3_title": "section title in ${targetLanguage}",
  "section3_content": "translated content in ${targetLanguage}",
  "section4_title": "",
  "section4_content": "",
  "section5_title": "",
  "section5_content": "",
  "references": ["source1", "source2", "source3"],
  "imageQuery": "english image search query"
}`;

  return await callGemini(prompt);
}

// ─── Общая функция вызова Gemini ───

async function callGemini(prompt: string) {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    console.log('--- [GEMINI RAW] First 200 chars:', text.substring(0, 200));

    // Убираем markdown блоки
    text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    // Находим JSON между первой { и последней }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      text = text.substring(firstBrace, lastBrace + 1);
    }

    // Убираем управляющие символы ТОЛЬКО вне строк JSON
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Фиксируем переносы строк внутри строковых значений
    text = text.replace(/"([^"]*?)"/gs, (_match: string, inner: string) => {
      const fixed = inner
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      return `"${fixed}"`;
    });

    const parsed = JSON.parse(text);
    return { success: true, data: parsed };
  } catch (error: any) {
    console.error('AI Error:', error);

    // Попытка 2 — попросить Gemini исправить JSON
    try {
      const fixPrompt = `The following text should be valid JSON but has errors. Fix it and return ONLY valid JSON, nothing else:\n\n${error.text || ''}`;
      const retry = await model.generateContent(fixPrompt);
      const retryText = retry.response.text().replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(retryText);
      return { success: true, data: parsed };
    } catch {
      return { success: false, error: error.message };
    }
  }
}
