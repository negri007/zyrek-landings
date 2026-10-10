"""Gera celular/<nome>.html: a página de landings-motion/ num arquivo só, para abrir no celular sem internet.

Uso: python ferramentas/gerar_celular.py lobo    (sem argumento: todas as páginas de landings-motion/)

Embute scripts (locais ou de CDN), fontes do Google Fonts e fotos de fotos/ em base64.
Fotos: no máximo 1200px de largura, qualidade 75, sem loading="lazy" (já estão no arquivo).
Fontes: woff2 latin, um arquivo estático por peso (o WebKit ignora o peso de fonte variável);
famílias com eixos além do peso (largura, tamanho óptico, faixas) vão variáveis, como o Google serve.
Precisa de internet só na hora de gerar e do Pillow (pip install pillow).
"""
import base64
import io
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Falta o Pillow: rode  pip install pillow")

RAIZ = Path(__file__).resolve().parent.parent
ORIGEM = RAIZ / "landings-motion"
DESTINO = RAIZ / "celular"
LARGURA_MAX = 1200
QUALIDADE = 75
# navegador moderno: o Google Fonts só entrega woff2 para ele
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
FONTSOURCE = "https://cdn.jsdelivr.net/fontsource/fonts/{id}@latest/latin-{peso}-{estilo}.woff2"
LATIN = ("U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, "
         "U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD")
MIME_FOTO = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}

_baixados = {}
_fotos = {}


def baixar(url):
    if url not in _baixados:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                _baixados[url] = r.read()
        except (urllib.error.URLError, TimeoutError) as e:
            raise RuntimeError(f"não consegui baixar {url} ({e})") from e
    return _baixados[url]


def data_uri(mime, dados):
    return f"data:{mime};base64,{base64.b64encode(dados).decode('ascii')}"


# ---------- fotos ----------

def foto(caminho):
    if caminho not in _fotos:
        ext = caminho.suffix.lower()
        img = ImageOps.exif_transpose(Image.open(caminho))
        if img.width > LARGURA_MAX:
            img = img.resize((LARGURA_MAX, round(img.height * LARGURA_MAX / img.width)), Image.LANCZOS)
        saida = io.BytesIO()
        if ext == ".png":
            img.save(saida, "PNG", optimize=True)
        elif ext == ".webp":
            img.save(saida, "WEBP", quality=QUALIDADE)
        else:
            img.convert("RGB").save(saida, "JPEG", quality=QUALIDADE, optimize=True, progressive=True)
        _fotos[caminho] = data_uri(MIME_FOTO[ext], saida.getvalue())
    return _fotos[caminho]


def embutir_fotos(html, pasta):
    # a foto já está no arquivo: preload não serve para nada
    html = re.sub(r'<link[^>]+rel="preload"[^>]+href="fotos/[^"]+"[^>]*>\n?', "", html)
    html = re.sub(r'\s+loading=(["\'])lazy\1', "", html)

    def troca(m):
        caminho = pasta / m.group(0)
        if not caminho.exists():
            print(f"  aviso: {m.group(0)} não existe, ficou como está")
            return m.group(0)
        return foto(caminho)

    return re.sub(r"(?<![\w/.-])fotos/[\w.-]+\.(?:jpe?g|png|webp)", troca, html, flags=re.I)


# ---------- fontes ----------

def face(familia, peso, estilo, woff2, intervalo_peso=None):
    return ("@font-face{font-family:\"%s\";font-style:%s;font-weight:%s;font-display:swap;"
            "src:url(%s) format(\"woff2\");unicode-range:%s}\n"
            % (familia, estilo, intervalo_peso or peso, data_uri("font/woff2", woff2), LATIN))


def fonte_estatica(familia, peso, estilo):
    fid = familia.lower().replace(" ", "-")
    try:
        return face(familia, peso, estilo, baixar(FONTSOURCE.format(id=fid, peso=peso, estilo=estilo)))
    except RuntimeError:
        # sem arquivo estático: usa o do Google (pode ser variável)
        print(f"  aviso: {familia} {peso} {estilo} sem arquivo estático, usando o do Google")
        ital = "1," if estilo == "italic" else ""
        eixos = "ital,wght@" if ital else "wght@"
        return fonte_google(familia.replace(" ", "+") + ":" + eixos + ital + str(peso))


def fonte_google(spec):
    """Busca o CSS do Google para uma família e embute só os blocos latin."""
    url = "https://fonts.googleapis.com/css2?family=" + spec + "&display=swap"
    css = baixar(url).decode("utf-8")
    blocos = re.findall(r"/\*\s*latin\s*\*/\s*(@font-face\s*\{[^}]*\})", css)
    if not blocos:
        raise RuntimeError(f"o Google não devolveu fonte latin para {spec}")
    saida = ""
    for b in blocos:
        b = re.sub(r"url\((https://[^)]+)\)", lambda m: "url(" + data_uri("font/woff2", baixar(m.group(1))) + ")", b)
        saida += re.sub(r"\s*\n\s*", "", b) + "\n"
    return saida


def css_das_fontes(url_google):
    """Cada família do link vira @font-face embutido: estático por peso quando dá, variável quando precisa."""
    consulta = urllib.parse.urlsplit(url_google.replace("&amp;", "&")).query
    css = ""
    for spec in urllib.parse.parse_qs(consulta, keep_blank_values=True).get("family", []):
        nome, _, resto = spec.partition(":")
        if not resto:
            css += fonte_estatica(nome, 400, "normal")
            continue
        eixos, _, valores = resto.partition("@")
        eixos = eixos.split(",")
        tuplas = [v.split(",") for v in valores.split(";")]
        so_peso = set(eixos) <= {"ital", "wght"} and ".." not in valores
        if not so_peso:
            css += fonte_google(urllib.parse.quote(spec.replace(" ", "+"), safe="+:,@;."))
            continue
        for t in tuplas:
            par = dict(zip(eixos, t))
            css += fonte_estatica(nome, int(par.get("wght", 400)), "italic" if par.get("ital") == "1" else "normal")
    return css


def embutir_fontes(html):
    html = re.sub(r'<link[^>]+rel="preconnect"[^>]+fonts\.(?:googleapis|gstatic)\.com[^>]*>\n?', "", html)
    feitos = set()

    def troca(m):
        url = m.group(1)
        if url in feitos:
            return ""
        feitos.add(url)
        return "<style>\n" + css_das_fontes(url) + "</style>"

    html = re.sub(r'<link[^>]+href="(https://fonts\.googleapis\.com/css2\?[^"]+)"[^>]*>', troca, html)
    return re.sub(r"<noscript>\s*</noscript>", "", html)


# ---------- scripts e css locais ----------

def conteudo(src, pasta):
    if src.startswith(("http://", "https://")):
        return baixar(src).decode("utf-8")
    return (pasta / src).read_text(encoding="utf-8")


def embutir_scripts(html, pasta):
    def troca(m):
        antes, src, depois = m.group(1), m.group(2), m.group(3)
        attrs = re.sub(r"\s+(?:defer|async)\b", "", antes + depois)
        codigo = conteudo(src, pasta).replace("</script", "<\\/script")
        return f"<script{attrs}>{codigo}</script>"

    return re.sub(r'<script([^>]*?)\s+src="([^"]+)"([^>]*)>\s*</script>', troca, html)


def embutir_css(html, pasta):
    def troca(m):
        return "<style>\n" + conteudo(m.group(1), pasta) + "\n</style>"

    return re.sub(r'<link[^>]+rel="stylesheet"[^>]+href="((?!https?:)[^"]+\.css)"[^>]*>', troca, html)


# ---------- página ----------

def gerar(nome):
    nome = nome.removesuffix(".html")
    origem = ORIGEM / f"{nome}.html"
    if not origem.exists():
        sys.exit(f"Não achei {origem.relative_to(RAIZ)}")
    html = origem.read_text(encoding="utf-8")
    html = embutir_fontes(html)
    html = embutir_css(html, ORIGEM)
    html = embutir_scripts(html, ORIGEM)
    html = embutir_fotos(html, ORIGEM)

    sobra = re.findall(r'(?:src|srcset|poster)="((?!data:)[^"#][^"]*)"|<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"|url\((?!["\']?data:)["\']?((?:https?:|fotos/)[^)"\']+)', html)
    for item in sobra:
        print(f"  aviso: ainda depende de fora: {next(x for x in item if x)}")

    DESTINO.mkdir(exist_ok=True)
    destino = DESTINO / f"{nome}.html"
    destino.write_text(html, encoding="utf-8", newline="\n")
    print(f"celular/{nome}.html  {destino.stat().st_size / 1024:.0f} KB")


def main():
    nomes = sys.argv[1:] or sorted(p.stem for p in ORIGEM.glob("*.html"))
    for nome in nomes:
        try:
            gerar(nome)
        except RuntimeError as e:
            sys.exit(f"{nome}: {e}")


if __name__ == "__main__":
    main()
