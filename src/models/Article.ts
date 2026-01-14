import mongoose from 'mongoose';

// 1. Очищаем кеш модели, если она уже существует (чтобы Next.js увидел новые поля)
// Это критически важно при разработке!
if (mongoose.models.Article) {
  delete mongoose.models.Article;
}

const ArticleSchema = new mongoose.Schema({
  slug: { 
    type: String, 
    required: [true, 'Slug is required'], 
    unique: true, 
    index: true 
  },
  image: { type: String, required: false },
  authorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor',
    required: true
  },
  isVerified: { type: Boolean, default: false },
  
  // --- МУЛЬТИЯЗЫЧНЫЕ ПОЛЯ (Проверяем наличие всех 5 полей!) ---
  title: {
    ru: String, uz: String, tg: String, ky: String, kk: String
  },
  overview: {
    ru: String, uz: String, tg: String, ky: String, kk: String
  },
  symptoms: {
    ru: String, uz: String, tg: String, ky: String, kk: String
  },
  causes: {
    ru: String, uz: String, tg: String, ky: String, kk: String
  },
  // Вот эти поля терялись:
  diagnosis_treatment: {
    ru: String, uz: String, tg: String, ky: String, kk: String
  },
  prevention: {
    ru: String, uz: String, tg: String, ky: String, kk: String
  },
  
  references: [String],
  views: { type: Number, default: 0 },
}, { timestamps: true });

const Article = mongoose.model('Article', ArticleSchema);
export default Article;
