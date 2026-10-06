import mongoose from 'mongoose';

/**
 * An article that is not on the site yet: the author pressed "Publish", but the profile still lacks something
 * (or the team has not verified the doctor yet). It lives in its own collection on purpose: the public pages read
 * `Article` without any filter, so a draft kept there would be one forgotten query away from being public.
 *
 * `data` is exactly what the editors hand to saveArticle(); it is cleaned (HTML stripped) when it becomes an Article.
 */
const ArticleDraftSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  language: { type: String, required: true },
  title: { type: String, default: '' },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true });

export default mongoose.models.ArticleDraft || mongoose.model('ArticleDraft', ArticleDraftSchema);
