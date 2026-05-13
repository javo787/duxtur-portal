import mongoose from 'mongoose';

const DoctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  phone: { type: String, required: true },
  specialty: { ru: String, uz: String, kk: String, ky: String, tg: String },
  experience: { type: Number, default: 0 },
  workplace: { type: String, default: '' },
  education: { type: String, default: '' },
  licenseNumber: { type: String, default: '' },
  bio: { type: String, default: '' },
  sameAs: { type: [String], default: [] },
  image: { type: String },
  documentImage: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'banned'], default: 'pending' },
  languages: [String],
  price: { type: Number, default: 0 },

  // Соцсети и график
  instagram: { type: String, default: '' },
  telegram: { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  workingHours: { type: String, default: '' },

  // Новые поля визитки
  downloadsCount: { type: Number, default: 0 },
  accentColor: { type: String, default: '#2563eb' },
  cardTheme: { type: String, enum: ['dark', 'light'], default: 'dark' },
}, { timestamps: true });

export default mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);
