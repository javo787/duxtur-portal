'use server';

import { model } from '@/lib/gemini';

export async function processMedicalDraft(draftText: string, language: string = 'ru') {
  console.log(`--- [ACTION START] Режим редактора + Библиограф. Язык: ${language}`);

  try {
    const prompt = `
      You are a professional Medical Editor and Fact-Checker.
      
      INPUT TEXT: "${draftText}"
      TARGET LANGUAGE: "${language}"

      YOUR TASK:
      1. **Edit & Format:** Correct errors, use professional tone, format with Markdown.
      2. **Sourcing:** You MUST provide at least 3 credible medical sources (WHO, Mayo Clinic, CDC, PubMed, Lancet) relevant to this topic.
      3. **Structure:** Fill the JSON fields below.
      
      OUTPUT JSON FORMAT (Strictly):
      {
        "title": "Professional title",
        "overview": "Summary",
        "symptoms": "List of symptoms",
        "causes": "Causes",
        "diagnosis_treatment": "Treatment protocols",
        "prevention": "Prevention tips",
        "references": [
          "WHO: Title of the guideline - www.who.int/...",
          "Mayo Clinic: Article Title - www.mayoclinic.org/..."
        ],
        "imageQuery": "English image query"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return { success: true, data: JSON.parse(text) };

  } catch (error: any) {
    console.error("AI Error:", error);
    return { success: false, error: error.message };
  }
}
