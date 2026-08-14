// Site content · generic key/value store for admin-editable site
// sections (currently: the "How is it made" step images on /origins).
// Authored in the admin portal's Content tab; read publicly via
// /api/content/:key.
const { mongoose } = require('../db/db');

const siteContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, maxlength: 60 },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { collection: 'site_content', versionKey: false }
);

module.exports =
  mongoose.models.SiteContent || mongoose.model('SiteContent', siteContentSchema);
