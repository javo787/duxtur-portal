import mongoose, { Schema, model, models } from 'mongoose';

const DoctorSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true, required: true }, // Для URL: /doctor/rustam-azimov
  specialty: { 
    ru: String, 
    uz: String, 
    tg: String, 
    kk: String, 
    ky: String 
  },
  image: { type: String }, // Ссылка на Cloudinary
  experience: { type: Number, required: true },
  price: { type: Number, required: true },
  rating: { type: Number, default: 5.0 },
  reviewsCount: { type: Number, default: 0 },
  languages: [String], // ["ru", "uz", "en"]
  
  // Описание врача на всех языках
  about: {
    ru: String,
    uz: String,
    tg: String,
    kk: String,
    ky: String
  },
  
  createdAt: { type: Date, default: Date.now }
});

const Doctor = models.Doctor || model('Doctor', DoctorSchema);
export default Doctor;
