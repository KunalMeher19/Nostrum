// Journal API · public reads show only published content; authoring is
// admin-gated CRUD. Runs against the throwaway test database.
const request = require('supertest');
const {
  sessionCookie,
  connectTestDb,
  dropAndCloseTestDb,
} = require('../test/helpers');

const app = require('../src/app');
const Post = require('../src/models/post.model');
const { Exhibit } = require('../src/models/exhibit.model');

const admin = sessionCookie({
  uid: '64b000000000000000000009',
  email: 'root@test.local',
  role: 'admin',
});
const customer = sessionCookie({
  uid: '64b000000000000000000001',
  email: 'c@test.local',
  role: 'customer',
});

beforeAll(async () => {
  await connectTestDb();
  await Post.create([
    {
      title: 'Published story',
      slug: 'published-story',
      excerpt: 'x',
      body: 'Para one.\n\nPara two.',
      status: 'published',
      publishedAt: new Date(),
    },
    { title: 'Hidden draft', slug: 'hidden-draft', status: 'draft' },
  ]);
  await Exhibit.create([
    { title: 'Shown', caption: 'c', image: '/images/1.png', room: 'grove', published: true },
    { title: 'Hidden', caption: 'c', image: '/images/2.png', room: 'mill', published: false },
  ]);
});

afterAll(dropAndCloseTestDb);

describe('public journal reads', () => {
  it('lists only published posts, without bodies', async () => {
    const res = await request(app).get('/api/journal/posts');
    expect(res.status).toBe(200);
    expect(res.body.posts.map((p) => p.slug)).toEqual(['published-story']);
    expect(res.body.posts[0].body).toBeUndefined();
  });

  it('serves a published post by slug with its body', async () => {
    const res = await request(app).get('/api/journal/posts/published-story');
    expect(res.status).toBe(200);
    expect(res.body.post.body).toContain('Para one.');
  });

  it('404s drafts and unknown slugs alike', async () => {
    for (const slug of ['hidden-draft', 'nope']) {
      const res = await request(app).get(`/api/journal/posts/${slug}`);
      expect(res.status).toBe(404);
    }
  });

  it('museum returns only published exhibits', async () => {
    const res = await request(app).get('/api/journal/museum');
    expect(res.status).toBe(200);
    expect(res.body.exhibits.map((e) => e.title)).toEqual(['Shown']);
  });
});

describe('admin authoring', () => {
  it('is closed to anonymous and customer sessions', async () => {
    expect((await request(app).get('/api/admin/posts')).status).toBe(401);
    expect(
      (await request(app).get('/api/admin/posts').set('Cookie', customer)).status
    ).toBe(403);
  });

  it('creates a draft with a unique accent-safe slug', async () => {
    const res = await request(app)
      .post('/api/admin/posts')
      .set('Cookie', admin)
      .send({ title: 'Memòria de l’estiu', body: 'Text.' });
    expect(res.status).toBe(201);
    expect(res.body.post.slug).toBe('memoria-de-l-estiu');
    expect(res.body.post.status).toBe('draft');

    // Same title again → suffixed slug, never a collision.
    const again = await request(app)
      .post('/api/admin/posts')
      .set('Cookie', admin)
      .send({ title: 'Memòria de l’estiu' });
    expect(again.body.post.slug).toBe('memoria-de-l-estiu-2');
  });

  it('publishes a draft (stamps publishedAt) and the public sees it', async () => {
    const created = await request(app)
      .post('/api/admin/posts')
      .set('Cookie', admin)
      .send({ title: 'Goes live', body: 'Soon.' });
    const id = created.body.post.id;

    const published = await request(app)
      .patch(`/api/admin/posts/${id}`)
      .set('Cookie', admin)
      .send({ status: 'published' });
    expect(published.status).toBe(200);
    expect(published.body.post.publishedAt).toBeTruthy();

    const pub = await request(app).get('/api/journal/posts/goes-live');
    expect(pub.status).toBe(200);
  });

  it('edits and deletes posts', async () => {
    const created = await request(app)
      .post('/api/admin/posts')
      .set('Cookie', admin)
      .send({ title: 'Temp' });
    const id = created.body.post.id;

    const edited = await request(app)
      .patch(`/api/admin/posts/${id}`)
      .set('Cookie', admin)
      .send({ excerpt: 'New excerpt', coverImage: '/products/3.webp' });
    expect(edited.body.post.excerpt).toBe('New excerpt');

    expect(
      (await request(app).delete(`/api/admin/posts/${id}`).set('Cookie', admin)).status
    ).toBe(200);
    expect(
      (await request(app).delete(`/api/admin/posts/${id}`).set('Cookie', admin)).status
    ).toBe(404);
  });

  it('manages exhibits (create, edit room/order, unpublish, delete)', async () => {
    const created = await request(app)
      .post('/api/admin/exhibits')
      .set('Cookie', admin)
      .send({ title: 'New piece', image: '/images/3.png', room: 'harvest' });
    expect(created.status).toBe(201);
    const id = created.body.exhibit.id;

    const moved = await request(app)
      .patch(`/api/admin/exhibits/${id}`)
      .set('Cookie', admin)
      .send({ room: 'family', order: 5, published: false });
    expect(moved.body.exhibit.room).toBe('family');
    expect(moved.body.exhibit.published).toBe(false);

    const rejected = await request(app)
      .patch(`/api/admin/exhibits/${id}`)
      .set('Cookie', admin)
      .send({ room: 'not-a-room' });
    expect(rejected.body.exhibit.room).toBe('family'); // invalid room ignored

    expect(
      (await request(app).delete(`/api/admin/exhibits/${id}`).set('Cookie', admin))
        .status
    ).toBe(200);
  });
});
