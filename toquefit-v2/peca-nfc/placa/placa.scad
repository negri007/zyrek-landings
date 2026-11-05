// Placa ToqueFit 50 x 75 x 12 mm: base (fica no aparelho, segura a tag) + tampa lisa (leva o adesivo).
// Eixos: x da esquerda para a direita, y de baixo para cima (vista de frente), z saindo do metal.
// modo: "base" | "tampa" (STL, já na posição de imprimir) | "fora" | "dentro" | "explodida" | "corte" | "montada"
modo = "montada";

L = 50; A = 75; R = 5;          // placa
H = 12;                          // altura total
fundo = 2;                       // espessura do fundo da base
parede = 2;                      // parede até o apoio (z = 10)
moldura = 1.5;                   // parede acima do apoio (borda que aparece na frente)
apoio_z = 10;                    // onde a tampa apoia; topo do pilar
tampa_e = 1.6;                   // espessura da tampa
rebaixo = H - apoio_z - tampa_e; // 0,4: degrau entre a tampa e a borda da base = rebaixo do adesivo
folga = 0.2;                     // folga entre tampa e moldura, por lado
chanfro = 1;                     // chanfro da borda da frente

tag_d = 25; tag_e = 0.3;         // tag NFC (meça a sua e ajuste tag_e)
tag_x = 25; tag_y = A - 41.5;    // centro da tag: 25 da esquerda, 41,5 do topo
pilar_d = 30; pilar_parede = 1.6; pilar_teto = 1.2;
aloj_d = 26;                     // alojamento da tag no topo do pilar

trava_c = 6; trava_p = 0.35;     // 4 travas na moldura (comprimento, quanto avançam)
trava_y = [20, 55];
chave_l = 3; chave_p = 0.8;      // dente na moldura de cima (anti-inversão)
moeda_l = 8;                     // fenda de abrir na borda de baixo
fenda = [6, 2];                  // fendas de abraçadeira no fundo
fenda_pos = [[8, 8], [42, 8], [8, 67], [42, 67]];

$fn = 96;
ab = [L - 2 * moldura, A - 2 * moldura];                 // abertura da moldura: 47 x 72
tp = [ab[0] - 2 * folga, ab[1] - 2 * folga];             // tampa: 46,6 x 71,6

module rr(w, h, r) translate([(L - w) / 2, (A - h) / 2]) translate([r, r]) offset(r) square([w - 2 * r, h - 2 * r]);

module base() {
  difference() {
    hull() {
      linear_extrude(H - chanfro) rr(L, A, R);
      linear_extrude(H) rr(L - 2 * chanfro, A - 2 * chanfro, R - chanfro);
    }
    translate([0, 0, fundo]) linear_extrude(H) rr(L - 2 * parede, A - 2 * parede, R - parede);   // vão
    translate([0, 0, apoio_z]) linear_extrude(H) rr(ab[0], ab[1], R - moldura);                 // encaixe da tampa
    translate([L / 2 - moeda_l / 2, -1, apoio_z - 0.8]) cube([moeda_l, parede + 1.5, 5]);        // fenda da moeda
    for (p = fenda_pos) translate([p[0] - fenda[0] / 2, p[1] - fenda[1] / 2, -1]) cube([fenda[0], fenda[1], fundo + 2]);
    translate([L / 2, A - 13, fundo - 0.5]) linear_extrude(1) {                                  // marca TOPO
      text("TOPO", size = 3.6, halign = "center", font = "Liberation Sans:style=Bold");
      translate([0, 5.4]) polygon([[-2.4, 0], [2.4, 0], [0, 3]]);
    }
  }
  // pilar oco que segura a tag
  translate([tag_x, tag_y, fundo]) difference() {
    cylinder(d = pilar_d, h = apoio_z - fundo);
    translate([0, 0, -0.01]) cylinder(d = pilar_d - 2 * pilar_parede, h = apoio_z - fundo - pilar_teto);
    translate([0, 0, apoio_z - fundo - tag_e]) cylinder(d = aloj_d, h = 1);
  }
  // dente anti-inversão (do fundo até a face da tampa)
  translate([L / 2 - chave_l / 2, A - moldura - chave_p, fundo]) cube([chave_l, chave_p + 0.6, H - rebaixo - fundo]);
  // travas: por baixo retas (seguram a tampa), por cima inclinadas (a tampa entra com um clique)
  for (y = trava_y, lado = [0, 1])
    translate([lado * L, 0, 0]) mirror([lado, 0, 0])
      translate([0, y + trava_c / 2, 0]) rotate([90, 0, 0]) linear_extrude(trava_c)
        polygon([[moldura - 0.01, apoio_z + tampa_e], [moldura + trava_p, apoio_z + tampa_e], [moldura - 0.01, H]]);
}

module tampa() difference() {
  linear_extrude(tampa_e) rr(tp[0], tp[1], R - moldura - folga);
  translate([L / 2 - (chave_l + 0.5) / 2, A - moldura - folga - (chave_p + 0.2), -1]) cube([chave_l + 0.5, 2, tampa_e + 2]);
}

module tag() color("#2E8BFF") translate([tag_x, tag_y, apoio_z - tag_e]) cylinder(d = tag_d, h = tag_e - 0.02);

module adesivo() {   // só ilustração: amarelo com as faixas e o alvo escuro
  translate([0, 0, 0]) {
    color("#F3FF2C") linear_extrude(0.2) rr(46, 71, 3.5);
    color("#15181C") translate([0, 0, 0.2]) linear_extrude(0.05) {
      intersection() { rr(46, 71, 3.5); union() { translate([0, A - 2 - 8]) square([L, 8]); translate([0, 2]) square([L, 10.8]); } }
      translate([tag_x, tag_y]) circle(r = 9.6);
    }
  }
}

C_BASE = "#3A3F47"; C_TAMPA = "#5A616B";
if (modo == "base") base();
else if (modo == "tampa") tampa();
else if (modo == "fora" || modo == "montada") {
  color(C_BASE) base(); color(C_TAMPA) translate([0, 0, apoio_z]) tampa(); translate([0, 0, apoio_z + tampa_e]) adesivo();
} else if (modo == "dentro") {
  color(C_BASE) base(); tag();
} else if (modo == "explodida") {
  color(C_BASE) base(); translate([0, 0, 9]) tag();
  color(C_TAMPA) translate([0, 0, apoio_z + 18]) tampa();
  translate([0, 0, apoio_z + 30]) adesivo();
} else if (modo == "corte") {
  intersection() {
    union() { color(C_BASE) base(); color(C_TAMPA) translate([0, 0, apoio_z]) tampa(); tag(); translate([0, 0, apoio_z + tampa_e]) adesivo(); }
    translate([-1, -1, -1]) cube([tag_x + 1, A + 2, H + 5]);
  }
}
