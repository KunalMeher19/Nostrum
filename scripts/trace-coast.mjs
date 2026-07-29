// One-off tracer: converts the client's reference coastline PNG into an
// SVG path (used to author OriginMap's coast). Not part of the app build.
//
//   node scripts/trace-coast.mjs "C:\Users\ardhe\Downloads\2.png"
//
// Strategy: threshold non-white pixels → thin to a point cloud on a grid →
// greedy nearest-neighbour walk from the top-right end of the stroke →
// Douglas-Peucker simplify → emit "M … L …" path data scaled to a
// 730×1000 viewBox.

import sharp from "sharp";

const src = process.argv[2];
if (!src) {
  console.error("usage: node scripts/trace-coast.mjs <image.png>");
  process.exit(1);
}

const TARGET_W = 730; // OriginMap viewBox
const TARGET_H = 1000;

const img = sharp(src).flatten({ background: "#ffffff" });
const { width, height } = await img.metadata();
const raw = await img.raw().toBuffer();
const ch = raw.length / (width * height);

// 1) Collect "ink" pixels (anything clearly not white).
const ink = new Set();
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * ch;
    const r = raw[i], g = raw[i + 1], b = raw[i + 2];
    if (r + g + b < 720) ink.add(y * width + x); // < ~240 avg
  }
}
console.error(`ink pixels: ${ink.size} (${width}x${height})`);

// 2) Downsample to grid cells (centroid per cell) to thin the stroke.
const CELL = Math.max(2, Math.round(width / 260));
const cells = new Map(); // cellKey -> {sx, sy, n}
for (const p of ink) {
  const x = p % width, y = (p / width) | 0;
  const key = ((y / CELL) | 0) * 100000 + ((x / CELL) | 0);
  const c = cells.get(key) ?? { sx: 0, sy: 0, n: 0 };
  c.sx += x; c.sy += y; c.n++;
  cells.set(key, c);
}
let pts = [...cells.values()].map((c) => ({ x: c.sx / c.n, y: c.sy / c.n }));
console.error(`cells: ${pts.length} (CELL=${CELL})`);

// 3) Greedy nearest-neighbour walk. Start at the topmost point (NE tail).
let start = pts.reduce((a, b) => (b.y < a.y ? b : a));
const unvisited = new Set(pts);
unvisited.delete(start);
const path = [start];
let cur = start;
const MAX_JUMP = CELL * 6;
while (unvisited.size) {
  let best = null, bestD = Infinity;
  for (const p of unvisited) {
    const d = (p.x - cur.x) ** 2 + (p.y - cur.y) ** 2;
    if (d < bestD) { bestD = d; best = p; }
  }
  if (Math.sqrt(bestD) > MAX_JUMP) break; // stroke ended (stray specks left)
  path.push(best);
  unvisited.delete(best);
  cur = best;
}
console.error(`walked: ${path.length} pts, leftover: ${unvisited.size}`);

// 4) Douglas-Peucker simplification.
function dp(points, eps) {
  if (points.length < 3) return points;
  const [a, b] = [points[0], points[points.length - 1]];
  let maxD = 0, idx = 0;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    const d = Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / len;
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD <= eps) return [a, b];
  return [...dp(points.slice(0, idx + 1), eps).slice(0, -1), ...dp(points.slice(idx), eps)];
}
const simplified = dp(path, CELL * 0.55);
console.error(`simplified: ${simplified.length} pts`);

// 5) Scale into the viewBox with a small margin.
const xs = simplified.map((p) => p.x), ys = simplified.map((p) => p.y);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minY = Math.min(...ys), maxY = Math.max(...ys);
const M = 18;
const s = Math.min((TARGET_W - 2 * M) / (maxX - minX), (TARGET_H - 2 * M) / (maxY - minY));
const ox = (TARGET_W - (maxX - minX) * s) / 2;
const oy = (TARGET_H - (maxY - minY) * s) / 2;
const sc = simplified.map((p) => ({
  x: +( (p.x - minX) * s + ox ).toFixed(1),
  y: +( (p.y - minY) * s + oy ).toFixed(1),
}));

let d = `M${sc[0].x} ${sc[0].y}`;
for (let i = 1; i < sc.length; i++) d += `\nL ${sc[i].x} ${sc[i].y}`;
console.log(d);
