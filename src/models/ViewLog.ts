import mongoose from 'mongoose';

const ViewLogSchema = new mongoose.Schema({
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  entityType: { type: String, enum: ['doctor', 'article', 'clinic'], required: true },
  date: { type: Date, required: true }, // Normalized to start of day
  count: { type: Number, default: 0 },
}, { timestamps: true });

ViewLogSchema.index({ entityId: 1, entityType: 1, date: 1 }, { unique: true });

export default mongoose.models.ViewLog || mongoose.model('ViewLog', ViewLogSchema);
