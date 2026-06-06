import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientName: { type: String, required: true },
  patientPhone: { type: String, required: true },
  patientEmail: { type: String },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true }, // e.g. "10:00"
  durationMinutes: { type: Number, default: 30 },
  type: {
    type: String,
    enum: ['in_person', 'online', 'home_visit'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
    default: 'pending'
  },
  notes: { type: String },
  cancelReason: { type: String },
  reminderSent: { type: Boolean, default: false },
}, { timestamps: true });

AppointmentSchema.index({ doctorId: 1, date: 1, status: 1 });
AppointmentSchema.index({ patientId: 1, date: -1 });

export default mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
