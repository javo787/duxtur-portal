import mongoose from 'mongoose';

const CleanupLogSchema = new mongoose.Schema({
  performedAt: { type: Date, default: Date.now },
  performedBy: { type: String, required: true }, // 'cron' or userId
  deletedCount: { type: Number, required: true },
  cutoffDate: { type: Date, required: true },
  entityType: { type: String, default: 'place' }
}, { timestamps: true });

export default mongoose.models.CleanupLog || mongoose.model('CleanupLog', CleanupLogSchema);
