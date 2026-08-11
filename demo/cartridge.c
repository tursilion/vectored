// Vectrex cartridge header (gcc6809 build).
//
// Ordinary const data placed in the linker's .cartridge section, which crt0
// locates at $0000; the BIOS reads the copyright/music/title from it and then
// execution falls through into crt0's .bootloader immediately after.

#include <vectrex.h>

struct cartridge_t
{
    char copyright[11];         // must start with "g GCE", end with \x80
    const void *music;          // title music data address
    signed int title_height;    // int is 8-bit under -mint8
    unsigned int title_width;
    int title_y;
    int title_x;
    char title[];               // must end with \x80 (\x00 auto-appended)
};

const struct cartridge_t game_header
    __attribute__((section(".cartridge"), used)) =
{
    .copyright    = "g GCE 2026\x80",
    .music        = (void *)0xfd0d,     // BIOS "Vectrex" opening tune
    .title_height = 0xf8,
    .title_width  = 0x50,
    .title_y      = 0x14,
    .title_x      = 0xb0,
    .title        = "SPRITE TEST\x80"
};
