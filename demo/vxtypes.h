#ifndef VXTYPES_H
#define VXTYPES_H

// Fixed-width types for the gcc6809 (-mint8) build: int is 8 bits and long
// is 16 bits, so the usual "int == 16 bit" assumptions do not hold.

typedef signed char    int8_t;
typedef unsigned char  uint8_t;
typedef signed long    int16_t;
typedef unsigned long  uint16_t;

typedef unsigned char  BOOL;
enum { FALSE, TRUE };

#endif
