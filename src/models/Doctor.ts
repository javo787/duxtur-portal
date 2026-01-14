import mongoose from 'mongoose';

const DoctorSchema = new mongoose.Schema({
  // Связь с аккаунтом (User)
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  
  // Контакты для проверки админом
  phone: { type: String, required: true },
  
  // Профессиональные данные
  specialty: {
    ru: String,
    uz: String,
    kk: String,
    ky: String,
    tg: String
  },
  experience: { type: Number, default: 0 },
  
  // Ссылки на фото
  image: { type: String }, // Аватар
  documentImage: { type: String, required: true }, // ФОТО ДИПЛОМА
  
  // Статус модерации
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' // По умолчанию - на проверке
  },

  languages: [String],
  price: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);
