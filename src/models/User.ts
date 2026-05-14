import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true },
  password: { type: String, default: '' }, // пустой для OAuth
  role:     { type: String, enum: ['doctor', 'portal_admin', 'patient'], default: 'patient' },
  name:     { type: String, default: '' },
  image:    { type: String, default: '' },
  provider: { type: String, default: 'credentials' }, // google | resend | credentials
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
