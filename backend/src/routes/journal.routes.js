// /api/journal · public reads for the Journal page. Only published
// content ever leaves this router; drafts live behind /api/admin.
const express = require('express');
const Post = require('../models/post.model');
const { Exhibit, MUSEUM_ROOMS } = require('../models/exhibit.model');

const router = express.Router();
const JOURNAL_LOCALES = new Set(['en', 'es', 'ca', 'it', 'el']);

function requestedLocale(value) {
  const locale = String(value || 'en').toLowerCase();
  return JOURNAL_LOCALES.has(locale) ? locale : 'en';
}

function hasTranslation(post, locale) {
  if (locale === 'en') return Boolean(post.title && post.slug);
  const translation = post.translations?.[locale];
  return Boolean(translation?.title && translation?.body && translation?.slug);
}

function serializePost(p, { locale = 'en', withBody = false } = {}) {
  const translation = locale === 'en' ? null : p.translations?.[locale];
  const base = {
    id: String(p._id),
    title: translation?.title ?? p.title,
    slug: translation?.slug ?? p.slug,
    excerpt: translation?.excerpt ?? p.excerpt,
    coverImage: p.coverImage,
    publishedAt: p.publishedAt,
  };
  return withBody ? { ...base, body: translation?.body ?? p.body } : base;
}

router.get('/posts', async (req, res, next) => {
  try {
    const locale = requestedLocale(req.query.locale);
    const localeFilter = locale === 'en'
      ? { status: 'published' }
      : { status: 'published', [`translations.${locale}.title`]: { $exists: true, $ne: '' }, [`translations.${locale}.body`]: { $exists: true, $ne: '' }, [`translations.${locale}.slug`]: { $exists: true, $ne: '' } };
    const posts = await Post.find(localeFilter)
      .sort({ publishedAt: -1 })
      .limit(100)
      .lean();
    res.json({ posts: posts.map((p) => serializePost(p, { locale })) });
  } catch (err) {
    next(err);
  }
});

router.get('/posts/:slug', async (req, res, next) => {
  try {
    const locale = requestedLocale(req.query.locale);
    const slug = String(req.params.slug).toLowerCase().slice(0, 200);
    const slugField = locale === 'en' ? 'slug' : `translations.${locale}.slug`;
    const post = await Post.findOne({ [slugField]: slug, status: 'published' }).lean();
    if (!post || !hasTranslation(post, locale)) return res.status(404).json({ error: 'Post not found' });
    res.json({ post: serializePost(post, { locale, withBody: true }) });
  } catch (err) {
    next(err);
  }
});

// The digital museum: published exhibits in walking order.
router.get('/museum', async (req, res, next) => {
  try {
    const exhibits = await Exhibit.find({ published: true })
      .limit(100)
      .lean();
    // Walking order: room sequence from the model, then curator order.
    exhibits.sort(
      (a, b) =>
        MUSEUM_ROOMS.indexOf(a.room) - MUSEUM_ROOMS.indexOf(b.room) ||
        a.order - b.order
    );
    res.json({
      exhibits: exhibits.map((e) => ({
        id: String(e._id),
        title: e.title,
        caption: e.caption,
        image: e.image,
        room: e.room,
        order: e.order,
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
