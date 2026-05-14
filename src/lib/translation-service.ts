import { generateContent } from './ai-service';

export interface MultilingualObject {
  ru: string;
  uz: string;
  kk: string;
  ky: string;
  tg: string;
}

export async function translateText(text: string): Promise<MultilingualObject> {
  if (!text) {
    return { ru: '', uz: '', kk: '', ky: '', tg: '' };
  }

  const prompt = `
    You are a professional translator specializing in medical terminology.
    Translate the following text into 5 languages: Russian (ru), Uzbek (uz), Kazakh (kk), Kyrgyz (ky), and Tajik (tg).
    The input text might be in Russian or Uzbek.

    Format the output as a valid JSON object with keys: "ru", "uz", "kk", "ky", "tg".
    Do not include any other text, markdown formatting, or explanations in your response.

    Text to translate:
    "${text}"
  `;

  try {
    const response = await generateContent(prompt);

    // Find the JSON part more robustly
    const start = response.indexOf('{');
    const end = response.lastIndexOf('}');
    if (start === -1 || end === -1) {
        throw new Error("Could not find JSON in AI response");
    }
    const cleanJson = response.substring(start, end + 1);

    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("--- [TRANSLATION SERVICE] Error:", error);
    // Fallback: return the same text for all languages if translation fails
    return {
      ru: text,
      uz: text,
      kk: text,
      ky: text,
      tg: text,
    };
  }
}

export async function translateFields(fields: Record<string, string | undefined>) {
    const fieldKeys = Object.keys(fields);
    const fieldValues = Object.values(fields);

    const translationPromises = fieldValues.map(value =>
        value && typeof value === 'string' ? translateText(value) : Promise.resolve(undefined)
    );

    const results = await Promise.all(translationPromises);

    const translatedFields: Record<string, MultilingualObject | undefined> = {};
    fieldKeys.forEach((key, index) => {
        translatedFields[key] = results[index];
    });

    return translatedFields;
}
