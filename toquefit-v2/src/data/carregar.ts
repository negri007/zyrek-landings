// Carrega os dados de exemplo e o roteiro. Hoje vêm de JSON estático; depois viram chamadas à API.
import dados from "./aparelhos.json";
import roteiroExtensora from "./roteiros/cadeira-extensora.json";
import roteiroFlexora from "./roteiros/cadeira-flexora.json";
import roteiroLegPress from "./roteiros/leg-press-45.json";
import roteiroSupino from "./roteiros/supino-reto.json";
import { montarLinha, type Linha, type TrechoRoteiro } from "../player/timeline";

export interface Aparelho {
  slug: string; name: string; group: string; tag: string; w: number; video: boolean; dur: number;
  adjust: string; sets: string; rest: string; steps: string[]; errs: string[]; roteiro?: string;
}
export const DADOS = dados as Omit<typeof dados, "aparelhos"> & { aparelhos: Aparelho[] };

interface Roteiro {
  slug: string;
  instrutora: string;
  trechos: (TrechoRoteiro & { selo?: { tx: string; tom: "bad" | "good" } })[];
}
const ROTEIROS: Record<string, Roteiro> = {
  "supino-reto": roteiroSupino as Roteiro,
  "leg-press-45": roteiroLegPress as Roteiro,
  "cadeira-extensora": roteiroExtensora as Roteiro,
  "cadeira-flexora": roteiroFlexora as Roteiro,
};

export interface RoteiroPronto {
  linha: Linha;
  instrutora: string;
  selos: Record<string, { tx: string; tom: "bad" | "good" }>;
}

const cache = new Map<string, Promise<RoteiroPronto>>();

/** Junta o roteiro com os tempos de palavra salvos ao lado de cada áudio. `so` filtra trechos. */
export function carregarRoteiro(slug: string, so?: string[]): Promise<RoteiroPronto> | null {
  const r = ROTEIROS[slug];
  if (!r) return null;
  const chave = slug + (so ? ":" + so.join(",") : "");
  if (!cache.has(chave)) {
    const base = `${import.meta.env.BASE_URL}audio/${r.slug}/`;
    const trechos = so ? r.trechos.filter((t) => so.includes(t.id)) : r.trechos;
    cache.set(chave, Promise.all(trechos.map((t) =>
      fetch(base + t.id + ".json").then((x) => (x.ok ? x.json() : undefined)).catch(() => undefined),
    )).then((tempos) => {
      const map = Object.fromEntries(trechos.map((t, i) => [t.id, tempos[i]]));
      const selos = Object.fromEntries(trechos.filter((t) => t.selo).map((t) => [t.id, t.selo!]));
      return { linha: montarLinha(trechos, map, (id) => base + id + ".mp3"), instrutora: r.instrutora, selos };
    }));
  }
  return cache.get(chave)!;
}
