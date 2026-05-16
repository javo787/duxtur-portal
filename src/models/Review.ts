import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional, allow anonymous
  rating: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String, required: true, maxlength: 500 },
  isVerified: { type: Boolean, default: false }, // admin must approve
  isAnonymous: { type: Boolean, default: true },
}, { timestamps: true });

// Index for faster lookups
ReviewSchema.index({ doctorId: 1, isVerified: 1, createdAt: -1 });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);
