// /api/journal · public reads for the Journal page. Only published
// content ever leaves this router; drafts live behind /api/admin.
const express = require('express');
const Post = require('../models/post.model');
const { Exhibit, MUSEUM_ROOMS } = require('../models/exhibit.model');

const router = express.Router();

function serializePost(p, { withBody = false } = {}) {
  const base = {
    id: String(p._id),
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    publishedAt: p.publishedAt,
  };
  return withBody ? { ...base, body: p.body } : base;
}

router.get('/posts', async (req, res, next) => {
  try {
    const posts = await Post.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(100)
      .lean();
    res.json({ posts: posts.map((p) => serializePost(p)) });
  } catch (err) {
    next(err);
  }
});

router.get('/posts/:slug', async (req, res, next) => {
  try {
    const slug = String(req.params.slug).toLowerCase().slice(0, 200);
    const post = await Post.findOne({ slug, status: 'published' }).lean();
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ post: serializePost(post, { withBody: true }) });
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
