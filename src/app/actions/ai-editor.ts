'use server';

import { model } from '@/lib/gemini';

export async function processMedicalDraft(draftText: string, language: string = 'ru') {
  console.log(`--- [ACTION START] Обработка текста. Язык: ${language}`);

  try {
    // ПРОФЕССИОНАЛЬНЫЙ ПРОМПТ
    const prompt = `
      You are an expert Chief Medical Editor for "Duxtur.com" (Central Asia).
      
      ROLE:
      Analyze the doctor's raw notes and convert them into a structured, patient-friendly article.
      
      INPUT TEXT: "${draftText}"
      TARGET LANGUAGE: "${language}" (Strictly output in this language!)

      INSTRUCTIONS:
      1. **Tone:** Professional, empathetic, clear. Use "You" (addressing the patient).
      2. **Structure:** Fill the JSON fields below.
      3. **Content Enhancement:** - If the doctor missed "Risk Factors" or "Prevention", enable your medical knowledge to fill them briefly based on standard guidelines (WHO/Mayo Clinic).
         - Make text rich: use Markdown (e.g., **bold** for key terms).
      4. **Image Query:** Generate a specific English search query for Unsplash (e.g., "doctor measuring blood pressure elderly patient").

      OUTPUT FORMAT (Strict JSON, no markdown code blocks):
      {
        "title": "Catchy title in ${language}",
        "overview": "2-3 sentences summary",
        "symptoms": "Bulleted list of symptoms",
        "causes": "Explanation of causes",
        "diagnosis_treatment": "How to diagnose and treat",
        "prevention": "Tips for prevention",
        "imageQuery": "English search query for Unsplash"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Чистка JSON от лишнего форматирования (удаляем ```json и ```)
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    console.log("--- [AI RESULT]", text.substring(0, 50) + "...");
    
    return { success: true, data: JSON.parse(text) };

  } catch (error: any) {
    console.error("AI Error:", error);
    return { success: false, error: error.message || "Ошибка обработки" };
  }
}
