"""Gera a narração de cada trecho do roteiro com edge-tts e salva os tempos das palavras.

Uso:
  python ferramentas/gerar_voz.py                                   # todos os trechos do supino
  python ferramentas/gerar_voz.py cotovelos-errado ...              # só os trechos indicados
  python ferramentas/gerar_voz.py --roteiro leg-press-45            # outro roteiro
  python ferramentas/gerar_voz.py --roteiro leg-press-45 descida    # um trecho de outro roteiro

Saída em public/audio/<slug>/: <id>.mp3 e <id>.json com
  { id, dur, words: [{ w, t, d }] }   (t e d em segundos)
As palavras de `words` são as mesmas da legenda (texto sem a marcação [[...]]),
na mesma ordem, para o front-end casar uma a uma.
"""
import asyncio
import json
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

import edge_tts

RAIZ = Path(__file__).resolve().parent.parent
ROTEIROS = RAIZ / "src" / "data" / "roteiros"
MARCA = re.compile(r"\[\[([^\]|]+)(?:\|[^\]]*)?\]\]")


def texto_limpo(say: str) -> str:
    return MARCA.sub(lambda m: m.group(1), say)


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in s if c.isalnum())


def silabas(w: str) -> int:
    return max(1, len(re.findall(r"[aeiouáéíóúâêôãõà]+", w.lower())))


def alinhar(tokens, marcas, dur_fala):
    """Casa cada palavra da legenda com os tempos devolvidos pela voz."""
    out, j = [], 0
    for tok in tokens:
        alvo, acc, ini, fim = norm(tok), "", None, None
        while j < len(marcas) and alvo and (acc + norm(marcas[j]["text"])) and alvo.startswith(acc + norm(marcas[j]["text"])):
            acc += norm(marcas[j]["text"])
            ini = marcas[j]["t"] if ini is None else ini
            fim = marcas[j]["t"] + marcas[j]["d"]
            j += 1
            if acc == alvo:
                break
        # números e símbolos ("90°") podem virar várias palavras faladas
        if ini is None and j < len(marcas) and any(ch.isdigit() for ch in tok):
            ini, fim = marcas[j]["t"], marcas[j]["t"] + marcas[j]["d"]
            j += 1
            while j < len(marcas) and norm(marcas[j]["text"]) in ("graus", "grau", "segundos", "segundo", "e") and not norm(tok).endswith(norm(marcas[j]["text"])):
                fim = marcas[j]["t"] + marcas[j]["d"]
                j += 1
        out.append({"w": tok, "t": ini, "d": None if ini is None else round(fim - ini, 3)})
    # o que não casou ganha estimativa por sílabas entre os vizinhos
    pesos = [silabas(o["w"]) for o in out]
    for i, o in enumerate(out):
        if o["t"] is not None:
            continue
        a = next((out[k]["t"] + out[k]["d"] for k in range(i - 1, -1, -1) if out[k]["t"] is not None), 0.0)
        k2 = next((k for k in range(i + 1, len(out)) if out[k]["t"] is not None), None)
        b = out[k2]["t"] if k2 is not None else dur_fala
        buraco = [k for k in range(i, k2 if k2 is not None else len(out)) if out[k]["t"] is None]
        tot = sum(pesos[k] for k in buraco) or 1
        cur = a
        for k in buraco:
            dd = (b - a) * pesos[k] / tot
            out[k]["t"], out[k]["d"] = round(cur, 3), round(dd, 3)
            out[k]["est"] = True
            cur += dd
    for o in out:
        o["t"] = round(o["t"], 3)
    return out


def duracao(mp3: Path) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp3)],
                       capture_output=True, text=True, check=True)
    return round(float(r.stdout.strip()), 3)


async def gerar(trecho, voz, pasta: Path):
    txt = texto_limpo(trecho["say"])
    com = edge_tts.Communicate(txt, voz, rate="+2%", boundary="WordBoundary")
    mp3 = pasta / f"{trecho['id']}.mp3"
    marcas = []
    with open(mp3, "wb") as f:
        async for c in com.stream():
            if c["type"] == "audio":
                f.write(c["data"])
            elif c["type"] == "WordBoundary":
                marcas.append({"text": c["text"], "t": c["offset"] / 1e7, "d": c["duration"] / 1e7})
    dur = duracao(mp3)
    fala = marcas[-1]["t"] + marcas[-1]["d"] if marcas else dur
    words = alinhar(txt.split(), marcas, fala)
    est = sum(1 for w in words if w.get("est"))
    (pasta / f"{trecho['id']}.json").write_text(
        json.dumps({"id": trecho["id"], "voz": voz, "dur": dur, "words": words, "brutos": marcas}, ensure_ascii=False, indent=1),
        encoding="utf-8")
    print(f"{trecho['id']:18} {dur:5.2f}s  {len(words)} palavras  {est} estimadas")


async def main():
    args = sys.argv[1:]
    slug = "supino-reto"
    if args[:1] == ["--roteiro"]:
        if len(args) < 2:
            sys.exit("Informe o roteiro: --roteiro leg-press-45")
        slug, args = args[1], args[2:]
    rot = json.loads((ROTEIROS / f"{slug}.json").read_text(encoding="utf-8"))
    pasta = RAIZ / "public" / "audio" / rot["slug"]
    pasta.mkdir(parents=True, exist_ok=True)
    so = set(args)
    for t in rot["trechos"]:
        if not so or t["id"] in so:
            await gerar(t, rot["voz"], pasta)


asyncio.run(main())
