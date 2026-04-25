'use server';

import { model } from '@/lib/gemini';

const languageNames: Record<string, string> = {
  ru: 'Russian',
  uz: 'Uzbek',
  tg: 'Tajik (Тоҷикӣ) — use Cyrillic Tajik script only, NOT Persian/Farsi/Arabic',
  kk: 'Kazakh (Қазақша) — use Cyrillic Kazakh script only',
  ky: 'Kyrgyz (Кыргызча) — use Cyrillic Kyrgyz script only',
};

export async function processMedicalDraft(draftText: string, language: string = 'ru') {
  console.log(`--- [ACTION START] Язык: ${language}`);

  try {
    const targetLanguage = languageNames[language] || 'Russian';

    const prompt = `
You are a senior medical editor at a top health portal (like WebMD or Healthline).

INPUT TEXT FROM DOCTOR:
"${draftText}"

TARGET LANGUAGE: ${targetLanguage}
CRITICAL: Write ALL text fields strictly in ${targetLanguage}. No English except imageQuery.

YOUR TASKS:

1. DETECT ARTICLE TYPE from the input:
   - "disease" — about a specific disease (has symptoms, causes, treatment)
   - "procedure" — about a medical procedure or surgery
   - "nutrition" — about diet, food, vitamins
   - "mental_health" — about psychology, stress, mental disorders  
   - "child_health" — about pediatrics, child development
   - "prevention" — about disease prevention, healthy lifestyle
   - "anatomy" — about body organs or systems
   - "other" — anything else

2. BASED ON TYPE, choose the best structure:

   For "disease": use symptoms + causes + diagnosis_treatment + prevention
   For "procedure": use overview + preparation + how_it_works + recovery + risks
   For "nutrition": use overview + benefits + how_to_use + who_needs_it + cautions
   For "mental_health": use overview + signs + causes + coping_strategies + when_to_seek_help
   For "child_health": use overview + age_norms + warning_signs + parent_tips + when_to_see_doctor
   For "prevention": use overview + risk_factors + prevention_steps + lifestyle_tips + screening
   For "anatomy": use overview + functions + common_problems + how_to_keep_healthy
   For "other": use overview + key_points + practical_advice + conclusion

3. WRITE professionally with Markdown formatting.
   - Use **bold** for important terms
   - Use bullet points for lists
   - Keep paragraphs short and readable

4. PROVIDE 3+ real medical sources (WHO, CDC, Mayo Clinic, PubMed, Lancet, NEJM).

OUTPUT: Strictly valid JSON only. No text outside JSON. No markdown code blocks.

{
  "type": "detected article type from the list above",
  "title": "Professional engaging title in ${targetLanguage}",
  "overview": "2-3 sentence introduction in ${targetLanguage}",
  "section1_title": "First section title in ${targetLanguage}",
  "section1_content": "First section content in ${targetLanguage}",
  "section2_title": "Second section title in ${targetLanguage}",
  "section2_content": "Second section content in ${targetLanguage}",
  "section3_title": "Third section title in ${targetLanguage}",
  "section3_content": "Third section content in ${targetLanguage}",
  "section4_title": "Fourth section title (if needed, else empty string)",
  "section4_content": "Fourth section content (if needed, else empty string)",
  "section5_title": "Fifth section title (if needed, else empty string)",
  "section5_content": "Fifth section content (if needed, else empty string)",
  "references": [
    "WHO: exact title - www.who.int/...",
    "Mayo Clinic: exact title - www.mayoclinic.org/...",
    "PubMed: exact title - pubmed.ncbi.nlm.nih.gov/..."
  ],
  "imageQuery": "professional medical image search query in English"
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Убираем markdown блоки если есть
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // Убираем управляющие символы
    text = text.replace(/[\x00-\x1F\x7F]/g, (char) => {
      if (char === '\n') return '\\n';
      if (char === '\r') return '\\r';
      if (char === '\t') return '\\t';
      return '';
    });

    const parsed = JSON.parse(text);
    return { success: true, data: parsed };

  } catch (error: any) {
    console.error('AI Error:', error);
    return { success: false, error: error.message };
  }
}
