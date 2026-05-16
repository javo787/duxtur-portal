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
  coordinates: { lat: Number, lng: Number },
  isVerified: { type: Boolean, default: false },
  workingHours: String,
  doctorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
}, { timestamps: true });

PlaceSchema.index({ city: 1, type: 1 });

export default mongoose.models.Place || mongoose.model('Place', PlaceSchema);
