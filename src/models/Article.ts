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
  
  aiGenerated: { type: Boolean, default: true },

  reviewedById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null,
  },
  reviewedBy:  { type: String, default: '' },
  reviewedAt:  { type: Date },
  lastMedicalReview: { type: Date },
  
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

  category: {
    type: String,
    enum: ['cardiology', 'neurology', 'dentistry', 'pediatrics', 'dermatology', 'ophthalmology', 'surgery', 'gynecology', 'general'],
    default: 'general',
    index: true,
  },
  
  references: [String],
  views:      { type: Number, default: 0 },

  // Агрегированный рейтинг (не массив — безопаснее и быстрее)
  ratingSum:   { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  ratings:     { type: [Number], default: [] }, // оставляем для обратной совместимости
  likesUp:     { type: Number, default: 0 },
  likesDown:   { type: Number, default: 0 },
}, { timestamps: true });


ArticleSchema.index({
  'title.ru': 'text', 'title.uz': 'text', 'title.tg': 'text', 'title.kk': 'text', 'title.ky': 'text',
  'overview.ru': 'text', 'overview.uz': 'text', 'overview.tg': 'text', 'overview.kk': 'text', 'overview.ky': 'text'
});

export default mongoose.models.Article || mongoose.model('Article', ArticleSchema);
