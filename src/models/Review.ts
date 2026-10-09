import mongoose from 'mongoose';

// A review is about exactly one thing: a doctor (doctorId; clinicId is then the doctor's clinic), a clinic (clinicId
// alone) or an article (articleId). The author is always a signed-in account (patientId, for the administrator).
// Visitors only ever see `authorName`: the account name, or the masked one when the author chose to hide it
// (isAnonymous), see src/lib/reviews.ts. New reviews are published at once (isVerified); the administrator can hide
// or delete any review, and "hidden" is simply isVerified false.
const ReviewSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' },
  articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // reviews written before sign-in was required may lack it
  rating: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String, required: true, maxlength: 500 },
  isVerified: { type: Boolean, default: false }, // shown on the site (false: waiting or hidden by the administrator)
  isAnonymous: { type: Boolean, default: true }, // the author chose to hide the name
  authorName: { type: String, default: '' }, // what is shown under the review: "Жавохир Нурматов", or masked "Жа*** Н."
}, { timestamps: true });

// Index for faster lookups
ReviewSchema.index({ doctorId: 1, isVerified: 1, createdAt: -1 });
ReviewSchema.index({ clinicId: 1, isVerified: 1, createdAt: -1 });
ReviewSchema.index({ articleId: 1, isVerified: 1, createdAt: -1 });
// "Has this person already reviewed this?" (one review per person and subject)
ReviewSchema.index({ patientId: 1, doctorId: 1 });
ReviewSchema.index({ patientId: 1, clinicId: 1 });
ReviewSchema.index({ patientId: 1, articleId: 1 });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);
