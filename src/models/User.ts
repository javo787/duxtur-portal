import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  // 'doctor' — врач портала (пишет статьи)
  // 'portal_admin' — супер-админ (одобряет врачей, управляет сайтом)
  role: { 
    type: String, 
    enum: ['doctor', 'portal_admin'], 
    default: 'doctor' 
  },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
