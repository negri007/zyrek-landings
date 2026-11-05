// Modelos de ficha: o instrutor aplica um e ajusta para o aluno, em vez de montar do zero.
// Exercícios com slug abrem o vídeo do aparelho (e a tag NFC dele reconhece o exercício); os outros são livres.
import type { Ficha, Item, Treino } from "../conta";

const it = (nome: string, slug: string | null, series: number, reps: string, descanso = "60 s", carga = "", obs = ""): Item =>
  ({ slug, nome, series, reps, carga, descanso, obs });
const tr = (id: string, nome: string, dias: number[], itens: Item[]): Treino => ({ id, nome, dias, itens });

export const MODELOS: { id: string; nome: string; desc: string; ficha: () => Omit<Ficha, "validade" | "obs"> }[] = [
  {
    id: "iniciante", nome: "Iniciante · corpo todo", desc: "2 treinos alternados, 3 vezes por semana",
    ficha: () => ({ treinos: [
      tr("A", "Corpo todo A", [1, 5], [
        it("Leg press 45°", "leg-press-45", 3, "12–15", "90 s"),
        it("Supino reto", "supino-reto", 3, "10–12", "60 a 90 s"),
        it("Puxada frontal", "puxada-frontal", 3, "10–12"),
        it("Cadeira extensora", "cadeira-extensora", 3, "12–15"),
        it("Prancha abdominal", null, 3, "30 s", "45 s"),
      ]),
      tr("B", "Corpo todo B", [3], [
        it("Cadeira flexora", "cadeira-flexora", 3, "12–15"),
        it("Remada baixa", "remada-baixa", 3, "10–12"),
        it("Desenvolvimento", "desenvolvimento", 3, "10–12"),
        it("Elevação pélvica", null, 3, "12"),
        it("Esteira", null, 1, "15 min", "", "", "Caminhada rápida, conversando com dificuldade"),
      ]),
    ] }),
  },
  {
    id: "abc", nome: "Hipertrofia · ABC", desc: "Peito e ombro / costas / pernas, 2 voltas na semana",
    ficha: () => ({ treinos: [
      tr("A", "Peito, ombro e tríceps", [1, 4], [
        it("Supino reto", "supino-reto", 4, "8–12", "90 s"),
        it("Crossover", "crossover", 3, "12–15"),
        it("Desenvolvimento", "desenvolvimento", 4, "8–12", "90 s"),
        it("Tríceps corda", null, 3, "12–15"),
      ]),
      tr("B", "Costas e bíceps", [2, 5], [
        it("Puxada frontal", "puxada-frontal", 4, "8–12", "90 s"),
        it("Remada baixa", "remada-baixa", 4, "8–12", "90 s"),
        it("Rosca direta", null, 3, "10–12"),
      ]),
      tr("C", "Pernas", [3, 6], [
        it("Leg press 45°", "leg-press-45", 4, "10–12", "2 min"),
        it("Cadeira extensora", "cadeira-extensora", 3, "12–15"),
        it("Cadeira flexora", "cadeira-flexora", 3, "12–15"),
        it("Panturrilha em pé", null, 4, "15–20", "45 s"),
      ]),
    ] }),
  },
  {
    id: "ab", nome: "Hipertrofia · AB (superior / inferior)", desc: "4 vezes por semana",
    ficha: () => ({ treinos: [
      tr("A", "Superior", [1, 4], [
        it("Supino reto", "supino-reto", 4, "8–10", "2 min"),
        it("Puxada frontal", "puxada-frontal", 4, "8–10", "2 min"),
        it("Remada baixa", "remada-baixa", 3, "10–12", "90 s"),
        it("Desenvolvimento", "desenvolvimento", 3, "10–12", "90 s"),
      ]),
      tr("B", "Inferior", [2, 5], [
        it("Leg press 45°", "leg-press-45", 4, "8–10", "2 min"),
        it("Cadeira flexora", "cadeira-flexora", 4, "10–12", "90 s"),
        it("Cadeira extensora", "cadeira-extensora", 3, "12–15"),
        it("Elevação pélvica", null, 3, "10–12", "90 s"),
      ]),
    ] }),
  },
  {
    id: "circuito", nome: "Condicionamento · circuito", desc: "Pouco descanso, 3 vezes por semana",
    ficha: () => ({ treinos: [
      tr("A", "Circuito", [1, 3, 5], [
        it("Leg press 45°", "leg-press-45", 3, "15", "30 s", "", "Vá direto para o próximo exercício"),
        it("Puxada frontal", "puxada-frontal", 3, "15", "30 s"),
        it("Supino reto", "supino-reto", 3, "15", "30 s"),
        it("Cadeira extensora", "cadeira-extensora", 3, "15", "30 s"),
        it("Remada baixa", "remada-baixa", 3, "15", "30 s"),
        it("Bicicleta", null, 1, "20 min", "", "", "Ritmo moderado"),
      ]),
    ] }),
  },
];

/** exercícios sem tag que aparecem como sugestão no editor */
export const LIVRES = ["Agachamento livre", "Prancha abdominal", "Elevação pélvica", "Rosca direta", "Tríceps corda", "Panturrilha em pé", "Esteira", "Bicicleta", "Abdominal", "Afundo"];

export function fichaVazia(): Ficha {
  const v = new Date(); v.setDate(v.getDate() + 42);
  return { treinos: [tr("A", "Treino A", [], [it("Supino reto", "supino-reto", 3, "10–12")])], validade: v.toISOString().slice(0, 10), obs: "" };
}
