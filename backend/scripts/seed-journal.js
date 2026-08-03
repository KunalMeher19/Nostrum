// Seeds the Journal: a few published posts (blog) and the museum's
// exhibits. Placeholder imagery + copy until the client sends real
// factory photographs. Safe to re-run: wipes and re-inserts.
require('dotenv').config();
const { connectDb, mongoose } = require('../src/db/db');
const Post = require('../src/models/post.model');
const { Exhibit } = require('../src/models/exhibit.model');

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const POSTS = [
  {
    title: 'The first cold press of the year',
    slug: 'the-first-cold-press-of-the-year',
    excerpt:
      'Before dawn, the mill smells of cut grass and stone. The first press of the season is the one we wait all year for.',
    body: [
      'Before dawn, the mill smells of cut grass and stone. The olives came in last night, picked through the afternoon and carried down while the air was still warm.',
      'The first press of the season is the one we wait all year for. It runs slower than any other. Nobody talks much. We watch the first ribbon of oil find its way out of the stone, green as the grove it came from, and we taste it standing up, on bread, with nothing else.',
      'That first taste decides everything: when we harvest the rest, how long we let the fruit rest, what the year will be called around the table. This year it was bright, a little fierce, with that pepper at the back of the throat that means the grove is healthy.',
      'The bottles from this press never travel far. Most stay in the family. Some reach the people who have been with us longest. If one reaches you, you will know.',
    ].join('\n\n'),
    coverImage: '/products/12.webp',
    publishedAt: daysAgo(9),
  },
  {
    title: 'Why we still pick by hand',
    slug: 'why-we-still-pick-by-hand',
    excerpt:
      'Machines are faster. Hands are kinder. On our slopes, kindness wins.',
    body: [
      'Machines are faster. Hands are kinder. On our slopes, kindness wins.',
      'An olive bruised at harvest starts to turn before it reaches the mill. You cannot taste the bruise in one fruit, but you can taste a thousand of them in a bottle. So we pick the way the family always has: combs, nets, ladders, and patience.',
      'It takes longer. It costs more. It is the single decision that shapes our oil more than any other, and it is not one we intend to revisit.',
    ].join('\n\n'),
    coverImage: '/images/2.png',
    publishedAt: daysAgo(34),
  },
  {
    title: 'A year in the grove, told in four silences',
    slug: 'a-year-in-the-grove-told-in-four-silences',
    excerpt:
      'Winter prunes, spring blooms, summer holds its breath, autumn gives. The grove keeps its own calendar.',
    body: [
      'Winter is the silence of pruning. The saws stop by noon and the cut wood smells sweet. What we take from the tree this month decides its shape for a decade.',
      'Spring is the silence of flower. For two weeks the grove hums and we stay out of its way. A hot wind now can take half the year with it, so we watch the sky more than the trees.',
      'Summer is the silence of waiting. The fruit sets, swells, and turns. We walk the rows in the early morning, reading leaves like weather.',
      'Autumn is the loud season, the one everyone pictures. But even harvest has its quiet: the pause at the top of the ladder, the moment before the nets are lifted, the last row finished as the light goes.',
    ].join('\n\n'),
    coverImage: '/images/origin_2.png',
    publishedAt: daysAgo(71),
  },
];

const EXHIBITS = [
  // Room I · The grove
  {
    room: 'grove',
    order: 1,
    title: 'The old rows',
    caption:
      'Some of these trees were planted before anyone alive can remember. We are their caretakers, not their owners.',
    image: '/images/origin_1.png',
  },
  {
    room: 'grove',
    order: 2,
    title: 'Stone and root',
    caption:
      'Thin soil over old stone. The tree suffers a little, and the oil is better for it.',
    image: '/images/1.png',
  },
  // Room II · The harvest
  {
    room: 'harvest',
    order: 1,
    title: 'Nets at first light',
    caption:
      'Harvest starts before the sun is fully up. Cool fruit travels better than warm fruit.',
    image: '/images/2.png',
  },
  {
    room: 'harvest',
    order: 2,
    title: 'By hand',
    caption:
      'Combs and fingers, never machines. A bruised olive is a bitter olive.',
    image: '/images/3.png',
  },
  // Room III · The mill
  {
    room: 'mill',
    order: 1,
    title: 'Hours, not days',
    caption:
      'From branch to press in under twelve hours. Freshness is the only ingredient we add.',
    image: '/images/4.png',
  },
  {
    room: 'mill',
    order: 2,
    title: 'First oil',
    caption:
      'The first ribbon of the season, green and unfiltered, tasted standing up on warm bread.',
    image: '/products/12.webp',
  },
  // Room IV · The family
  {
    room: 'family',
    order: 1,
    title: 'The table',
    caption:
      'Every decision about the oil has been made at this table, over the oil itself.',
    image: '/images/5.png',
  },
  {
    room: 'family',
    order: 2,
    title: 'Four generations',
    caption:
      'The grove has outlived every argument. It will outlive us too, and that is the point.',
    image: '/images/origin_3.png',
  },
];

(async () => {
  await connectDb();
  await Post.deleteMany({});
  await Post.insertMany(
    POSTS.map((p) => ({ ...p, status: 'published' }))
  );
  await Exhibit.deleteMany({});
  await Exhibit.insertMany(EXHIBITS.map((e) => ({ ...e, published: true })));
  console.log(
    `Seeded ${POSTS.length} journal posts and ${EXHIBITS.length} museum exhibits.`
  );
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
