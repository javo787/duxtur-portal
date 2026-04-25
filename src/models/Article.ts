import mongoose from 'mongoose';

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
  
  title:              { ru: String, uz: String, tg: String, ky: String, kk: String },
  overview:           { ru: String, uz: String, tg: String, ky: String, kk: String },
  symptoms:           { ru: String, uz: String, tg: String, ky: String, kk: String },
  causes:             { ru: String, uz: String, tg: String, ky: String, kk: String },
  diagnosis_treatment:{ ru: String, uz: String, tg: String, ky: String, kk: String },
  prevention:         { ru: String, uz: String, tg: String, ky: String, kk: String },
  // Динамические секции (для гибкой структуры)
section1_title:   { ru: String, uz: String, tg: String, ky: String, kk: String },
section1_content: { ru: String, uz: String, tg: String, ky: String, kk: String },
section2_title:   { ru: String, uz: String, tg: String, ky: String, kk: String },
section2_content: { ru: String, uz: String, tg: String, ky: String, kk: String },
section3_title:   { ru: String, uz: String, tg: String, ky: String, kk: String },
section3_content: { ru: String, uz: String, tg: String, ky: String, kk: String },
section4_title:   { ru: String, uz: String, tg: String, ky: String, kk: String },
section4_content: { ru: String, uz: String, tg: String, ky: String, kk: String },
section5_title:   { ru: String, uz: String, tg: String, ky: String, kk: String },
section5_content: { ru: String, uz: String, tg: String, ky: String, kk: String },
  
  references: [String],
  views:      { type: Number, default: 0 },

  // Новые поля
  ratings:   { type: [Number], default: [] },  // массив оценок [5, 4, 5, 3...]
  likesUp:   { type: Number, default: 0 },
  likesDown: { type: Number, default: 0 },
}, { timestamps: true });

const Article = mongoose.model('Article', ArticleSchema);
export default Article;
