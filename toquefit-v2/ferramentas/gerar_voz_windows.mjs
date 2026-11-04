// Gera a narração dos roteiros com a voz do próprio Windows, sem internet e sem Python.
// Mesma saída de gerar_voz.py: public/audio/<slug>/<id>.mp3 e <id>.json com { id, voz, dur, words: [{ w, t, d }] }.
//
// Uso:
//   node ferramentas/gerar_voz_windows.mjs --roteiro leg-press-45             # todos os trechos
//   node ferramentas/gerar_voz_windows.mjs --roteiro leg-press-45 descida     # só os indicados
//   node ferramentas/gerar_voz_windows.mjs --todos                            # todos os roteiros
// Opções: --voz Maria (padrão) e --taxa 1.05 (velocidade da fala).
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Mp3Encoder } from "@breezystack/lamejs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROTEIROS = join(RAIZ, "src", "data", "roteiros");
const MARCA = /\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;

const textoLimpo = (say) => say.replace(MARCA, (_, w) => w);
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[^\p{L}\p{N}]/gu, "").replace(/\p{M}/gu, "");
const silabas = (w) => Math.max(1, (w.toLowerCase().match(/[aeiouáéíóúâêôãõà]+/g) || []).length);

/** Lê o WAV PCM 16 bits que o Windows devolve. */
function lerWav(buf) {
  let p = 12, fmt = null, dados = null;
  while (p + 8 <= buf.length) {
    const id = buf.toString("ascii", p, p + 4), tam = buf.readUInt32LE(p + 4);
    if (id === "fmt ") fmt = { canais: buf.readUInt16LE(p + 10), taxa: buf.readUInt32LE(p + 12), bits: buf.readUInt16LE(p + 22) };
    if (id === "data") dados = buf.subarray(p + 8, p + 8 + tam);
    p += 8 + tam + (tam % 2);
  }
  if (!fmt || !dados || fmt.bits !== 16 || fmt.canais !== 1) throw new Error("WAV inesperado");
  const amostras = new Int16Array(dados.buffer.slice(dados.byteOffset, dados.byteOffset + dados.length));
  return { taxa: fmt.taxa, amostras };
}

/** Onde a fala termina de verdade (sem o silêncio do fim), em segundos. */
function fimDaFala(amostras, taxa) {
  const janela = Math.round(taxa * 0.02);
  for (let fim = amostras.length; fim > janela; fim -= janela) {
    let e = 0;
    for (let i = fim - janela; i < fim; i++) e += amostras[i] * amostras[i];
    if (Math.sqrt(e / janela) > 500) return fim / taxa;
  }
  return amostras.length / taxa;
}

/**
 * Casa cada palavra da legenda com as marcas da voz (porte de alinhar() do gerar_voz.py).
 * O Windows só dá o início de cada palavra: a duração vai até a próxima, limitada pelo tamanho da palavra,
 * para a legenda não ficar acesa durante as pausas de vírgula.
 */
function alinhar(tokens, brutas, fala) {
  // números saem repetidos e já por extenso ("3 segundos", "3 segundos"): junta as repetições
  // e divide a marca em palavras, com o tempo repartido por sílabas
  const juntas = brutas.filter((m, i) => i === 0 || m.text !== brutas[i - 1].text);
  const marcas = [];
  juntas.forEach((m, i) => {
    const ate = i + 1 < juntas.length ? juntas[i + 1].t : fala, partes = m.text.split(/\s+/).filter(Boolean);
    const tot = partes.reduce((s, p) => s + silabas(p), 0) || 1;
    let t = m.t;
    for (const p of partes) { marcas.push({ text: p, t: +t.toFixed(3) }); t += ((ate - m.t) * silabas(p)) / tot; }
  });
  const ms = marcas.map((m, i) => {
    const prox = i + 1 < marcas.length ? marcas[i + 1].t : fala;
    return { text: m.text, t: m.t, d: Math.max(0.05, Math.min(prox - m.t, 0.16 + 0.2 * silabas(m.text))) };
  });
  const out = [];
  let j = 0;
  for (const tok of tokens) {
    const alvo = norm(tok);
    let acc = "", ini = null, fim = null;
    while (j < ms.length && alvo && alvo.startsWith(acc + norm(ms[j].text)) && norm(ms[j].text)) {
      acc += norm(ms[j].text);
      ini ??= ms[j].t;
      fim = ms[j].t + ms[j].d;
      j++;
      if (acc === alvo) break;
    }
    // números e símbolos ("90°", "3x") podem virar várias palavras faladas
    if (ini === null && j < ms.length && /\d/.test(tok)) {
      ini = ms[j].t; fim = ms[j].t + ms[j].d; j++;
      while (j < ms.length && ["graus", "grau", "segundos", "segundo", "e", "vezes"].includes(norm(ms[j].text)) && !norm(tok).endsWith(norm(ms[j].text))) {
        fim = ms[j].t + ms[j].d; j++;
      }
    }
    out.push({ w: tok, t: ini, d: ini === null ? null : +(fim - ini).toFixed(3) });
  }
  // o que não casou ganha estimativa por sílabas entre os vizinhos
  const pesos = out.map((o) => silabas(o.w));
  for (let i = 0; i < out.length; i++) {
    if (out[i].t !== null) continue;
    let a = 0;
    for (let k = i - 1; k >= 0; k--) if (out[k].t !== null) { a = out[k].t + out[k].d; break; }
    let k2 = out.findIndex((o, k) => k > i && o.t !== null);
    const b = k2 >= 0 ? out[k2].t : fala;
    if (k2 < 0) k2 = out.length;
    const buraco = [];
    for (let k = i; k < k2; k++) if (out[k].t === null) buraco.push(k);
    const tot = buraco.reduce((s, k) => s + pesos[k], 0) || 1;
    let cur = a;
    for (const k of buraco) {
      const dd = ((b - a) * pesos[k]) / tot;
      Object.assign(out[k], { t: +cur.toFixed(3), d: +dd.toFixed(3), est: true });
      cur += dd;
    }
  }
  for (const o of out) o.t = +o.t.toFixed(3);
  return out;
}

function mp3(amostras, taxa) {
  const enc = new Mp3Encoder(1, taxa, 48);
  const partes = [];
  for (let i = 0; i < amostras.length; i += 1152) partes.push(enc.encodeBuffer(amostras.subarray(i, i + 1152)));
  partes.push(enc.flush());
  return Buffer.concat(partes.map((p) => Buffer.from(p)));
}

function gerar(trecho, pasta, tmp, voz, taxa) {
  const txt = textoLimpo(trecho.say).replace(/\s+/g, " ").trim();
  const arqTxt = join(tmp, "frase.txt"), arqWav = join(tmp, "fala.wav"), arqMarcas = join(tmp, "marcas.json");
  writeFileSync(arqTxt, txt, "utf8");
  const nomeVoz = execFileSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", join(RAIZ, "ferramentas", "voz-windows.ps1"),
    "-Texto", arqTxt, "-Wav", arqWav, "-Marcas", arqMarcas, "-Voz", voz, "-Taxa", String(taxa)], { encoding: "utf8" }).trim();
  const marcas = JSON.parse(readFileSync(arqMarcas, "utf8").replace(/^﻿/, ""));
  const { taxa: hz, amostras } = lerWav(readFileSync(arqWav));
  const dur = +(amostras.length / hz).toFixed(3);
  const words = alinhar(txt.split(" "), marcas, fimDaFala(amostras, hz));
  writeFileSync(join(pasta, trecho.id + ".mp3"), mp3(amostras, hz));
  writeFileSync(join(pasta, trecho.id + ".json"),
    JSON.stringify({ id: trecho.id, voz: nomeVoz + " (Windows)", dur, words, brutos: marcas }, null, 1), "utf8");
  const est = words.filter((w) => w.est).length;
  console.log(`${trecho.id.padEnd(18)} ${dur.toFixed(2).padStart(5)}s  ${words.length} palavras  ${est} estimadas`);
}

const args = process.argv.slice(2);
const opc = (nome, padrao) => { const i = args.indexOf(nome); if (i < 0) return padrao; const v = args[i + 1]; args.splice(i, 2); return v; };
const voz = opc("--voz", "Maria"), taxa = +opc("--taxa", "1.05");
let slugs;
if (args[0] === "--todos") { slugs = readdirSync(ROTEIROS).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)); args.shift(); }
else if (args[0] === "--roteiro" && args[1]) { slugs = [args[1]]; args.splice(0, 2); }
else { console.error("Informe --roteiro <slug> ou --todos"); process.exit(1); }
const so = new Set(args);

const tmp = mkdtempSync(join(tmpdir(), "voz-"));
try {
  for (const slug of slugs) {
    const rot = JSON.parse(readFileSync(join(ROTEIROS, slug + ".json"), "utf8"));
    const pasta = join(RAIZ, "public", "audio", rot.slug);
    mkdirSync(pasta, { recursive: true });
    console.log(`\n${rot.slug}`);
    for (const t of rot.trechos) if (!so.size || so.has(t.id)) gerar(t, pasta, tmp, voz, taxa);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
