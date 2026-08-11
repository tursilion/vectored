#ifndef BIOSCOMPAT_H
#define BIOSCOMPAT_H

// Thin lowercase wrapper over the gcc6809 PeerC BIOS header (<vectrex.h>),
// matching the style used by the parent kernel project.  Only the handful
// of routines this demo needs are mapped here.

#include <vectrex.h>    // PeerC master header (vec_ram/vec_rom/vec_rum)
#include "vxtypes.h"

// Frame / beam control.
#define wait_recal()         Wait_Recal()
#define reset0ref()          Reset0Ref()
#define intensity_a(i)       Intensity_a(i)
#define moveto_d(y, x)       Moveto_d((int)(int8_t)(y), (int)(int8_t)(x))
#define print_str_d(y, x, s) Print_Str_d((int)(int8_t)(y), (int)(int8_t)(x), (void *)(s))
#define dot_here()           Dot_here()

// Scale is the VIA timer 1 low-order count (the "current scale factor" used
// by the BIOS moveto/draw routines).
#define set_scale(s)         (*(volatile uint8_t *)0xD004 = (uint8_t)(s))

// PeerC's Draw_VL_a() is raw BIOS: it draws (count - 1) + 1 lit vectors from
// the (y,x) list.  Pass the true line count here.
#define draw_vl_a(n, list)   Draw_VL_a((unsigned int)((n) - 1), (void *)(list))

#endif
