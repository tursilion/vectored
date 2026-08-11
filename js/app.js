'use strict';
/* Vectored — vector grid editor.
 * The file is split into two parts:
 *   1. Pure logic (graph decomposition, path optimisation, byte encoding).
 *      No DOM access — also exported for node-based unit tests.
 *   2. UI wiring — only runs inside a browser (guarded by `typeof document`).
 */

/* ======================================================================
 * PART 1 — PURE EXPORT LOGIC
 * ==================================================================== */

const CMD = { RESET: 0, MOVE: 1, DRAW: 2, POINT: 3 };
const DEFAULT_RESET_N = 7;   // re-zero the beam every N drawn vectors/dots
const BRUTE_MAX = 11; // exhaustively optimise ordering up to this many strokes

function toInt8(v) {
  v = Math.round(v);
  if (v > 127) v = 127;
  if (v < -128) v = -128;
  return v & 0xff;
}
function fromInt8(b) { return b & 0x80 ? b - 256 : b; }
function dist(a, b) { const dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }

/* Decompose the vector graph into the minimum number of open/closed trails
 * such that every edge (vector) is traversed exactly once — this is what
 * guarantees no vector is ever drawn twice. Isolated points (degree 0) are
 * returned separately. Uses Hierholzer with virtual edges added between odd
 * vertices so a single Euler walk splits into the minimum trail set. */
function extractTrails(points, edges) {
  const coord = new Map(points.map(p => [p.id, { x: p.x, y: p.y }]));
  const ids = points.map(p => p.id);
  const realAdj = new Map(ids.map(id => [id, []]));
  edges.forEach((e, i) => {
    if (!coord.has(e.a) || !coord.has(e.b) || e.a === e.b) return;
    realAdj.get(e.a).push({ to: e.b, e: i });
    realAdj.get(e.b).push({ to: e.a, e: i });
  });

  const seen = new Set();
  const comps = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    if (realAdj.get(id).length === 0) { seen.add(id); continue; }
    const stack = [id], comp = [];
    seen.add(id);
    while (stack.length) {
      const v = stack.pop();
      comp.push(v);
      for (const { to } of realAdj.get(v)) if (!seen.has(to)) { seen.add(to); stack.push(to); }
    }
    comps.push(comp);
  }
  const isolated = ids.filter(id => realAdj.get(id).length === 0);

  const trails = [];
  for (const comp of comps) {
    const deg = new Map(comp.map(v => [v, realAdj.get(v).length]));
    const odd = comp.filter(v => deg.get(v) % 2 === 1);

    const compEdgeIdx = new Set();
    for (const v of comp) for (const { e } of realAdj.get(v)) compEdgeIdx.add(e);

    const combined = [];
    for (const ei of compEdgeIdx)
      combined.push({ a: edges[ei].a, b: edges[ei].b, virtual: false, used: false });
    // Pair odd vertices with virtual edges, leaving the first & last odd
    // vertices as the open ends of a single Euler trail.
    if (odd.length > 2)
      for (let k = 1; k + 1 < odd.length; k += 2)
        combined.push({ a: odd[k], b: odd[k + 1], virtual: true, used: false });

    const adj = new Map(comp.map(v => [v, []]));
    combined.forEach((c, ci) => { adj.get(c.a).push({ to: c.b, ci }); adj.get(c.b).push({ to: c.a, ci }); });
    const ptr = new Map(comp.map(v => [v, 0]));

    const start = odd.length > 0 ? odd[0] : comp[0];
    const stV = [start], stE = [-1], outV = [], outE = [];
    while (stV.length) {
      const v = stV[stV.length - 1];
      const list = adj.get(v);
      let p = ptr.get(v);
      while (p < list.length && combined[list[p].ci].used) p++;
      ptr.set(v, p);
      if (p < list.length) {
        const rec = list[p];
        combined[rec.ci].used = true;
        stV.push(rec.to); stE.push(rec.ci);
      } else {
        outV.push(v); outE.push(stE[stE.length - 1]);
        stV.pop(); stE.pop();
      }
    }
    outV.reverse(); outE.reverse();
    // Edge between outV[i-1] and outV[i] is outE[i]; split at virtual edges.
    let cur = [outV[0]];
    for (let i = 1; i < outV.length; i++) {
      const ci = outE[i];
      if (ci >= 0 && combined[ci].virtual) {
        if (cur.length >= 2) trails.push(cur);
        cur = [outV[i]];
      } else {
        cur.push(outV[i]);
      }
    }
    if (cur.length >= 2) trails.push(cur);
  }
  return { trails, isolated, coord };
}

function strokeEntryExit(stroke, orient) {
  if (stroke.kind === 'point') return { entry: stroke.pt, exit: stroke.pt };
  const pts = stroke.pts;
  return orient
    ? { entry: pts[pts.length - 1], exit: pts[0] }
    : { entry: pts[0], exit: pts[pts.length - 1] };
}
function orientCount(stroke) { return stroke.kind === 'point' ? 1 : 2; }

/* Optimal ordering + orientation of strokes minimising pen-up travel.
 * Draw length is invariant (every edge drawn once), so only MOVE/POINT
 * jumps matter. Brute force (with per-permutation orientation DP) when the
 * stroke count is small; nearest-neighbour + 2-opt otherwise. */
function optimizeStrokes(strokes, origin) {
  const n = strokes.length;
  if (n === 0) return [];
  if (n === 1) return [{ stroke: strokes[0], orient: 0 }];

  const orderCost = (order) => {
    // DP over orientations for a fixed order; returns {cost, orients}.
    const oc = order.map(i => orientCount(strokes[i]));
    let prev = [];
    const back = [];
    for (let o = 0; o < oc[0]; o++) {
      const { entry } = strokeEntryExit(strokes[order[0]], o);
      prev.push(dist(origin, entry));
    }
    back.push(null);
    for (let k = 1; k < order.length; k++) {
      const cur = new Array(oc[k]).fill(Infinity);
      const bp = new Array(oc[k]).fill(0);
      for (let o = 0; o < oc[k]; o++) {
        const { entry } = strokeEntryExit(strokes[order[k]], o);
        for (let po = 0; po < oc[k - 1]; po++) {
          const { exit } = strokeEntryExit(strokes[order[k - 1]], po);
          const c = prev[po] + dist(exit, entry);
          if (c < cur[o]) { cur[o] = c; bp[o] = po; }
        }
      }
      prev = cur; back.push(bp);
    }
    let best = Infinity, bo = 0;
    for (let o = 0; o < prev.length; o++) if (prev[o] < best) { best = prev[o]; bo = o; }
    const orients = new Array(order.length);
    orients[order.length - 1] = bo;
    for (let k = order.length - 1; k > 0; k--) orients[k - 1] = back[k][orients[k]];
    return { cost: best, orients };
  };

  let bestOrder = null, bestOrients = null, bestCost = Infinity;

  if (n <= BRUTE_MAX) {
    const idx = Array.from({ length: n }, (_, i) => i);
    // Heap's algorithm over permutations.
    const c = new Array(n).fill(0);
    const consider = () => {
      const r = orderCost(idx);
      if (r.cost < bestCost) { bestCost = r.cost; bestOrder = idx.slice(); bestOrients = r.orients; }
    };
    consider();
    let i = 0;
    while (i < n) {
      if (c[i] < i) {
        const j = i % 2 === 0 ? 0 : c[i];
        [idx[j], idx[i]] = [idx[i], idx[j]];
        consider();
        c[i]++; i = 0;
      } else { c[i] = 0; i++; }
    }
  } else {
    // Nearest-neighbour seed.
    const used = new Array(n).fill(false);
    const order = [];
    let curPos = origin;
    for (let step = 0; step < n; step++) {
      let bi = -1, bd = Infinity;
      for (let i = 0; i < n; i++) {
        if (used[i]) continue;
        for (let o = 0; o < orientCount(strokes[i]); o++) {
          const d = dist(curPos, strokeEntryExit(strokes[i], o).entry);
          if (d < bd) { bd = d; bi = i; }
        }
      }
      used[bi] = true; order.push(bi);
      const r0 = orderCost(order);
      curPos = strokeEntryExit(strokes[order[order.length - 1]], r0.orients[order.length - 1]).exit;
    }
    let cur = orderCost(order);
    bestCost = cur.cost; bestOrder = order.slice(); bestOrients = cur.orients;
    // 2-opt.
    let improved = true, guard = 0;
    while (improved && guard++ < 40) {
      improved = false;
      for (let a = 0; a < n - 1; a++)
        for (let b = a + 1; b < n; b++) {
          const cand = bestOrder.slice();
          let lo = a, hi = b;
          while (lo < hi) { [cand[lo], cand[hi]] = [cand[hi], cand[lo]]; lo++; hi--; }
          const r = orderCost(cand);
          if (r.cost < bestCost - 1e-9) {
            bestCost = r.cost; bestOrder = cand; bestOrients = r.orients; improved = true;
          }
        }
    }
  }
  return bestOrder.map((si, k) => ({ stroke: strokes[si], orient: bestOrients[k] }));
}

function encodeRLE(ops, cx, cy, coordMode) {
  // Y is negated on the way out: grid space is +Y down, the Vectrex is +Y up.
  const bytes = [];
  let px = cx, py = cy;
  let i = 0;
  while (i < ops.length) {
    const cmd = ops[i].cmd;
    if (cmd === CMD.RESET) {
      // RESET carries no operands; the beam is back at the object origin.
      bytes.push(CMD.RESET << 6);
      px = cx; py = cy;
      i++;
      continue;
    }
    let j = i;
    while (j < ops.length && ops[j].cmd === cmd && (j - i) < 63) j++;
    bytes.push((cmd << 6) | (j - i));
    for (let k = i; k < j; k++) {
      const o = ops[k];
      let Y, X;
      if (coordMode === 'relative') { Y = py - o.y; X = o.x - px; py = o.y; px = o.x; }
      else { Y = cy - o.y; X = o.x - cx; }
      bytes.push(toInt8(Y), toInt8(X));
    }
    i = j;
  }
  return bytes;
}

/* Insert a RESET (+ a MOVE back to the resume point) after every resetN drawn
 * vectors/dots, so the renderer can re-zero the beam and shed accumulated
 * integrator drift.  MOVEs don't count toward the tally. */
function insertResets(ops, resetN) {
  if (!resetN || resetN <= 0) return ops.slice();
  const out = [];
  let drawn = 0, pen = null;
  for (let idx = 0; idx < ops.length; idx++) {
    const op = ops[idx];
    out.push(op);
    if (op.cmd === CMD.MOVE || op.cmd === CMD.DRAW || op.cmd === CMD.POINT)
      pen = { x: op.x, y: op.y };
    if (op.cmd === CMD.DRAW || op.cmd === CMD.POINT) {
      if (++drawn >= resetN && idx < ops.length - 1) {
        out.push({ cmd: CMD.RESET });
        out.push({ cmd: CMD.MOVE, x: pen.x, y: pen.y });   // move back from origin
        drawn = 0;
      }
    }
  }
  return out;
}

/* Merge runs of collinear edges into single edges before trail extraction, so
 * a straight line made of several vectors draws as one.  At each vertex the two
 * edges that continue straight through it (collinear, opposite directions) are
 * paired; maximal straight runs are then traced end to end and replaced by one
 * edge.  Interior pass-through vertices are dropped, but a junction vertex (its
 * other, non-collinear edges survive) is kept — the merged vector just draws
 * straight through it and the junction's own stroke still reaches it.  Points
 * that were isolated to begin with are preserved (they draw as dots). */
function contractCollinear(points, edges) {
  const coord = new Map(points.map(p => [p.id, { x: p.x, y: p.y }]));
  const adj = new Map(points.map(p => [p.id, []]));
  const valid = [];
  edges.forEach((e, i) => {
    if (!coord.has(e.a) || !coord.has(e.b) || e.a === e.b) return;
    adj.get(e.a).push({ to: e.b, e: i });
    adj.get(e.b).push({ to: e.a, e: i });
    valid.push(i);
  });

  // Pair collinear-opposite edges (a straight pass-through) at each vertex.
  const pair = new Map();   // `${vertex}:${edgeIdx}` -> partner edgeIdx
  for (const p of points) {
    const v = p.id, cv = coord.get(v), list = adj.get(v);
    const used = new Array(list.length).fill(false);
    for (let i = 0; i < list.length; i++) {
      if (used[i]) continue;
      const ci = coord.get(list[i].to), dix = ci.x - cv.x, diy = ci.y - cv.y;
      for (let j = i + 1; j < list.length; j++) {
        if (used[j]) continue;
        const cj = coord.get(list[j].to), djx = cj.x - cv.x, djy = cj.y - cv.y;
        if (dix * djy - diy * djx === 0 && dix * djx + diy * djy < 0) {
          used[i] = used[j] = true;
          pair.set(v + ':' + list[i].e, list[j].e);
          pair.set(v + ':' + list[j].e, list[i].e);
          break;
        }
      }
    }
  }

  // Trace maximal straight runs (start only from an open, unpaired end).
  const other = (ei, v) => (edges[ei].a === v ? edges[ei].b : edges[ei].a);
  const done = new Array(edges.length).fill(false);
  const newEdges = [];
  const trace = (startV, startE) => {
    let v = startV, e = startE;
    done[e] = true;
    let far = other(e, v);
    while (pair.has(far + ':' + e)) {
      const ne = pair.get(far + ':' + e);
      if (done[ne]) break;
      done[ne] = true; v = far; e = ne; far = other(e, v);
    }
    newEdges.push({ a: startV, b: far });
  };
  for (const i of valid) {
    if (done[i]) continue;
    const e = edges[i];
    if (!pair.has(e.a + ':' + i)) trace(e.a, i);
    else if (!pair.has(e.b + ':' + i)) trace(e.b, i);
    // else interior of a run: reached later from its open end
  }
  for (const i of valid)  // straight cycles (no open end): leave unmerged
    if (!done[i]) { done[i] = true; newEdges.push({ a: edges[i].a, b: edges[i].b }); }

  // Keep endpoints of the merged edges, plus points that started isolated.
  const deg = new Map(points.map(p => [p.id, 0]));
  for (const i of valid) { deg.set(edges[i].a, deg.get(edges[i].a) + 1); deg.set(edges[i].b, deg.get(edges[i].b) + 1); }
  const referenced = new Set();
  for (const ne of newEdges) { referenced.add(ne.a); referenced.add(ne.b); }
  const keepPoints = points.filter(p => referenced.has(p.id) || deg.get(p.id) === 0);
  return { points: keepPoints, edges: newEdges };
}

function buildExport(points, edges, gridW, gridH, coordMode, resetN = DEFAULT_RESET_N,
                     mergeCollinear = true) {
  const cx = gridW >> 1, cy = gridH >> 1;
  if (mergeCollinear) { const c = contractCollinear(points, edges); points = c.points; edges = c.edges; }
  const { trails, isolated, coord } = extractTrails(points, edges);
  const strokes = [];
  for (const t of trails) strokes.push({ kind: 'trail', pts: t.map(id => coord.get(id)) });
  for (const id of isolated) strokes.push({ kind: 'point', pt: coord.get(id) });
  if (strokes.length === 0) return { bytes: [], ops: [], trails, isolated };

  const ordered = optimizeStrokes(strokes, { x: cx, y: cy });
  const ops = [];
  let cur = { x: cx, y: cy };
  for (const { stroke, orient } of ordered) {
    if (stroke.kind === 'point') {
      ops.push({ cmd: CMD.POINT, x: stroke.pt.x, y: stroke.pt.y });
      cur = stroke.pt;
    } else {
      const seq = orient ? stroke.pts.slice().reverse() : stroke.pts;
      // Always emit the leading MOVE for the first stroke so drawing starts
      // from the object origin (centre) with the integrators settled, even
      // when the trail happens to begin at the centre.
      if (ops.length === 0 || cur.x !== seq[0].x || cur.y !== seq[0].y)
        ops.push({ cmd: CMD.MOVE, x: seq[0].x, y: seq[0].y });
      for (let k = 1; k < seq.length; k++) ops.push({ cmd: CMD.DRAW, x: seq[k].x, y: seq[k].y });
      cur = seq[seq.length - 1];
    }
  }
  const withResets = insertResets(ops, resetN);
  const bytes = encodeRLE(withResets, cx, cy, coordMode);
  return { bytes, ops: withResets, trails, isolated };
}

function disassemble(bytes, coordMode) {
  // Reports (Y,X) as signed offsets from the object centre, in Vectrex
  // orientation (+Y up) — the same values the renderer tracks.  A RESET
  // returns to the origin (0,0).
  const name = { 0: 'RESET', 1: 'MOVE', 2: 'DRAW', 3: 'POINT' };
  const lines = [];
  let i = 0, oy = 0, ox = 0;
  while (i < bytes.length) {
    const b = bytes[i++];
    const cmd = b >> 6, count = b & 0x3f;
    if (cmd === CMD.RESET) { oy = 0; ox = 0; lines.push('RESET'); continue; }
    const parts = [];
    for (let k = 0; k < count && i + 1 < bytes.length; k++) {
      const Y = fromInt8(bytes[i++]), X = fromInt8(bytes[i++]);
      if (coordMode === 'relative') { oy += Y; ox += X; } else { oy = Y; ox = X; }
      parts.push(`(${oy},${ox})`);
    }
    lines.push(`${name[cmd]} x${count}  ${parts.join(' ')}`);
  }
  return lines.join('\n');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CMD, DEFAULT_RESET_N, extractTrails, optimizeStrokes, encodeRLE, insertResets, contractCollinear, buildExport, disassemble, toInt8, fromInt8 };
}

/* ======================================================================
 * PART 2 — UI (browser only)
 * ==================================================================== */
if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', () => {
  const $ = s => document.querySelector(s);

  let project = newProject();
  const bgCache = new Map(); // dataURL -> HTMLImageElement
  let mode = 'line';
  let bgEdit = false;
  let lastPointId = null;      // active chain tail for line mode
  let drag = null;             // {type, ...}
  let hover = null;            // hovered point id
  let lastExportSource = '';
  let ghostIndex = -1;         // object shown as faded reference frame (-1 = none)
  let ghostOpacity = 0.3;

  const canvas = $('#stage');
  const ctx = canvas.getContext('2d');

  function newObject(name) {
    return {
      name: name || 'Object', nextId: 1, points: [], edges: [],
      bg: { name: null, dataURL: null, x: 0, y: 0, scale: 1, opacity: 0.5 }
    };
  }
  function newProject() {
    return { gridW: 64, gridH: 64, scale: 10, activeIndex: 0, objects: [newObject('Object 1')] };
  }
  function obj() { return project.objects[project.activeIndex]; }

  /* ---- undo (whole-project snapshots, 10 levels) ---- */
  const UNDO_LIMIT = 10;
  let undoStack = [];
  let coalesceKey = null; // groups a continuous gesture into one undo entry
  function pushUndo(key) {
    if (key && key === coalesceKey) return; // already snapshotted this gesture
    undoStack.push(JSON.stringify(project));
    if (undoStack.length > UNDO_LIMIT) undoStack.shift();
    coalesceKey = key || null;
  }
  function undo() {
    if (!undoStack.length) return;
    project = JSON.parse(undoStack.pop());
    coalesceKey = null; drag = null; lastPointId = null; hover = null;
    project.activeIndex = Math.min(project.activeIndex || 0, project.objects.length - 1);
    $('#gridW').value = project.gridW; $('#gridH').value = project.gridH; $('#scale').value = project.scale;
    refreshObjSelect(); syncBgInputs(); resizeCanvas(); redraw();
  }

  /* ---- coordinate helpers ---- */
  const g2s = c => c * project.scale;
  function s2g(px) { return Math.round(px / project.scale); }
  function clampCoord(c, max) { return Math.max(0, Math.min(max - 1, c)); }
  function mousePos(e) {
    const r = canvas.getBoundingClientRect();
    return { mx: e.clientX - r.left, my: e.clientY - r.top };
  }

  /* ---- graph edit helpers ---- */
  const edgeExists = (o, a, b) => o.edges.some(e => (e.a === a && e.b === b) || (e.a === b && e.b === a));
  function addEdge(o, a, b) { if (a !== b && !edgeExists(o, a, b)) o.edges.push({ a, b }); }
  function pointAt(o, x, y) { return o.points.find(p => p.x === x && p.y === y) || null; }
  function nearestPoint(o, mx, my) {
    const thr = Math.max(8, project.scale * 0.55);
    let best = null, bd = thr;
    for (const p of o.points) {
      const d = Math.hypot(g2s(p.x) - mx, g2s(p.y) - my);
      if (d <= bd) { bd = d; best = p; }
    }
    return best;
  }
  function removePoint(o, p) {
    const con = o.edges.filter(e => e.a === p.id || e.b === p.id);
    if (con.length === 2) {
      const nb = con.map(e => (e.a === p.id ? e.b : e.a));
      o.edges = o.edges.filter(e => e.a !== p.id && e.b !== p.id);
      if (nb[0] !== nb[1]) addEdge(o, nb[0], nb[1]);
    } else {
      o.edges = o.edges.filter(e => e.a !== p.id && e.b !== p.id);
    }
    o.points = o.points.filter(q => q.id !== p.id);
    if (lastPointId === p.id) lastPointId = null;
  }

  /* ---- rendering ---- */
  function resizeCanvas() {
    const w = project.gridW * project.scale, h = project.gridH * project.scale;
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function getBgImage(o) {
    if (!o.bg.dataURL) return null;
    let img = bgCache.get(o.bg.dataURL);
    if (!img) {
      img = new Image();
      img.onload = redraw;
      img.src = o.bg.dataURL;
      bgCache.set(o.bg.dataURL, img);
    }
    return img.complete && img.naturalWidth ? img : null;
  }
  function redraw() {
    const o = obj();
    const W = project.gridW * project.scale, H = project.gridH * project.scale;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    // onionskin PNG (behind the grid)
    const img = getBgImage(o);
    if (img) {
      ctx.save();
      ctx.globalAlpha = o.bg.opacity;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, o.bg.x, o.bg.y, img.naturalWidth * o.bg.scale, img.naturalHeight * o.bg.scale);
      ctx.restore();
    }

    // ghost reference frame — another object's vectors, behind the grid
    if (ghostIndex >= 0 && ghostIndex < project.objects.length && ghostIndex !== project.activeIndex) {
      const go = project.objects[ghostIndex];
      const gmap = new Map(go.points.map(p => [p.id, p]));
      ctx.save();
      ctx.globalAlpha = ghostOpacity;
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#c08cff';
      ctx.beginPath();
      for (const e of go.edges) {
        const a = gmap.get(e.a), b = gmap.get(e.b);
        if (!a || !b) continue;
        ctx.moveTo(g2s(a.x), g2s(a.y)); ctx.lineTo(g2s(b.x), g2s(b.y));
      }
      ctx.stroke();
      const gr = Math.max(2, project.scale * 0.22);
      ctx.fillStyle = '#c08cff';
      for (const p of go.points) { ctx.beginPath(); ctx.arc(g2s(p.x), g2s(p.y), gr, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }

    // faint grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(120,140,170,0.14)';
    ctx.beginPath();
    for (let x = 0; x <= project.gridW; x++) { ctx.moveTo(g2s(x) + 0.5, 0); ctx.lineTo(g2s(x) + 0.5, H); }
    for (let y = 0; y <= project.gridH; y++) { ctx.moveTo(0, g2s(y) + 0.5); ctx.lineTo(W, g2s(y) + 0.5); }
    ctx.stroke();
    // emphasised lines every 8 + centre axes
    ctx.strokeStyle = 'rgba(120,140,170,0.26)';
    ctx.beginPath();
    for (let x = 0; x <= project.gridW; x += 8) { ctx.moveTo(g2s(x) + 0.5, 0); ctx.lineTo(g2s(x) + 0.5, H); }
    for (let y = 0; y <= project.gridH; y += 8) { ctx.moveTo(0, g2s(y) + 0.5); ctx.lineTo(W, g2s(y) + 0.5); }
    ctx.stroke();
    const cx = (project.gridW >> 1) * project.scale, cy = (project.gridH >> 1) * project.scale;
    ctx.strokeStyle = 'rgba(90,200,160,0.35)';
    ctx.beginPath();
    ctx.moveTo(cx + 0.5, 0); ctx.lineTo(cx + 0.5, H);
    ctx.moveTo(0, cy + 0.5); ctx.lineTo(W, cy + 0.5);
    ctx.stroke();

    // vectors (brighter than grid)
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(120,200,255,0.95)';
    ctx.beginPath();
    const byId = new Map(o.points.map(p => [p.id, p]));
    for (const e of o.edges) {
      const a = byId.get(e.a), b = byId.get(e.b);
      if (!a || !b) continue;
      ctx.moveTo(g2s(a.x), g2s(a.y)); ctx.lineTo(g2s(b.x), g2s(b.y));
    }
    ctx.stroke();

    // points (prominent)
    const r = Math.max(3, project.scale * 0.32);
    for (const p of o.points) {
      const isHover = hover === p.id;
      const isTail = lastPointId === p.id;
      ctx.beginPath();
      ctx.arc(g2s(p.x), g2s(p.y), r, 0, Math.PI * 2);
      ctx.fillStyle = isTail ? '#ffd24a' : '#ff5d73';
      ctx.fill();
      if (isHover) { ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke(); }
    }

    updateStats();
  }

  /* ---- pointer interaction ---- */
  canvas.addEventListener('mousedown', e => {
    const { mx, my } = mousePos(e);
    const o = obj();
    if (bgEdit) {
      pushUndo();
      drag = { type: 'bg', sx: mx, sy: my, ox: o.bg.x, oy: o.bg.y };
      return;
    }
    if (mode === 'line' || mode === 'point') {
      pushUndo();
      const gx = clampCoord(s2g(mx), project.gridW);
      const gy = clampCoord(s2g(my), project.gridH);
      let p = pointAt(o, gx, gy);
      if (!p) { p = { id: o.nextId++, x: gx, y: gy }; o.points.push(p); }
      if (mode === 'line') {
        if (lastPointId != null && lastPointId !== p.id) addEdge(o, lastPointId, p.id);
        lastPointId = p.id;
      } else {
        lastPointId = null;
      }
    } else if (mode === 'move') {
      const p = nearestPoint(o, mx, my);
      if (p) { pushUndo(); drag = { type: 'point', id: p.id }; }
    } else if (mode === 'remove') {
      const p = nearestPoint(o, mx, my);
      if (p) { pushUndo(); removePoint(o, p); }
    }
    redraw();
  });

  canvas.addEventListener('mousemove', e => {
    const { mx, my } = mousePos(e);
    const o = obj();
    if (drag && drag.type === 'bg') {
      o.bg.x = drag.ox + (mx - drag.sx);
      o.bg.y = drag.oy + (my - drag.sy);
      syncBgInputs();
      redraw();
      return;
    }
    if (drag && drag.type === 'point') {
      const p = o.points.find(q => q.id === drag.id);
      if (p) { p.x = clampCoord(s2g(mx), project.gridW); p.y = clampCoord(s2g(my), project.gridH); redraw(); }
      return;
    }
    const np = (!bgEdit && (mode === 'move' || mode === 'remove')) ? nearestPoint(o, mx, my) : null;
    const id = np ? np.id : null;
    if (id !== hover) { hover = id; redraw(); }
  });

  window.addEventListener('mouseup', () => { drag = null; coalesceKey = null; });

  // right-click breaks the current line chain (start a disconnected polyline)
  canvas.addEventListener('contextmenu', e => { e.preventDefault(); lastPointId = null; redraw(); });

  canvas.addEventListener('wheel', e => {
    if (!bgEdit) return;
    e.preventDefault();
    pushUndo('bg');
    const o = obj();
    const f = e.deltaY < 0 ? 1.05 : 1 / 1.05;
    o.bg.scale = Math.max(0.02, Math.min(100, o.bg.scale * f));
    syncBgInputs();
    redraw();
  }, { passive: false });

  /* ---- toolbar wiring ---- */
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      mode = btn.dataset.mode;
      if (mode === 'line') lastPointId = null; // fresh chain
      hover = null;
      redraw();
    });
  });

  $('#gridW').addEventListener('change', e => {
    pushUndo();
    project.gridW = Math.max(2, Math.min(256, parseInt(e.target.value) || 64));
    e.target.value = project.gridW; resizeCanvas(); redraw();
  });
  $('#gridH').addEventListener('change', e => {
    pushUndo();
    project.gridH = Math.max(2, Math.min(256, parseInt(e.target.value) || 64));
    e.target.value = project.gridH; resizeCanvas(); redraw();
  });
  $('#scale').addEventListener('change', e => {
    project.scale = Math.max(1, Math.min(64, parseInt(e.target.value) || 10));
    e.target.value = project.scale; resizeCanvas(); redraw();
  });

  /* ---- object management ---- */
  function refreshObjSelect() {
    const sel = $('#objSelect');
    sel.innerHTML = '';
    project.objects.forEach((o, i) => {
      const opt = document.createElement('option');
      opt.value = i; opt.textContent = o.name;
      if (i === project.activeIndex) opt.selected = true;
      sel.appendChild(opt);
    });
    refreshGhostSelect();
  }
  function refreshGhostSelect() {
    const sel = $('#ghostSelect');
    sel.innerHTML = '';
    const none = document.createElement('option');
    none.value = '-1'; none.textContent = '(none)';
    sel.appendChild(none);
    project.objects.forEach((o, i) => {
      const opt = document.createElement('option');
      opt.value = i; opt.textContent = o.name;
      sel.appendChild(opt);
    });
    if (ghostIndex >= project.objects.length) ghostIndex = -1;
    sel.value = String(ghostIndex);
  }
  $('#ghostSelect').addEventListener('change', e => { ghostIndex = parseInt(e.target.value); redraw(); });
  $('#ghostOpacity').addEventListener('input', e => { ghostOpacity = parseFloat(e.target.value); redraw(); });
  $('#objSelect').addEventListener('change', e => {
    project.activeIndex = parseInt(e.target.value);
    lastPointId = null; hover = null; syncBgInputs(); redraw();
  });
  $('#objAdd').addEventListener('click', () => {
    pushUndo();
    project.objects.push(newObject('Object ' + (project.objects.length + 1)));
    project.activeIndex = project.objects.length - 1;
    lastPointId = null; refreshObjSelect(); syncBgInputs(); redraw();
  });
  $('#objDel').addEventListener('click', () => {
    if (project.objects.length <= 1) return;
    pushUndo();
    project.objects.splice(project.activeIndex, 1);
    project.activeIndex = Math.max(0, project.activeIndex - 1);
    lastPointId = null; refreshObjSelect(); syncBgInputs(); redraw();
  });
  $('#objRename').addEventListener('click', () => {
    const name = prompt('Object name:', obj().name);
    if (name) { pushUndo(); obj().name = name; refreshObjSelect(); }
  });

  /* ---- object transforms ---- */
  function duplicateActive() {
    pushUndo();
    const copy = JSON.parse(JSON.stringify(obj())); // clones geometry + PNG ref
    copy.name = obj().name + ' copy';
    project.objects.push(copy);
    project.activeIndex = project.objects.length - 1;
    lastPointId = null; hover = null;
    refreshObjSelect(); syncBgInputs(); redraw();
  }
  function bbox(o) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of o.points) {
      if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
    }
    return { minX, maxX, minY, maxY };
  }
  function flipObject(horizontal) {
    const o = obj();
    if (!o.points.length) return;
    pushUndo();
    const b = bbox(o);
    if (horizontal) { const s = b.minX + b.maxX; for (const p of o.points) p.x = s - p.x; }
    else { const s = b.minY + b.maxY; for (const p of o.points) p.y = s - p.y; }
    redraw();
  }
  function shiftObject(dx, dy) {
    const o = obj();
    if (!o.points.length) return;
    const b = bbox(o);
    // clamp the shift so the whole object stays on the grid
    if (dx > 0) dx = Math.min(dx, (project.gridW - 1) - b.maxX);
    if (dx < 0) dx = Math.max(dx, -b.minX);
    if (dy > 0) dy = Math.min(dy, (project.gridH - 1) - b.maxY);
    if (dy < 0) dy = Math.max(dy, -b.minY);
    if (!dx && !dy) return;
    pushUndo('shift');
    for (const p of o.points) { p.x += dx; p.y += dy; }
    redraw();
  }
  $('#dupBtn').addEventListener('click', duplicateActive);
  $('#flipH').addEventListener('click', () => flipObject(true));
  $('#flipV').addEventListener('click', () => flipObject(false));
  $('#shiftU').addEventListener('click', () => shiftObject(0, -1));
  $('#shiftD').addEventListener('click', () => shiftObject(0, 1));
  $('#shiftL').addEventListener('click', () => shiftObject(-1, 0));
  $('#shiftR').addEventListener('click', () => shiftObject(1, 0));

  /* ---- PNG onionskin ---- */
  $('#loadPngBtn').addEventListener('click', () => $('#pngFile').click());
  $('#pngFile').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      pushUndo();
      const o = obj();
      o.bg.dataURL = reader.result;
      o.bg.name = file.name;
      $('#pngName').textContent = file.name;
      redraw();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });
  function fitBgToGrid() {
    const o = obj();
    const img = getBgImage(o);
    if (!img) { alert('Load a PNG first.'); return; }
    pushUndo();
    const gridPxW = project.gridW * project.scale, gridPxH = project.gridH * project.scale;
    // uniform scale that fits the image entirely within the grid, then centre it
    const s = Math.min(gridPxW / img.naturalWidth, gridPxH / img.naturalHeight);
    o.bg.scale = s;
    o.bg.x = (gridPxW - img.naturalWidth * s) / 2;
    o.bg.y = (gridPxH - img.naturalHeight * s) / 2;
    syncBgInputs();
    redraw();
  }
  $('#fitBgBtn').addEventListener('click', fitBgToGrid);

  function syncBgInputs() {
    const b = obj().bg;
    $('#bgOpacity').value = b.opacity;
    $('#bgScale').value = b.scale;
    $('#bgX').value = Math.round(b.x);
    $('#bgY').value = Math.round(b.y);
    $('#pngName').textContent = b.name || 'no image';
  }
  $('#bgEdit').addEventListener('change', e => { bgEdit = e.target.checked; canvas.style.cursor = bgEdit ? 'move' : 'crosshair'; });
  $('#bgOpacity').addEventListener('input', e => { pushUndo('bg'); obj().bg.opacity = parseFloat(e.target.value); redraw(); });
  $('#bgScale').addEventListener('input', e => { pushUndo('bg'); obj().bg.scale = parseFloat(e.target.value); redraw(); });
  $('#bgX').addEventListener('input', e => { pushUndo('bg'); obj().bg.x = parseFloat(e.target.value) || 0; redraw(); });
  $('#bgY').addEventListener('input', e => { pushUndo('bg'); obj().bg.y = parseFloat(e.target.value) || 0; redraw(); });

  /* ---- stats ---- */
  function updateStats() {
    const o = obj();
    $('#stats').innerHTML =
      `<div><span>Points</span><b>${o.points.length}</b></div>` +
      `<div><span>Vectors</span><b>${o.edges.length}</b></div>` +
      `<div><span>Grid</span><b>${project.gridW}×${project.gridH}</b></div>` +
      `<div><span>Centre</span><b>${project.gridW >> 1},${project.gridH >> 1}</b></div>`;
  }

  /* ---- save / load project ---- */
  $('#saveBtn').addEventListener('click', () => {
    const data = JSON.stringify(project, null, 2);
    downloadBlob(new Blob([data], { type: 'application/json' }), 'project.vectored.json');
  });
  $('#loadBtn').addEventListener('click', () => $('#projFile').click());
  $('#projFile').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data.objects || !data.objects.length) throw new Error('no objects');
        pushUndo();
        // fill missing bg fields for forward-compat
        data.objects.forEach(o => {
          o.bg = Object.assign({ name: null, dataURL: null, x: 0, y: 0, scale: 1, opacity: 0.5 }, o.bg || {});
          if (o.nextId == null) o.nextId = o.points.reduce((m, p) => Math.max(m, p.id + 1), 1);
        });
        project = data;
        project.activeIndex = Math.min(project.activeIndex || 0, project.objects.length - 1);
        bgCache.clear(); lastPointId = null; hover = null;
        $('#gridW').value = project.gridW; $('#gridH').value = project.gridH; $('#scale').value = project.scale;
        refreshObjSelect(); syncBgInputs(); resizeCanvas(); redraw();
      } catch (err) { alert('Could not load project: ' + err.message); }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ---- export ---- */
  function cIdentifier(name, fallback) {
    let s = (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (!s) s = fallback;
    if (/^[0-9]/.test(s)) s = '_' + s;
    return s;
  }
  function formatCArray(id, o, bytes) {
    const head = `/* ${o.name} — ${o.points.length} points, ${o.edges.length} vectors */\n`;
    if (bytes.length === 0)
      return head + `const unsigned char ${id}[1] = { 0x00 }; /* empty */\n` +
        `const unsigned int ${id}_len = 0;\n`;
    const hex = bytes.map(b => '0x' + b.toString(16).padStart(2, '0'));
    const lines = [];
    for (let i = 0; i < hex.length; i += 16) lines.push('  ' + hex.slice(i, i + 16).join(', ') + ',');
    return head +
      `const unsigned char ${id}[${bytes.length}] = {\n${lines.join('\n')}\n};\n` +
      `const unsigned int ${id}_len = ${bytes.length};\n`;
  }
  function runExport() {
    const coordMode = $('#coordMode').value;
    const mergeCollinear = $('#mergeCollinear').checked;
    let resetN = parseInt($('#resetN').value, 10);
    if (!Number.isFinite(resetN) || resetN < 0) resetN = 0;
    const cx = project.gridW >> 1, cy = project.gridH >> 1;
    const used = new Set();
    let src = `/* Vectored export — grid ${project.gridW}x${project.gridH}, origin (centre) ${cx},${cy}\n` +
      `   coords: ${coordMode === 'relative' ? 'signed Y,X deltas from previous point' : 'signed Y,X offsets from centre'} (Vectrex orientation, +Y up)\n` +
      `   command byte: bits 7-6 = 00 RESET / 01 MOVE / 10 DRAW / 11 POINT, bits 5-0 = following Y,X pair count\n` +
      `   RESET (re-zero beam to origin) inserted every ${resetN || 'off'} drawn vectors/dots */\n\n`;
    let totalBytes = 0;
    project.objects.forEach((o, i) => {
      const res = buildExport(o.points, o.edges, project.gridW, project.gridH, coordMode, resetN, mergeCollinear);
      let id = cIdentifier(o.name, 'object_' + (i + 1)), base = id, n = 2;
      while (used.has(id)) id = base + '_' + (n++);
      used.add(id);
      totalBytes += res.bytes.length;
      src += formatCArray(id, o, res.bytes) + '\n';
    });
    lastExportSource = src;
    $('#hexOut').textContent = src;
    // disassembly of the active object for reference
    const ao = obj();
    const ares = buildExport(ao.points, ao.edges, project.gridW, project.gridH, coordMode, resetN, mergeCollinear);
    $('#disOut').textContent =
      `; active object: ${ao.name}\n` + (disassemble(ares.bytes, coordMode, cx, cy) || '(empty)');
    $('#exportStats').textContent = `${project.objects.length} object(s) · ${totalBytes} bytes total`;
    $('#exportPanel').classList.remove('hidden');
  }
  $('#exportBtn').addEventListener('click', runExport);
  $('#coordMode').addEventListener('change', runExport);
  $('#resetN').addEventListener('change', runExport);
  $('#mergeCollinear').addEventListener('change', runExport);
  $('#closeExport').addEventListener('click', () => $('#exportPanel').classList.add('hidden'));
  $('#downloadBin').addEventListener('click', () => {
    downloadBlob(new Blob([lastExportSource], { type: 'text/plain' }), 'vectored.h');
  });

  /* ---- keyboard shortcuts ---- */
  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); undo(); return; }
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.key === 'Escape') { lastPointId = null; redraw(); return; }
    const shifts = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    if (shifts[e.key]) { e.preventDefault(); shiftObject(shifts[e.key][0], shifts[e.key][1]); return; }
    const map = { l: 'line', p: 'point', r: 'remove', m: 'move' };
    if (map[e.key]) {
      const btn = document.querySelector(`.mode-btn[data-mode="${map[e.key]}"]`);
      if (btn) btn.click();
    }
  });

  /* ---- init ---- */
  refreshObjSelect();
  syncBgInputs();
  resizeCanvas();
  canvas.style.cursor = 'crosshair';
  redraw();
});
