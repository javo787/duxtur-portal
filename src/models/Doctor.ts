import mongoose from 'mongoose';

const MultilingualString = {
  ru: String,
  uz: String,
  kk: String,
  ky: String,
  tg: String,
};

const DoctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function(this: any) { return this.status !== 'pre_imported'; }
  },
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  phone: {
    type: String,
    required: function(this: any) { return this.status !== 'pre_imported'; }
  },
  specialty: MultilingualString,
  experience: { type: Number, default: 0 },
  workplace: MultilingualString,
  education: MultilingualString,
  licenseNumber: { type: String, default: '' },
  bio: MultilingualString,
  sameAs: { type: [String], default: [] },
  image: { type: String },
  documentImage: {
    type: String,
    required: function(this: any) { return this.status !== 'pre_imported'; }
  },
  status: {
    type: String,
    enum: ['pre_imported', 'pending', 'approved', 'rejected', 'banned'],
    default: 'pending'
  },
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

  // Location
  city: { type: String, default: '' },
  district: { type: String, default: '' },
  address: { type: String, default: '' },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number },
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] }, // [lng, lat]
  },
  clinicName: { type: String, default: '' },
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', default: null },

  // Booking & Schedule
  acceptsNewPatients: { type: Boolean, default: true },
  consultationTypes: {
    type: [String],
    enum: ['in_person', 'online', 'home_visit'],
    default: ['in_person'],
  },
  priceRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    currency: { type: String, default: 'TJS' },
  },
  schedule: {
    mon: { open: String, close: String, isWorking: Boolean },
    tue: { open: String, close: String, isWorking: Boolean },
    wed: { open: String, close: String, isWorking: Boolean },
    thu: { open: String, close: String, isWorking: Boolean },
    fri: { open: String, close: String, isWorking: Boolean },
    sat: { open: String, close: String, isWorking: Boolean },
    sun: { open: String, close: String, isWorking: Boolean },
  },

  // Patient reviews
  reviewCount: { type: Number, default: 0 },
  reviewSum: { type: Number, default: 0 },
  reviewAvg: { type: Number, default: 0 },

  // Verification badge level
  verificationLevel: {
    type: String,
    enum: ['basic', 'verified', 'premium'],
    default: 'basic',
  },

  // Analytics
  profileViews: { type: Number, default: 0 },
  contactClicks: { type: Number, default: 0 },

  // Import info
  importSourceUrl: { type: String, default: '' },
  importedAt: { type: Date },
  isClaimed: { type: Boolean, default: false },
  claimedAt: { type: Date },

  // ─── Премиум-профиль ───

  // Фото рабочего места/кабинета (Cloudinary URLs)
  gallery: { type: [String], default: [] },

  // Видео-визитка: прямая ссылка на видео (Cloudinary) либо на YouTube/Instagram
  videoIntro: { type: String, default: '' },

  // Награды, сертификаты, членства в проф. сообществах, публикации
  achievements: {
    type: [{
      type: {
        type: String,
        enum: ['award', 'certification', 'membership', 'publication'],
        default: 'award',
      },
      title: MultilingualString,
      issuer: { type: String, default: '' },
      year: { type: Number },
    }],
    default: [],
  },

  // Направления/процедуры — отдельно от общей специальности
  expertiseTags: { type: [MultilingualString], default: [] },

  // Персональные вопросы-ответы от врача (дополняют авто-сгенерированные)
  faq: {
    type: [{
      question: MultilingualString,
      answer: MultilingualString,
    }],
    default: [],
  },

  // Способы оплаты и страховые компании
  paymentMethods: {
    type: [String],
    enum: ['cash', 'card', 'insurance', 'installment'],
    default: ['cash'],
  },
  insuranceProviders: { type: [String], default: [] },
}, { timestamps: true });

DoctorSchema.index({ city: 1 });
DoctorSchema.index({ 'specialty.ru': 1 });
DoctorSchema.index({ status: 1 });
DoctorSchema.index({ reviewAvg: -1, reviewCount: -1 });
DoctorSchema.index({ experience: -1 });
DoctorSchema.index({ 'priceRange.min': 1 });
DoctorSchema.index({ createdAt: -1 });
DoctorSchema.index({ 'coordinates.coordinates': '2dsphere' });
DoctorSchema.index({ name: 'text', 'specialty.ru': 'text', city: 'text' });

export default mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);
