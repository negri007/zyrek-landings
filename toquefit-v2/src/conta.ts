// Área do aluno, lado do navegador: quem está conectado (instrutor ou aluno) e as chamadas à API
// netlify/functions/academias.mjs. Sem senha: o instrutor guarda a chave da academia, o aluno abre o link pessoal.
import { DADOS } from "./data/carregar";

export interface Item { slug: string | null; nome: string; series: number; reps: string; carga: string; descanso: string; obs: string }
export interface Treino { id: string; nome: string; dias: number[]; itens: Item[] }
export interface Ficha { treinos: Treino[]; validade: string; obs: string }
export interface RegItem { feito: boolean; cargas: string[] }
export interface Registro { data: string; treino: string; itens: Record<string, RegItem>; sensacao: "leve" | "ok" | "pesado" | null; dor: boolean; at?: number }
export interface ResumoAluno {
  id: string; nome: string; criado: number; atualizado: number; validade: string; treinos: number; exemplo: boolean;
  ultimo: string | null; semana: number; previstos: number;
  ultimoRetorno: { data: string; sensacao: Registro["sensacao"]; dor: boolean } | null;
}
export interface AlunoCompleto { id: string; nome: string; ficha: Ficha; criado: number; atualizado: number }

interface SessaoInstrutor { cod: string; nome: string; chave: string }
interface SessaoAluno { cod: string; id: string; token: string }

const K_INSTR = "tf-academia", K_ALUNO = "tf-aluno", K_FICHA = "tf-meu-treino", K_DIA = "tf-meu-dia";
const ler = <T>(k: string): T | null => { try { return JSON.parse(localStorage.getItem(k) || "null") as T | null; } catch { return null; } };
const gravar = (k: string, v: unknown) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento */ } };

/* ---------- link pessoal: #acesso=COD-ID-TOKEN ---------- */
// depois do # de propósito: essa parte do endereço nunca sai do celular (não vai para o servidor nem para logs)
const meuTreinoSalvoDe = (id?: string) => { const m = ler<{ aluno: { id: string; nome: string } }>(K_FICHA); return m && m.aluno.id === id ? m : null; };

/** lê o link de acesso do aluno, se o endereço for um; true quando trocou de aluno */
export function lerLinkDeAcesso() {
  const m = location.hash.match(/^#acesso=([A-Za-z0-9]{6})-([a-f0-9]{12})-([a-f0-9]{32})$/);
  if (!location.hash.startsWith("#acesso=")) return false;
  if (m) {
    const [, a, u, t] = m;
    const antes = ler<SessaoAluno>(K_ALUNO);
    // link de outra pessoa não troca a ficha deste celular sem o aluno confirmar
    const nome = meuTreinoSalvoDe(antes?.id)?.aluno.nome;
    const trocar = !antes || antes.id === u || confirm(`Este celular está com a ficha de ${nome || "outro aluno"}. Trocar para a ficha deste link?`);
    if (trocar) {
      if (antes?.id !== u) { gravar(K_FICHA, null); gravar(K_DIA, null); }
      gravar(K_ALUNO, { cod: a.toUpperCase(), id: u, token: t });
    }
    history.replaceState(null, "", location.pathname + location.search + "#treino");
    return trocar;
  }
  // o token também não fica no endereço: some do histórico e de um print da tela
  history.replaceState(null, "", location.pathname + location.search + "#treino");
  return !!m;
}
lerLinkDeAcesso();

export const instrutor = () => ler<SessaoInstrutor>(K_INSTR);
export const aluno = () => ler<SessaoAluno>(K_ALUNO);

/** nome que aparece no topo, nas etiquetas e no celular */
export function nomeAcademia() {
  return instrutor()?.nome || ler<{ academia: string }>(K_FICHA)?.academia || DADOS.academia;
}

export const linkDoAluno = (cod: string, id: string, token: string) =>
  `${location.origin}${location.pathname}#acesso=${cod}-${id}-${token}`;

/* ---------- chamadas ---------- */
async function pedir<T>(url: string, init: RequestInit = {}, cab: Record<string, string> = {}): Promise<T> {
  const r = await fetch(url, { ...init, cache: "no-store", headers: { "content-type": "application/json", ...cab, ...(init.headers as Record<string, string>) } });
  if (!r.ok) {
    const e = (await r.json().catch(() => null)) as { erro?: string } | null;
    throw Object.assign(new Error(e?.erro || `Servidor respondeu ${r.status}`), { status: r.status });
  }
  return r.status === 204 ? (undefined as T) : r.json();
}
const corpo = (b: unknown) => JSON.stringify(b);

function doInstrutor() {
  const s = instrutor();
  if (!s) throw new Error("Academia não conectada");
  return { base: `/api/academias/${s.cod}`, cab: { "x-chave": s.chave } };
}

export async function criarAcademia(nome: string) {
  const r = await pedir<SessaoInstrutor>("/api/academias", { method: "POST", body: corpo({ nome }) });
  gravar(K_INSTR, r);
  return r;
}
/** abrir a mesma academia em outro computador: código + chave */
export async function entrarAcademia(cod: string, chave: string) {
  const r = await pedir<{ academia: { cod: string; nome: string } }>(`/api/academias/${cod}`, {}, { "x-chave": chave });
  gravar(K_INSTR, { cod: r.academia.cod, nome: r.academia.nome, chave });
  return r;
}
export const sairAcademia = () => gravar(K_INSTR, null);

export async function listarAlunos() {
  const { base, cab } = doInstrutor();
  return pedir<{ academia: { cod: string; nome: string }; alunos: ResumoAluno[]; hoje: string }>(base, {}, cab);
}
export async function lerAluno(id: string) {
  const { base, cab } = doInstrutor();
  return pedir<{ aluno: AlunoCompleto; treinos: Registro[] }>(`${base}/alunos/${id}`, {}, cab);
}
export async function cadastrarAluno(nome: string, ficha: Ficha) {
  const { base, cab } = doInstrutor();
  return pedir<{ aluno: AlunoCompleto; token: string }>(`${base}/alunos`, { method: "POST", body: corpo({ nome, ficha }) }, cab);
}
export async function salvarAluno(id: string, nome: string, ficha: Ficha) {
  const { base, cab } = doInstrutor();
  return pedir<{ aluno: AlunoCompleto }>(`${base}/alunos/${id}`, { method: "PUT", body: corpo({ nome, ficha }) }, cab);
}
export async function apagarAluno(id: string) {
  const { base, cab } = doInstrutor();
  return pedir<void>(`${base}/alunos/${id}`, { method: "DELETE" }, cab);
}
/** alunos de exemplo com histórico, para o painel não começar vazio na apresentação */
export interface Exemplos {
  alunos: { nome: string; ficha: Ficha; treinos: Registro[]; diasCadastro?: number }[];
  problemas?: { slug: string; tipo: TipoProblema; quem: string; horasAtras: number }[];
}
export async function criarExemplos(dados: Exemplos) {
  const { base, cab } = doInstrutor();
  return pedir<{ criados: number }>(`${base}/exemplo`, { method: "POST", body: corpo(dados) }, cab);
}
export async function apagarExemplos() {
  const { base, cab } = doInstrutor();
  return pedir<{ apagados: number }>(`${base}/exemplo`, { method: "DELETE" }, cab);
}
/* ---------- aparelhos com problema ---------- */
export type TipoProblema = "quebrado" | "peca" | "limpeza" | "outro";
export interface Problema { id: string; slug: string; tipo: TipoProblema; at: number; ultimoEm: number; vezes: number; quem: string; resolvido: boolean; resolvidoEm?: number; exemplo?: boolean }
export async function avisarProblema(slug: string, tipo: TipoProblema) {
  const s = aluno();
  if (!s) throw new Error("Sem aluno conectado");
  return pedir<{ problema: Problema }>(`/api/academias/${s.cod}/eu/problemas`, { method: "POST", body: corpo({ slug, tipo }) }, { "x-aluno": s.id, "x-token": s.token });
}
export async function listarProblemas() {
  const { base, cab } = doInstrutor();
  return pedir<{ problemas: Problema[] }>(`${base}/problemas`, {}, cab);
}
export async function resolverProblema(pid: string) {
  const { base, cab } = doInstrutor();
  return pedir<{ problema: Problema }>(`${base}/problemas/${pid}`, { method: "PATCH" }, cab);
}

export async function novoLink(id: string) {
  const { base, cab } = doInstrutor();
  return pedir<{ token: string }>(`${base}/alunos/${id}/link`, { method: "POST" }, cab);
}

/* ---------- aluno ---------- */
export interface MeuTreino { academia: string; aluno: { id: string; nome: string; ficha: Ficha; atualizado: number }; treinos: Registro[]; em: number }

/** ficha guardada no celular: abre na hora (e sem internet); a rede atualiza por trás */
export const meuTreinoSalvo = () => {
  const m = ler<MeuTreino>(K_FICHA);
  return m && m.aluno.id === aluno()?.id ? m : null;
};

export async function buscarMeuTreino(): Promise<MeuTreino> {
  const s = aluno();
  if (!s) throw new Error("Sem aluno conectado");
  try {
    const r = await pedir<Omit<MeuTreino, "em">>(`/api/academias/${s.cod}/eu`, {}, { "x-aluno": s.id, "x-token": s.token });
    const m = { ...r, em: Date.now() };
    gravar(K_FICHA, m);
    return m;
  } catch (e) {
    // link trocado ou aluno apagado pela academia: desconecta este celular
    if ((e as { status?: number }).status === 401) sairAluno();
    throw e;
  }
}

export function sairAluno() {
  gravar(K_ALUNO, null); gravar(K_FICHA, null); gravar(K_DIA, null);
}

export const hojeISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

/* ---------- registro do dia: salvo no celular primeiro, enviado em seguida (e de novo se a internet cair) ---------- */
interface Dia { id: string; reg: Registro; pendente: boolean }
export function registroDeHoje(): Registro {
  const d = ler<Dia>(K_DIA), s = aluno();
  if (d && d.id === s?.id && d.reg.data === hojeISO()) return d.reg;
  // o servidor pode já ter o de hoje (aberto em outro celular, ou guardado antes de limpar o navegador)
  const doServidor = meuTreinoSalvo()?.treinos.find((t) => t.data === hojeISO());
  return doServidor ? structuredClone(doServidor) : { data: hojeISO(), treino: "", itens: {}, sensacao: null, dor: false };
}
export const temPendente = () => !!ler<Dia>(K_DIA)?.pendente;

let timer = 0, enviando: Promise<boolean> | null = null;
type Ouvinte = (estado: "salvando" | "salvo" | "pendente") => void;
let ouvinte: Ouvinte | null = null;
export const aoSalvar = (f: Ouvinte | null) => { ouvinte = f; };

export function guardarRegistro(reg: Registro) {
  const s = aluno();
  if (!s) return;
  gravar(K_DIA, { id: s.id, reg, pendente: true } satisfies Dia);
  // também na cópia da ficha, para "última vez" e o resumo valerem na hora
  const m = meuTreinoSalvo();
  if (m) { m.treinos = [reg, ...m.treinos.filter((t) => t.data !== reg.data)]; gravar(K_FICHA, m); }
  ouvinte?.("salvando");
  clearTimeout(timer);
  timer = window.setTimeout(() => void enviarPendente(), 700);
}

export async function enviarPendente(): Promise<boolean> {
  if (enviando) return enviando;
  const d = ler<Dia>(K_DIA), s = aluno();
  if (!d?.pendente || !s || d.id !== s.id) return true;
  enviando = (async () => {
    try {
      await pedir(`/api/academias/${s.cod}/eu/treinos/${d.reg.data}`, { method: "PUT", body: corpo(d.reg) }, { "x-aluno": s.id, "x-token": s.token });
      // só baixa a pendência se nada mudou enquanto o pedido estava no ar
      const agora = ler<Dia>(K_DIA);
      if (agora && JSON.stringify(agora.reg) === JSON.stringify(d.reg)) gravar(K_DIA, { ...agora, pendente: false });
      ouvinte?.(temPendente() ? "salvando" : "salvo");
      if (temPendente()) { clearTimeout(timer); timer = window.setTimeout(() => void enviarPendente(), 300); }
      return true;
    } catch {
      ouvinte?.("pendente");
      return false;
    } finally { enviando = null; }
  })();
  return enviando;
}
window.addEventListener("online", () => void enviarPendente());

/* ---------- leitura da ficha ---------- */
export const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const chaveItem = (t: Treino, i: number) => `${t.id}.${i}`;

/** treino sugerido hoje: o marcado para o dia da semana; senão o seguinte ao último feito */
export function treinoDeHoje(f: Ficha, treinos: Registro[]): Treino | null {
  if (!f.treinos.length) return null;
  const reg = treinos.find((t) => t.data === hojeISO());
  if (reg?.treino) { const t = f.treinos.find((x) => x.id === reg.treino); if (t) return t; }
  const dia = new Date().getDay();
  const doDia = f.treinos.find((t) => t.dias.includes(dia));
  if (doDia) return doDia;
  const ultimo = treinos.find((t) => t.data < hojeISO() && t.treino);
  const i = ultimo ? f.treinos.findIndex((t) => t.id === ultimo.treino) : -1;
  return f.treinos[(i + 1) % f.treinos.length];
}

/** última carga usada neste exercício antes de hoje (a maior série do dia) */
export function ultimaCarga(treinos: Registro[], chave: string) {
  for (const t of treinos) {
    if (t.data >= hojeISO()) continue;
    const c = t.itens[chave]?.cargas.filter(Boolean);
    if (c?.length) return { data: t.data, carga: c[c.length - 1] };
  }
  return null;
}

/** situação da ficha pela validade */
export function situacaoFicha(validade: string) {
  if (!validade) return { tipo: "sem" as const, dias: Infinity };
  const dias = Math.round((new Date(validade + "T12:00").getTime() - new Date(hojeISO() + "T12:00").getTime()) / 86400e3);
  return { tipo: dias < 0 ? ("vencida" as const) : dias <= 7 ? ("vence" as const) : ("ok" as const), dias };
}

export const dataCurta = (iso: string) => { const [, m, d] = iso.split("-"); return `${d}/${m}`; };
export function quando(iso: string | null) {
  if (!iso) return "Nunca treinou";
  const dias = Math.round((new Date(hojeISO() + "T12:00").getTime() - new Date(iso + "T12:00").getTime()) / 86400e3);
  return dias <= 0 ? "Hoje" : dias === 1 ? "Ontem" : `Há ${dias} dias`;
}
