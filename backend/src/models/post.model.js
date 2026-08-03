// Journal post · the client's blog ("post like in GetKinetIA").
// Authored in the admin portal; the public journal only ever sees
// status: "published". Body is plain text; blank lines separate
// paragraphs (rendered as <p> blocks by the frontend).
const { mongoose } = require('../db/db');

const postSchema = new mongoose.Schema(
  {
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
  },
  { collection: 'journal_posts', versionKey: false }
);

module.exports =
  mongoose.models.Post || mongoose.model('Post', postSchema);
