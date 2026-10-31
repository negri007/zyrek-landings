// Estado da demonstração: dados de exemplo + tudo o que o aluno faz (toques, avaliações, chamados).
// Fica no navegador; na versão real isso vem da API de cada academia.
import { DADOS, type Aparelho } from "./data/carregar";

export interface Maquina extends Aparelho {
  t7: number; // toques nos últimos 7 dias
  videoName: string;
}
export interface Chamado { id: number; slug: string; at: number; done: boolean }
export interface Estado {
  machines: Maquina[];
  extra: number; // toques feitos hoje nesta demonstração
  help: { yes: number; no: number };
  calls: Chamado[];
  nextTag: number;
  nextCall: number;
  /** vídeos assistidos até o fim hoje, por aparelho */
  fins: Record<string, number>;
  /** séries marcadas pelos alunos hoje, por aparelho */
  series: Record<string, number>;
}

const KEY = "toquefit-demo-v2";
export const DAILY = DADOS.toquesPorDia;

export function fresh(): Estado {
  const ms: Maquina[] = DADOS.aparelhos.map((m) => ({ ...m, steps: m.steps.slice(), errs: m.errs.slice(), t7: 0, videoName: m.video ? m.slug + ".mp4" : "" }));
  // distribui os toques da semana pelo peso de cada aparelho, fechando a soma exata
  const total = DAILY.slice(7).reduce((a, b) => a + b, 0);
  const raw = ms.map((m) => (m.w * total) / 100);
  ms.forEach((m, i) => (m.t7 = Math.floor(raw[i])));
  const resto = total - ms.reduce((a, m) => a + m.t7, 0);
  ms.map((m, i) => [raw[i] - m.t7, i] as const).sort((a, b) => b[0] - a[0]).slice(0, resto).forEach(([, i]) => ms[i].t7++);
  const now = Date.now();
  return {
    machines: ms, extra: 0,
    help: { yes: DADOS.avaliacoes.ajudou, no: DADOS.avaliacoes.naoAjudou },
    calls: DADOS.chamados.map((c) => ({ id: c.id, slug: c.slug, at: now - c.minutosAtras * 60e3, done: c.atendido })),
    nextTag: ms.length + 1, nextCall: Math.max(...DADOS.chamados.map((c) => c.id)) + 1,
    fins: {}, series: {},
  };
}

function load(): Estado | null {
  try {
    const r = localStorage.getItem(KEY);
    if (!r) return null;
    const e = JSON.parse(r) as Estado;
    // roteiros gravados depois que o estado foi salvo passam a valer para os aparelhos de exemplo
    for (const m of e.machines) m.roteiro = DADOS.aparelhos.find((a) => a.slug === m.slug)?.roteiro;
    // estados salvos antes de existir o registro de treino
    e.fins ||= {};
    e.series ||= {};
    return e;
  } catch { return null; }
}
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* modo privado: segue só na memória */ }
}

export let S: Estado = load() || fresh();
export function restaurar() { S = fresh(); save(); }

export const bySlug = (s: string) => S.machines.find((m) => m.slug === s);
/** soma 1 num contador por aparelho e salva */
export function contarTreino(tipo: "fins" | "series", slug: string) {
  S[tipo][slug] = (S[tipo][slug] || 0) + 1;
  save();
}
/** vídeos enviados pela gaveta nesta sessão (só na memória) */
export const blobs: Record<string, string> = {};
