// Tudo o que depende do three.js fica neste pedaço, baixado só quando o player aparece na tela.
import type { CenaRoteiro, OpcoesCena } from "./motor";
import { criarDesenvolvimento } from "./desenvolvimento";
import { criarExtensora } from "./extensora";
import { criarFlexora } from "./flexora";
import { criarLegPress } from "./legpress";
import { criarRemada } from "./remada";
import { criarSupino } from "./supino";

export { motor } from "./motor";
export { criarPilha } from "./pilha";

/** Cena 3D de cada roteiro gravado (a chave é o slug do roteiro). */
export const CENAS: Record<string, (o: OpcoesCena) => CenaRoteiro> = {
  "supino-reto": criarSupino,
  "leg-press-45": criarLegPress,
  "cadeira-extensora": criarExtensora,
  "cadeira-flexora": criarFlexora,
  desenvolvimento: criarDesenvolvimento,
  "remada-baixa": criarRemada,
};
