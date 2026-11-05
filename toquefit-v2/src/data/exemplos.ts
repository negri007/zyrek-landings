// Alunos de exemplo para a apresentação: cada um mostra uma situação que o painel resolve
// (constante e evoluindo, sumido, sentiu dor, ficha vencendo, ficha vencida). Nomes inventados.
import type { Ficha, Registro } from "../conta";
import { MODELOS } from "./modelos";

const iso = (offset: number) => { const d = new Date(); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

interface Perfil {
  nome: string; modelo: string; validade: number; obs?: string;
  /** carga inicial por exercício (kg), na ordem dos itens de cada treino */
  cargas: Record<string, number[]>;
  /** dias atrás em que treinou, do mais antigo ao mais recente */
  dias: number[];
  /** retorno do último treino */
  fim?: { sensacao?: Registro["sensacao"]; dor?: boolean };
}

const PERFIS: Perfil[] = [
  { nome: "Carla Mendes", modelo: "abc", validade: 30, obs: "Foco em pernas este mês",
    cargas: { A: [24, 10, 8, 0], B: [40, 35, 10], C: [120, 35, 30, 40] },
    dias: [-26, -25, -23, -22, -20, -18, -16, -15, -13, -11, -9, -8, -6, -4, -3, -1], fim: { sensacao: "ok" } },
  { nome: "Rafael Lima", modelo: "iniciante", validade: 20,
    cargas: { A: [60, 10, 25, 20, 0], B: [20, 25, 6, 0, 0] },
    dias: [-24, -22, -19, -17, -12], fim: { sensacao: "pesado" } },
  { nome: "Juliana Prado", modelo: "ab", validade: 25,
    cargas: { A: [16, 30, 25, 6], B: [90, 25, 25, 20] },
    dias: [-20, -19, -17, -16, -13, -12, -10, -9, -6, -5, -3, -1], fim: { sensacao: "pesado", dor: true } },
  { nome: "Marcos Vieira", modelo: "abc", validade: 3,
    cargas: { A: [40, 15, 14, 0], B: [55, 50, 14], C: [180, 50, 40, 60] },
    dias: [-27, -24, -22, -20, -17, -15, -13, -10, -8, -6, -3, -2], fim: { sensacao: "leve" } },
  { nome: "Beatriz Nunes", modelo: "circuito", validade: -5,
    cargas: { A: [50, 25, 10, 15, 25, 0] },
    dias: [-25, -21, -18, -14, -11, -7, -4], fim: { sensacao: "ok" } },
];

export function alunosDeExemplo() {
  return PERFIS.map((p) => {
    const base = MODELOS.find((m) => m.id === p.modelo)!.ficha();
    const ficha: Ficha = { treinos: base.treinos, validade: iso(p.validade), obs: p.obs || "" };
    // carga prescrita = a inicial + o que o aluno evoluiu
    const n = p.dias.length;
    for (const t of ficha.treinos) t.itens.forEach((it, i) => {
      const c = p.cargas[t.id]?.[i];
      if (c) it.carga = `${c + Math.round(n / 4) * passo(c)} kg`;
    });
    // treinos em rodízio (A, B, C…) com carga subindo devagar
    const treinos: Registro[] = p.dias.map((d, k) => {
      const t = ficha.treinos[k % ficha.treinos.length];
      const itens: Registro["itens"] = {};
      t.itens.forEach((_, i) => {
        const c = p.cargas[t.id]?.[i];
        // de vez em quando um exercício fica sem marcar, como na vida real
        if ((k + i) % 7 === 6) return;
        itens[`${t.id}.${i}`] = { feito: true, cargas: c ? [`${c + Math.floor(k / ficha.treinos.length / 1.5) * passo(c)} kg`] : [] };
      });
      const ultimo = k === n - 1;
      return { data: iso(d), treino: t.id, itens, sensacao: ultimo ? p.fim?.sensacao ?? null : (["ok", "ok", "pesado", "leve"] as const)[k % 4], dor: ultimo ? !!p.fim?.dor : false };
    });
    return { nome: p.nome, ficha, treinos };
  });
}

/** quanto sobe a carga de cada vez: 1 kg em halteres leves, 5 kg em máquinas pesadas */
const passo = (c: number) => (c >= 80 ? 10 : c >= 30 ? 5 : c >= 12 ? 2 : 1);
