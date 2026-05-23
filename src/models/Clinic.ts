import mongoose from 'mongoose';

const MultilingualString = {
  ru: { type: String, default: '' },
  uz: { type: String, default: '' },
  kk: { type: String, default: '' },
  ky: { type: String, default: '' },
  tg: { type: String, default: '' },
};

const WorkingHoursSchema = {
  open: { type: String, default: '08:00' },
  close: { type: String, default: '18:00' },
  isWorking: { type: Boolean, default: true },
};

const ClinicSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: MultilingualString,
  slug: { type: String, unique: true, required: true },
  description: MultilingualString,
  type: {
    type: String,
    enum: ['clinic', 'hospital', 'diagnostic_center', 'dental_clinic', 'eye_clinic', 'maternity', 'rehabilitation', 'polyclinic'],
    default: 'clinic'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'banned'],
    default: 'pending'
  },
  logo: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  photos: { type: [String], default: [] },
  city: { type: String, default: '' },
  address: { type: String, default: '' },
  district: { type: String, default: '' },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number },
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] }, // [lng, lat]
  },
  phone: { type: String, default: '' },
  phone2: { type: String, default: '' },
  email: { type: String, default: '' },
  website: { type: String, default: '' },
  telegram: { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  instagram: { type: String, default: '' },
  workingHours: {
    mon: WorkingHoursSchema,
    tue: WorkingHoursSchema,
    wed: WorkingHoursSchema,
    thu: WorkingHoursSchema,
    fri: WorkingHoursSchema,
    sat: WorkingHoursSchema,
    sun: WorkingHoursSchema,
  },
  specialties: { type: [String], default: [] },
  services: [{
    name: MultilingualString,
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'TJS' }
  }],
  insurance: { type: [String], default: [] },
  amenities: { type: [String], default: [] },
  doctorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
  licenseNumber: { type: String, default: '' },
  licenseDocument: { type: String, default: '' },
  verifiedAt: { type: Date },
  rating: {
    avg: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  profileViews: { type: Number, default: 0 },
  accentColor: { type: String, default: '#2563eb' },
}, { timestamps: true });

ClinicSchema.index({ 'coordinates.coordinates': '2dsphere' });
ClinicSchema.index(
  { 'name.ru': 'text', 'name.uz': 'text', 'description.ru': 'text' },
  { default_language: 'russian' }
);
ClinicSchema.index({ slug: 1 });
ClinicSchema.index({ status: 1 });
ClinicSchema.index({ city: 1 });
ClinicSchema.index({ status: 1, city: 1, type: 1, specialties: 1, 'rating.avg': -1 });

export default mongoose.models.Clinic || mongoose.model('Clinic', ClinicSchema);
