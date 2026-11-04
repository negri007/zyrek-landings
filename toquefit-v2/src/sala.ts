// Sala ao vivo: liga o celular de verdade de um aluno ao painel aberto em outro aparelho.
// O painel cria a sala e mostra um QR Code; o celular abre a página com ?sala=CODIGO.
// Sem sala (ou sem internet) tudo continua funcionando só neste navegador, como antes.
import type { Chamado } from "./estado";

const CHAVE = "tf-sala";
const FORMATO = /^[A-Z0-9]{6}$/;
// sem 0/O e 1/I: o código pode ser lido em voz alta ou digitado
const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// a sala vale 12 horas, como os chamados no servidor: um celular que entrou numa demonstração
// não fica preso nela e mandando chamados para uma sala que ninguém mais olha
const VALIDADE = 12 * 3600e3;
function guardada(): string | null {
  try {
    const g = JSON.parse(localStorage.getItem(CHAVE) || "null") as { sala?: string; ate?: number } | null;
    return g?.sala && g.ate && g.ate > Date.now() ? g.sala : null;
  } catch { return null; }
}
function guardar(s: string | null) {
  try { s ? localStorage.setItem(CHAVE, JSON.stringify({ sala: s, ate: Date.now() + VALIDADE })) : localStorage.removeItem(CHAVE); }
  catch { /* sem armazenamento: vale só nesta página */ }
}

let atual: string | null = (() => {
  const daUrl = new URLSearchParams(location.search).get("sala")?.toUpperCase() ?? null;
  if (daUrl && FORMATO.test(daUrl)) { guardar(daUrl); return daUrl; }
  const g = guardada();
  return g && FORMATO.test(g) ? g : null;
})();

export const salaAtual = () => atual;

/** chamados que o painel acabou de atender e o servidor ainda não confirmou: a consulta não pode trazê-los de volta */
export const atendendo = new Set<string>();

export function criarSala() {
  const n = new Uint32Array(6);
  crypto.getRandomValues(n);
  atual = Array.from(n, (v) => LETRAS[v % LETRAS.length]).join("");
  guardar(atual);
  return atual;
}

export function sairDaSala() {
  atual = null;
  guardar(null);
  // tira o ?sala= do endereço para um recarregar não entrar de novo
  const u = new URL(location.href);
  if (u.searchParams.has("sala")) { u.searchParams.delete("sala"); history.replaceState(null, "", u); }
}

/** Link que o QR Code do painel abre no celular. */
export const linkDaSala = (sala: string, slug: string) => `${location.origin}${location.pathname}?sala=${sala}#m-${slug}`;

// a função fica na raiz do domínio (netlify/functions/chamados.mts)
const base = () => `/api/salas/${atual}/chamados`;

async function pedir<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { ...init, headers: { "content-type": "application/json", ...init?.headers }, cache: "no-store" });
  if (!r.ok) {
    const e = await r.json().catch(() => null) as { erro?: string } | null;
    throw new Error(e?.erro || `Servidor respondeu ${r.status}`);
  }
  return r.status === 204 ? (undefined as T) : r.json();
}

/** o que o servidor devolve (com doneAt) vira o chamado que a interface usa */
interface ChamadoServidor { id: string; slug: string; at: number; done: boolean; doneAt?: number }
const doServidor = (c: ChamadoServidor): Chamado => ({ id: c.id, slug: c.slug, at: c.at, done: c.done });

export async function listarChamados() {
  const r = await pedir<{ chamados: ChamadoServidor[] }>(base());
  return r.chamados.map(doServidor);
}
export async function criarChamado(slug: string) {
  const r = await pedir<{ chamado: ChamadoServidor }>(base(), { method: "POST", body: JSON.stringify({ slug }) });
  return doServidor(r.chamado);
}
export const atenderChamado = (id: string) => pedir<unknown>(`${base()}/${id}`, { method: "PATCH" });
export const cancelarChamado = (id: string) => pedir<unknown>(`${base()}/${id}`, { method: "DELETE" });

export type EstadoConexao = "ok" | "falhou";
let ativa: { agora(): void; parar(): void } | null = null;
/** depois de uma ação (atender, cancelar), consulta a sala na hora em vez de esperar os 4 s */
export const atualizarSalaJa = () => ativa?.agora();
/**
 * Consulta a sala a cada 4 s enquanto a aba está à vista (aba escondida não gasta bateria nem rede)
 * e avisa quando a lista mudou ou a conexão caiu/voltou.
 */
export function sincronizarSala(aoMudar: (lista: Chamado[]) => void, aoConectar: (e: EstadoConexao) => void) {
  let timer = 0, ultimo = "", estado: EstadoConexao | null = null, parado = false;
  const rodar = async () => {
    clearTimeout(timer);
    if (parado || !atual) return;
    if (!document.hidden) {
      try {
        const lista = await listarChamados();
        const assinatura = JSON.stringify(lista);
        if (assinatura !== ultimo) { ultimo = assinatura; aoMudar(lista); }
        if (estado !== "ok") { estado = "ok"; aoConectar("ok"); }
      } catch {
        if (estado !== "falhou") { estado = "falhou"; aoConectar("falhou"); }
      }
    }
    timer = window.setTimeout(rodar, 4000);
  };
  const aoVoltar = () => { if (!document.hidden) void rodar(); };
  document.addEventListener("visibilitychange", aoVoltar);
  void rodar();
  return ativa = {
    /** consulta já (depois de uma ação), sem esperar os 4 s */
    agora: () => void rodar(),
    parar() { parado = true; clearTimeout(timer); document.removeEventListener("visibilitychange", aoVoltar); ativa = null; },
  };
}
