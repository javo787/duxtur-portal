import mongoose from 'mongoose';

const ClinicInvitationSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  sentAt: { type: Date, default: Date.now }
}, { timestamps: true });

ClinicInvitationSchema.index({ clinicId: 1, doctorId: 1 });
ClinicInvitationSchema.index({ doctorId: 1, status: 1 });

export default mongoose.models.ClinicInvitation || mongoose.model('ClinicInvitation', ClinicInvitationSchema);
