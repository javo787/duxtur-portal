'use server';

import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import Doctor from '@/models/Doctor';

function cleanText(content: any) {
  if (Array.isArray(content)) {
    return content.map((item) => `• ${item}`).join('\n');
  }
  return content || "";
}

export async function saveArticle(articleData: any, language: string) {
  try {
    await dbConnect();
    
    // 1. Проверка источников (защита от непрофессиональных статей)
    if (!articleData.references || articleData.references.length < 2) {
      throw new Error("Недостаточно источников! Минимум 2 (WHO, CDC, PubMed).");
    }

    // 2. Создаем "Доктора-полиглота", если его нет
    let author = await Doctor.findOne({ slug: 'test-doctor' });
    if (!author) {
      author = await Doctor.create({
        name: "Dr. Avicenna", // Назовем его в честь Ибн Сины
        slug: "test-doctor",
        specialty: { 
          ru: "Главный врач", 
          uz: "Bosh shifokor", 
          ky: "Башкы дарыгер",
          kk: "Бас дәрігер",
          tg: "Сардухтур"
        },
        experience: 15,
        price: 0,
        // Доктор теперь знает все языки портала
        languages: ["ru", "uz", "tg", "ky", "kk"] 
      });
    }

    // 3. Генерация уникальной ссылки (slug)
    const slug = (articleData.title || "new")
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '') + '-' + Date.now().toString().slice(-4);

    // 4. Сохранение статьи
    // Конструкция [language] автоматически подставит 'ky', 'kk', 'uz' и т.д.
    const newArticle = await Article.create({
      slug: slug,
      authorId: author._id,
      image: articleData.image || "https://source.unsplash.com/random/800x600?medicine",
      
      title: { [language]: cleanText(articleData.title) },
      overview: { [language]: cleanText(articleData.overview) },
      symptoms: { [language]: cleanText(articleData.symptoms) },
      causes: { [language]: cleanText(articleData.causes) },
      diagnosis_treatment: { [language]: cleanText(articleData.diagnosis_treatment) },
      prevention: { [language]: cleanText(articleData.prevention) },
      
      references: articleData.references,
      isVerified: true
    });

    console.log(`--- [DB SUCCESS] Статья сохранена на языке [${language}]:`, newArticle.slug);
    return { success: true, slug: newArticle.slug };

  } catch (error: any) {
    console.error("DB Error:", error);
    return { success: false, error: error.message };
  }
}
