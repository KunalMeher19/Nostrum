// Journal post · the client's blog ("post like in GetKinetIA").
// Authored in the admin portal; the public journal only ever sees
// status: "published". Body is plain text; blank lines separate
// paragraphs (rendered as <p> blocks by the frontend).
//
// Multi-language support (2026-08-20): each post can have translations
// for different locales. The base content is in English, with optional
// translations in es, ca, it, el. When displaying, show the translation
// if available, otherwise fall back to English.
const { mongoose } = require('../db/db');

const translationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 160 },
    slug: { type: String, default: '', maxlength: 80 },
    excerpt: { type: String, default: '', maxlength: 300 },
    body: { type: String, default: '', maxlength: 20000 },
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    // Base content (English)
    title: { type: String, required: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, default: '', maxlength: 300 },
    body: { type: String, default: '', maxlength: 20000 },
    // Path under /public (e.g. "/products/12.webp") until a real media
    // pipeline (Cloudinary) lands with the final shop stack.
    coverImage: { type: String, default: null },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    publishedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    // Translations for other locales (optional). A translation is public only
    // when its title, body, and locale-specific slug are complete.
    translations: {
      es: { type: translationSchema, default: null },
      ca: { type: translationSchema, default: null },
      it: { type: translationSchema, default: null },
      el: { type: translationSchema, default: null },
    },
  },
  { collection: 'journal_posts', versionKey: false }
);

module.exports =
  mongoose.models.Post || mongoose.model('Post', postSchema);
