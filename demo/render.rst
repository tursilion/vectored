                              1 ;;; gcc for m6809 : Mar 17 2019 11:56:12
                              2 ;;; 4.3.6 (gcc6809)
                              3 ;;; ABI version 1
                              4 ;;; -mabi=bx -mint8 -fomit-frame-pointer -O2
                              5 	.module	render.c
                              6 	.area	.text
                              7 	.globl	_render_sprite
   026E                       8 _render_sprite:
   026E 34 60         [ 7]    9 	pshs	y,u
   0270 32 77         [ 5]   10 	leas	-9,s
   0272 31 84         [ 4]   11 	leay	,x
   0274 3A            [ 3]   12 	abx
   0275 AF 63         [ 6]   13 	stx	3,s
   0277 34 10         [ 6]   14 	pshs	x	;cmphi: R:x with R:y
   0279 10 AC E1      [10]   15 	cmpy	,s++	;cmphi:
   027C 24 51         [ 3]   16 	bhs	L10
   027E                      17 L11:
   027E E6 A0         [ 6]   18 	ldb	,y+
   0280 E7 65         [ 5]   19 	stb	5,s
   0282 C6 C0         [ 2]   20 	ldb	#-64
   0284 E4 65         [ 5]   21 	andb	5,s
   0286 E7 62         [ 5]   22 	stb	2,s
   0288 27 49         [ 3]   23 	beq	L17
   028A C6 3F         [ 2]   24 	ldb	#63
   028C E4 65         [ 5]   25 	andb	5,s
   028E E7 68         [ 5]   26 	stb	8,s
   0290 27 38         [ 3]   27 	beq	L4
   0292 E6 62         [ 5]   28 	ldb	2,s
   0294 C1 80         [ 2]   29 	cmpb	#-128	;cmpqi:
   0296 10 27 00 59   [ 6]   30 	lbeq	L18
   029A E6 62         [ 5]   31 	ldb	2,s
   029C C1 40         [ 2]   32 	cmpb	#64	;cmpqi:
   029E 27 38         [ 3]   33 	beq	L19
   02A0 33 A4         [ 4]   34 	leau	,y
   02A2 E6 68         [ 5]   35 	ldb	8,s
   02A4 E7 67         [ 5]   36 	stb	7,s
   02A6                      37 L8:
   02A6 E6 C4         [ 4]   38 	ldb	,u
   02A8 E7 E2         [ 6]   39 	stb	,-s
   02AA E6 41         [ 5]   40 	ldb	1,u
   02AC BD 11 7C      [ 8]   41 	jsr	__Moveto_d
   02AF BD F2 C5      [ 8]   42 	jsr	___Dot_here
   02B2 33 42         [ 5]   43 	leau	2,u
   02B4 6A 68         [ 7]   44 	dec	8,s
   02B6 32 61         [ 5]   45 	leas	1,s
   02B8 6D 67         [ 7]   46 	tst	7,s
   02BA 26 EA         [ 3]   47 	bne	L8
   02BC                      48 L15:
   02BC 6A 68         [ 7]   49 	dec	8,s
   02BE E6 68         [ 5]   50 	ldb	8,s
   02C0 4F            [ 2]   51 	clra		;zero_extendqihi: R:b -> R:d
   02C1 ED E4         [ 5]   52 	std	,s
   02C3 C3 00 01      [ 4]   53 	addd	#1; addhi3,3
   02C6 58            [ 2]   54 	aslb
   02C7 49            [ 2]   55 	rola
   02C8 31 AB         [ 8]   56 	leay	d,y
   02CA                      57 L4:
   02CA 10 AC 63      [ 8]   58 	cmpy	3,s	;cmphi:(R)
   02CD 25 AF         [ 3]   59 	blo	L11
   02CF                      60 L10:
   02CF 32 69         [ 5]   61 	leas	9,s
   02D1 35 E0         [ 8]   62 	puls	y,u,pc
   02D3                      63 L17:
   02D3 BD F3 54      [ 8]   64 	jsr	___Reset0Ref
   02D6 20 F2         [ 3]   65 	bra	L4
   02D8                      66 L19:
   02D8 33 A4         [ 4]   67 	leau	,y
   02DA E6 68         [ 5]   68 	ldb	8,s
   02DC E7 66         [ 5]   69 	stb	6,s
   02DE                      70 L7:
   02DE E6 C4         [ 4]   71 	ldb	,u
   02E0 E7 E2         [ 6]   72 	stb	,-s
   02E2 E6 41         [ 5]   73 	ldb	1,u
   02E4 BD 11 7C      [ 8]   74 	jsr	__Moveto_d
   02E7 33 42         [ 5]   75 	leau	2,u
   02E9 6A 67         [ 7]   76 	dec	7,s
   02EB 32 61         [ 5]   77 	leas	1,s
   02ED 6D 66         [ 7]   78 	tst	6,s
   02EF 26 ED         [ 3]   79 	bne	L7
   02F1 20 C9         [ 3]   80 	bra	L15
   02F3                      81 L18:
   02F3 E6 68         [ 5]   82 	ldb	8,s
   02F5 5A            [ 2]   83 	decb
   02F6 30 A4         [ 4]   84 	leax	,y
   02F8 BD 11 64      [ 8]   85 	jsr	__Draw_VL_a
   02FB 68 68         [ 7]   86 	asl	8,s
   02FD E6 68         [ 5]   87 	ldb	8,s
   02FF 4F            [ 2]   88 	clra		;zero_extendqihi: R:b -> R:d
   0300 ED E4         [ 5]   89 	std	,s
   0302 31 AB         [ 8]   90 	leay	d,y
   0304 20 C4         [ 3]   91 	bra	L4
ASxxxx Assembler V05.00  (Motorola 6809), page 1.
Hexidecimal [16-Bits]

Symbol Table

    .__.$$$.       =   2710 L   |     .__.ABS.       =   0000 G
    .__.CPU.       =   0000 L   |     .__.H$L.       =   0001 L
  2 A$render$10        0002 GR  |   2 A$render$11        0004 GR
  2 A$render$12        0006 GR  |   2 A$render$13        0007 GR
  2 A$render$14        0009 GR  |   2 A$render$15        000B GR
  2 A$render$16        000E GR  |   2 A$render$18        0010 GR
  2 A$render$19        0012 GR  |   2 A$render$20        0014 GR
  2 A$render$21        0016 GR  |   2 A$render$22        0018 GR
  2 A$render$23        001A GR  |   2 A$render$24        001C GR
  2 A$render$25        001E GR  |   2 A$render$26        0020 GR
  2 A$render$27        0022 GR  |   2 A$render$28        0024 GR
  2 A$render$29        0026 GR  |   2 A$render$30        0028 GR
  2 A$render$31        002C GR  |   2 A$render$32        002E GR
  2 A$render$33        0030 GR  |   2 A$render$34        0032 GR
  2 A$render$35        0034 GR  |   2 A$render$36        0036 GR
  2 A$render$38        0038 GR  |   2 A$render$39        003A GR
  2 A$render$40        003C GR  |   2 A$render$41        003E GR
  2 A$render$42        0041 GR  |   2 A$render$43        0044 GR
  2 A$render$44        0046 GR  |   2 A$render$45        0048 GR
  2 A$render$46        004A GR  |   2 A$render$47        004C GR
  2 A$render$49        004E GR  |   2 A$render$50        0050 GR
  2 A$render$51        0052 GR  |   2 A$render$52        0053 GR
  2 A$render$53        0055 GR  |   2 A$render$54        0058 GR
  2 A$render$55        0059 GR  |   2 A$render$56        005A GR
  2 A$render$58        005C GR  |   2 A$render$59        005F GR
  2 A$render$61        0061 GR  |   2 A$render$62        0063 GR
  2 A$render$64        0065 GR  |   2 A$render$65        0068 GR
  2 A$render$67        006A GR  |   2 A$render$68        006C GR
  2 A$render$69        006E GR  |   2 A$render$71        0070 GR
  2 A$render$72        0072 GR  |   2 A$render$73        0074 GR
  2 A$render$74        0076 GR  |   2 A$render$75        0079 GR
  2 A$render$76        007B GR  |   2 A$render$77        007D GR
  2 A$render$78        007F GR  |   2 A$render$79        0081 GR
  2 A$render$80        0083 GR  |   2 A$render$82        0085 GR
  2 A$render$83        0087 GR  |   2 A$render$84        0088 GR
  2 A$render$85        008A GR  |   2 A$render$86        008D GR
  2 A$render$87        008F GR  |   2 A$render$88        0091 GR
  2 A$render$89        0092 GR  |   2 A$render$9         0000 GR
  2 A$render$90        0094 GR  |   2 A$render$91        0096 GR
  2 L10                0061 R   |   2 L11                0010 R
  2 L15                004E R   |   2 L17                0065 R
  2 L18                0085 R   |   2 L19                006A R
  2 L4                 005C R   |   2 L7                 0070 R
  2 L8                 0038 R   |     __Draw_VL_a        **** GX
    __Moveto_d         **** GX  |     ___Dot_here        **** GX
    ___Reset0Ref       **** GX  |   2 _render_sprite     0000 GR

ASxxxx Assembler V05.00  (Motorola 6809), page 2.
Hexidecimal [16-Bits]

Area Table

[_CSEG]
   0 _CODE            size    0   flags C080
   2 .text            size   98   flags  100
[_DSEG]
   1 _DATA            size    0   flags C0C0

