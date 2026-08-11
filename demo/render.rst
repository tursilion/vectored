                              1 ;;; gcc for m6809 : Mar 17 2019 11:56:12
                              2 ;;; 4.3.6 (gcc6809)
                              3 ;;; ABI version 1
                              4 ;;; -mabi=bx -mint8 -fomit-frame-pointer -O2
                              5 	.module	render.c
                              6 	.area	.bss
   C883                       7 _deltas:	.blkb	126
                              8 	.area	.text
                              9 	.globl	_render_sprite
   026E                      10 _render_sprite:
   026E 34 60         [ 7]   11 	pshs	y,u
   0270 32 E8 ED      [ 5]   12 	leas	-19,s
   0273 AF 63         [ 6]   13 	stx	3,s
   0275 4F            [ 2]   14 	clra		;zero_extendqihi: R:b -> R:d
   0276 34 10         [ 6]   15 	pshs	x	;addhi: R:d += R:x
   0278 E3 E1         [ 9]   16 	addd	,s++
   027A ED 65         [ 6]   17 	std	5,s
   027C 34 06         [ 7]   18 	pshs	d	;cmphi: R:d with R:x
   027E AC E1         [ 9]   19 	cmpx	,s++	;cmphi:
   0280 10 24 00 8C   [ 6]   20 	lbhs	L11
   0284 6F 67         [ 7]   21 	clr	7,s
   0286 6F 68         [ 7]   22 	clr	8,s
   0288                      23 L10:
   0288 10 AE 63      [ 7]   24 	ldy	3,s
   028B E6 A0         [ 6]   25 	ldb	,y+
   028D E7 69         [ 5]   26 	stb	9,s
   028F C6 C0         [ 2]   27 	ldb	#-64
   0291 E4 69         [ 5]   28 	andb	9,s
   0293 E7 62         [ 5]   29 	stb	2,s
   0295 10 27 00 6B   [ 6]   30 	lbeq	L17
   0299 C6 3F         [ 2]   31 	ldb	#63
   029B E4 69         [ 5]   32 	andb	9,s
   029D E7 E8 12      [ 5]   33 	stb	18,s
   02A0 27 57         [ 3]   34 	beq	L4
   02A2 E6 62         [ 5]   35 	ldb	2,s
   02A4 C1 80         [ 2]   36 	cmpb	#-128	;cmpqi:
   02A6 10 27 00 6B   [ 6]   37 	lbeq	L18
   02AA E6 62         [ 5]   38 	ldb	2,s
   02AC C1 40         [ 2]   39 	cmpb	#64	;cmpqi:
   02AE 10 27 00 B7   [ 6]   40 	lbeq	L19
   02B2 33 A4         [ 4]   41 	leau	,y
   02B4 E6 E8 12      [ 5]   42 	ldb	18,s
   02B7 E7 E8 11      [ 5]   43 	stb	17,s
   02BA                      44 L9:
   02BA E6 C4         [ 4]   45 	ldb	,u
   02BC E7 6E         [ 5]   46 	stb	14,s
   02BE E6 41         [ 5]   47 	ldb	1,u
   02C0 E7 6F         [ 5]   48 	stb	15,s
   02C2 33 42         [ 5]   49 	leau	2,u
   02C4 E0 68         [ 5]   50 	subb	8,s
   02C6 E7 68         [ 5]   51 	stb	8,s
   02C8 E6 6E         [ 5]   52 	ldb	14,s
   02CA E0 67         [ 5]   53 	subb	7,s
   02CC 34 04         [ 6]   54 	pshs	b
   02CE E6 69         [ 5]   55 	ldb	9,s
   02D0 BD 0F 7C      [ 8]   56 	jsr	__Moveto_d
   02D3 BD F2 C5      [ 8]   57 	jsr	___Dot_here
   02D6 6A E8 12      [ 7]   58 	dec	18,s
   02D9 E6 E8 10      [ 5]   59 	ldb	16,s
   02DC E7 69         [ 5]   60 	stb	9,s
   02DE E6 6F         [ 5]   61 	ldb	15,s
   02E0 E7 68         [ 5]   62 	stb	8,s
   02E2 32 61         [ 5]   63 	leas	1,s
   02E4 6D E8 11      [ 7]   64 	tst	17,s
   02E7 26 D1         [ 3]   65 	bne	L9
   02E9                      66 L15:
   02E9 6A E8 12      [ 7]   67 	dec	18,s
   02EC E6 E8 12      [ 5]   68 	ldb	18,s
   02EF 4F            [ 2]   69 	clra		;zero_extendqihi: R:b -> R:d
   02F0 ED E4         [ 5]   70 	std	,s
   02F2 C3 00 01      [ 4]   71 	addd	#1; addhi3,3
   02F5 58            [ 2]   72 	aslb
   02F6 49            [ 2]   73 	rola
   02F7 31 AB         [ 8]   74 	leay	d,y
   02F9                      75 L4:
   02F9 10 AC 65      [ 8]   76 	cmpy	5,s	;cmphi:(R)
   02FC 24 12         [ 3]   77 	bhs	L11
   02FE                      78 L20:
   02FE 10 AF 63      [ 7]   79 	sty	3,s
   0301 16 FF 84      [ 5]   80 	lbra	L10
   0304                      81 L17:
   0304 BD F3 54      [ 8]   82 	jsr	___Reset0Ref
   0307 6F 67         [ 7]   83 	clr	7,s
   0309 6F 68         [ 7]   84 	clr	8,s
   030B 10 AC 65      [ 8]   85 	cmpy	5,s	;cmphi:(R)
   030E 25 EE         [ 3]   86 	blo	L20
   0310                      87 L11:
   0310 32 E8 13      [ 5]   88 	leas	19,s
   0313 35 E0         [ 8]   89 	puls	y,u,pc
   0315                      90 L18:
   0315 CE 00 00      [ 3]   91 	ldu	#0
   0318                      92 L6:
   0318 EC 63         [ 6]   93 	ldd	3,s
   031A 30 CB         [ 8]   94 	leax	d,u
   031C E6 01         [ 5]   95 	ldb	1,x
   031E E7 6B         [ 5]   96 	stb	11,s
   0320 E6 02         [ 5]   97 	ldb	2,x
   0322 E7 62         [ 5]   98 	stb	2,s
   0324 E6 6B         [ 5]   99 	ldb	11,s
   0326 E0 67         [ 5]  100 	subb	7,s
   0328 E7 C9 C8 83   [ 8]  101 	stb	_deltas,u
   032C E6 62         [ 5]  102 	ldb	2,s
   032E E0 68         [ 5]  103 	subb	8,s
   0330 E7 C9 C8 84   [ 8]  104 	stb	_deltas+1,u
   0334 33 42         [ 5]  105 	leau	2,u
   0336 E6 E8 12      [ 5]  106 	ldb	18,s
   0339 5A            [ 2]  107 	decb
   033A E7 E8 10      [ 5]  108 	stb	16,s
   033D E6 62         [ 5]  109 	ldb	2,s
   033F E7 68         [ 5]  110 	stb	8,s
   0341 E6 6B         [ 5]  111 	ldb	11,s
   0343 E7 67         [ 5]  112 	stb	7,s
   0345 E6 E8 10      [ 5]  113 	ldb	16,s
   0348 4F            [ 2]  114 	clra		;zero_extendqihi: R:b -> R:d
   0349 ED E4         [ 5]  115 	std	,s
   034B C3 00 01      [ 4]  116 	addd	#1; addhi3,3
   034E 58            [ 2]  117 	aslb
   034F 49            [ 2]  118 	rola
   0350 34 06         [ 7]  119 	pshs	d	;cmphi: R:d with R:u
   0352 11 A3 E1      [10]  120 	cmpu	,s++	;cmphi:
   0355 26 C1         [ 3]  121 	bne	L6
   0357 1E 03         [ 8]  122 	exg	d,u
   0359 31 AB         [ 8]  123 	leay	d,y
   035B 1E 03         [ 8]  124 	exg	d,u
   035D 8E C8 83      [ 3]  125 	ldx	#_deltas
   0360 E6 E8 10      [ 5]  126 	ldb	16,s
   0363 BD 0F 64      [ 8]  127 	jsr	__Draw_VL_a
   0366 16 FF 90      [ 5]  128 	lbra	L4
   0369                     129 L19:
   0369 33 A4         [ 4]  130 	leau	,y
   036B E6 E8 12      [ 5]  131 	ldb	18,s
   036E E7 6A         [ 5]  132 	stb	10,s
   0370                     133 L8:
   0370 E6 C4         [ 4]  134 	ldb	,u
   0372 E7 6C         [ 5]  135 	stb	12,s
   0374 E6 41         [ 5]  136 	ldb	1,u
   0376 E7 6D         [ 5]  137 	stb	13,s
   0378 33 42         [ 5]  138 	leau	2,u
   037A E0 68         [ 5]  139 	subb	8,s
   037C E7 68         [ 5]  140 	stb	8,s
   037E E6 6C         [ 5]  141 	ldb	12,s
   0380 E0 67         [ 5]  142 	subb	7,s
   0382 34 04         [ 6]  143 	pshs	b
   0384 E6 69         [ 5]  144 	ldb	9,s
   0386 BD 0F 7C      [ 8]  145 	jsr	__Moveto_d
   0389 6A 6B         [ 7]  146 	dec	11,s
   038B E6 6E         [ 5]  147 	ldb	14,s
   038D E7 69         [ 5]  148 	stb	9,s
   038F E6 6D         [ 5]  149 	ldb	13,s
   0391 E7 68         [ 5]  150 	stb	8,s
   0393 32 61         [ 5]  151 	leas	1,s
   0395 6D 6A         [ 7]  152 	tst	10,s
   0397 26 D7         [ 3]  153 	bne	L8
   0399 16 FF 4D      [ 5]  154 	lbra	L15
ASxxxx Assembler V05.00  (Motorola 6809), page 1.
Hexidecimal [16-Bits]

Symbol Table

    .__.$$$.       =   2710 L   |     .__.ABS.       =   0000 G
    .__.CPU.       =   0000 L   |     .__.H$L.       =   0001 L
  3 A$render$100       00B8 GR  |   3 A$render$101       00BA GR
  3 A$render$102       00BE GR  |   3 A$render$103       00C0 GR
  3 A$render$104       00C2 GR  |   3 A$render$105       00C6 GR
  3 A$render$106       00C8 GR  |   3 A$render$107       00CB GR
  3 A$render$108       00CC GR  |   3 A$render$109       00CF GR
  3 A$render$11        0000 GR  |   3 A$render$110       00D1 GR
  3 A$render$111       00D3 GR  |   3 A$render$112       00D5 GR
  3 A$render$113       00D7 GR  |   3 A$render$114       00DA GR
  3 A$render$115       00DB GR  |   3 A$render$116       00DD GR
  3 A$render$117       00E0 GR  |   3 A$render$118       00E1 GR
  3 A$render$119       00E2 GR  |   3 A$render$12        0002 GR
  3 A$render$120       00E4 GR  |   3 A$render$121       00E7 GR
  3 A$render$122       00E9 GR  |   3 A$render$123       00EB GR
  3 A$render$124       00ED GR  |   3 A$render$125       00EF GR
  3 A$render$126       00F2 GR  |   3 A$render$127       00F5 GR
  3 A$render$128       00F8 GR  |   3 A$render$13        0005 GR
  3 A$render$130       00FB GR  |   3 A$render$131       00FD GR
  3 A$render$132       0100 GR  |   3 A$render$134       0102 GR
  3 A$render$135       0104 GR  |   3 A$render$136       0106 GR
  3 A$render$137       0108 GR  |   3 A$render$138       010A GR
  3 A$render$139       010C GR  |   3 A$render$14        0007 GR
  3 A$render$140       010E GR  |   3 A$render$141       0110 GR
  3 A$render$142       0112 GR  |   3 A$render$143       0114 GR
  3 A$render$144       0116 GR  |   3 A$render$145       0118 GR
  3 A$render$146       011B GR  |   3 A$render$147       011D GR
  3 A$render$148       011F GR  |   3 A$render$149       0121 GR
  3 A$render$15        0008 GR  |   3 A$render$150       0123 GR
  3 A$render$151       0125 GR  |   3 A$render$152       0127 GR
  3 A$render$153       0129 GR  |   3 A$render$154       012B GR
  3 A$render$16        000A GR  |   3 A$render$17        000C GR
  3 A$render$18        000E GR  |   3 A$render$19        0010 GR
  3 A$render$20        0012 GR  |   3 A$render$21        0016 GR
  3 A$render$22        0018 GR  |   3 A$render$24        001A GR
  3 A$render$25        001D GR  |   3 A$render$26        001F GR
  3 A$render$27        0021 GR  |   3 A$render$28        0023 GR
  3 A$render$29        0025 GR  |   3 A$render$30        0027 GR
  3 A$render$31        002B GR  |   3 A$render$32        002D GR
  3 A$render$33        002F GR  |   3 A$render$34        0032 GR
  3 A$render$35        0034 GR  |   3 A$render$36        0036 GR
  3 A$render$37        0038 GR  |   3 A$render$38        003C GR
  3 A$render$39        003E GR  |   3 A$render$40        0040 GR
  3 A$render$41        0044 GR  |   3 A$render$42        0046 GR
  3 A$render$43        0049 GR  |   3 A$render$45        004C GR
  3 A$render$46        004E GR  |   3 A$render$47        0050 GR
  3 A$render$48        0052 GR  |   3 A$render$49        0054 GR
  3 A$render$50        0056 GR  |   3 A$render$51        0058 GR
  3 A$render$52        005A GR  |   3 A$render$53        005C GR
  3 A$render$54        005E GR  |   3 A$render$55        0060 GR
  3 A$render$56        0062 GR  |   3 A$render$57        0065 GR
  3 A$render$58        0068 GR  |   3 A$render$59        006B GR
  3 A$render$60        006E GR  |   3 A$render$61        0070 GR
  3 A$render$62        0072 GR  |   3 A$render$63        0074 GR
  3 A$render$64        0076 GR  |   3 A$render$65        0079 GR
  3 A$render$67        007B GR  |   3 A$render$68        007E GR
  3 A$render$69        0081 GR  |   3 A$render$70        0082 GR
  3 A$render$71        0084 GR  |   3 A$render$72        0087 GR
  3 A$render$73        0088 GR  |   3 A$render$74        0089 GR
  3 A$render$76        008B GR  |   3 A$render$77        008E GR
  3 A$render$79        0090 GR  |   3 A$render$80        0093 GR
  3 A$render$82        0096 GR  |   3 A$render$83        0099 GR
  3 A$render$84        009B GR  |   3 A$render$85        009D GR
  3 A$render$86        00A0 GR  |   3 A$render$88        00A2 GR
  3 A$render$89        00A5 GR  |   3 A$render$91        00A7 GR
  3 A$render$93        00AA GR  |   3 A$render$94        00AC GR
  3 A$render$95        00AE GR  |   3 A$render$96        00B0 GR
  3 A$render$97        00B2 GR  |   3 A$render$98        00B4 GR
  3 A$render$99        00B6 GR  |   3 L10                001A R
  3 L11                00A2 R   |   3 L15                007B R
  3 L17                0096 R   |   3 L18                00A7 R
  3 L19                00FB R   |   3 L20                0090 R
  3 L4                 008B R   |   3 L6                 00AA R
  3 L8                 0102 R   |   3 L9                 004C R
    __Draw_VL_a        **** GX  |     __Moveto_d         **** GX
    ___Dot_here        **** GX  |     ___Reset0Ref       **** GX
  2 _deltas            0000 R   |   3 _render_sprite     0000 GR

ASxxxx Assembler V05.00  (Motorola 6809), page 2.
Hexidecimal [16-Bits]

Area Table

[_CSEG]
   0 _CODE            size    0   flags C080
   2 .bss             size   7E   flags    0
   3 .text            size  12E   flags  100
[_DSEG]
   1 _DATA            size    0   flags C0C0

