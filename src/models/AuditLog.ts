import mongoose from 'mongoose';

/**
 * One line per change made by the portal admin: who, what, to which record, when.
 * Written best-effort by src/lib/audit-log.ts. `meta` holds only short flat values (see sanitizeMeta).
 */
const AuditLogSchema = new mongoose.Schema({
  actorId:     { type: String, required: true },
  actorEmail:  { type: String, default: '' },
  action:      { type: String, required: true },
  entityType:  { type: String, enum: ['doctor', 'clinic', 'article', 'review'], required: true },
  entityId:    { type: String, required: true },
  entityLabel: { type: String, default: '' },
  meta:        { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: { createdAt: true, updatedAt: false } });

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
