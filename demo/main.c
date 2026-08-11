// Vectrex sprite render-engine test / benchmark browser.
//
// Draws one exported sprite at a time, centred, so the render_sprite() path
// can be exercised and profiled (cycles-per-frame in the emulator).  Browse
// with joystick 1 or the four buttons.
//
//   Joystick left / right ....... previous / next shape
//   Button 1 .................... previous shape
//   Button 4 .................... next shape
//   Button 2 .................... switch sprite set (PLAYER <-> SMALL)
//   Button 3 .................... cycle draw scale (size)

#include "bioscompat.h"
#include "render.h"
#include "shapes.h"

// BIOS RAM we poke directly (kept as raw addresses to stay independent of
// header symbol spellings).
#define VEC_JOY_MUX_1X (*(volatile uint8_t *)0xC81F)   // joystick enable/mux
#define VEC_JOY_MUX_1Y (*(volatile uint8_t *)0xC820)
#define VEC_JOY_MUX_2X (*(volatile uint8_t *)0xC821)
#define VEC_JOY_MUX_2Y (*(volatile uint8_t *)0xC822)
#define VEC_JOY_1_X    (*(volatile int8_t  *)0xC81B)   // digital -1 / 0 / +1
#define VEC_JOY_1_Y    (*(volatile int8_t  *)0xC81C)   // digital -1 / 0 / +1 (up = +)
#define VEC_BTN(n)     (*(volatile uint8_t *)(0xC812 + (n)))  // n = 0..3

// Draw scales to cycle through (VIA t1 count = vector length / draw time).
// Bigger = larger sprite and more beam-on cycles, so the profile changes.
static const uint8_t scales[] = { 0x20, 0x40, 0x60, 0x7F };
#define NUM_SCALES (sizeof(scales) / sizeof(scales[0]))

#define TEXT_INTENSITY   0x50
#define SPRITE_INTENSITY 0x7F

static uint8_t setIdx;
static uint8_t shapeIdx;
static uint8_t scaleIdx;

static void next_shape(void)
{
    const ShapeSet *set = &shapeSets[setIdx];
    if (++shapeIdx >= set->count)
        shapeIdx = 0;
}

static void prev_shape(void)
{
    const ShapeSet *set = &shapeSets[setIdx];
    if (shapeIdx == 0)
        shapeIdx = set->count;
    --shapeIdx;
}

static void switch_set(void)
{
    if (++setIdx >= NUM_SETS)
        setIdx = 0;
    shapeIdx = 0;
}

int main(void)
{
    // Edge-detection state for the four buttons and the stick.
    uint8_t prevBtn[4] = { 0, 0, 0, 0 };
    int8_t  prevJoyX = 0;

    setIdx = 0;
    shapeIdx = 0;
    scaleIdx = 2;                    // start at 0x60

    // Enable joystick 1 only (X and Y); disable joystick 2 to save cycles.
    VEC_JOY_MUX_1X = 1;
    VEC_JOY_MUX_1Y = 3;
    VEC_JOY_MUX_2X = 0;
    VEC_JOY_MUX_2Y = 0;

    for (;;) {
        const ShapeSet *set = &shapeSets[setIdx];
        const Shape    *shp = &set->shapes[shapeIdx];
        uint8_t i;
        int8_t  jx;

        Joy_Digital();
        Read_Btns();
        wait_recal();

        // ---- the render under test: one centred sprite ----
        // Hold the stick UP to skip drawing the sprite (labels still draw),
        // for quick cycle-count comparisons with vs. without the render.
        if (VEC_JOY_1_Y <= 0) {
            intensity_a(SPRITE_INTENSITY);
            set_scale(scales[scaleIdx]);
            reset0ref();
            render_sprite(shp->data, shp->len);
        }

        // ---- labels ----
        // Print_Str_d positions relative to the current beam, so zero the
        // integrators before each string to pin it to an absolute spot.
        intensity_a(TEXT_INTENSITY);
        reset0ref();
        print_str_d(110, -110, (char *)set->name);
        reset0ref();
        print_str_d(88,  -110, (char *)shp->name);

        // ---- input (edge triggered so one press == one step) ----
        jx = VEC_JOY_1_X;
        if (jx > 0 && prevJoyX <= 0) next_shape();
        else if (jx < 0 && prevJoyX >= 0) prev_shape();
        prevJoyX = jx;

        for (i = 0; i < 4; ++i) {
            uint8_t now = VEC_BTN(i);
            if (now && !prevBtn[i]) {
                if (i == 0) prev_shape();
                else if (i == 3) next_shape();
                else if (i == 1) switch_set();
                else /* i == 2 */ {
                    if (++scaleIdx >= NUM_SCALES) scaleIdx = 0;
                }
            }
            prevBtn[i] = now;
        }
    }

    return 0;
}
