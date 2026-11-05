"""Gera uma tampa por aparelho, com o QR code do link daquele aparelho, e confere se o QR lê.

Uso:
  python ferramentas/gerar_tampas.py                         # link da demonstração na rede local
  python ferramentas/gerar_tampas.py HTTPS://TQF.IO          # domínio definitivo
  python ferramentas/gerar_tampas.py HTTPS://TQF.IO A01 A02  # só alguns aparelhos

Links (curtos e em MAIÚSCULAS para o QR sair no modo alfanumérico, com quadrados maiores):
  QR da tampa  -> <base>/Q/A01
  tag NFC      -> <base>/N/A01   (gravar na tag com o app NFC Tools)
A demonstração abre o aparelho certo pelos dois e conta no painel quantos vieram de cada um.

Saída em peca-nfc/tampas/: tampa-A01.stl ... e links.csv com o que gravar em cada tag.
Precisa do OpenSCAD instalado e de: pip install segno opencv-python-headless
"""
import csv
import json
import subprocess
import sys
from pathlib import Path

import segno

RAIZ = Path(__file__).resolve().parent.parent
SCAD = RAIZ / "peca-nfc" / "tag-anilha.scad"
SAIDA = RAIZ / "peca-nfc" / "tampas"
OPENSCAD = r"C:\Program Files\OpenSCAD\openscad.com"


def matriz(url: str):
    q = segno.make(url, error="m", micro=False)
    return q, [[1 if c else 0 for c in linha] for linha in q.matrix]


def scad(*args):
    r = subprocess.run([OPENSCAD, *args, str(SCAD)], capture_output=True, text=True)
    if r.returncode != 0 or "ERROR" in r.stderr:
        raise RuntimeError(r.stderr[-800:])


def confere(png: Path, esperado: str) -> bool:
    import cv2
    img = cv2.imread(str(png), cv2.IMREAD_GRAYSCALE)
    _, bw = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    # o desenho sai claro sobre fundo escuro; o QR precisa de escuro sobre claro
    if bw.mean() < 128:
        bw = 255 - bw
    for im in (bw, cv2.GaussianBlur(bw, (3, 3), 0)):
        txt, _, _ = cv2.QRCodeDetector().detectAndDecode(im)
        if txt:
            return txt == esperado
    return False


def main():
    base = (sys.argv[1] if len(sys.argv) > 1 else "HTTP://192.168.2.130:4173").rstrip("/").upper()
    so = {c.upper() for c in sys.argv[2:]}
    dados = json.loads((RAIZ / "src" / "data" / "aparelhos.json").read_text(encoding="utf-8"))
    SAIDA.mkdir(parents=True, exist_ok=True)
    linhas = []
    for ap in dados["aparelhos"]:
        cod = ap["tag"].split("-")[-1].upper()  # TF-A01 -> A01
        if so and cod not in so:
            continue
        url_q, url_n = f"{base}/Q/{cod}", f"{base}/N/{cod}"
        q, m = matriz(url_q)
        qr = "[" + ",".join("[" + ",".join(map(str, l)) + "]" for l in m) + "]"
        stl, png = SAIDA / f"tampa-{cod}.stl", SAIDA / f"face-{cod}.png"
        defs = ["-D", f"qr={qr}", "-D", f'codigo="{cod}"']
        scad("-o", str(stl), "-D", 'mostrar="tampa"', *defs)
        scad("-o", str(png), "-D", 'mostrar="face"', *defs, "--imgsize=900,900", "--camera=0,0,100,0,0,0",
             "--projection=o", "--colorscheme=Tomorrow Night")
        ok = confere(png, url_q)
        mod = 19 / len(m)
        print(f"{cod}  {ap['name']:28} QR versão {q.version} ({len(m)}×{len(m)}, {mod:.2f} mm por quadrado)  leitura: {'OK' if ok else 'FALHOU'}")
        linhas.append({"codigo": cod, "aparelho": ap["name"], "gravar_na_tag_nfc": url_n, "qr_da_tampa": url_q,
                       "arquivo": stl.name, "qr_conferido": "sim" if ok else "NÃO"})
    with open(SAIDA / "links.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=list(linhas[0].keys()), delimiter=";")
        w.writeheader()
        w.writerows(linhas)
    if not all(l["qr_conferido"] == "sim" for l in linhas):
        sys.exit("Algum QR não leu na conferência: veja as imagens face-*.png")


main()
