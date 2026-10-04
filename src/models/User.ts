import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true },
  password: { type: String, default: '' }, // пустой для OAuth
  role:     { type: String, enum: ['doctor', 'portal_admin', 'patient', 'clinic'], default: 'patient' },
  name:     { type: String, default: '' },
  image:    { type: String, default: '' },
  provider: { type: String, default: 'credentials' }, // google | resend | credentials
  // Firebase uid of this person's Duxtur Edu account (tg_<id>, a Google uid, or dx_<id> generated here).
  // Set only by the signed-in person through /api/edu-auth/link or the first "Sign in with duxtur.org" in Edu.
  // Absent for everybody who has never used Edu; sparse so those users do not collide on the unique index.
  eduUid:   { type: String, default: undefined, unique: true, sparse: true },
  resetPasswordToken:   { type: String, default: null },
  resetPasswordExpires: { type: Date,   default: null },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
