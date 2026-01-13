import mongoose, { Schema, model, models } from 'mongoose';

// Повторяющаяся схема для мультиязычных полей
const LocalizedString = {
  ru: String,
  uz: String,
  tg: String,
  kk: String,
  ky: String
};

const ArticleSchema = new Schema({
  slug: { type: String, unique: true, required: true }, // /blog/migraine
  image: { type: String }, // Cloudinary URL
  
  authorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  isVerified: { type: Boolean, default: false }, // Галочка "Проверено"
  
  // === СТРУКТУРНЫЕ ПОЛЯ (MAYO CLINIC) ===
  title: LocalizedString,
  overview: LocalizedString,   // Краткое описание
  symptoms: LocalizedString,   // Симптомы
  causes: LocalizedString,     // Патогенез/Причины
  riskFactors: LocalizedString, // Факторы риска
  complications: LocalizedString, // Осложнения
  diagnosis: LocalizedString,  // Диагностика
  treatment: LocalizedString,  // Лечение
  
  // === КОНТРОЛЬ КАЧЕСТВА ===
  // Массив ссылок. Если пустой - AI должен ругаться.
  references: [{ type: String }], 
  
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Article = models.Article || model('Article', ArticleSchema);
export default Article;
