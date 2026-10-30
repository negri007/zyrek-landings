// Monta a linha do tempo do vídeo a partir do roteiro (JSON) e dos tempos de palavra gerados pela voz.
export type Tom = "ok" | "bad";

export interface Palavra {
  w: string;
  t: number; // início absoluto na linha do tempo (s)
  d: number;
  tom?: Tom;
  grupo?: number; // termos marcados juntos ("Assim não.") dividem o grupo
}

export interface Destaque {
  grupo: number;
  texto: string; // como aparece grande sobre o vídeo
  tom: Tom;
  t: number;
  grande: boolean;
}

export interface Trecho {
  id: string;
  ch: string;
  cam: string;
  step: number;
  t0: number;
  t1: number;
  fala: number; // duração do áudio
  ini: number; // a fala começa este tanto depois do início do trecho (tempo para o movimento)
  audio: string | null;
  replay: Replay | null;
  palavras: Palavra[];
  destaques: Destaque[];
  /** tempo local (s) em que a palavra com esse texto começa */
  cue(trecho: string): number;
}

/** Trecho do próprio vídeo revisto em câmera lenta: mostra [de, ate] (tempo local) a `vel`, começando em `em`. */
export interface Replay { em: number; de: number; ate: number; vel: number }

export interface Linha {
  dur: number;
  trechos: Trecho[];
  capitulos: { ch: string; t0: number; t1: number }[];
}

export interface TrechoRoteiro {
  id: string;
  ch: string;
  cam: string;
  step: number;
  pausa: number;
  antes?: number;
  say: string;
  replay?: { de: number; ate: number; vel: number };
}

interface Tempos {
  dur: number;
  words: { w: string; t: number; d: number }[];
}

const MARCA = /\[\[([^\]|]+)((?:\|[^\]|]+)*)\]\]/g;
const SEM_ACENTO = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const silabas = (w: string) => Math.max(1, (w.toLowerCase().match(/[aeiouáéíóúâêôãõà]+/g) || []).length);

/** Separa o texto em palavras, guardando o tom de cada uma conforme a marcação [[...|tom|grande]]. */
export function lerMarcacao(say: string) {
  let limpo = "";
  const estilo: ({ tom: Tom; grupo: number } | null)[] = [];
  const grupos: { texto: string; tom: Tom; grande: boolean }[] = [];
  let ult = 0;
  for (const m of say.matchAll(MARCA)) {
    const antes = say.slice(ult, m.index);
    limpo += antes;
    for (let i = 0; i < antes.length; i++) estilo.push(null);
    const opts = m[2].split("|").filter(Boolean);
    const tom = (opts.includes("bad") ? "bad" : "ok") as Tom;
    const g = grupos.push({ texto: m[1], tom, grande: opts.includes("grande") }) - 1;
    limpo += m[1];
    for (let i = 0; i < m[1].length; i++) estilo.push({ tom, grupo: g });
    ult = m.index! + m[0].length;
  }
  const resto = say.slice(ult);
  limpo += resto;
  for (let i = 0; i < resto.length; i++) estilo.push(null);

  const palavras: { w: string; tom?: Tom; grupo?: number }[] = [];
  const re = /\S+/g;
  for (const m of limpo.matchAll(re)) {
    let st = null;
    for (let i = m.index!; i < m.index! + m[0].length; i++) if (estilo[i] && /[\p{L}\p{N}°]/u.test(limpo[i])) { st = estilo[i]; break; }
    palavras.push({ w: m[0], tom: st?.tom, grupo: st?.grupo });
  }
  return { limpo, palavras, grupos };
}

/** Estimativa por sílabas quando não há tempos da voz. */
function estimar(ws: string[], dur: number) {
  const p = ws.map(silabas), tot = p.reduce((a, b) => a + b, 0);
  let t = 0.1;
  const usa = dur - 0.2;
  return ws.map((w, i) => {
    const d = (usa * p[i]) / tot;
    const r = { w, t, d };
    t += d;
    return r;
  });
}

function textoGrande(s: string) {
  return s.replace(/[.,:;!?]+$/, "").replace(/^(\d+)\s*segundos?$/i, "$1 s");
}

export function montarLinha(
  roteiro: TrechoRoteiro[],
  tempos: Record<string, Tempos | undefined>,
  audioDe: (id: string) => string,
): Linha {
  let t = 0;
  const trechos: Trecho[] = roteiro.map((r) => {
    const { palavras, grupos } = lerMarcacao(r.say);
    const tm = tempos[r.id];
    const fala = tm ? tm.dur : Math.max(2.5, palavras.length * 0.36);
    const ws = tm && tm.words.length === palavras.length ? tm.words : estimar(palavras.map((p) => p.w), fala);
    const t0 = t, ini = r.antes || 0;
    const lista: Palavra[] = palavras.map((p, i) => ({ ...p, t: t0 + ini + ws[i].t, d: ws[i].d }));
    const destaques: Destaque[] = grupos.map((g, gi) => {
      const prim = lista.find((p) => p.grupo === gi);
      return { grupo: gi, texto: textoGrande(g.texto), tom: g.tom, grande: g.grande, t: prim ? prim.t : t0 };
    });
    // o replay entra depois da fala, sem voz
    const rp = r.replay ? { em: ini + fala + 0.4, ...r.replay } : null;
    t += ini + fala + r.pausa + (rp ? (rp.ate - rp.de) / rp.vel + 1.0 : 0);
    const tr: Trecho = {
      id: r.id, ch: r.ch, cam: r.cam, step: r.step, t0, t1: t, fala, ini,
      audio: tm ? audioDe(r.id) : null, replay: rp, palavras: lista, destaques,
      cue(txt: string) {
        const alvo = SEM_ACENTO(txt);
        const p = lista.find((x) => SEM_ACENTO(x.w).startsWith(alvo));
        return p ? p.t - t0 : 0;
      },
    };
    return tr;
  });
  const capitulos: Linha["capitulos"] = [];
  for (const tr of trechos) {
    const last = capitulos[capitulos.length - 1];
    if (last && last.ch === tr.ch) last.t1 = tr.t1;
    else capitulos.push({ ch: tr.ch, t0: tr.t0, t1: tr.t1 });
  }
  return { dur: t, trechos, capitulos };
}

export const trechoEm = (L: Linha, t: number) =>
  L.trechos.find((x) => t >= x.t0 && t < x.t1) || L.trechos[L.trechos.length - 1];
