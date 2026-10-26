import 'server-only';
import dbConnect from '@/lib/mongodb';
import AuditLog from '@/models/AuditLog';
import { buildAuditEntry, type AuditInput } from '@/lib/admin-moderation';

/**
 * Writes one audit line. The log must never break the action it describes, so a failure is only reported to the
 * server log: the moderation change has already happened and rolling it back because of a log line would be worse.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await dbConnect();
    await AuditLog.create(buildAuditEntry(input));
  } catch (error) {
    console.error('Audit log write failed:', error);
  }
}
