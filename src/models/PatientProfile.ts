import mongoose from 'mongoose';

const PatientProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  bloodType: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  allergies: [String],
  chronicConditions: [String],
  currentMedications: [String],
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  documents: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now },
    type: String
  }],
}, { timestamps: true });

export default mongoose.models.PatientProfile || mongoose.model('PatientProfile', PatientProfileSchema);
