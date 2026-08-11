                              1 ;;; gcc for m6809 : Mar 17 2019 11:56:12
                              2 ;;; 4.3.6 (gcc6809)
                              3 ;;; ABI version 1
                              4 ;;; -mabi=bx -mint8 -fomit-frame-pointer -O2
                              5 	.module	cartridge.c
                              6 	.globl	_game_header
                              7 	.area	.cartridge
   0000                       8 _game_header:
   0000 67 20 47 43 45 20     9 	.byte	103,32,71,67,69,32,50,48
        32 30
   0008 32 36 80             10 	.byte	50,54,-128
   000B FD 0D                11 	.word	-755
   000D F8                   12 	.byte	-8
   000E 50                   13 	.byte	80
   000F 14                   14 	.byte	20
   0010 B0                   15 	.byte	-80
   0011 53 50 52 49 54 45    16 	.byte	83,80,82,73,84,69,32,84
        20 54
   0019 45 53 54 80 00       17 	.byte	69,83,84,-128,0
ASxxxx Assembler V05.00  (Motorola 6809), page 1.
Hexidecimal [16-Bits]

Symbol Table

    .__.$$$.       =   2710 L   |     .__.ABS.       =   0000 G
    .__.CPU.       =   0000 L   |     .__.H$L.       =   0001 L
  2 _game_header       0000 GR

ASxxxx Assembler V05.00  (Motorola 6809), page 2.
Hexidecimal [16-Bits]

Area Table

[_CSEG]
   0 _CODE            size    0   flags C080
   2 .cartridge       size   1E   flags  100
[_DSEG]
   1 _DATA            size    0   flags C0C0

