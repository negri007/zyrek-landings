"""Desenhos cotados da placa (medidas em mm). Gera desenhos.html; cada <svg id> vira um PNG."""
import sys

BASE, VAO, TAMPA, TAG, ADES, TXT, COTA = "#3A3F47", "#23272D", "#6A717B", "#2E8BFF", "#E8F020", "#15181C", "#C2410C"
F = 'font-family="Figtree,Arial"'

def rr(x, y, w, h, r, **a):
    attrs = " ".join(f'{k.replace("_", "-")}="{v}"' for k, v in a.items())
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" {attrs}/>'

def seta(x, y, ang, s):
    return f'<path d="M0 0 L{-1.6 * s} {-0.55 * s} L{-1.6 * s} {0.55 * s}Z" transform="translate({x} {y}) rotate({ang})" fill="{COTA}"/>'

def cota_h(x1, x2, y, txt, s=1, ext=None, tsize=2.4, lado=-1):
    """cota horizontal de x1 a x2 na altura y; ext = y de onde saem as linhas de chamada"""
    g = f'<path d="M{x1} {y}H{x2}" stroke="{COTA}" stroke-width="{0.18 * s}"/>' + seta(x1, y, 180, s) + seta(x2, y, 0, s)
    if ext is not None:
        g += f'<path d="M{x1} {ext}V{y + 0.8 * s * (1 if y > ext else -1)}M{x2} {ext}V{y + 0.8 * s * (1 if y > ext else -1)}" stroke="{COTA}" stroke-width="{0.12 * s}"/>'
    return g + f'<text x="{(x1 + x2) / 2}" y="{y + (lado * 0.8 if lado < 0 else 2.8) * s}" text-anchor="middle" {F} font-weight="700" font-size="{tsize * s}" fill="{COTA}">{txt}</text>'

def cota_v(y1, y2, x, txt, s=1, ext=None, tsize=2.4, lado=1):
    g = f'<path d="M{x} {y1}V{y2}" stroke="{COTA}" stroke-width="{0.18 * s}"/>' + seta(x, y1, -90, s) + seta(x, y2, 90, s)
    if ext is not None:
        g += f'<path d="M{ext} {y1}H{x + 0.8 * s * (1 if x > ext else -1)}M{ext} {y2}H{x + 0.8 * s * (1 if x > ext else -1)}" stroke="{COTA}" stroke-width="{0.12 * s}"/>'
    a = "start" if lado > 0 else "end"
    return g + f'<text x="{x + lado * 1.0 * s}" y="{(y1 + y2) / 2 + 0.9 * s}" text-anchor="{a}" {F} font-weight="700" font-size="{tsize * s}" fill="{COTA}">{txt}</text>'

def nota(x, y, tx, ty, txt, s=1, tsize=2.3, a="start"):
    linhas = txt.split("\n")
    t = "".join(f'<tspan x="{tx}" dy="{0 if i == 0 else tsize * 1.25 * s}">{l}</tspan>' for i, l in enumerate(linhas))
    return (f'<path d="M{x} {y}L{tx - (0.6 if a == "start" else -0.6) * s} {ty - 0.8 * s}" stroke="{TXT}" stroke-width="{0.12 * s}"/>'
            f'<circle cx="{x}" cy="{y}" r="{0.35 * s}" fill="{TXT}"/>'
            f'<text x="{tx}" y="{ty}" text-anchor="{a}" {F} font-size="{tsize * s}" fill="{TXT}">{t}</text>')

def svg(id_, vb, w, corpo, titulo):
    x, y, vw, vh = vb
    h = w * vh / vw
    return (f'<figure id="{id_}"><svg viewBox="{x} {y} {vw} {vh}" width="{w}" height="{h:.0f}">{corpo}</svg>'
            f'<figcaption>{titulo}</figcaption></figure>')

# 1. Frente: tampa, adesivo e tag (coordenadas a partir do canto de cima à esquerda)
TY = 41.5
frente = (
    f'<path d="M5 0H45A5 5 0 0 1 50 5V70A5 5 0 0 1 45 75H29V73.5H21V75H5A5 5 0 0 1 0 70V5A5 5 0 0 1 5 0Z" fill="{BASE}"/>'
    + rr(1.5, 1.5, 47, 72, 3.5, fill=VAO)
    + rr(1.7, 1.7, 46.6, 71.6, 3.3, fill=TAMPA)
    + rr(23.25, 1.5, 3.5, 1.2, 0, fill=VAO) + rr(23.5, 1.5, 3, 0.8, 0, fill=BASE)
    + "".join(rr(x, y, 0.35, 6, 0, fill="#FFB020") for x in (1.5, 48.15) for y in (17, 52))
    + rr(2, 2, 46, 71, 3.5, fill="none", stroke=ADES, stroke_width=0.45, stroke_dasharray="1.6 0.9")
    + f'<circle cx="25" cy="{TY}" r="12.5" fill="none" stroke="{TAG}" stroke-width=".45" stroke-dasharray="1.4 .8"/>'
    + f'<path d="M25 {TY - 15}V{TY + 15}M10 {TY}H40" stroke="{TAG}" stroke-width=".2"/>'
    + cota_h(0, 50, -6, "50", ext=0)
    + cota_v(0, 75, -6, "75", ext=0, lado=-1)
    + cota_h(0, 25, TY + 17.5, "25", ext=TY, tsize=2.2)
    + cota_v(0, TY, 55, "41,5", ext=50)
    + nota(36, 1.8, 58, 4, "abertura da base 47 × 72\ntampa 46,6 × 71,6 (raio 3,3)")
    + nota(25, 2.2, 58, 13, "chave: dente 3 × 0,8 na base,\nentalhe 3,5 × 1 na tampa")
    + nota(48.3, 20, 58, 30, "4 travas: 6 × 0,35 mm\n(a 20 mm do topo e da base)")
    + nota(37.5, TY, 58, 47.5, "tag Ø25, centro em (25 ; 41,5)\n= centro do círculo do adesivo", )
    + nota(45, 65, 58, 63, "adesivo 46 × 71 (tracejado amarelo)")
    + nota(25, 74.3, 58, 74, "fenda da moeda: 8 mm")
)

# 2. Base por dentro (sem a tampa)
base = (
    f'<path d="M5 0H45A5 5 0 0 1 50 5V70A5 5 0 0 1 45 75H29V73.5H21V75H5A5 5 0 0 1 0 70V5A5 5 0 0 1 5 0Z" fill="{BASE}"/>'
    + rr(1.5, 1.5, 47, 72, 3.5, fill="#30353C") + rr(2, 2, 46, 71, 3, fill=VAO)
    + rr(23.5, 1.5, 3, 1.4, 0, fill=BASE)
    + "".join(rr(x, y, 0.35, 6, 0, fill="#FFB020") for x in (1.5, 48.15) for y in (17, 52))
    + "".join(rr(cx - 3, cy - 1, 6, 2, 0.3, fill="#F4F5F6") for cx in (8, 42) for cy in (8, 67))
    + f'<circle cx="25" cy="{TY}" r="15" fill="{BASE}"/><circle cx="25" cy="{TY}" r="13" fill="#4A5059"/>'
    + f'<circle cx="25" cy="{TY}" r="12.5" fill="{TAG}" opacity=".85"/>'
    + f'<path d="M22.6 15.4L27.4 15.4L25 12.4Z" fill="#8A929C"/><text x="25" y="19.6" text-anchor="middle" {F} font-weight="700" font-size="3.6" fill="#8A929C">TOPO</text>'
    + cota_h(0, 50, -6, "50", ext=0)
    + cota_v(0, 75, -6, "75", ext=0, lado=-1)
    + cota_h(10, 40, TY + 19, "Ø30 pilar", ext=TY, tsize=2.2)
    + cota_h(12, 38, TY - 15.5, "Ø26 alojamento", ext=TY - 4, tsize=2.2)
    + cota_v(0, 8, 55, "8", ext=45, tsize=2.2)
    + cota_h(0, 8, 80.5, "8", ext=75, tsize=2.2, lado=1)
    + nota(48.25, 32, 58, 33, "parede 2 (em baixo)\nmoldura 1,5 (em cima)\napoio da tampa: 0,5")
    + nota(25, 2.4, 58, 0.5, "dente anti-inversão 3 × 0,8\n(sobe do fundo até 11,6)")
    + nota(42, 67, 58, 63, "4 fendas 6 × 2 no fundo\n(abraçadeira, opcional)")
    + nota(25, 48, 58, 45, "tag Ø25 no alojamento\n(0,3 mm de fundo)")
    + nota(25, 74.3, 58, 74, "fenda da moeda: 8 mm")
    + nota(30, 18, 58, 22.5, "marca TOPO gravada\nno fundo (0,5 mm)")
)

# 3. Corte A-A: plano que passa pelo centro da tag, de cima (esq.) para baixo (dir.); vertical = altura
def P(*pts): return " ".join(f"{u},{12 - z}" for u, z in pts)
corte = (
    f'<path d="M-3 12.6H78" stroke="#8A929C" stroke-width=".9"/>'
    f'<text x="-3" y="15.2" {F} font-size="2" fill="#6B7280">metal do aparelho</text>'
    + f'<polygon points="{P((0, 0), (75, 0), (75, 9.2), (72.5, 9.2), (72.5, 2), (56.5, 2), (56.5, 10), (54.5, 10), (54.5, 9.7), (28.5, 9.7), (28.5, 10), (26.5, 10), (26.5, 2), (2.3, 2), (2.3, 11.6), (0.9, 11.6), (0.9, 12), (1, 12), (0, 11))}" fill="{BASE}"/>'
    + f'<polygon points="{P((28.1, 2), (54.9, 2), (54.9, 8.8), (28.1, 8.8))}" fill="{VAO}"/>'
    + f'<rect x="2.7" y="{12 - 11.6}" width="70.6" height="1.6" fill="{TAMPA}"/>'
    + f'<rect x="29" y="{12 - 9.98}" width="25" height=".28" fill="{TAG}"/>'
    + f'<rect x="2" y="{12 - 11.8}" width="71" height=".2" fill="{ADES}"/>'
    + cota_v(10, 12, -3, "2", tsize=1.9, lado=-1)
    + cota_v(2, 12, -7.5, "10", tsize=1.9, lado=-1)
    + cota_v(0, 12, 80, "12", ext=75, tsize=1.9)
    + cota_h(26.5, 56.5, 17.5, "Ø30 pilar (parede 1,6 · teto 1,2)", ext=12, tsize=1.9, lado=1)
    + nota(16, 1.3, 20, -5.5, "adesivo no rebaixo de 0,4 (tampa 0,4 abaixo da borda)", tsize=1.9)
    + nota(41.5, 2.4, 47, -2.2, "tampa 1,6", tsize=1.9)
    + nota(50, 2.15, 60, -2.2, "tag a ≈ 9,7 do metal", tsize=1.9)
    + f'<text x="64" y="7" text-anchor="middle" {F} font-size="1.9" fill="#6B7280">ar</text>'
    + nota(73.7, 1.5, 76, -5.5, "fenda da moeda", tsize=1.9)
    + nota(1.6, 4, 2, -5.5, "dente", tsize=1.9)
)

# 4. Detalhe do encaixe: corte pela trava, borda esquerda, ampliado
def Q(*pts): return " ".join(f"{x},{12.5 - z}" for x, z in pts)
s = 0.35
detalhe = (
    f'<polygon points="{Q((0, 0), (7, 0), (7, 2), (2, 2), (2, 10), (1.5, 10), (1.5, 12), (1, 12), (0, 11))}" fill="{BASE}"/>'
    + f'<polygon points="{Q((1.5, 11.6), (1.85, 11.6), (1.5, 12))}" fill="#FFB020"/>'
    + f'<rect x="1.7" y="{12.5 - 11.6}" width="5.3" height="1.6" fill="{TAMPA}"/>'
    + f'<rect x="2" y="{12.5 - 11.8}" width="5" height=".2" fill="{ADES}"/>'
    + f'<path d="M-1 12.7H7.4" stroke="#8A929C" stroke-width=".25"/>'
    + cota_h(0, 2, 14.4, "2", s=s, ext=12.5, tsize=2.4, lado=1)
    + cota_h(0, 1.5, -0.9, "1,5", s=s, ext=0.5, tsize=2.4)
    + cota_v(12.5 - 12, 12.5 - 11.6, 8.2, "0,4 rebaixo", s=s, ext=7, tsize=2.4)
    + cota_v(12.5 - 11.6, 12.5 - 10, 8.2, "1,6 tampa", s=s, ext=7, tsize=2.4)
    + cota_v(12.5 - 10, 12.5 - 2, 8.2, "8 vão", s=s, ext=7, tsize=2.4)
    + cota_v(12.5 - 2, 12.5, 8.2, "2 fundo", s=s, ext=7, tsize=2.4)
    + nota(1.68, 12.5 - 11.75, 3.6, -1.6, "trava 0,35: a tampa entra\ncom clique e fica presa", s=s, tsize=2.4)
    + nota(1.6, 12.5 - 10.8, -3.2, 3.6, "folga 0,2", s=s, tsize=2.4, a="end")
    + nota(1.75, 12.5 - 10, -3.2, 6, "apoio 0,5", s=s, tsize=2.4, a="end")
    + nota(0.4, 12.5 - 11.5, -3.2, 1.2, "chanfro 1", s=s, tsize=2.4, a="end")
)

html = f'''<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;700&display=swap">
<style>body{{margin:0;background:#fff;font-family:Figtree,Arial}} figure{{margin:0;padding:22px 26px 18px;display:inline-block;background:#fff}}
figcaption{{font-size:17px;font-weight:700;color:#15181C;margin-top:6px}}</style></head><body>
{svg("frente", (-14, -12, 118, 98), 1180, frente, "Frente: tampa, adesivo e posição da tag")}
{svg("base", (-14, -12, 118, 98), 1180, base, "Base por dentro (sem a tampa)")}
{svg("corte", (-13, -9, 105, 31), 1300, corte, "Corte A-A pelo centro da tag (topo à esquerda)")}
{svg("detalhe", (-12, -3.5, 25, 19.5), 900, detalhe, "Detalhe do encaixe: corte pela trava")}
</body></html>'''
open(sys.argv[1], "w", encoding="utf-8").write(html)
print("ok")
