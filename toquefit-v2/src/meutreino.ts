// "Meu treino": a ficha semanal que o instrutor mandou, no celular do aluno.
// E o cartão que aparece na página do aparelho quando o aluno encosta na tag já conectado.
import { animate, stagger } from "motion";
import {
  DIAS, aoSalvar, aluno, buscarMeuTreino, chaveItem, dataCurta, enviarPendente, guardarRegistro, meuTreinoSalvo,
  registroDeHoje, sairAluno, situacaoFicha, temPendente, treinoDeHoje, ultimaCarga,
  type Item, type MeuTreino, type Registro, type Treino,
} from "./conta";
import { bySlug } from "./estado";
import { icone } from "./ui/icones";
import { $, RM, esc, toast } from "./ui/util";

let escolhido: string | null = null; // treino que o aluno abriu nesta visita (A, B…)

/** busca a ficha no servidor sem travar a tela; redesenha quando chegar algo novo */
let buscando: Promise<MeuTreino | null> | null = null;
function atualizar(aoChegar: () => void) {
  const antes = JSON.stringify(meuTreinoSalvo()?.aluno);
  buscando ||= buscarMeuTreino().then((m) => m, () => null).finally(() => { buscando = null; });
  void buscando.then((m) => {
    if (!aluno()) { aoChegar(); return; } // o link deixou de valer
    if (m && JSON.stringify(m.aluno) !== antes) aoChegar();
  });
}

const textoSalvo = { salvando: "Salvando…", salvo: "Salvo · o instrutor já vê", pendente: "Sem internet: guardado no celular, envia quando voltar" };
function ligarStatus() {
  aoSalvar((e) => {
    const el = document.getElementById("mt-salvo");
    if (!el) return;
    el.textContent = textoSalvo[e];
    el.dataset.e = e;
  });
}

export function renderMeuTreino(primeira = true) {
  const sc = $("p-scroll");
  $("p-cta").innerHTML = "";
  $("p-cta").dataset.estado = "";
  const m = meuTreinoSalvo();
  if (!aluno()) {
    sc.innerHTML = `<div class="mt-vazio">${icone("nfc", "vazio-ic")}<h1>Meu treino</h1>
      <p>Este celular não está ligado a nenhum aluno. Peça ao instrutor o seu link pessoal: ele chega pelo WhatsApp ou pelo QR Code do painel.</p>
      <a class="btn" href="#m-supino-reto">Ver os aparelhos</a></div>`;
    return;
  }
  if (!m) {
    sc.innerHTML = `<div class="mt-vazio"><div class="mt-carregando" aria-hidden="true"></div><p role="status">Abrindo sua ficha…</p></div>`;
    void buscarMeuTreino().then(() => renderMeuTreino(), (e: Error) => {
      if (!aluno()) { toast(e.message); renderMeuTreino(); return; }
      sc.innerHTML = `<div class="mt-vazio"><h1>Sem conexão</h1><p>Não deu para abrir sua ficha agora. Confira a internet e tente de novo.</p><button class="btn" type="button" id="mt-tentar">Tentar de novo</button></div>`;
      $("mt-tentar").onclick = () => renderMeuTreino();
    });
    return;
  }
  const { ficha } = m.aluno;
  const reg = registroDeHoje();
  const hoje = treinoDeHoje(ficha, m.treinos);
  const t = ficha.treinos.find((x) => x.id === escolhido) || hoje;
  const sit = situacaoFicha(ficha.validade);
  const primeiroNome = m.aluno.nome.split(/\s+/)[0];

  sc.innerHTML = `
    <div class="p-head"><span class="gym">${esc(m.academia)}</span><span class="p-head-r">${chipAoVivo()}</span></div>
    <div class="mt-topo">
      <p class="mt-ola">Olá, ${esc(primeiroNome)}</p>
      <h1>Meu treino</h1>
      ${sit.tipo === "vencida" ? `<p class="mt-aviso crit">Sua ficha venceu em ${dataCurta(ficha.validade)}. Fale com o instrutor para montar a próxima.</p>`
        : sit.tipo === "vence" ? `<p class="mt-aviso warn">Sua ficha vence em ${sit.dias === 0 ? "hoje" : sit.dias === 1 ? "1 dia" : sit.dias + " dias"}. Combine a troca com o instrutor.</p>`
        : ficha.validade ? `<p class="mt-val">Ficha válida até ${dataCurta(ficha.validade)}</p>` : ""}
      ${ficha.obs ? `<p class="mt-obs"><b>Recado do instrutor:</b> ${esc(ficha.obs)}</p>` : ""}
    </div>
    ${!t ? `<div class="mt-vazio"><p>Sua ficha ainda está vazia. O instrutor vai montar os treinos.</p></div>` : `
    <div class="mt-abas" role="tablist" aria-label="Treinos da semana">${ficha.treinos.map((x) => `<button type="button" role="tab" aria-selected="${x.id === t.id}" data-tr="${esc(x.id)}">
      <b>${esc(x.id)}</b><small>${x.id === hoje?.id ? "Hoje" : x.dias.length ? x.dias.map((d) => DIAS[d]).join(" · ") : "Livre"}</small></button>`).join("")}</div>
    <section class="mt-treino" aria-labelledby="mt-nome">
      <div class="mt-th"><h2 id="mt-nome">${esc(t.nome)}</h2><span class="mt-prog num" id="mt-prog"></span></div>
      <div class="mt-barra" aria-hidden="true"><i id="mt-barra"></i></div>
      <ol class="mt-itens" id="mt-itens">${t.itens.map((it, i) => itemHtml(t, i, it, reg, m.treinos)).join("")}</ol>
    </section>
    <section class="sec mt-fim" id="mt-fim">
      <h2>Como foi o treino?</h2>
      <div class="mt-sens" role="group" aria-label="Como foi o treino">${(["leve", "ok", "pesado"] as const).map((s) => `<button class="btn sm" type="button" data-sens="${s}" aria-pressed="${reg.sensacao === s}">${{ leve: "Leve", ok: "Na medida", pesado: "Pesado" }[s]}</button>`).join("")}</div>
      <label class="mt-dor"><input type="checkbox" id="mt-dor" ${reg.dor ? "checked" : ""}><span>Senti dor ou desconforto</span></label>
      <p class="mt-salvo" id="mt-salvo" aria-live="polite" data-e="${temPendente() ? "pendente" : "salvo"}">${temPendente() ? textoSalvo.pendente : Object.keys(reg.itens).length ? textoSalvo.salvo : "Cada exercício marcado já vai para o instrutor"}</p>
    </section>`}
    ${historico(m)}
    <section class="sec mt-priv"><p>Sua ficha e seus treinos ficam só com a ${esc(m.academia)}. Para apagar, peça ao instrutor.</p>
      <button class="btn sm" type="button" id="mt-sair">Desconectar este celular</button></section>
    <p class="p-foot">${esc(m.academia)} · com tecnologia ToqueFit</p>`;

  ligarStatus();
  if (t) {
    ligarItens(sc, t, reg);
    sc.querySelectorAll<HTMLButtonElement>("[data-tr]").forEach((b) => (b.onclick = () => {
      escolhido = b.dataset.tr!;
      renderMeuTreino(false);
      (document.querySelector(`[data-tr="${CSS.escape(escolhido)}"]`) as HTMLElement | null)?.focus();
    }));
    sc.querySelectorAll<HTMLButtonElement>("[data-sens]").forEach((b) => (b.onclick = () => {
      const r = registroDeHoje();
      r.sensacao = r.sensacao === b.dataset.sens ? null : (b.dataset.sens as Registro["sensacao"]);
      r.treino ||= t.id;
      guardarRegistro(r);
      sc.querySelectorAll<HTMLButtonElement>("[data-sens]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.sens === r.sensacao)));
      if (r.sensacao) toast(r.sensacao === "pesado" ? "Anotado. O instrutor vai ver que pesou" : "Anotado. Bom treino!");
    }));
    $<HTMLInputElement>("mt-dor").onchange = (e) => {
      const r = registroDeHoje();
      r.dor = (e.target as HTMLInputElement).checked;
      r.treino ||= t.id;
      guardarRegistro(r);
      if (r.dor) toast("O instrutor vai ser avisado. Se doer agora, pare e chame alguém");
    };
    progresso(t);
  }
  mostrarInstalar();
  $("mt-sair").onclick = () => { sairAluno(); escolhido = null; toast("Celular desconectado"); window.dispatchEvent(new Event("tf-aluno")); renderMeuTreino(); };
  if (primeira) {
    sc.scrollTop = 0;
    if (!RM) animate(sc.querySelectorAll(".mt-itens > li"), { opacity: [0, 1], transform: ["translateY(10px)", "none"] }, { duration: 0.35, delay: stagger(0.045, { startDelay: 0.1 }), ease: [0.2, 0.8, 0.2, 1] });
    void enviarPendente();
    atualizar(() => renderMeuTreino(false));
  }
}

const chipAoVivo = () => `<span class="ao-vivo-chip" title="Ligado ao painel da academia"><i aria-hidden="true"></i><span class="av-wait">Conectando</span><span class="av-ok">Ao vivo</span><span class="av-off">Sem conexão</span></span>`;

function itemHtml(t: Treino, i: number, it: Item, reg: Registro, treinos: Registro[], compacto = false) {
  const k = chaveItem(t, i), r = reg.itens[k], ult = ultimaCarga(treinos, k);
  const m = it.slug ? bySlug(it.slug) : null;
  const feito = !!r?.feito;
  const linha = [`${it.series} × ${esc(it.reps)}`, it.carga ? esc(it.carga) : "", it.descanso ? "descanso " + esc(it.descanso) : ""].filter(Boolean).join(" · ");
  return `<li class="mt-it${feito ? " feito" : ""}${compacto ? " compacto" : ""}" data-k="${esc(k)}">
    ${compacto ? "" : `<span class="mt-n num" aria-hidden="true">${i + 1}</span>`}
    <div class="mt-c">
      <b class="mt-ex">${esc(it.nome)}</b>
      <span class="mt-l">${linha}</span>
      ${ult ? `<span class="mt-ult">Última vez: <b>${esc(ult.carga)}</b> em ${dataCurta(ult.data)}</span>` : ""}
      ${it.obs ? `<span class="mt-o">${esc(it.obs)}</span>` : ""}
      <div class="mt-acts">
        <label class="mt-carga"><span class="sr">Carga usada em ${esc(it.nome)}</span><input type="text" inputmode="decimal" autocomplete="off" placeholder="${esc(it.carga || "Carga")}" value="${esc(r?.cargas[0] || "")}" data-carga></label>
        <button class="btn sm mt-ok" type="button" data-feito aria-pressed="${feito}">${icone("check")}<span>${feito ? "Feito" : "Marcar feito"}</span></button>
        ${m && !compacto ? `<a class="btn sm" href="#m-${m.slug}">${icone("play")}<span>Ver como fazer</span></a>` : ""}
      </div>
    </div></li>`;
}

function ligarItens(root: ParentNode, t: Treino, _reg: Registro, aoMudar?: () => void) {
  root.querySelectorAll<HTMLLIElement>(".mt-it").forEach((li) => {
    const k = li.dataset.k!, i = +k.split(".")[1], it = t.itens[i];
    const inp = li.querySelector<HTMLInputElement>("[data-carga]")!, bt = li.querySelector<HTMLButtonElement>("[data-feito]")!;
    const gravarItem = (feito?: boolean) => {
      const r = registroDeHoje();
      const atual = r.itens[k] || { feito: false, cargas: [] };
      if (feito !== undefined) atual.feito = feito;
      const c = inp.value.trim().slice(0, 12);
      atual.cargas = c ? [c] : feito && it.carga ? [it.carga] : [];
      r.itens[k] = atual;
      r.treino = t.id;
      guardarRegistro(r);
      return atual;
    };
    inp.onchange = () => { gravarItem(); };
    inp.onkeydown = (e) => { if (e.key === "Enter") inp.blur(); };
    bt.onclick = () => {
      const feito = bt.getAttribute("aria-pressed") !== "true";
      const a = gravarItem(feito);
      if (!inp.value && a.cargas[0]) inp.value = a.cargas[0];
      bt.setAttribute("aria-pressed", String(feito));
      bt.querySelector("span")!.textContent = feito ? "Feito" : "Marcar feito";
      li.classList.toggle("feito", feito);
      if (feito && !RM) animate(bt.querySelector(".ic")!, { transform: ["scale(0) rotate(-40deg)", "scale(1) rotate(0deg)"] }, { type: "spring", bounce: 0.45, visualDuration: 0.4 });
      progresso(t);
      aoMudar?.();
    };
  });
}

function progresso(t: Treino) {
  const reg = registroDeHoje();
  const feitos = t.itens.filter((_, i) => reg.itens[chaveItem(t, i)]?.feito).length;
  const el = document.getElementById("mt-prog"), barra = document.getElementById("mt-barra");
  if (el) el.textContent = `${feitos} de ${t.itens.length}`;
  if (barra) barra.style.transform = `scaleX(${t.itens.length ? feitos / t.itens.length : 0})`;
  if (feitos === t.itens.length && t.itens.length && el && el.dataset.fim !== "1") {
    el.dataset.fim = "1";
    toast("Treino completo! Conta como foi lá embaixo");
    if (!RM) animate("#mt-fim", { transform: ["scale(.98)", "scale(1)"] }, { type: "spring", bounce: 0.4, visualDuration: 0.4 });
  } else if (el && feitos < t.itens.length) el.dataset.fim = "";
}

/** últimos treinos: o aluno vê a própria constância */
function historico(m: MeuTreino) {
  const ant = m.treinos.filter((t) => Object.values(t.itens).some((x) => x.feito)).slice(0, 6);
  if (!ant.length) return "";
  return `<section class="sec mt-hist"><h2>Seus últimos treinos</h2><ul>${ant.map((r) => {
    const t = m.aluno.ficha.treinos.find((x) => x.id === r.treino);
    const n = Object.values(r.itens).filter((x) => x.feito).length;
    return `<li><span class="num">${dataCurta(r.data)}</span><b>${esc(t ? t.id + " · " + t.nome : "Treino")}</b><small>${n} ${n > 1 ? "exercícios" : "exercício"}</small></li>`;
  }).join("")}</ul></section>`;
}

/* ---------- na página do aparelho (tag NFC) ---------- */

/** exercício deste aparelho na ficha do aluno: no treino de hoje primeiro */
function naFicha(slug: string) {
  const m = meuTreinoSalvo();
  if (!m) return null;
  const hoje = treinoDeHoje(m.aluno.ficha, m.treinos);
  const ordem = [...(hoje ? [hoje] : []), ...m.aluno.ficha.treinos.filter((t) => t !== hoje)];
  for (const t of ordem) {
    const i = t.itens.findIndex((x) => x.slug === slug);
    if (i >= 0) return { m, t, i, hoje: t === hoje };
  }
  return { m, t: null, i: -1, hoje: false };
}

/** HTML do cartão (vazio se o celular não tem aluno conectado) */
export function cartaoDaFicha(slug: string) {
  if (!aluno()) return "";
  const f = naFicha(slug);
  if (!f) return `<section class="mt-card" id="mt-card" data-slug="${esc(slug)}" aria-label="Sua ficha"><p class="mt-card-h">${icone("nfc")}Abrindo sua ficha…</p></section>`;
  if (!f.t) return `<section class="mt-card fora" id="mt-card" data-slug="${esc(slug)}" aria-label="Sua ficha"><p class="mt-card-h">Este aparelho não está na sua ficha.</p><a class="btn sm" href="#treino">Ver meu treino</a></section>`;
  return `<section class="mt-card" id="mt-card" data-slug="${esc(slug)}" aria-label="Sua ficha neste aparelho">
    <p class="mt-card-h">${icone("nfc")}<span>${f.hoje ? "No seu treino de hoje" : "Na sua ficha"} · <b>Treino ${esc(f.t.id)}</b></span><a href="#treino">Meu treino</a></p>
    <ol class="mt-itens">${itemHtml(f.t, f.i, f.t.itens[f.i], registroDeHoje(), f.m.treinos, true)}</ol>
    <p class="mt-salvo" id="mt-salvo" aria-live="polite"></p></section>`;
}

export function ligarCartaoDaFicha(slug: string, redesenhar: () => void, buscar = true) {
  const el = document.getElementById("mt-card");
  if (!el) return;
  ligarStatus();
  const f = naFicha(slug);
  if (f?.t) ligarItens(el, f.t, registroDeHoje(), () => { if (el.querySelector("[aria-pressed=true]")) toast("Exercício marcado na sua ficha"); });
  if (!buscar) return;
  // a ficha chegou ou mudou no servidor: troca só o cartão
  atualizar(() => {
    const atual = document.getElementById("mt-card");
    if (!atual || atual.dataset.slug !== slug) return; // o aluno já foi para outro aparelho
    const novo = cartaoDaFicha(slug);
    if (!novo) { atual.remove(); redesenhar(); return; }
    atual.outerHTML = novo;
    ligarCartaoDaFicha(slug, redesenhar, false);
  });
}

/** séries e descanso que o instrutor passou para este aparelho (valem no lugar da sugestão padrão) */
export function prescricao(slug: string) {
  const f = aluno() ? naFicha(slug) : null;
  if (!f?.t) return null;
  const it = f.t.itens[f.i];
  return { sets: `${it.series} × ${it.reps}`, rest: it.descanso };
}

/** aparelhos do treino de hoje (a lista ao lado marca "Hoje") */
export function slugsDeHoje() {
  const m = aluno() ? meuTreinoSalvo() : null;
  const t = m ? treinoDeHoje(m.aluno.ficha, m.treinos) : null;
  return new Set((t?.itens || []).map((i) => i.slug).filter(Boolean) as string[]);
}

/* ---------- instalar como app (Android/Chrome): o aluno abre a ficha pelo ícone na tela inicial ---------- */
type PedidoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
let pedido: PedidoInstalar | null = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  pedido = e as PedidoInstalar;
  if (location.hash === "#treino") mostrarInstalar();
});
window.addEventListener("appinstalled", () => { pedido = null; document.getElementById("mt-instalar")?.remove(); });
function mostrarInstalar() {
  if (!pedido || document.getElementById("mt-instalar") || matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches) return;
  const priv = document.querySelector(".mt-priv");
  if (!priv) return;
  priv.insertAdjacentHTML("beforebegin", `<div class="mt-instalar" id="mt-instalar"><span>Coloque o ToqueFit na tela inicial e abra a ficha com um toque.</span><button class="btn sm primary" type="button">Instalar</button></div>`);
  document.querySelector<HTMLButtonElement>("#mt-instalar button")!.onclick = async () => {
    const p = pedido;
    if (!p) return;
    pedido = null;
    await p.prompt();
    document.getElementById("mt-instalar")?.remove();
  };
}
