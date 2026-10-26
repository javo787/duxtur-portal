import mongoose from 'mongoose';

/**
 * A record the admin deleted, kept as a snapshot for TRASH_RETENTION_DAYS so it can be restored.
 * `payload` holds the original documents exactly as they were (BSON types preserved). MongoDB removes the item
 * by itself when `expiresAt` passes (TTL index), which is also when a deleted account's data finally disappears.
 */
const TrashItemSchema = new mongoose.Schema({
  entityType:     { type: String, enum: ['doctor', 'clinic', 'article', 'review'], required: true },
  entityId:       { type: String, required: true },
  label:          { type: String, default: '' },
  payload:        { type: mongoose.Schema.Types.Mixed, required: true },
  deletedById:    { type: String, default: '' },
  deletedByEmail: { type: String, default: '' },
  deletedAt:      { type: Date, default: Date.now },
  expiresAt:      { type: Date, required: true },
});

TrashItemSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
TrashItemSchema.index({ deletedAt: -1 });
TrashItemSchema.index({ entityType: 1, entityId: 1 });

export default mongoose.models.TrashItem || mongoose.model('TrashItem', TrashItemSchema);
