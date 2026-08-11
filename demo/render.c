#include "bioscompat.h"
#include "render.h"

// Draw one sprite blob from the current beam position (centre / object origin
// after reset0ref).  The exported (Y,X) pairs are RELATIVE deltas in Vectrex
// orientation (+Y up) — i.e. the native BIOS vector-list format — so a DRAW
// block is handed to the BIOS straight from ROM with no per-vector work here.
// Caller sets intensity and scale and zeroes the beam first.
//
// Opcodes (top two bits): 00 RESET, 01 MOVE, 10 DRAW, 11 POINT.  A RESET
// re-zeros the beam to the object origin to shed accumulated integrator drift;
// the exporter follows it with a MOVE (a delta measured from the origin) back
// to the resume point.
void render_sprite(const uint8_t *p, uint8_t len)
{
    const uint8_t *end = p + len;

    while (p < end) {
        uint8_t cmd   = *p++;
        uint8_t op    = cmd & 0xC0;
        uint8_t count = cmd & 0x3F;

        if (op == 0x00) {           // RESET: re-zero to the object origin
            reset0ref();
            continue;
        }
        if (count == 0)
            continue;

        if (op == 0x80) {           // DRAW: relative list straight to the BIOS
            draw_vl_a(count, p);
            p += (uint8_t)(count << 1);
        } else if (op == 0x40) {    // MOVE: relative reposition (unlit)
            do {
                moveto_d(p[0], p[1]);
                p += 2;
            } while (--count);
        } else {                    // POINT (0xC0): relative move + dot
            do {
                moveto_d(p[0], p[1]);
                dot_here();
                p += 2;
            } while (--count);
        }
    }
}
