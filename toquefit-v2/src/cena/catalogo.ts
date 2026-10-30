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

const FLEXORA: InfoCena = {
  estatica: "flexora-estatica.svg",
  carregando: "Preparando a instrutora",
  desenho: `<path class="c-1" pathLength="1" d="M92 44l-10 22"/><path class="c-2" pathLength="1" d="M92 44a5 5 0 1 0 0.1 0M80 66a6 6 0 1 0 0.1 0"/><path class="c-3" pathLength="1" d="M8 68h146M40 44h48M40 44L30 6M60 44v24M16 6v62M16 40h14"/>`,
};

const DESENVOLVIMENTO: InfoCena = {
  estatica: "desenvolvimento-estatico.svg",
  carregando: "Preparando a instrutora",
  desenho: `<path class="c-1" pathLength="1" d="M52 22h56"/><path class="c-2" pathLength="1" d="M58 22v-14M102 22v-14"/><path class="c-3" pathLength="1" d="M8 68h146M40 4v64M120 4v64M40 4h80M64 56h32M70 56L66 30"/>`,
};

const REMADA: InfoCena = {
  estatica: "remada-estatica.svg",
  carregando: "Preparando a instrutora",
  desenho: `<path class="c-1" pathLength="1" d="M70 40h70"/><path class="c-2" pathLength="1" d="M62 40l8-6M62 40l8 6"/><path class="c-3" pathLength="1" d="M8 68h146M14 56h50M40 56V20M140 4v64M150 4v64"/>`,
};

const PUXADA: InfoCena = {
  estatica: "puxada-estatica.svg",
  carregando: "Preparando a instrutora",
  desenho: `<path class="c-1" pathLength="1" d="M40 30h80"/><path class="c-2" pathLength="1" d="M80 30V6"/><path class="c-3" pathLength="1" d="M8 68h146M30 4v64M30 4h56M66 56h30M80 56V36"/>`,
};

const PILHA: InfoCena = {
  estatica: "pilha-estatica.svg",
  carregando: "Carregando o aparelho",
  desenho: `<path class="c-1" pathLength="1" d="M56 14h48M56 24h48M56 34h48"/><path class="c-2" pathLength="1" d="M80 4v10"/><path class="c-3" pathLength="1" d="M40 4v64M120 4v64M40 4h80M30 68h100"/>`,
};

const CATALOGO: Record<string, InfoCena> = { "supino-reto": SUPINO, "leg-press-45": LEG_PRESS, "cadeira-extensora": EXTENSORA, "cadeira-flexora": FLEXORA, desenvolvimento: DESENVOLVIMENTO, "remada-baixa": REMADA, "puxada-frontal": PUXADA };

/** Cena de um roteiro; sem roteiro, a pilha de anilhas. */
export const infoCena = (roteiro?: string) => (roteiro && CATALOGO[roteiro]) || PILHA;
