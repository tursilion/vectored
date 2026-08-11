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
    // merge off: this checks the exact Euler decomposition (one vector/edge)
    const res = buildExport(points, edges, 32, 32, 'absolute', 7, false);

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
  const res = buildExport(points, edges, 32, 32, 'absolute', 0, false); // no merge: raw layout
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

check('first stroke always emits a leading MOVE from the origin', () => {
  // even when the first point is the centre, drawing starts with a MOVE(0,0)
  // so the beam leaves the zero reference settled.
  const { points, edges } = make([[16, 16], [17, 16], [18, 16]], [[0, 1], [1, 2]]);
  const res = buildExport(points, edges, 32, 32, 'absolute', 0);
  assert.strictEqual(res.bytes[0] >> 6, CMD.MOVE);
  assert.strictEqual(res.bytes[0] & 0x3f, 1);
  assert.strictEqual(fromInt8(res.bytes[1]), 0); // Y offset 0 (at centre)
  assert.strictEqual(fromInt8(res.bytes[2]), 0); // X offset 0
});

check('Y axis is flipped to Vectrex orientation (+Y up)', () => {
  // grid y above centre (smaller) exports as positive Y; below as negative.
  const { points, edges } = make([[16, 12], [16, 20]], [[0, 1]]);
  const res = buildExport(points, edges, 32, 32, 'absolute', 0);
  const dis = disassemble(res.bytes, 'absolute');
  assert.ok(dis.includes('(4,0)'), dis);   // grid y=12 -> +4
  assert.ok(dis.includes('(-4,0)'), dis);  // grid y=20 -> -4
});

check('relative coords roundtrip via disassembly (centre offsets, flipped Y)', () => {
  const { points, edges } = make([[20, 18], [22, 18], [22, 21]], [[0, 1], [1, 2]]);
  const res = buildExport(points, edges, 32, 32, 'relative', 0);
  const dis = disassemble(res.bytes, 'relative');
  assert.ok(dis.includes('(-2,4)'), dis);  // MOVE  (x=20,y=18) -> off (16-18,20-16)
  assert.ok(dis.includes('(-2,6)'), dis);  // DRAW  (x=22,y=18)
  assert.ok(dis.includes('(-5,6)'), dis);  // DRAW  (x=22,y=21)
});

check('RESET re-zeros without changing geometry (renderer round-trip)', () => {
  // 10-point polyline; with resetN=3 several RESET opcodes fire mid-stroke.
  const coords = [];
  for (let i = 0; i < 10; i++) coords.push([4 + i, 8 + (i % 3)]);
  const pairs = [];
  for (let i = 0; i < 9; i++) pairs.push([i, i + 1]);
  const { points, edges } = make(coords, pairs);
  const res = buildExport(points, edges, 32, 32, 'absolute', 3, false); // merge off: fixed vector count

  // Walk the bytes exactly as demo/render.c does (absolute offsets, +Y up).
  const b = res.bytes;
  let i = 0, cy = 0, cx = 0, resets = 0;
  const visited = new Set();
  while (i < b.length) {
    const cmd = b[i++], op = cmd & 0xc0, count = cmd & 0x3f;
    if (op === 0x00) { resets++; cy = 0; cx = 0; continue; }
    for (let k = 0; k < count; k++) {
      cy = fromInt8(b[i++]); cx = fromInt8(b[i++]);   // absolute offset from centre
      visited.add(cy + ',' + cx);
    }
  }
  assert.ok(resets >= 2, 'expected multiple RESET opcodes, got ' + resets);
  // every original point (as a Vectrex centre offset) is reached
  for (const [x, y] of coords) assert.ok(visited.has((16 - y) + ',' + (x - 16)),
    'missing point ' + x + ',' + y);
});

check('relative export is native BIOS deltas (renderer round-trip)', () => {
  // Same shape, relative mode: the demo renderer applies deltas with no pen
  // tracking; a RESET returns the accumulator to the origin.
  const coords = [];
  for (let i = 0; i < 10; i++) coords.push([4 + i, 8 + (i % 3)]);
  const pairs = [];
  for (let i = 0; i < 9; i++) pairs.push([i, i + 1]);
  const { points, edges } = make(coords, pairs);
  const res = buildExport(points, edges, 32, 32, 'relative', 3, false); // merge off: fixed vector count

  const b = res.bytes;
  let i = 0, cy = 0, cx = 0, resets = 0;   // running absolute offset from centre
  const visited = new Set();
  while (i < b.length) {
    const cmd = b[i++], op = cmd & 0xc0, count = cmd & 0x3f;
    if (op === 0x00) { resets++; cy = 0; cx = 0; continue; }  // RESET -> origin
    for (let k = 0; k < count; k++) {
      cy += fromInt8(b[i++]); cx += fromInt8(b[i++]);         // apply delta
      visited.add(cy + ',' + cx);
    }
  }
  assert.ok(resets >= 2, 'expected RESET opcodes, got ' + resets);
  for (const [x, y] of coords) assert.ok(visited.has((16 - y) + ',' + (x - 16)),
    'missing point ' + x + ',' + y);
});

const drawCount = (res) => res.ops.filter(o => o.cmd === CMD.DRAW).length;

check('collinear merge: straight polyline collapses to one vector', () => {
  // four colinear points -> 3 edges; merged they draw as a single vector.
  const { points, edges } = make([[10, 16], [12, 16], [14, 16], [16, 16]],
                                  [[0, 1], [1, 2], [2, 3]]);
  assert.strictEqual(drawCount(buildExport(points, edges, 32, 32, 'relative', 0, true)), 1);
  assert.strictEqual(drawCount(buildExport(points, edges, 32, 32, 'relative', 0, false)), 3);
});

check('collinear merge: draws straight through a junction (3 -> 2)', () => {
  // the bottom line (BL-BM-BR) is colinear; BM also carries a perpendicular
  // up to T.  Merged: bottom is one vector, perpendicular is another = 2.
  const BL = 0, BM = 1, BR = 2, T = 3;
  const { points, edges } = make([[13, 20], [16, 20], [19, 20], [16, 14]],
                                  [[BL, BM], [BM, BR], [BM, T]]);
  assert.strictEqual(drawCount(buildExport(points, edges, 32, 32, 'relative', 0, true)), 2);
  assert.strictEqual(drawCount(buildExport(points, edges, 32, 32, 'relative', 0, false)), 3);
});

check('collinear merge: a real corner is preserved', () => {
  // right-angle: not colinear, so both edges survive whether merging or not.
  const { points, edges } = make([[10, 16], [14, 16], [14, 20]], [[0, 1], [1, 2]]);
  assert.strictEqual(drawCount(buildExport(points, edges, 32, 32, 'relative', 0, true)), 2);
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
