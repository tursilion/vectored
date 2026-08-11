# gcc6809 build for the sprite display test (single 32K bank, no music).
# Pipeline: cc1 (C -> .s) -> as6809 (.s -> .rel) -> aslink (.rel -> .s19)
# -> srec2bin (.s19 -> cartridge .bin).  Paths/flags follow the parent
# kernel project's Vide/PeerC toolchain setup.

TOOLDIR := /mnt/d/work/vectrex/Vide.w64/C/Linux64/bin
PEERC   := /mnt/d/work/vectrex/Vide.w64/C/PeerC/vectrex
PEERLIB := $(PEERC)/lib
STDINC  := -I$(PEERC)/include

CC      := $(TOOLDIR)/cc1
AS      := $(TOOLDIR)/as6809
LINK    := $(TOOLDIR)/aslink
SREC2BIN:= $(TOOLDIR)/srec2bin

CFLAGS  := -quiet -O2 -fno-gcse -fno-toplevel-reorder -mint8 -fsigned-char \
           -msoft-reg-count=0 -std=gnu99 -fno-time-report -W -Wall -DBUILD_VECTREX $(STDINC)
ASFLAGS := -x -p -l -o -y -g

TARGET  := sprite.bin
OBJS    := crt0.rel cartridge.rel main.rel render.rel shapes.rel

HDRS    := bioscompat.h vxtypes.h render.h shapes.h \
           PlayerSprites.h smallsprites.h

all: $(TARGET)

$(TARGET): $(OBJS)
	cd $(PEERLIB) && $(LINK) -n -m -w -u -s $(CURDIR)/sprite \
		$(addprefix $(CURDIR)/,$(OBJS)) static/*.rel \
		-k ./ -l rum.lib -l libgcc.lib -l gcc.lib -l assert.lib \
		2>&1 | tee $(CURDIR)/link.log
	@! grep -q 'Undefined Global' link.log || \
		{ echo '*** link failed: undefined globals'; rm -f sprite_rom.s19; exit 1; }
	$(SREC2BIN) -q sprite_rom.s19 $@
	truncate -s 32768 $@

%.s: %.c $(HDRS)
	$(CC) $(CFLAGS) $< -o $@

%.rel: %.s
	$(AS) $(ASFLAGS) $<

%.rel: %.assembly
	$(AS) $(ASFLAGS) $<

clean:
	rm -f $(TARGET) link.log *.rel *.lst *.rst *.map *.s19 \
		main.s render.s shapes.s cartridge.s

.PHONY: all clean
