#ifndef SHAPES_H
#define SHAPES_H

#include "vxtypes.h"

// One browsable shape: display name (BIOS text, \x80 terminated), the raw
// exported vector blob, and its length in bytes.
typedef struct {
    const char    *name;
    const uint8_t *data;
    uint8_t        len;
} Shape;

// A named collection of shapes (one per exported .h file).
typedef struct {
    const char  *name;
    const Shape *shapes;
    uint8_t      count;
} ShapeSet;

#define NUM_SETS 2
extern const ShapeSet shapeSets[NUM_SETS];

#endif
