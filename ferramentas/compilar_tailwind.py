"""Compila o Tailwind usado por uma página de landings-motion/ e grava o CSS dentro dela (sem CDN).

Uso: python ferramentas/compilar_tailwind.py planet-patas

O CSS vai entre /*tw:start*/ e /*tw:end*/ no <style id="tw"> da página.
Também troca href="wa:Mensagem" pelo link wa.me com a mensagem codificada; o número
sai do primeiro "wa.me/<número>" que já existe na página.
Precisa do Node (npx baixa o tailwindcss 3.4.17 na primeira vez).
"""
import re
import subprocess
import sys
import tempfile
import urllib.parse
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ORIGEM = RAIZ / "landings-motion"
INICIO, FIM = "/*tw:start*/", "/*tw:end*/"


def links_whatsapp(html):
    achado = re.search(r"wa\.me/(\d{10,13})", html)
    if not achado and 'href="wa:' in html:
        sys.exit('A página tem href="wa:..." mas nenhum "wa.me/<número>" para saber o número.')

    def troca(m):
        texto = m.group(1).replace("&amp;", "&")
        return 'href="https://wa.me/%s?text=%s"' % (achado.group(1), urllib.parse.quote(texto, safe=""))

    return re.sub(r'href="wa:([^"]+)"', troca, html)


def compilar(nome):
    pagina = ORIGEM / f"{nome.removesuffix('.html')}.html"
    html = links_whatsapp(pagina.read_text(encoding="utf-8"))
    if INICIO not in html or FIM not in html:
        sys.exit(f"{pagina.name}: falta o bloco {INICIO}{FIM}")
    antes, resto = html.split(INICIO, 1)
    _, depois = resto.split(FIM, 1)

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        (tmp / "pagina.html").write_text(antes + INICIO + FIM + depois, encoding="utf-8")
        (tmp / "entrada.css").write_text("@tailwind base;\n@tailwind utilities;\n", encoding="utf-8")
        (tmp / "tailwind.config.js").write_text(
            "module.exports={content:[%r],theme:{extend:{}},corePlugins:{preflight:true}}"
            % str(tmp / "pagina.html").replace("\\", "/"), encoding="utf-8")
        cmd = ["npx", "--yes", "tailwindcss@3.4.17", "-c", str(tmp / "tailwind.config.js"),
               "-i", str(tmp / "entrada.css"), "-o", str(tmp / "saida.css"), "--minify"]
        r = subprocess.run(cmd, capture_output=True, text=True, shell=sys.platform == "win32")
        if r.returncode != 0:
            sys.exit(f"tailwind falhou:\n{r.stderr}")
        css = (tmp / "saida.css").read_text(encoding="utf-8").strip()

    pagina.write_text(antes + INICIO + css + FIM + depois, encoding="utf-8", newline="\n")
    print(f"{pagina.relative_to(RAIZ)}  tailwind {len(css) / 1024:.1f} KB")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    for n in sys.argv[1:]:
        compilar(n)
