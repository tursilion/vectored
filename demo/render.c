#include "bioscompat.h"
#include "render.h"

// Delta scratch for one DRAW block (max 63 pairs -> 126 bytes).  In bss so
// it stays off the small 6809 stack.
static int8_t deltas[63 * 2];

// Draw one sprite blob from the current beam position (centre after
// reset0ref).  The exported (Y,X) pairs are ABSOLUTE offsets from the sprite
// centre in Vectrex orientation (+Y up), but the BIOS draws relative, so we
// track the running pen position and feed the BIOS the deltas.  Caller sets
// intensity and scale and zeroes the beam first.
//
// Opcodes (top two bits): 00 RESET, 01 MOVE, 10 DRAW, 11 POINT.
// A RESET re-zeros the beam to the object origin (centre) to shed accumulated
// integrator drift; the exporter always follows it with a MOVE back to the
// resume point.
void render_sprite(const uint8_t *p, uint8_t len)
{
    const uint8_t *end = p + len;
    int8_t cy = 0, cx = 0;          // current pen position (offset from centre)

    while (p < end) {
        uint8_t cmd   = *p++;
        uint8_t op    = cmd & 0xC0;
        uint8_t count = cmd & 0x3F;

        if (op == 0x00) {           // RESET: re-zero to the object origin
            reset0ref();
            cy = 0;
            cx = 0;
            continue;
        }
        if (count == 0)
            continue;

        if (op == 0x80) {           // DRAW: absolute endpoints -> lit vectors
            int8_t *d = deltas;
            uint8_t i;
            for (i = 0; i < count; ++i) {
                int8_t ty = (int8_t)*p++;
                int8_t tx = (int8_t)*p++;
                *d++ = (int8_t)(ty - cy);
                *d++ = (int8_t)(tx - cx);
                cy = ty;
                cx = tx;
            }
            draw_vl_a(count, deltas);
        } else if (op == 0x40) {    // MOVE: reposition beam (unlit)
            do {
                int8_t ty = (int8_t)*p++;
                int8_t tx = (int8_t)*p++;
                moveto_d((int8_t)(ty - cy), (int8_t)(tx - cx));
                cy = ty;
                cx = tx;
            } while (--count);
        } else {                    // POINT (0xC0): plot dots
            do {
                int8_t ty = (int8_t)*p++;
                int8_t tx = (int8_t)*p++;
                moveto_d((int8_t)(ty - cy), (int8_t)(tx - cx));
                dot_here();
                cy = ty;
                cx = tx;
            } while (--count);
        }
    }
}
