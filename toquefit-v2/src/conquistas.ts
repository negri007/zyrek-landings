// Conquistas do aluno: semanas seguidas treinando e recordes de carga.
// Tudo calculado no próprio celular a partir dos treinos registrados (nada novo no servidor).
import { hojeISO, type Registro } from "./conta";

/** "32,5 kg" → 32.5; texto sem número → null */
export function numero(c: string | undefined) {
  const m = c?.replace(",", ".").match(/\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

const feito = (r: Registro) => Object.values(r.itens).some((x) => x.feito);

/** segunda-feira da semana de uma data (aaaa-mm-dd), como número de dias */
function semana(iso: string) {
  const d = new Date(iso + "T12:00");
  const dia = (d.getDay() + 6) % 7; // segunda = 0
  return Math.floor((d.getTime() - dia * 86400e3) / (7 * 86400e3));
}

/** semanas seguidas com pelo menos um treino; a semana atual ainda vazia não quebra a sequência */
export function semanasSeguidas(treinos: Registro[]) {
  const semanas = new Set(treinos.filter(feito).map((r) => semana(r.data)));
  let s = semana(hojeISO());
  if (!semanas.has(s)) s--;
  let n = 0;
  while (semanas.has(s)) { n++; s--; }
  return n;
}

export const treinosNoMes = (treinos: Registro[]) => {
  const mes = hojeISO().slice(0, 7);
  return treinos.filter((r) => r.data.startsWith(mes) && feito(r)).length;
};

/** maior carga já usada neste exercício antes de hoje */
export function melhorAntes(treinos: Registro[], chave: string) {
  let max: number | null = null;
  for (const r of treinos) {
    if (r.data >= hojeISO()) continue;
    for (const c of r.itens[chave]?.cargas || []) { const v = numero(c); if (v !== null && (max === null || v > max)) max = v; }
  }
  return max;
}

/** recordes batidos no mês: dias em que a carga passou de tudo o que veio antes */
export function recordesNoMes(treinos: Registro[]) {
  const mes = hojeISO().slice(0, 7);
  const ordem = treinos.slice().sort((a, b) => a.data.localeCompare(b.data));
  const max: Record<string, number> = {};
  let n = 0;
  for (const r of ordem) {
    for (const [k, it] of Object.entries(r.itens)) {
      const v = Math.max(...it.cargas.map(numero).filter((x): x is number => x !== null), -Infinity);
      if (!isFinite(v)) continue;
      if (k in max && v > max[k] && r.data.startsWith(mes)) n++;
      if (!(k in max) || v > max[k]) max[k] = v;
    }
  }
  return n;
}

/** a carga de hoje é recorde? (só conta se já havia carga antes) */
export function ehRecorde(treinos: Registro[], chave: string, carga: string) {
  const v = numero(carga), antes = melhorAntes(treinos, chave);
  return v !== null && antes !== null && v > antes;
}
