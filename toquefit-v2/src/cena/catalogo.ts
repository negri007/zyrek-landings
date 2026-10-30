// O que o player mostra de cada cena antes do three.js chegar (ou quando não há WebGL).
// Fica fora do pacote 3D para aparecer na hora.

export interface InfoCena {
  /** imagem em public/img mostrada sem WebGL ou se a cena falhar */
  estatica: string;
  /** texto enquanto a cena carrega */
  carregando: string;
  /** desenho em traço que se completa com o progresso: c-1 e c-2 em neon, c-3 em cinza (viewBox 160 × 70) */
  desenho: string;
}

const SUPINO: InfoCena = {
  estatica: "supino-estatico.svg",
  carregando: "Preparando a instrutora",
  desenho: `<path class="c-1" pathLength="1" d="M6 22h148"/><path class="c-2" pathLength="1" d="M22 8v28M30 4v36M138 8v28M130 4v36"/><path class="c-3" pathLength="1" d="M18 56h124M44 56v12M116 56v12M60 22l-4 34M100 22l4 34"/>`,
};

const LEG_PRESS: InfoCena = {
  estatica: "legpress-estatico.svg",
  carregando: "Preparando a instrutora",
  desenho: `<path class="c-1" pathLength="1" d="M58 60L134 14"/><path class="c-2" pathLength="1" d="M112 4l26 26M128 30a9 9 0 1 0 0.1 0"/><path class="c-3" pathLength="1" d="M8 68h146M20 52h30M20 52L6 30M34 52v16"/>`,
};

const EXTENSORA: InfoCena = {
  estatica: "extensora-estatica.svg",
  carregando: "Preparando a instrutora",
  desenho: `<path class="c-1" pathLength="1" d="M92 44l40-26"/><path class="c-2" pathLength="1" d="M92 44a5 5 0 1 0 0.1 0M132 18a6 6 0 1 0 0.1 0"/><path class="c-3" pathLength="1" d="M8 68h146M40 44h48M40 44L30 6M60 44v24M16 6v62M16 40h14"/>`,
};

const PILHA: InfoCena = {
  estatica: "pilha-estatica.svg",
  carregando: "Carregando o aparelho",
  desenho: `<path class="c-1" pathLength="1" d="M56 14h48M56 24h48M56 34h48"/><path class="c-2" pathLength="1" d="M80 4v10"/><path class="c-3" pathLength="1" d="M40 4v64M120 4v64M40 4h80M30 68h100"/>`,
};

const CATALOGO: Record<string, InfoCena> = { "supino-reto": SUPINO, "leg-press-45": LEG_PRESS, "cadeira-extensora": EXTENSORA };

/** Cena de um roteiro; sem roteiro, a pilha de anilhas. */
export const infoCena = (roteiro?: string) => (roteiro && CATALOGO[roteiro]) || PILHA;
