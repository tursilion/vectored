                              1 ; crt0 for main program - bank 1
                              2 
                              3 ; ---------------------------------------------------------------------------
                              4 ; define linker rom section
                              5 
                              6 	.bank rom(BASE=0x0000,SIZE=0xC000,FSFX=_rom)
                              7 	.area .cartridge		(BANK=rom)
                              8 	.area .bootloader		(CSEG,BANK=rom)
                              9 	.area .bankswitch.data	(DSEG,BANK=rom)
                             10 	.area .bankswitch.code	(CSEG,BANK=rom)
                             11 	.area .text  			(BANK=rom)
                             12 	.area .text.hot		    (BANK=rom)
                             13 	.area .text.unlikely	(BANK=rom)
                             14 	.area .text.unlikely	(BANK=rom)
                             15 	.area .text.last		(BANK=rom)
                             16 
                             17 ; ---------------------------------------------------------------------------
                             18 ; define linker ram section (original size of 0x36B steps on BIOS reserved...?)
                             19 
                             20 	.bank ram(BASE=0xc880,SIZE=0x036b,FSFX=_ram)
                             21 	.area .data  (BANK=ram)
                             22 	.area .bss   (BANK=ram)
                             23 
                             24 ; ---------------------------------------------------------------------------
                             25 ; c runtime startup code
                             26 ; ---------------------------------------------------------------------------
                             27 ; initialize data segment (and zero bss segment in system ram),	
                             28 ; then loop through main, error code > 0 causes cold reset
                             29 
                             30 ; Put some labels into the symbol table
                             31         .globl _crt0_reboot
                             32         .globl _tramp_return0
                             33         .globl _wrap_StartSong
                             34         .globl _wrap_StopSong
                             35         .globl _wrap_SongLoop
                             36 
                             37 		.area .bootloader			 
                             38 
   001E                      39 _crt0_init_data:				
   001E CE 00 8D      [ 3]   40 		ldu		#s_.text			
   0021 33 C9 0E F4   [ 8]   41 		leau	l_.text,u			
   0025 33 C9 00 00   [ 8]   42 		leau	l_.text.hot,u		
   0029 33 C9 00 00   [ 8]   43 		leau	l_.text.unlikely,u	
   002D 10 8E C8 80   [ 4]   44 		ldy		#s_.data			
   0031 8E 00 00      [ 3]   45 		ldx		#l_.data			
   0034 27 17         [ 3]   46 		beq		_crt0_startup		
                             47 
   0036                      48 _crt0_copy_data:				
   0036 A6 C0         [ 6]   49 		lda		,u+					
   0038 A7 A0         [ 6]   50 		sta		,y+					
   003A 30 1F         [ 5]   51 		leax	-1,x				
   003C 26 F8         [ 3]   52 		bne		_crt0_copy_data		
                             53 
   003E                      54 _crt0_init_bss:				
   003E 10 8E C8 80   [ 4]   55 		ldy		#s_.bss				
   0042 8E 00 81      [ 3]   56 		ldx		#l_.bss				
   0045 27 06         [ 3]   57 		beq		_crt0_startup		
   0047                      58 _crt0_zero_bss:				
   0047 6F A0         [ 8]   59 		clr		,y+					
   0049 30 1F         [ 5]   60 		leax	-1,x				
   004B 26 FA         [ 3]   61 		bne		_crt0_zero_bss		
                             62 
                             63 ; Nobody seems to do their own stack, relying on the BIOS setup instead
                             64 ; But, I need to ;)
                             65 ; Default stack address is CBEA. But Super Space Acer cheats and stores some
                             66 ; stuff above the stack for persistence across restarts. It's not clear whether
                             67 ; I should also clean out the BIOS variables, but I expect they'll be okay since
                             68 ; we don't reset mid-operation.
                             69 
                             70 ; cbea default top of stack for games
                             71 ; cbe8 2 bytes for saved return for wrapper functions (this file)
                             72 ; cb98 80 bytes for music player data
                             73 ; cb97 1 byte for SAVEDCHECK1
                             74 ; cb96 1 byte for SAVEDCHECK2
                             75 ; cb8f 7 bytes for SAVEDSCORE
                             76 ; cb8e 1 byte for SAVEDMODE 
                             77 ; cb8d 1 byte for SAVEDATTRACT
                             78 
   004D                      79 _crt0_startup:
   004D 10 CE CB 8D   [ 4]   80         lds     #0xcb8d
   0051 BD 00 91      [ 8]   81 		jsr		_main				
   0054                      82 _crt0_reboot:                       ; if we return, or restart vector from the game
   0054 7E 00 1E      [ 4]   83 		jmp 	_crt0_init_data		; go reinit ourselves
                             84 
                             85 ; here's a small trampoline area that must be copied to both banks as well
                             86 ; uses the PB6 bank switching method. Because Port B is used by so much of
                             87 ; the hardware, and the BIOS always writes PB6 as 0, it is cleaner to change
                             88 ; the state by transitioning the pin between output (when it will be 0) and
                             89 ; input (when it will pull up to 1). Since the rest of the direction bits
                             90 ; on port B are fixed, this should work.
                             91 ; There's a warning about some bad VIA6522s breaking in this method thanks
                             92 ; to many functions in the BIOS using INC, which may read back bad values,
                             93 ; but it doesn't look like many people are deterred from using it, and may
                             94 ; only be faulty VIAs causing this...?? Since only some do it, maybe.
                             95 
                             96 ; We don't need to worry about clobbering 'a', and 'b' contains an argument and return
                             97 ; We are also allowed to clobber 'x', but not Y or U.
                             98 
                             99 ; ***************************************************************************
                            100 ; Switches to main bank (bank1), then returns
                            101 ; To switch to bank 1, we want PB6 to go high. Since it's not safe to
                            102 ; just output a 1 and hope for the best, we switch it to input mode
                            103 ; where the VIA's pullup will take care of the electrical. No need to
                            104 ; write any data. Remember the switch is instantaneous, this code must
                            105 ; be the same in both banks.
   0057                     106 _tramp_return1:
   0057 86 9F         [ 2]  107     lda  #0x9f       ; vectrex default value for port B with PB6 as input
   0059 B7 D0 02      [ 5]  108     sta 0xD002       ; DDRB - bank switch happens here
   005C 39            [ 5]  109     rts
                            110 
                            111 ; ***************************************************************************
                            112 ; Switches to alt bank (bank0), then returns
                            113 ; To switch to bank 0 we need to output a 0 on PB6. Since we are in input
                            114 ; mode otherwise, and any previous write might affect our output, we will 
                            115 ; do a slightly slower but potentially safer RMW for data. However, if the BIOS really
                            116 ; does ever write a '1' to PB6, we may be screwed anyway. I'm still not sure
                            117 ; how worried about that case to actually be...
                            118 ; John's original notes also mess with Port A, Auxiliary control, and even the timer.
                            119 ; I'm not sure why... not doing that here if I don't need to. Bank switch is supposed
                            120 ; to be FAST. Seems like Aklabeth gets away with a simpler one similar to this, but they
                            121 ; write ORB AFTER changing direction, which could cause the line to bounce.
   005D                     122 _tramp_return0:
   005D 86 01         [ 2]  123     lda #0x01        ; should we read/mask/write? Seems most people just 0x01. Seems safe though.
   005F B7 D0 00      [ 5]  124     sta 0xd000       ; PORTB - write it out - should be no change to output yet (ramp on, mux off)
   0062 86 DF         [ 2]  125     lda #0xdf        ; now we need to set DDRB
   0064 B7 D0 02      [ 5]  126     sta 0xd002       ; DDRB - PB6 is now output, should output the zero we already wrote
   0067 39            [ 5]  127     rts
                            128 
                            129 ; ***************************************************************************
                            130 ; Switches to alt bank (bank0), then calls ay_StartSong. Note that the
                            131 ; signature here takes a bank index rather than pointer, since only the
                            132 ; other bank knows where the data files are located. There are only two
                            133 ; and it is only at song start, not a big cost to look up.
                            134 ; The second argument is stored on the stack (the first is in B), so we need to
                            135 ; remove the extra JSR return address to have it in the right place.
                            136 ; we probably also could have pulled it and re-pushed it in the right place... 
   0068                     137 _wrap_StartSong:
   0068 BD 00 5D      [ 8]  138     jsr _tramp_return0
   006B 35 10         [ 6]  139     puls x                      ; pull the return value
   006D BF CB E8      [ 6]  140     stx 0xcbe8                  ; save it - now our stack will look right when we jsr
                            141     ;jsr _ay_StartSong          ; for music bank 0 only
   0070 7E 00 73      [ 4]  142     jmp _wrap_StartSong0        ; if we didn't bank, take up the same space
   0073                     143 _wrap_StartSong0:
   0073 BE CB E8      [ 6]  144     ldx 0xcbe8                  ; get our return value back
   0076 34 10         [ 6]  145     pshs x                      ; put it back on the stack
   0078 7E 00 57      [ 4]  146     jmp _tramp_return1
                            147 
                            148 ; ***************************************************************************
                            149 ; Switches to alt bank (bank0), then calls ay_StopSong
                            150 ; we have no arguments on the stack, we probably don't need the return address manip...
   007B                     151 _wrap_StopSong:
   007B BD 00 5D      [ 8]  152     jsr _tramp_return0
                            153     ;jsr _ay_StopSong           ; for music bank 0 only
   007E 7E 00 81      [ 4]  154     jmp _wrap_StopSong0         ; if we didn't bank, take up the same space
   0081                     155 _wrap_StopSong0:
   0081 7E 00 57      [ 4]  156     jmp _tramp_return1
                            157 
                            158 ; ***************************************************************************
                            159 ; Switches to alternate bank (bank0), then run ay_SongLoop on the other bank.
                            160 ; note the rts - if the bank doesn't switch, it doesn't break, just no music
                            161 ; we have no arguments on the stack, we probably don't need the return address manip...
   0084                     162 _wrap_SongLoop:
   0084 BD 00 5D      [ 8]  163     jsr _tramp_return0
                            164     ;jsr _ay_SongLoop           ; for music bank 0 only
   0087 7E 00 8A      [ 4]  165     jmp _wrap_SongLoop0
   008A                     166 _wrap_SongLoop0:
   008A 7E 00 57      [ 4]  167     jmp _tramp_return1
                            168 
                            169 ; ***************************************************************************
                            170 ; Original notes follow...
                            171 ; ***************************************************************************
                            172 
                            173 ; The vectrex memory map
                            174 ;
                            175 ; 0000 - 7FFF      Cart ROM
                            176 ; 8000 - C7FF      unused
                            177 ; C800 - CFFF      1k RAM (duplicated every 0x400 bytes)
                            178 ;                  C800-C87F - used by BIOS
                            179 ;                  C880-CBE9 - Free RAM for application
                            180 ;                  CBEA-CBFE - used by BIOS (is it?)
                            181 ; D000 - D7FF      VIA (duplicated every 16 bytes)
                            182 ;                  D000 - 8 bit port B (CNTRL) Not sure about the bit order
                            183 ;                  D001 - 8 bit port A (DAC and PSC)
                            184 ;                  D002 - Port B direction (0 = input)
                            185 ;                  D003 - Port A direction (0 = input)
                            186 ;                  D004-D007 - Timer 1 (T1LOLC, T1HOC, T1LOL, T1HOL)
                            187 ;                  D008-D009 - Timer 2 (T2LOLC, T2HOC)
                            188 ;                  D00A - Shift register
                            189 ;                  D00B - Auxiliary Control
                            190 ;                  D00C - Peripheral Control
                            191 ;                  D00D - Interrupt Flag
                            192 ;                  D00E - Interrupt Enable
                            193 ;                  D00F - ORA
                            194 ; D800 - DFFF      broken mapping don't use (selects RAM and VIA at the same time)
                            195 ; E000 - FFFF      8k boot ROM
                            196 ;                  E000-EFFF - Minestorm
                            197 ;                  F000-FFFF - BIOS
                            198 
                            199 ; ***************************************************************************
                            200 ; vectrex c runtime initialization - do not change! muahahahahaa!
                            201 ; ***************************************************************************
                            202 ;
                            203 ; Disclaimer:
                            204 ;
                            205 ; This file is part of the Vectrex C programming setup developed by 
                            206 ; Prof. Dr. rer. nat. Peer Johannsen. The setup is used as tool and as
                            207 ; teaching material in the Retro-Programming and the Advanced
                            208 ; hardware-oriented C and Assembly Language Programming classes at
                            209 ; Pforzheim University, Germany.
                            210 ; 
                            211 ; Writing their own games for a vintage arcade game console in a programming
                            212 ; course and seeing them run on a real Vectrex device has proved to greatly
                            213 ; contribute to the motivation of the students.
                            214 ;
                            215 ; The C programming setup can freely be used by everyone for writing 
                            216 ; Vectrex games and Vectrex programs in C, but at one's own risk. Please
                            217 ; respect the copyright and credit the origin of these files.
                            218 ;
                            219 ; It would be truly fantastic if those who use this setup and/or these files
                            220 ; to develop and produce their own Vectrex game cartridges, would support the
                            221 ; educational approach and aim of these programming classes by donating a
                            222 ; complimentary cartridge which will then be used as additional motivational
                            223 ; content.
                            224 ;
                            225 ; Many thanks to all those out there who have already supported this course
                            226 ; in various ways!
                            227 ;
                            228 ; Feedback, suggestions and bug-reports are always welcome and can be sent
                            229 ; to the following contact address:
                            230 ;
                            231 ; peer.johannsen@pforzheim-university.de
                            232 ;
                            233 ; Modified by M.Brent aka tursilion
                            234 ; ---------------------------------------------------------------------------
                            235 
                            236 ; These assumptions are now baked in
                            237 ;#define __ASLINK_500 	    1	; set to 1 for version 5.00
                            238 ;#define __ZERO_BSS 		1	; set to 1 to clear bss segment
                            239 
ASxxxx Assembler V05.00  (Motorola 6809), page 1.
Hexidecimal [16-Bits]

Symbol Table

    .__.$$$.       =   2710 L   |     .__.ABS.       =   0000 G
    .__.CPU.       =   0000 L   |     .__.H$L.       =   0001 L
  3 A$crt0$107         0039 GR  |   3 A$crt0$108         003B GR
  3 A$crt0$109         003E GR  |   3 A$crt0$123         003F GR
  3 A$crt0$124         0041 GR  |   3 A$crt0$125         0044 GR
  3 A$crt0$126         0046 GR  |   3 A$crt0$127         0049 GR
  3 A$crt0$138         004A GR  |   3 A$crt0$139         004D GR
  3 A$crt0$140         004F GR  |   3 A$crt0$142         0052 GR
  3 A$crt0$144         0055 GR  |   3 A$crt0$145         0058 GR
  3 A$crt0$146         005A GR  |   3 A$crt0$152         005D GR
  3 A$crt0$154         0060 GR  |   3 A$crt0$156         0063 GR
  3 A$crt0$163         0066 GR  |   3 A$crt0$165         0069 GR
  3 A$crt0$167         006C GR  |   3 A$crt0$40          0000 GR
  3 A$crt0$41          0003 GR  |   3 A$crt0$42          0007 GR
  3 A$crt0$43          000B GR  |   3 A$crt0$44          000F GR
  3 A$crt0$45          0013 GR  |   3 A$crt0$46          0016 GR
  3 A$crt0$49          0018 GR  |   3 A$crt0$50          001A GR
  3 A$crt0$51          001C GR  |   3 A$crt0$52          001E GR
  3 A$crt0$55          0020 GR  |   3 A$crt0$56          0024 GR
  3 A$crt0$57          0027 GR  |   3 A$crt0$59          0029 GR
  3 A$crt0$60          002B GR  |   3 A$crt0$61          002D GR
  3 A$crt0$80          002F GR  |   3 A$crt0$81          0033 GR
  3 A$crt0$83          0036 GR  |   3 _crt0_copy_dat     0018 R
  3 _crt0_init_bss     0020 R   |   3 _crt0_init_dat     0000 R
  3 _crt0_reboot       0036 GR  |   3 _crt0_startup      002F R
  3 _crt0_zero_bss     0029 R   |     _main              **** GX
  3 _tramp_return0     003F GR  |   3 _tramp_return1     0039 R
  3 _wrap_SongLoop     0066 GR  |   3 _wrap_SongLoop     006C R
  3 _wrap_StartSon     004A GR  |   3 _wrap_StartSon     0055 R
  3 _wrap_StopSong     005D GR  |   3 _wrap_StopSong     0063 R
    l_.bss             **** GX  |     l_.data            **** GX
    l_.text            **** GX  |     l_.text.hot        **** GX
    l_.text.unlike     **** GX  |     s_.bss             **** GX
    s_.data            **** GX  |     s_.text            **** GX

ASxxxx Assembler V05.00  (Motorola 6809), page 2.
Hexidecimal [16-Bits]

Area Table

[_CSEG]
   0 _CODE            size    0   flags C080
[_DSEG]
   1 _DATA            size    0   flags C0C0
[rom]
   2 .cartridge       size    0   flags 8080
   3 .bootloader      size   6F   flags C180
   4 .bankswitch.da   size    0   flags C0C0
   5 .bankswitch.co   size    0   flags C080
   6 .text            size    0   flags 8080
   7 .text.hot        size    0   flags 8080
   8 .text.unlikely   size    0   flags 8080
   9 .text.last       size    0   flags 8080
[ram]
   A .data            size    0   flags 8080
   B .bss             size    0   flags 8080

