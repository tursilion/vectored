# Vectored

An HTML5 vector-grid editor. No build step, no dependencies — open `index.html`
in any modern browser (works over `file://`).

## Why HTML5 (not Python + raylib)

Native PNG decode (`<img>`), one-line file save/load (Blob + `<input type=file>`),
Canvas rendering, and zero install — it just runs by double-clicking. raylib would
need a toolchain, manual PNG decode, and clumsy native file dialogs.

## Features

- **Grid** up to 256×256, view scale set as a fixed pixels-per-cell multiple.
  Grid is drawn faintly with emphasised lines every 8 cells and centre axes.
- **Onionskin PNG** loaded behind the grid; adjust opacity, scale, and X/Y in
  real time. Tick **Edit background** to drag the image with the mouse and scale
  it with the wheel to align it manually.
- **Editing modes** (keys `L P R M`):
  - **Line** — first click sets a start point; each further click adds a point and
    a vector from the previous point. Right-click or `Esc` breaks the chain.
    Clicking an existing grid point reuses it (lets you close shapes).
  - **Point** — places standalone points (no vector).
  - **Remove** — deletes the clicked point. If it sat between two vectors, its two
    neighbours are joined by a new vector.
  - **Move** — drag a point; its attached vectors follow.
- **Objects** — a project holds a list of objects, each with its own points,
  vectors, and onionskin PNG. Add / delete / rename from the toolbar.
- **Save / Load project** — JSON containing every object, its geometry, and its
  PNG (embedded as a data URL, with the original filename kept as a reference).
- **Smart export** — see below.

Points are drawn prominently (the active chain tail is highlighted yellow);
vectors are brighter than the grid and the onionskin.

## Smart export

The exporter treats the drawing as a graph of points and vectors and produces a
compact command stream, optimising the pen path:

1. **Every vector is drawn exactly once — never retraced.** The vector set is
   decomposed (Hierholzer with virtual edges between odd-degree vertices) into the
   *minimum* number of trails that cover all edges once.
2. **Shortest pen travel.** The order and direction of those trails, plus any
   isolated points, are chosen to minimise pen-up movement. With few strokes this
   is solved exactly by enumerating all orderings (with an orientation DP per
   ordering); larger drawings fall back to nearest-neighbour + 2-opt. Draw length
   is invariant, so only MOVE/POINT jumps are minimised.
3. The origin is the **centre of the grid**. The first operation is a `MOVE` to
   the start of the nearest stroke (skipped if it already lies on the centre).

### Byte format

Run-length encoded. Each **command byte**:

```
bit7 bit6 | bits5..0
command   | count N   (number of Y,X pairs that follow)
```

| command bits | meaning                                        |
|:------------:|------------------------------------------------|
| `00`         | undefined                                       |
| `01`         | MOVE  — pen up, reposition (normally N = 1)      |
| `10`         | DRAW  — pen down, draw a line to each pair       |
| `11`         | POINT — plot a dot at each pair (implied MOVE)   |

Each following pair is two signed bytes: **Y then X**. In **absolute** mode
(default) they are offsets from the grid centre; in **relative** mode they are
deltas from the previous pen position. For a 256-wide grid, coordinates span
−128…127, which is exactly one signed byte.

A run of the same command (e.g. a whole polyline of DRAWs) collapses to a single
command byte followed by its N coordinate pairs.

Export shows the hex bytes and a human-readable disassembly, and offers a
`.bin` download.

## Tests

Pure export logic (graph decomposition, optimisation, encoding) is unit-tested:

```
node test/export.test.js
```

The property test runs 400 random graphs and asserts that every vector is drawn
exactly once and every point is visited.

## Files

```
index.html        markup + toolbar
css/style.css      styling
js/app.js          logic (pure export core + browser UI; the core is also
                   require-able by the tests)
test/export.test.js
```
