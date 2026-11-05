// ToqueFit · porta-tag NFC em forma de anilha
// Duas peças: BASE (presa no aparelho, faz o espaçamento do metal) e TAMPA (guarda a tag e leva a logo).
// Fecha com quarto de volta (baioneta): encaixa as três travas nos rasgos e gira no sentido horário.
//
// Para gerar cada peça, troque "mostrar" abaixo e exporte em STL (F6 e depois F7 no OpenSCAD).
// Todas as medidas em milímetros.

/* [O que mostrar] */
mostrar = "montada";   // "base", "tampa" (já virada para imprimir), "montada", "explodida", "corte"

/* [Tag NFC] */
tag_d     = 25;    // diâmetro da tag adesiva
tag_folga = 2.0;   // folga total no rebaixo (1 mm de cada lado: a tag entra sem forçar)
pele      = 1.0;   // plástico entre a tag e o celular (0,8 a 1,2)
afast     = 10;    // distância da tag até o metal do aparelho

/* [Peça] */
D         = 44;    // diâmetro externo
parede    = 3.5;   // parede da base
fundo     = 3.0;   // fundo da base
placa     = 2.0;   // espessura do disco da tampa
pino_h    = 5.0;   // altura do encaixe que desce da tampa
pino_furo = 29;    // vão interno do encaixe (precisa ser maior que tag_d + tag_folga)

/* [Encaixe de quarto de volta] */
folga     = 0.3;   // folga do encaixe (aumente para 0,4 se ficar duro)
n_travas  = 3;
trava_ang = 20;    // largura de cada trava, em graus
trava_sai = 1.5;   // quanto a trava sai para fora do encaixe
trava_h   = 1.2;   // parte reta da trava (o resto é rampa de 45°, imprime sem suporte)
giro      = 35;    // quanto gira para travar, em graus

/* [Fixação] */
canal_cinta = true;  // canal embaixo para abraçadeira ou velcro (aparelho de tubo redondo)
cinta_larg  = 6;
cinta_prof  = 1.6;
parafuso    = true;  // furo lateral para parafuso M2 que impede abrir sem ferramenta

/* [Tampa] */
academia    = "TITAN ACADEMIA";        // borda de baixo da tampa ("" para tirar)
instrucao   = "APROXIME OU ESCANEIE";  // borda de cima
marca       = "TOQUEFIT";              // gravado na lateral da base ("" para tirar)
codigo      = "";                      // código do aparelho gravado por baixo da tampa (ex.: "A01")
// profundidade das gravações = 2 camadas de 0,2 mm. Imprimindo a tampa virada, troque o filamento
// para a cor escura em 0,4 mm de altura: QR, textos e sulco aparecem escuros sobre a cor clara.
gravacao    = 0.4;

/* [QR code] */
qr          = [];   // matriz do QR (1 = quadrado escuro); vazia = sem QR. Gerada por ferramentas/gerar_tampas.py
qr_lado     = 19;   // lado do QR, sem contar a margem clara em volta

/* [Logo no centro (só sem QR)] */
logo_svg    = "";          // ex.: "logo-academia.svg" na mesma pasta
logo_d      = 18;
logo_prof   = 0.4;

$fn = 120;

// ---------- medidas derivadas ----------
R      = D / 2;
R_cav  = R - parede;                 // vão interno da base
R_pino = R_cav - folga;              // encaixe da tampa
Hb     = afast - (placa - pele);     // altura da base: a tag fica exatamente a "afast" do metal
rebaixo = placa - pele;              // profundidade do rebaixo da tag
z_ponta = Hb - pino_h;               // ponta do encaixe, peça montada
trava_total = trava_h + trava_sai;   // trava com rampa de 45°
canal_z0 = z_ponta - folga;
canal_z1 = z_ponta + trava_total + folga;

assert(pino_furo / 2 > (tag_d + tag_folga) / 2, "pino_furo precisa ser maior que a tag");
assert(Hb - fundo >= pino_h + 0.5, "base baixa demais para o encaixe: aumente afast ou diminua pino_h");
assert(R - (R_pino + trava_sai + folga) >= 1.6, "parede fina demais atrás das travas");

module setor(r0, r1, a0, a1, z0, z1) {
  // fatia de anel entre os raios r0..r1, ângulos a0..a1 e alturas z0..z1
  translate([0, 0, z0]) linear_extrude(z1 - z0)
    intersection() {
      difference() { circle(r1); circle(r0); }
      polygon(concat([[0, 0]], [for (a = [a0 : (a1 - a0) / 24 : a1]) [cos(a), sin(a)] * (r1 * 1.5)]));
    }
}

// ---------- BASE ----------
module base() {
  difference() {
    cylinder(r = R, h = Hb);
    // vão de ar (o espaçamento do metal)
    translate([0, 0, fundo]) cylinder(r = R_cav, h = Hb);
    // rasgos da baioneta: entrada vertical + caminho horizontal no sentido horário
    for (i = [0 : n_travas - 1]) {
      a = i * 360 / n_travas;
      setor(R_cav - 1, R_pino + trava_sai + folga, a - trava_ang / 2 - 2, a + trava_ang / 2 + 2, canal_z0, Hb + 1);
      setor(R_cav - 1, R_pino + trava_sai + folga, a - giro - trava_ang / 2 - 2, a + trava_ang / 2 + 2, canal_z0, canal_z1);
    }
    // canal da abraçadeira por baixo
    if (canal_cinta) translate([-R - 1, -cinta_larg / 2, -0.01]) cube([D + 2, cinta_larg, cinta_prof]);
    // furo do parafuso M2, alinhado com a tampa já travada
    if (parafuso) translate([0, 0, Hb - 1.6]) rotate([0, 0, 60]) rotate([0, 90, 0]) cylinder(d = 2.2, h = R + 1, $fn = 24);
    // marca de alinhamento: um risco na lateral onde entra a trava
    translate([R - 0.6, -0.4, Hb - 3]) cube([1, 0.8, 3.1]);
    // marca gravada na lateral, de frente (abaixo do nome da academia)
    if (marca != "") texto_lateral(marca, Hb / 2 - 0.3, 3.0, 0.5);
  }
}

// largura aproximada de cada letra (Liberation Sans Bold), em frações do tamanho da fonte
function lw(c) = len(search(c, "I ")) > 0 ? 0.36 : len(search(c, "MW")) > 0 ? 0.92 : len(search(c, "OQGCD")) > 0 ? 0.8 : 0.7;
function soma(t, i) = i <= 0 ? 0 : soma(t, i - 1) + lw(t[i - 1]) + 0.1;
// posição do centro da letra i em relação ao centro do texto (em mm, ao longo do arco)
function pos_letra(t, i, alt) = (soma(t, i) + lw(t[i]) / 2 - (soma(t, len(t)) - 0.1) / 2) * alt;

module texto_lateral(t, z, alt, prof) {
  n = len(t);
  for (i = [0 : n - 1])
    rotate([0, 0, 270 + pos_letra(t, i, alt) * 1.18 / R * 180 / PI])
      translate([R - prof, 0, z]) rotate([90, 0, 90]) linear_extrude(prof + 1)
        text(t[i], size = alt, font = "Liberation Sans:style=Bold", halign = "center", valign = "center");
}

// ---------- TAMPA (montada: face de cima para cima) ----------
module trava() {
  // parte reta + rampa de 45° na face de cima: a tampa imprime virada sem precisar de suporte
  hull() {
    setor(R_pino - 0.5, R_pino + trava_sai, -trava_ang / 2, trava_ang / 2, z_ponta, z_ponta + trava_h);
    setor(R_pino - 0.5, R_pino + 0.01, -trava_ang / 2, trava_ang / 2, z_ponta, z_ponta + trava_total);
  }
}

module simbolo_nfc() {
  // as três ondas de aproximação
  for (k = [0 : 2]) {
    rr = 1.6 + k * 1.5;
    intersection() {
      difference() { circle(rr + 0.45, $fn = 48); circle(rr - 0.45, $fn = 48); }
      polygon([[0, 0], [8 * cos(-48), 8 * sin(-48)], [8, 0], [8 * cos(48), 8 * sin(48)]]);
    }
  }
}

// texto em arco, sempre lido da esquerda para a direita (em cima com o pé para o centro, embaixo com a cabeça)
module texto_curvo(t, r, alt, centro = 270, folga = 1) {
  n = len(t);
  cima = sin(centro) > 0;
  for (i = [0 : n - 1]) {
    d = pos_letra(t, i, alt) * folga / r * 180 / PI;  // ângulo do centro da letra
    a = cima ? centro - d : centro + d;
    translate([r * cos(a), r * sin(a)]) rotate(cima ? a - 90 : a + 90)
      text(t[i], size = alt, font = "Liberation Sans:style=Bold", halign = "center", valign = "center");
  }
}

// QR code: um quadrado por módulo escuro (linha 0 da matriz = topo)
module qr_2d() {
  n = len(qr);
  m = qr_lado / n;
  translate([-qr_lado / 2, -qr_lado / 2])
    for (y = [0 : n - 1], x = [0 : n - 1]) if (qr[y][x] == 1) translate([x * m, (n - 1 - y) * m]) square(m + 0.002);
}

module gravacoes_2d() {
  difference() { circle(R - 1.6); circle(R - 2.3); }
  // desenhadas já compensando o giro: com a tampa travada, ficam retas
  rotate(giro) {
    if (len(qr) > 0) qr_2d();
    else translate([0, 7]) rotate(90) simbolo_nfc();
    if (instrucao != "") texto_curvo(instrucao, 17.3, 1.9, 90, 1.08);
    if (academia != "") texto_curvo(academia, 17.2, 2.4, 270, 1.12);
  }
}

module tampa() {
  zt = Hb + placa;  // face de cima
  difference() {
    union() {
      translate([0, 0, Hb]) cylinder(r = R, h = placa);
      // encaixe (anel) que desce para dentro da base
      translate([0, 0, z_ponta]) difference() {
        cylinder(r = R_pino, h = pino_h + 0.01);
        translate([0, 0, -1]) cylinder(d = pino_furo, h = pino_h + 2);
      }
      for (i = [0 : n_travas - 1]) rotate([0, 0, i * 360 / n_travas]) trava();
    }
    // rebaixo da tag, por baixo da placa
    translate([0, 0, Hb - 0.01]) cylinder(d = tag_d + tag_folga, h = rebaixo + 0.01);
    // furo do parafuso (só a ponta, para o parafuso morder) na posição travada
    if (parafuso) translate([0, 0, Hb - 1.6]) rotate([0, 0, 60 + giro]) translate([R_pino - 3, 0, 0]) rotate([0, 90, 0]) cylinder(d = 1.6, h = 3.5, $fn = 24);
    // gravações na face de cima: sulco da anilha, QR no centro, instrução em cima e academia embaixo
    translate([0, 0, zt - gravacao]) linear_extrude(gravacao + 0.01) gravacoes_2d();
    // logo da academia no centro, quando não há QR (fica sobre a tag; deixa pelo menos 0,6 mm de plástico)
    if (len(qr) == 0 && logo_svg != "") translate([0, 0, zt - logo_prof]) linear_extrude(logo_prof + 0.01)
      resize([logo_d, 0], auto = true) import(logo_svg, center = true);
    // código do aparelho por baixo da borda (espelhado para ler olhando por baixo)
    if (codigo != "") translate([0, 0, Hb - 0.01]) linear_extrude(0.31)
      rotate(giro + 180) translate([0, -20.1]) mirror([1, 0]) text(codigo, size = 2, font = "Liberation Sans:style=Bold", halign = "center", valign = "center");
    // seta de "gire para travar" na lateral
    translate([0, 0, Hb + 0.5]) rotate([0, 0, -8]) setor(R - 0.5, R + 1, 0, 16, 0, 1);
  }
}

// tag de referência (só para visualizar)
module tag() { color("#3A7BD5") translate([0, 0, Hb + rebaixo - 0.3]) cylinder(d = tag_d, h = 0.3); }

if (mostrar == "base") base();
else if (mostrar == "tampa") translate([0, 0, Hb + placa]) rotate([180, 0, 0]) tampa();  // virada: face de cima na mesa
else if (mostrar == "montada") { color("#2B3037") base(); color("#F3FF2C") rotate([0, 0, -giro]) tampa(); }
else if (mostrar == "explodida") { color("#2B3037") base(); color("#3A7BD5") translate([0, 0, 8]) tag(); color("#F3FF2C") translate([0, 0, 16]) tampa(); }
else if (mostrar == "corte") difference() {
  union() { color("#2B3037") base(); color("#F3FF2C") rotate([0, 0, -giro]) tampa(); tag(); }
  translate([-D, 0, -1]) cube([2 * D, D, 40]);
}

// cortes 2D para o desenho técnico (exportar em SVG)
// corte pelo plano que passa a 90° e 270°: mostra uma trava já presa no rasgo e o canal da abraçadeira
module secao() projection(cut = true) rotate([90, 0, 0]) rotate([0, 0, -90]) children();
if (mostrar == "secao-base") secao() base();
if (mostrar == "secao-tampa") secao() rotate([0, 0, -giro]) tampa();
if (mostrar == "secao-tag") secao() tag();

// face da tampa travada, vista de cima (para conferir se o QR lê)
if (mostrar == "face") rotate(-giro) gravacoes_2d();
