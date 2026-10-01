import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Short-lived record of a "Sign in with Telegram" attempt for Duxtur Edu.
 * Only SHA-256 hashes of the secrets are stored. Documents expire via TTL index.
 */
export interface ITelegramLogin extends Document {
  tokenHash: string;
  pollSecretHash: string;
  status: 'pending' | 'approved' | 'consumed';
  telegram?: {
    id: number;
    firstName: string;
    lastName?: string;
    username?: string;
  };
  expiresAt: Date;
  createdAt: Date;
}

const TelegramLoginSchema = new Schema<ITelegramLogin>(
  {
    tokenHash: { type: String, required: true, unique: true },
    pollSecretHash: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'consumed'], default: 'pending' },
    telegram: {
      id: Number,
      firstName: String,
      lastName: String,
      username: String,
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// MongoDB removes the document once expiresAt has passed.
TelegramLoginSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const TelegramLogin: Model<ITelegramLogin> =
  mongoose.models.TelegramLogin || mongoose.model<ITelegramLogin>('TelegramLogin', TelegramLoginSchema);

export default TelegramLogin;
