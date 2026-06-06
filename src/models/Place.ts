import mongoose from 'mongoose';

const PlaceSchema = new mongoose.Schema({
  name: { ru: String, uz: String, tg: String, kk: String, ky: String },
  type: {
    type: String,
    enum: ['clinic', 'pharmacy', 'hospital', 'lab'],
    required: true
  },
  address: String,
  city: String,
  phone: String,
  coordinates: {
    lat: Number,
    lng: Number,
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] } // [lng, lat]
  },
  isVerified: { type: Boolean, default: false },
  workingHours: String,
  doctorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

PlaceSchema.index({ city: 1, type: 1 });
PlaceSchema.index({ 'coordinates.coordinates': '2dsphere' });
PlaceSchema.index({ isDeleted: 1, deletedAt: 1 });

export default mongoose.models.Place || mongoose.model('Place', PlaceSchema);
