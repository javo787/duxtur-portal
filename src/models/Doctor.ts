// src/models/Doctor.ts
// ПОЛНОСТЬЮ ЗАМЕНИТЬ ФАЙЛ

import mongoose from 'mongoose';

const DoctorSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  phone: { type: String, required: true },
  
  specialty: {
    ru: String, uz: String, kk: String, ky: String, tg: String
  },
  experience: { type: Number, default: 0 },

  // E-E-A-T: credentials врача
  workplace:   { type: String, default: '' },   // место работы (клиника/больница)
  education:   { type: String, default: '' },   // университет / учёная степень
  licenseNumber: { type: String, default: '' }, // номер лицензии (не показываем публично)
  bio: { type: String, default: '' },           // биография

  image: { type: String },
  documentImage: { type: String, required: true },
  
  // ИСПРАВЛЕНО: добавлен 'banned'
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'banned'], 
    default: 'pending'
  },

  languages: [String],
  price: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);
