// src/models/Article.ts
// ПОЛНОСТЬЮ ЗАМЕНИТЬ ФАЙЛ

import mongoose from 'mongoose';

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

  // E-E-A-T поля
  aiGenerated: { type: Boolean, default: true },  // создана с помощью AI?
  reviewedBy: { type: String, default: '' },       // имя врача который проверил
  reviewedAt: { type: Date },                      // дата проверки
  
  title:              { ru: String, uz: String, tg: String, ky: String, kk: String },
  overview:           { ru: String, uz: String, tg: String, ky: String, kk: String },
  symptoms:           { ru: String, uz: String, tg: String, ky: String, kk: String },
  causes:             { ru: String, uz: String, tg: String, ky: String, kk: String },
  diagnosis_treatment:{ ru: String, uz: String, tg: String, ky: String, kk: String },
  prevention:         { ru: String, uz: String, tg: String, ky: String, kk: String },

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

  // Агрегированный рейтинг (не массив — безопаснее и быстрее)
  ratingSum:   { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  ratings:     { type: [Number], default: [] }, // оставляем для обратной совместимости
  likesUp:     { type: Number, default: 0 },
  likesDown:   { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Article || mongoose.model('Article', ArticleSchema);
