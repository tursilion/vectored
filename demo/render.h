#ifndef RENDER_H
#define RENDER_H

#include "vxtypes.h"

// Walk one exported sprite blob and draw it at the current beam position,
// scale and intensity.  This is the routine under test / benchmark.
//
// Blob format (see the .h exports): a stream of command blocks.  Each block
// is one command byte followed by that many signed (Y,X) pairs.  Each pair
// is an ABSOLUTE offset from the sprite centre in Vectrex orientation (+Y up);
// the engine converts to the relative deltas the BIOS wants:
//   bits 7-6 = 00 RESET  re-zero the beam to the object origin (no pairs)
//              01 MOVE   reposition beam (unlit) to the point
//              10 DRAW    draw lit vectors through the points
//              11 POINT   plot a dot at each point
//   bits 5-0 = number of (Y,X) pairs that follow (0 for RESET)
void render_sprite(const uint8_t *p, uint8_t len);

#endif
