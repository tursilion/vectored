#ifndef RENDER_H
#define RENDER_H

#include "vxtypes.h"

// Walk one exported sprite blob and draw it at the current beam position,
// scale and intensity.  This is the routine under test / benchmark.
//
// Blob format (see the .h exports): a stream of command blocks.  Each block
// is one command byte followed by that many signed (Y,X) pairs.  Each pair is
// a RELATIVE delta in Vectrex orientation (+Y up) — the native BIOS vector
// format, ready to draw with no runtime math:
//   bits 7-6 = 00 RESET  re-zero the beam to the object origin (no pairs)
//              01 MOVE   relative reposition (unlit)
//              10 DRAW    relative lit vector list (fed straight to the BIOS)
//              11 POINT   relative move + dot at each pair
//   bits 5-0 = number of (Y,X) pairs that follow (0 for RESET).  A RESET is
//   followed by a MOVE whose delta is measured from the object origin.
void render_sprite(const uint8_t *p, uint8_t len);

#endif
