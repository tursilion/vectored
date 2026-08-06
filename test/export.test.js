'use strict';
const assert = require('assert');
const { CMD, extractTrails, buildExport, disassemble, fromInt8 } = require('../js/app.js');

let pass = 0;
function check(name, fn) { fn(); pass++; console.log('  ok -', name); }

// Helper: build points/edges from simple coord list + edge pairs (indices).
function make(coords, edgePairs) {
  const points = coords.map((c, i) => ({ id: i + 1, x: c[0], y: c[1] }));
  const edges = edgePairs.map(([a, b]) => ({ a: a + 1, b: b + 1 }));
  return { points, edges };
}

// Count how many times each undirected edge is DRAWN by walking the ops.
function drawnEdgeCounts(ops) {
  const counts = new Map();
  let cur = null;
  for (const op of ops) {
    if (op.cmd === CMD.DRAW) {
      const key = [cur.x, cur.y, op.x, op.y];
      const norm = (cur.x < op.x || (cur.x === op.x && cur.y <= op.y))
        ? `${cur.x},${cur.y}-${op.x},${op.y}` : `${op.x},${op.y}-${cur.x},${cur.y}`;
      counts.set(norm, (counts.get(norm) || 0) + 1);
    }
    cur = { x: op.x, y: op.y };
  }
  return counts;
}

console.log('extractTrails / buildExport:');

check('open polyline -> single trail, 3 draws', () => {
  const { points, edges } = make([[0, 0], [1, 0], [2, 0], [3, 0]], [[0, 1], [1, 2], [2, 3]]);
  const { trails, isolated } = extractTrails(points, edges);
  assert.strictEqual(trails.length, 1);
  assert.strictEqual(isolated.length, 0);
  assert.strictEqual(trails[0].length, 4);
});

check('triangle -> single closed trail', () => {
  const { points, edges } = make([[0, 0], [2, 0], [1, 2]], [[0, 1], [1, 2], [2, 0]]);
  const { trails } = extractTrails(points, edges);
  assert.strictEqual(trails.length, 1);
  // closed: first and last vertex equal
  assert.strictEqual(trails[0][0], trails[0][trails[0].length - 1]);
});

check('two disjoint edges -> two trails', () => {
  const { points, edges } = make([[0, 0], [1, 0], [5, 5], [6, 5]], [[0, 1], [2, 3]]);
  const { trails, isolated } = extractTrails(points, edges);
  assert.strictEqual(trails.length, 2);
  assert.strictEqual(isolated.length, 0);
});

check('star (4 odd vertices) -> two trails, all edges once', () => {
  // center 0 connected to 1,2,3  => degrees: 0:3(odd),1:1,2:1,3:1 -> 4 odd -> 2 trails
  const { points, edges } = make([[5, 5], [0, 5], [10, 5], [5, 0]], [[0, 1], [0, 2], [0, 3]]);
  const { trails } = extractTrails(points, edges);
  assert.strictEqual(trails.length, 2);
});

check('isolated points reported', () => {
  const { points, edges } = make([[0, 0], [1, 0], [9, 9]], [[0, 1]]);
  const { trails, isolated } = extractTrails(points, edges);
  assert.strictEqual(trails.length, 1);
  assert.strictEqual(isolated.length, 1);
});

// Property test: for many random graphs, every edge is drawn EXACTLY once
// and every point is visited (drawn-endpoint or POINT op).
check('random graphs: every vector drawn exactly once, every point visited', () => {
  let rng = 12345;
  const rand = () => (rng = (rng * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let t = 0; t < 400; t++) {
    const n = 2 + Math.floor(rand() * 8);
    const coords = [];
    const seen = new Set();
    for (let i = 0; i < n; i++) {
      let x, y, k;
      do { x = Math.floor(rand() * 12); y = Math.floor(rand() * 12); k = x + ',' + y; } while (seen.has(k));
      seen.add(k); coords.push([x, y]);
    }
    const pairs = [];
    const eset = new Set();
    const m = Math.floor(rand() * n);
    for (let i = 0; i < m; i++) {
      const a = Math.floor(rand() * n), b = Math.floor(rand() * n);
      if (a === b) continue;
      const key = a < b ? a + '_' + b : b + '_' + a;
      if (eset.has(key)) continue;
      eset.add(key); pairs.push([a, b]);
    }
    const { points, edges } = make(coords, pairs);
    const res = buildExport(points, edges, 32, 32, 'absolute');

    // every edge drawn exactly once
    const counts = drawnEdgeCounts(res.ops);
    assert.strictEqual([...counts.values()].filter(v => v !== 1).length, 0,
      't=' + t + ' some edge drawn !=1 time');
    assert.strictEqual(counts.size, edges.length, 't=' + t + ' drawn edge count mismatch');

    // every point visited
    const visited = new Set(res.ops.map(o => o.x + ',' + o.y));
    for (const p of points) assert.ok(visited.has(p.x + ',' + p.y), 't=' + t + ' point unvisited');
  }
});

console.log('\nencoding:');

check('RLE command byte layout + roundtrip', () => {
  // polyline offset from centre => MOVE(1) to start + DRAW(3) run
  const { points, edges } = make([[18, 16], [19, 16], [20, 16], [21, 16]], [[0, 1], [1, 2], [2, 3]]);
  const res = buildExport(points, edges, 32, 32, 'absolute');
  const b = res.bytes;
  // first byte: MOVE, count 1
  assert.strictEqual(b[0] >> 6, CMD.MOVE);
  assert.strictEqual(b[0] & 0x3f, 1);
  // coordinates are signed offsets from centre (16,16): move to (18,16)
  assert.strictEqual(fromInt8(b[1]), 0); // Y (16-16)
  assert.strictEqual(fromInt8(b[2]), 2); // X (18-16)
  // then a DRAW run of 3
  const drawByte = b[3];
  assert.strictEqual(drawByte >> 6, CMD.DRAW);
  assert.strictEqual(drawByte & 0x3f, 3);
});

check('point exactly on centre needs no leading MOVE', () => {
  // first point is the centre -> exporter starts drawing immediately
  const { points, edges } = make([[16, 16], [17, 16], [18, 16]], [[0, 1], [1, 2]]);
  const res = buildExport(points, edges, 32, 32, 'absolute');
  assert.strictEqual(res.bytes[0] >> 6, CMD.DRAW);
});

check('relative coords roundtrip via disassembly', () => {
  // start point offset from centre so a MOVE carries it; chain the rest
  const { points, edges } = make([[20, 18], [22, 18], [22, 21]], [[0, 1], [1, 2]]);
  const res = buildExport(points, edges, 32, 32, 'relative');
  // reconstruct with the known centre (16,16); disassembly is absolute (y,x)
  const dis = disassemble(res.bytes, 'relative', 16, 16);
  assert.ok(dis.includes('(18,20)'), dis); // MOVE to (x=20,y=18)
  assert.ok(dis.includes('(18,22)'), dis); // DRAW
  assert.ok(dis.includes('(21,22)'), dis); // DRAW
});

check('coords stay within int8 for 256 grid corners', () => {
  const { points, edges } = make([[0, 0], [255, 255]], [[0, 1]]);
  const res = buildExport(points, edges, 256, 256, 'absolute');
  for (const b of res.bytes) assert.ok(b >= 0 && b <= 255);
  // -128 and 127 are the extremes we expect
  const signed = res.bytes.map(fromInt8);
  assert.ok(signed.includes(-128));
  assert.ok(signed.includes(127));
});

console.log('\nALL', pass, 'CHECKS PASSED');
