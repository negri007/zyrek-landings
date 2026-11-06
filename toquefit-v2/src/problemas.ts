// Aparelho com problema: quem está no aparelho avisa pela própria tag (quebrado, faltando peça, sujo),
// e a equipe vê a lista no painel e marca como resolvido. Aparelho parado sem ninguém saber é reclamação certa.
import { animate } from "motion";
import {
  aluno, avisarProblema, instrutor, listarProblemas, resolverProblema,
  type Problema, type TipoProblema,
} from "./conta";
import { S, bySlug, save } from "./estado";
import { icone } from "./ui/icones";
import { $, RM, ago, esc, toast } from "./ui/util";

export const TIPOS: Record<TipoProblema, string> = {
  quebrado: "Quebrado ou travando",
  peca: "Faltando peça (pino, pegador, trava)",
  limpeza: "Precisa de limpeza",
  outro: "Outro problema",
};

/* ---------- na página do aparelho ---------- */

export const avisoHtml = () => `<section class="sec prob" id="prob">
  <button class="prob-abrir" type="button" id="prob-abrir" aria-expanded="false" aria-controls="prob-opcoes">${icone("alerta")}<span>Algo errado com este aparelho?</span></button>
  <div class="prob-opcoes" id="prob-opcoes" role="group" aria-label="Qual o problema" hidden>
    ${(Object.keys(TIPOS) as TipoProblema[]).map((t) => `<button class="btn sm" type="button" data-prob="${t}">${esc(TIPOS[t])}</button>`).join("")}
  </div></section>`;

export function ligarAviso(slug: string) {
  const abrir = document.getElementById("prob-abrir"), opcoes = document.getElementById("prob-opcoes");
  if (!abrir || !opcoes) return;
  abrir.onclick = () => {
    const aberto = opcoes.hidden;
    opcoes.hidden = !aberto;
    abrir.setAttribute("aria-expanded", String(aberto));
    if (aberto) { (opcoes.querySelector("button") as HTMLElement).focus(); if (!RM) animate(opcoes, { opacity: [0, 1], transform: ["translateY(-4px)", "none"] }, { duration: 0.2 }); }
  };
  opcoes.querySelectorAll<HTMLButtonElement>("[data-prob]").forEach((b) => (b.onclick = async () => {
    const tipo = b.dataset.prob as TipoProblema;
    opcoes.querySelectorAll("button").forEach((x) => ((x as HTMLButtonElement).disabled = true));
    try {
      if (aluno()) await avisarProblema(slug, tipo);
      else avisarLocal(slug, tipo);
      $("prob").innerHTML = `<p class="thanks">${icone("check")} Obrigado! A equipe foi avisada e vai olhar o aparelho.</p>`;
      if (!RM) animate($("prob").firstElementChild!, { opacity: [0, 1] }, { duration: 0.3 });
    } catch (e) {
      toast((e as Error).message || "Sem conexão. Tente de novo ou avise um instrutor");
      opcoes.querySelectorAll("button").forEach((x) => ((x as HTMLButtonElement).disabled = false));
    }
  }));
}

/** sem área do aluno (demonstração): o aviso fica neste navegador e aparece no painel daqui */
function avisarLocal(slug: string, tipo: TipoProblema) {
  const igual = S.problemas.find((x) => !x.resolvido && x.slug === slug && x.tipo === tipo);
  if (igual) { igual.vezes++; igual.ultimoEm = Date.now(); }
  else S.problemas.unshift({ id: "l" + Date.now(), slug, tipo, at: Date.now(), ultimoEm: Date.now(), vezes: 1, quem: "Aluno", resolvido: false });
  save();
}

/* ---------- no painel ---------- */

let doServidor: Problema[] | null = null, buscando = false;

/** lista que o painel mostra: a do servidor com a área do aluno ativa, senão a deste navegador */
const lista = () => (instrutor() ? doServidor || [] : S.problemas);
export const problemasAbertos = () => lista().filter((p) => !p.resolvido).length;

export async function buscarProblemas() {
  if (!instrutor() || buscando) return;
  buscando = true;
  try { doServidor = (await listarProblemas()).problemas; }
  catch { /* sem conexão: mantém a última lista */ }
  finally { buscando = false; }
  renderProblemas();
}

export function renderProblemas() {
  const ul = document.getElementById("probs"), cont = document.getElementById("pcount");
  if (!ul || !cont) return;
  const abertos = lista().filter((p) => !p.resolvido), resolvidos = lista().filter((p) => p.resolvido);
  cont.textContent = abertos.length ? String(abertos.length) : "";
  const html = (abertos.length
    ? abertos.map((p) => {
      const m = bySlug(p.slug);
      return `<li class="prob-it ${p.tipo === "quebrado" ? "crit" : ""}"><div><b>${esc(m ? m.name : p.slug)}</b><small>${esc(TIPOS[p.tipo])}${p.vezes > 1 ? ` · ${p.vezes} avisos` : ""} · ${esc(p.quem)} ${ago(p.ultimoEm)}</small></div>
        <button class="btn sm" type="button" data-resolver="${esc(p.id)}" aria-label="Marcar ${esc(m ? m.name : p.slug)} como resolvido">Resolvido</button></li>`;
    }).join("")
    : `<li class="empty-s">${icone("check", "ok-ic")}Nenhum aparelho com problema. Quando um aluno avisar pela tag, aparece aqui.</li>`)
    + (resolvidos.length ? `<li class="hist">${resolvidos.length} ${resolvidos.length > 1 ? "resolvidos" : "resolvido"} nos últimos dias</li>` : "");
  if (ul.dataset.assin === html) return; // o painel redesenha muito: só troca se mudou
  ul.dataset.assin = html;
  ul.innerHTML = html;
  ul.querySelectorAll<HTMLButtonElement>("[data-resolver]").forEach((b) => (b.onclick = async () => {
    b.disabled = true;
    const id = b.dataset.resolver!;
    try {
      if (instrutor()) { const r = await resolverProblema(id); doServidor = (doServidor || []).map((x) => (x.id === id ? r.problema : x)); }
      else { const p = S.problemas.find((x) => x.id === id); if (p) { p.resolvido = true; p.resolvidoEm = Date.now(); save(); } }
      toast("Aparelho marcado como resolvido");
      renderProblemas();
    } catch (e) { b.disabled = false; toast((e as Error).message); }
  }));
}

