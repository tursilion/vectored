                              1 ;;; gcc for m6809 : Mar 17 2019 11:56:12
                              2 ;;; 4.3.6 (gcc6809)
                              3 ;;; ABI version 1
                              4 ;;; -mabi=bx -mint8 -fomit-frame-pointer -O2
                              5 	.module	main.c
                              6 	.area	.text
   008D                       7 _scales:
   008D 20                    8 	.byte	32
   008E 40                    9 	.byte	64
   008F 60                   10 	.byte	96
   0090 7F                   11 	.byte	127
                             12 	.area	.bss
   C880                      13 _setIdx:	.blkb	1
   C881                      14 _shapeIdx:	.blkb	1
   C882                      15 _scaleIdx:	.blkb	1
                             16 	.area	.text
                             17 	.globl	_main
   0091                      18 _main:
   0091 34 60         [ 7]   19 	pshs	y,u
   0093 32 70         [ 5]   20 	leas	-16,s
   0095 6F 6C         [ 7]   21 	clr	12,s
   0097 6F 6D         [ 7]   22 	clr	13,s
   0099 6F 6E         [ 7]   23 	clr	14,s
   009B 6F 6F         [ 7]   24 	clr	15,s
   009D 7F C8 80      [ 7]   25 	clr	_setIdx
   00A0 7F C8 81      [ 7]   26 	clr	_shapeIdx
   00A3 C6 02         [ 2]   27 	ldb	#2
   00A5 F7 C8 82      [ 5]   28 	stb	_scaleIdx
   00A8 C6 01         [ 2]   29 	ldb	#1
   00AA F7 C8 1F      [ 5]   30 	stb	-14305
   00AD C6 03         [ 2]   31 	ldb	#3
   00AF F7 C8 20      [ 5]   32 	stb	-14304
   00B2 7F C8 21      [ 7]   33 	clr	-14303
   00B5 7F C8 22      [ 7]   34 	clr	-14302
   00B8 6F 64         [ 7]   35 	clr	4,s
   00BA                      36 L2:
   00BA F6 C8 80      [ 5]   37 	ldb	_setIdx
   00BD 86 05         [ 2]   38 	lda	#5	;umulqihi3
   00BF 3D            [11]   39 	mul
   00C0 1F 01         [ 6]   40 	tfr	d,x
   00C2 31 89 0F 55   [ 8]   41 	leay	_shapeSets,x
   00C6 F6 C8 81      [ 5]   42 	ldb	_shapeIdx
   00C9 86 05         [ 2]   43 	lda	#5	;umulqihi3
   00CB 3D            [11]   44 	mul
   00CC 1F 03         [ 6]   45 	tfr	d,u
   00CE 1E 03         [ 8]   46 	exg	d,u
   00D0 E3 22         [ 7]   47 	addd	2,y; addhi3,3
   00D2 1E 03         [ 8]   48 	exg	d,u
   00D4 BD F1 F8      [ 8]   49 	jsr	___Joy_Digital
   00D7 BD F1 BA      [ 8]   50 	jsr	___Read_Btns
   00DA BD F1 92      [ 8]   51 	jsr	___Wait_Recal
   00DD F6 C8 1C      [ 5]   52 	ldb	-14308
   00E0 10 2F 00 E3   [ 6]   53 	lble	L22
   00E4                      54 L3:
   00E4 C6 50         [ 2]   55 	ldb	#80
   00E6 BD 0F 5F      [ 8]   56 	jsr	__Intensity_a
   00E9 BD F3 54      [ 8]   57 	jsr	___Reset0Ref
   00EC C6 6E         [ 2]   58 	ldb	#110
   00EE E7 E2         [ 6]   59 	stb	,-s
   00F0 AE A4         [ 5]   60 	ldx	,y
   00F2 CB 24         [ 2]   61 	addb	#36
   00F4 BD 0F 69      [ 8]   62 	jsr	__Print_Str_d
   00F7 BD F3 54      [ 8]   63 	jsr	___Reset0Ref
   00FA C6 58         [ 2]   64 	ldb	#88
   00FC E7 E2         [ 6]   65 	stb	,-s
   00FE AE C4         [ 5]   66 	ldx	,u
   0100 CB 3A         [ 2]   67 	addb	#58
   0102 BD 0F 69      [ 8]   68 	jsr	__Print_Str_d
   0105 F6 C8 1B      [ 5]   69 	ldb	-14309
   0108 E7 67         [ 5]   70 	stb	7,s
   010A 32 62         [ 5]   71 	leas	2,s
   010C 5D            [ 2]   72 	tstb
   010D 2F 06         [ 3]   73 	ble	L4
   010F 6D 64         [ 7]   74 	tst	4,s
   0111 10 2F 00 96   [ 6]   75 	lble	L23
   0115                      76 L4:
   0115 6D 65         [ 7]   77 	tst	5,s
   0117 10 2D 00 66   [ 6]   78 	lblt	L24
   011B                      79 L5:
   011B F6 C8 80      [ 5]   80 	ldb	_setIdx
   011E E7 69         [ 5]   81 	stb	9,s
   0120 F6 C8 81      [ 5]   82 	ldb	_shapeIdx
   0123 E7 68         [ 5]   83 	stb	8,s
   0125 F6 C8 82      [ 5]   84 	ldb	_scaleIdx
   0128 E7 6A         [ 5]   85 	stb	10,s
   012A 6F 6B         [ 7]   86 	clr	11,s
   012C                      87 L6:
   012C E6 6B         [ 5]   88 	ldb	11,s
   012E 4F            [ 2]   89 	clra		;zero_extendqihi: R:b -> R:d
   012F ED E4         [ 5]   90 	std	,s
   0131 E6 6B         [ 5]   91 	ldb	11,s
   0133 8E C8 12      [ 3]   92 	ldx	#-14318
   0136 3A            [ 3]   93 	abx
   0137 E6 84         [ 4]   94 	ldb	,x
   0139 E7 66         [ 5]   95 	stb	6,s
   013B 10 27 00 BF   [ 6]   96 	lbeq	L8
   013F 30 E8 10      [ 5]   97 	leax	16,s
   0142 1E 01         [ 8]   98 	exg	d,x
   0144 E3 E4         [ 6]   99 	addd	,s; addhi3,3
   0146 1E 01         [ 8]  100 	exg	d,x
   0148 6D 1C         [ 7]  101 	tst	-4,x
   014A 10 26 00 B0   [ 6]  102 	lbne	L8
   014E 6D 6B         [ 7]  103 	tst	11,s
   0150 10 26 00 92   [ 6]  104 	lbne	L9
   0154 6D 68         [ 7]  105 	tst	8,s
   0156 26 17         [ 3]  106 	bne	L10
   0158 E6 69         [ 5]  107 	ldb	9,s
   015A 4F            [ 2]  108 	clra		;zero_extendqihi: R:b -> R:d
   015B ED E4         [ 5]  109 	std	,s
   015D 58            [ 2]  110 	aslb
   015E 49            [ 2]  111 	rola
   015F 58            [ 2]  112 	aslb
   0160 49            [ 2]  113 	rola
   0161 1F 01         [ 6]  114 	tfr	d,x
   0163 1E 01         [ 8]  115 	exg	d,x
   0165 E3 E4         [ 6]  116 	addd	,s; addhi3,3
   0167 1E 01         [ 8]  117 	exg	d,x
   0169 E6 89 0F 59   [ 8]  118 	ldb	_shapeSets+4,x
   016D E7 68         [ 5]  119 	stb	8,s
   016F                     120 L10:
   016F 6A 68         [ 7]  121 	dec	8,s
   0171                     122 L11:
   0171 E6 6B         [ 5]  123 	ldb	11,s
   0173 4F            [ 2]  124 	clra		;zero_extendqihi: R:b -> R:d
   0174 30 E8 10      [ 5]  125 	leax	16,s
   0177 30 8B         [ 8]  126 	leax	d,x
   0179 E6 66         [ 5]  127 	ldb	6,s
   017B E7 1C         [ 5]  128 	stb	-4,x
   017D                     129 L17:
   017D 6C 6B         [ 7]  130 	inc	11,s
   017F 20 AB         [ 3]  131 	bra	L6
   0181                     132 L24:
   0181 6D 64         [ 7]  133 	tst	4,s
   0183 10 2D FF 94   [ 6]  134 	lblt	L5
   0187 F6 C8 80      [ 5]  135 	ldb	_setIdx
   018A 7D C8 81      [ 7]  136 	tst	_shapeIdx
   018D 26 16         [ 3]  137 	bne	L7
   018F 4F            [ 2]  138 	clra		;zero_extendqihi: R:b -> R:d
   0190 ED E4         [ 5]  139 	std	,s
   0192 58            [ 2]  140 	aslb
   0193 49            [ 2]  141 	rola
   0194 58            [ 2]  142 	aslb
   0195 49            [ 2]  143 	rola
   0196 1F 01         [ 6]  144 	tfr	d,x
   0198 1E 01         [ 8]  145 	exg	d,x
   019A E3 E4         [ 6]  146 	addd	,s; addhi3,3
   019C 1E 01         [ 8]  147 	exg	d,x
   019E E6 89 0F 59   [ 8]  148 	ldb	_shapeSets+4,x
   01A2 F7 C8 81      [ 5]  149 	stb	_shapeIdx
   01A5                     150 L7:
   01A5 7A C8 81      [ 7]  151 	dec	_shapeIdx
   01A8 16 FF 70      [ 5]  152 	lbra	L5
   01AB                     153 L23:
   01AB F6 C8 80      [ 5]  154 	ldb	_setIdx
   01AE 86 05         [ 2]  155 	lda	#5	;umulqihi3
   01B0 3D            [11]  156 	mul
   01B1 1F 01         [ 6]  157 	tfr	d,x
   01B3 7C C8 81      [ 7]  158 	inc	_shapeIdx
   01B6 F6 C8 81      [ 5]  159 	ldb	_shapeIdx
   01B9 E1 89 0F 59   [ 8]  160 	cmpb	_shapeSets+4,x	;cmpqi:
   01BD 10 25 FF 5A   [ 6]  161 	lblo	L5
   01C1 7F C8 81      [ 7]  162 	clr	_shapeIdx
   01C4 16 FF 54      [ 5]  163 	lbra	L5
   01C7                     164 L22:
   01C7 C6 7F         [ 2]  165 	ldb	#127
   01C9 BD 0F 5F      [ 8]  166 	jsr	__Intensity_a
   01CC F6 C8 82      [ 5]  167 	ldb	_scaleIdx
   01CF 4F            [ 2]  168 	clra		;zero_extendqihi: R:b -> R:d
   01D0 1F 01         [ 6]  169 	tfr	d,x
   01D2 E6 89 00 8D   [ 8]  170 	ldb	_scales,x
   01D6 F7 D0 04      [ 5]  171 	stb	-12284
   01D9 BD F3 54      [ 8]  172 	jsr	___Reset0Ref
   01DC E6 44         [ 5]  173 	ldb	4,u
   01DE AE 42         [ 6]  174 	ldx	2,u
   01E0 BD 02 6E      [ 8]  175 	jsr	_render_sprite
   01E3 16 FE FE      [ 5]  176 	lbra	L3
   01E6                     177 L9:
   01E6 E6 6B         [ 5]  178 	ldb	11,s
   01E8 C1 03         [ 2]  179 	cmpb	#3	;cmpqi:
   01EA 27 3D         [ 3]  180 	beq	L25
   01EC E6 6B         [ 5]  181 	ldb	11,s
   01EE C1 01         [ 2]  182 	cmpb	#1	;cmpqi:
   01F0 10 27 00 65   [ 6]  183 	lbeq	L26
   01F4 6C 6A         [ 7]  184 	inc	10,s
   01F6 E6 6A         [ 5]  185 	ldb	10,s
   01F8 C1 03         [ 2]  186 	cmpb	#3	;cmpqi:
   01FA 23 02         [ 3]  187 	bls	L8
   01FC 6F 6A         [ 7]  188 	clr	10,s
   01FE                     189 L8:
   01FE E6 6B         [ 5]  190 	ldb	11,s
   0200 4F            [ 2]  191 	clra		;zero_extendqihi: R:b -> R:d
   0201 30 E8 10      [ 5]  192 	leax	16,s
   0204 30 8B         [ 8]  193 	leax	d,x
   0206 E6 66         [ 5]  194 	ldb	6,s
   0208 E7 1C         [ 5]  195 	stb	-4,x
   020A E6 6B         [ 5]  196 	ldb	11,s
   020C 5C            [ 2]  197 	incb
   020D C1 03         [ 2]  198 	cmpb	#3	;cmpqi:
   020F 10 23 FF 6A   [ 6]  199 	lbls	L17
   0213 E6 69         [ 5]  200 	ldb	9,s
   0215 F7 C8 80      [ 5]  201 	stb	_setIdx
   0218 E6 68         [ 5]  202 	ldb	8,s
   021A F7 C8 81      [ 5]  203 	stb	_shapeIdx
   021D E6 6A         [ 5]  204 	ldb	10,s
   021F F7 C8 82      [ 5]  205 	stb	_scaleIdx
   0222                     206 L14:
   0222 E6 65         [ 5]  207 	ldb	5,s
   0224 E7 64         [ 5]  208 	stb	4,s
   0226 16 FE 91      [ 5]  209 	lbra	L2
   0229                     210 L25:
   0229 E6 69         [ 5]  211 	ldb	9,s
   022B F7 C8 80      [ 5]  212 	stb	_setIdx
   022E E6 6A         [ 5]  213 	ldb	10,s
   0230 F7 C8 82      [ 5]  214 	stb	_scaleIdx
   0233 E6 68         [ 5]  215 	ldb	8,s
   0235 5C            [ 2]  216 	incb
   0236 E7 67         [ 5]  217 	stb	7,s
   0238 F7 C8 81      [ 5]  218 	stb	_shapeIdx
   023B E6 69         [ 5]  219 	ldb	9,s
   023D 4F            [ 2]  220 	clra		;zero_extendqihi: R:b -> R:d
   023E ED 62         [ 6]  221 	std	2,s
   0240 58            [ 2]  222 	aslb
   0241 49            [ 2]  223 	rola
   0242 58            [ 2]  224 	aslb
   0243 49            [ 2]  225 	rola
   0244 EE 62         [ 6]  226 	ldu	2,s
   0246 30 CB         [ 8]  227 	leax	d,u
   0248 E6 67         [ 5]  228 	ldb	7,s
   024A E1 89 0F 59   [ 8]  229 	cmpb	_shapeSets+4,x	;cmpqi:
   024E 25 18         [ 3]  230 	blo	L13
   0250 7F C8 81      [ 7]  231 	clr	_shapeIdx
   0253 E6 66         [ 5]  232 	ldb	6,s
   0255 E7 6F         [ 5]  233 	stb	15,s
   0257 20 C9         [ 3]  234 	bra	L14
   0259                     235 L26:
   0259 6C 69         [ 7]  236 	inc	9,s
   025B E6 69         [ 5]  237 	ldb	9,s
   025D C1 01         [ 2]  238 	cmpb	#1	;cmpqi:
   025F 23 02         [ 3]  239 	bls	L16
   0261 6F 69         [ 7]  240 	clr	9,s
   0263                     241 L16:
   0263 6F 68         [ 7]  242 	clr	8,s
   0265 16 FF 09      [ 5]  243 	lbra	L11
   0268                     244 L13:
   0268 E6 66         [ 5]  245 	ldb	6,s
   026A E7 6F         [ 5]  246 	stb	15,s
   026C 20 B4         [ 3]  247 	bra	L14
ASxxxx Assembler V05.00  (Motorola 6809), page 1.
Hexidecimal [16-Bits]

Symbol Table

    .__.$$$.       =   2710 L   |     .__.ABS.       =   0000 G
    .__.CPU.       =   0000 L   |     .__.H$L.       =   0001 L
  2 A$main$100         00B9 GR  |   2 A$main$101         00BB GR
  2 A$main$102         00BD GR  |   2 A$main$103         00C1 GR
  2 A$main$104         00C3 GR  |   2 A$main$105         00C7 GR
  2 A$main$106         00C9 GR  |   2 A$main$107         00CB GR
  2 A$main$108         00CD GR  |   2 A$main$109         00CE GR
  2 A$main$110         00D0 GR  |   2 A$main$111         00D1 GR
  2 A$main$112         00D2 GR  |   2 A$main$113         00D3 GR
  2 A$main$114         00D4 GR  |   2 A$main$115         00D6 GR
  2 A$main$116         00D8 GR  |   2 A$main$117         00DA GR
  2 A$main$118         00DC GR  |   2 A$main$119         00E0 GR
  2 A$main$121         00E2 GR  |   2 A$main$123         00E4 GR
  2 A$main$124         00E6 GR  |   2 A$main$125         00E7 GR
  2 A$main$126         00EA GR  |   2 A$main$127         00EC GR
  2 A$main$128         00EE GR  |   2 A$main$130         00F0 GR
  2 A$main$131         00F2 GR  |   2 A$main$133         00F4 GR
  2 A$main$134         00F6 GR  |   2 A$main$135         00FA GR
  2 A$main$136         00FD GR  |   2 A$main$137         0100 GR
  2 A$main$138         0102 GR  |   2 A$main$139         0103 GR
  2 A$main$140         0105 GR  |   2 A$main$141         0106 GR
  2 A$main$142         0107 GR  |   2 A$main$143         0108 GR
  2 A$main$144         0109 GR  |   2 A$main$145         010B GR
  2 A$main$146         010D GR  |   2 A$main$147         010F GR
  2 A$main$148         0111 GR  |   2 A$main$149         0115 GR
  2 A$main$151         0118 GR  |   2 A$main$152         011B GR
  2 A$main$154         011E GR  |   2 A$main$155         0121 GR
  2 A$main$156         0123 GR  |   2 A$main$157         0124 GR
  2 A$main$158         0126 GR  |   2 A$main$159         0129 GR
  2 A$main$160         012C GR  |   2 A$main$161         0130 GR
  2 A$main$162         0134 GR  |   2 A$main$163         0137 GR
  2 A$main$165         013A GR  |   2 A$main$166         013C GR
  2 A$main$167         013F GR  |   2 A$main$168         0142 GR
  2 A$main$169         0143 GR  |   2 A$main$170         0145 GR
  2 A$main$171         0149 GR  |   2 A$main$172         014C GR
  2 A$main$173         014F GR  |   2 A$main$174         0151 GR
  2 A$main$175         0153 GR  |   2 A$main$176         0156 GR
  2 A$main$178         0159 GR  |   2 A$main$179         015B GR
  2 A$main$180         015D GR  |   2 A$main$181         015F GR
  2 A$main$182         0161 GR  |   2 A$main$183         0163 GR
  2 A$main$184         0167 GR  |   2 A$main$185         0169 GR
  2 A$main$186         016B GR  |   2 A$main$187         016D GR
  2 A$main$188         016F GR  |   2 A$main$19          0004 GR
  2 A$main$190         0171 GR  |   2 A$main$191         0173 GR
  2 A$main$192         0174 GR  |   2 A$main$193         0177 GR
  2 A$main$194         0179 GR  |   2 A$main$195         017B GR
  2 A$main$196         017D GR  |   2 A$main$197         017F GR
  2 A$main$198         0180 GR  |   2 A$main$199         0182 GR
  2 A$main$20          0006 GR  |   2 A$main$200         0186 GR
  2 A$main$201         0188 GR  |   2 A$main$202         018B GR
  2 A$main$203         018D GR  |   2 A$main$204         0190 GR
  2 A$main$205         0192 GR  |   2 A$main$207         0195 GR
  2 A$main$208         0197 GR  |   2 A$main$209         0199 GR
  2 A$main$21          0008 GR  |   2 A$main$211         019C GR
  2 A$main$212         019E GR  |   2 A$main$213         01A1 GR
  2 A$main$214         01A3 GR  |   2 A$main$215         01A6 GR
  2 A$main$216         01A8 GR  |   2 A$main$217         01A9 GR
  2 A$main$218         01AB GR  |   2 A$main$219         01AE GR
  2 A$main$22          000A GR  |   2 A$main$220         01B0 GR
  2 A$main$221         01B1 GR  |   2 A$main$222         01B3 GR
  2 A$main$223         01B4 GR  |   2 A$main$224         01B5 GR
  2 A$main$225         01B6 GR  |   2 A$main$226         01B7 GR
  2 A$main$227         01B9 GR  |   2 A$main$228         01BB GR
  2 A$main$229         01BD GR  |   2 A$main$23          000C GR
  2 A$main$230         01C1 GR  |   2 A$main$231         01C3 GR
  2 A$main$232         01C6 GR  |   2 A$main$233         01C8 GR
  2 A$main$234         01CA GR  |   2 A$main$236         01CC GR
  2 A$main$237         01CE GR  |   2 A$main$238         01D0 GR
  2 A$main$239         01D2 GR  |   2 A$main$24          000E GR
  2 A$main$240         01D4 GR  |   2 A$main$242         01D6 GR
  2 A$main$243         01D8 GR  |   2 A$main$245         01DB GR
  2 A$main$246         01DD GR  |   2 A$main$247         01DF GR
  2 A$main$25          0010 GR  |   2 A$main$26          0013 GR
  2 A$main$27          0016 GR  |   2 A$main$28          0018 GR
  2 A$main$29          001B GR  |   2 A$main$30          001D GR
  2 A$main$31          0020 GR  |   2 A$main$32          0022 GR
  2 A$main$33          0025 GR  |   2 A$main$34          0028 GR
  2 A$main$35          002B GR  |   2 A$main$37          002D GR
  2 A$main$38          0030 GR  |   2 A$main$39          0032 GR
  2 A$main$40          0033 GR  |   2 A$main$41          0035 GR
  2 A$main$42          0039 GR  |   2 A$main$43          003C GR
  2 A$main$44          003E GR  |   2 A$main$45          003F GR
  2 A$main$46          0041 GR  |   2 A$main$47          0043 GR
  2 A$main$48          0045 GR  |   2 A$main$49          0047 GR
  2 A$main$50          004A GR  |   2 A$main$51          004D GR
  2 A$main$52          0050 GR  |   2 A$main$53          0053 GR
  2 A$main$55          0057 GR  |   2 A$main$56          0059 GR
  2 A$main$57          005C GR  |   2 A$main$58          005F GR
  2 A$main$59          0061 GR  |   2 A$main$60          0063 GR
  2 A$main$61          0065 GR  |   2 A$main$62          0067 GR
  2 A$main$63          006A GR  |   2 A$main$64          006D GR
  2 A$main$65          006F GR  |   2 A$main$66          0071 GR
  2 A$main$67          0073 GR  |   2 A$main$68          0075 GR
  2 A$main$69          0078 GR  |   2 A$main$70          007B GR
  2 A$main$71          007D GR  |   2 A$main$72          007F GR
  2 A$main$73          0080 GR  |   2 A$main$74          0082 GR
  2 A$main$75          0084 GR  |   2 A$main$77          0088 GR
  2 A$main$78          008A GR  |   2 A$main$80          008E GR
  2 A$main$81          0091 GR  |   2 A$main$82          0093 GR
  2 A$main$83          0096 GR  |   2 A$main$84          0098 GR
  2 A$main$85          009B GR  |   2 A$main$86          009D GR
  2 A$main$88          009F GR  |   2 A$main$89          00A1 GR
  2 A$main$90          00A2 GR  |   2 A$main$91          00A4 GR
  2 A$main$92          00A6 GR  |   2 A$main$93          00A9 GR
  2 A$main$94          00AA GR  |   2 A$main$95          00AC GR
  2 A$main$96          00AE GR  |   2 A$main$97          00B2 GR
  2 A$main$98          00B5 GR  |   2 A$main$99          00B7 GR
  2 L10                00E2 R   |   2 L11                00E4 R
  2 L13                01DB R   |   2 L14                0195 R
  2 L16                01D6 R   |   2 L17                00F0 R
  2 L2                 002D R   |   2 L22                013A R
  2 L23                011E R   |   2 L24                00F4 R
  2 L25                019C R   |   2 L26                01CC R
  2 L3                 0057 R   |   2 L4                 0088 R
  2 L5                 008E R   |   2 L6                 009F R
  2 L7                 0118 R   |   2 L8                 0171 R
  2 L9                 0159 R   |     __Intensity_a      **** GX
    __Print_Str_d      **** GX  |     ___Joy_Digital     **** GX
    ___Read_Btns       **** GX  |     ___Reset0Ref       **** GX
    ___Wait_Recal      **** GX  |   2 _main              0004 GR
    _render_sprite     **** GX  |   3 _scaleIdx          0002 R
  2 _scales            0000 R   |   3 _setIdx            0000 R
  3 _shapeIdx          0001 R   |     _shapeSets         **** GX

ASxxxx Assembler V05.00  (Motorola 6809), page 2.
Hexidecimal [16-Bits]

Area Table

[_CSEG]
   0 _CODE            size    0   flags C080
   2 .text            size  1E1   flags  100
   3 .bss             size    3   flags    0
[_DSEG]
   1 _DATA            size    0   flags C0C0

