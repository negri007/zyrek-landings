// Painel da academia → Alunos e fichas: o instrutor cadastra o aluno, monta a ficha semanal e manda o link pessoal.
// Os números vêm do servidor (netlify/functions/academias.mjs); o celular do aluno registra cada exercício feito.
import { animate, stagger } from "motion";
import {
  DIAS, apagarAluno, cadastrarAluno, criarAcademia, dataCurta, entrarAcademia, instrutor, lerAluno, linkDoAluno, listarAlunos,
  apagarExemplos, criarExemplos, novoLink, quando, sairAcademia, salvarAluno, situacaoFicha, chaveItem,
  type Ficha, type Item, type Registro, type ResumoAluno, type Treino,
} from "./conta";
import { LIVRES, MODELOS, fichaVazia } from "./data/modelos";
import { S } from "./estado";
import { icone } from "./ui/icones";
import { qrSvg } from "./ui/qr";
import { $, RM, esc, toast } from "./ui/util";

let lista: ResumoAluno[] | null = null, erroLista = "", carregando = false;

/* ---------- cartão no painel ---------- */
let chaveAberta = false, filtro = "", ocupado = false;
export function renderAlunos(buscar = true) {
  const el = $("alunos");
  const s = instrutor();
  // o painel redesenha a cada consulta da sala ao vivo: este cartão só muda quando os dados mudam
  // (senão apagaria o que o instrutor está digitando)
  if (!s) {
    if (el.dataset.modo !== "ativar") { el.dataset.modo = "ativar"; semAcademia(el); }
    return;
  }
  if (buscar) void recarregar();
  const alertas = lista ? contarAlertas(lista) : null;
  const temExemplo = !!lista?.some((a) => a.exemplo);
  const html = `
    <div class="card-h al-h"><div><h2>Alunos e fichas</h2><span>${lista ? `${lista.length} ${lista.length === 1 ? "aluno" : "alunos"} · ` : ""}código da academia <code class="av-cod">${esc(s.cod)}</code></span></div>
      <div class="acts">
        ${lista?.length ? `<button class="btn sm" type="button" id="al-planilha">Baixar planilha</button>` : ""}
        <button class="btn sm" type="button" id="al-chave" aria-expanded="${chaveAberta}">Chave do instrutor</button>
        <button class="btn sm primary" type="button" id="al-novo">Novo aluno</button></div></div>
    ${chaveAberta ? `<div class="al-chave" id="al-chave-box">
      <p><b>Anote estes dois dados.</b> Com eles você abre este painel em outro computador ou no celular do instrutor (botão <b>Já tenho a chave</b>). Se o navegador for limpo sem eles, os alunos continuam no servidor, mas o painel não abre.</p>
      <dl><dt>Código</dt><dd><code>${esc(s.cod)}</code></dd><dt>Chave do instrutor</dt><dd><code>${esc(s.chave)}</code></dd></dl>
      <p class="hint">Quem tem a chave vê e edita todos os alunos. Não mande para alunos.</p>
      <div class="acts"><button class="btn sm" type="button" id="al-copiar">Copiar código e chave</button><button class="btn sm perigo" type="button" id="al-sair">Desconectar este computador</button></div></div>` : ""}
    ${alertas && (alertas.vence + alertas.sumido + alertas.dor) ? `<ul class="al-alertas" aria-label="Precisa de atenção">
      ${alertas.dor ? `<li class="crit"><b class="num">${alertas.dor}</b> ${alertas.dor > 1 ? "sentiram" : "sentiu"} dor no último treino</li>` : ""}
      ${alertas.sumido ? `<li class="warn"><b class="num">${alertas.sumido}</b> sem treinar há 7 dias ou mais</li>` : ""}
      ${alertas.vence ? `<li class="warn"><b class="num">${alertas.vence}</b> ${alertas.vence > 1 ? "fichas vencidas ou vencendo" : "ficha vencida ou vencendo"} em 7 dias</li>` : ""}
    </ul>` : ""}
    ${(lista?.length || 0) > 5 ? `<div class="al-busca"><label class="sr" for="al-filtro">Buscar aluno</label><input type="search" id="al-filtro" placeholder="Buscar aluno pelo nome" autocomplete="off" value="${esc(filtro)}"></div>` : ""}
    <div id="al-lista" aria-live="polite">${listaHtml()}</div>
    ${lista ? `<div class="al-exemplo">${temExemplo
      ? `<span>Os alunos marcados como <b>Exemplo</b> são de demonstração.</span><button class="btn sm" type="button" id="al-ex-tirar">Apagar alunos de exemplo</button>`
      : `<span>Vai apresentar? Coloque 5 alunos de exemplo com 4 semanas de treino para mostrar os alertas e a evolução de carga.</span><button class="btn sm" type="button" id="al-ex-por">Colocar alunos de exemplo</button>`}</div>` : ""}`;
  const assinatura = s.cod + "|" + html;
  if (el.dataset.modo === "lista" && el.dataset.assin === assinatura) return;
  // o campo de busca não perde o foco quando a lista se atualiza
  const buscando = document.activeElement?.id === "al-filtro";
  el.dataset.modo = "lista";
  el.dataset.assin = assinatura;
  el.innerHTML = html;
  if (buscando) { const f = $<HTMLInputElement>("al-filtro"); f.focus(); f.setSelectionRange(f.value.length, f.value.length); }
  $("al-novo").onclick = (e) => abrirEditor(null, e.currentTarget as HTMLElement);
  $("al-chave").onclick = () => { chaveAberta = !chaveAberta; renderAlunos(false); $("al-chave").focus(); };
  document.getElementById("al-copiar")?.addEventListener("click", () => copiar(`Código: ${s.cod}\nChave do instrutor: ${s.chave}`, "Código e chave copiados"));
  document.getElementById("al-sair")?.addEventListener("click", () => { sairAcademia(); lista = null; chaveAberta = false; window.dispatchEvent(new Event("tf-academia")); toast("Painel desconectado. Os dados continuam no servidor"); });
  document.getElementById("al-planilha")?.addEventListener("click", baixarPlanilhaAlunos);
  document.getElementById("al-filtro")?.addEventListener("input", (e) => { filtro = (e.target as HTMLInputElement).value; $("al-lista").innerHTML = listaHtml(); ligarLista(el); });
  document.getElementById("al-ex-por")?.addEventListener("click", (e) => void exemplos(true, e.currentTarget as HTMLButtonElement));
  document.getElementById("al-ex-tirar")?.addEventListener("click", (e) => void exemplos(false, e.currentTarget as HTMLButtonElement));
  ligarLista(el);
}

/** depois de ativar a academia: a chave aparece aberta, para o instrutor anotar */
export const mostrarChave = () => { chaveAberta = true; };

function ligarLista(el: HTMLElement) {
  el.querySelectorAll<HTMLButtonElement>("[data-al]").forEach((b) => (b.onclick = () => abrirEditor(b.dataset.al!, b)));
  el.querySelector<HTMLButtonElement>("#al-tentar")?.addEventListener("click", () => renderAlunos());
}

async function exemplos(por: boolean, bt: HTMLButtonElement) {
  if (ocupado) return;
  ocupado = true; bt.disabled = true; bt.textContent = por ? "Colocando…" : "Apagando…";
  try {
    if (por) {
      const { alunosDeExemplo } = await import("./data/exemplos");
      await criarExemplos(alunosDeExemplo());
      toast("5 alunos de exemplo no painel. Abra a ficha de cada um");
    } else {
      const r = await apagarExemplos();
      toast(`${r.apagados} alunos de exemplo apagados`);
    }
    await recarregar(true);
  } catch (e) { toast((e as Error).message); bt.disabled = false; bt.textContent = por ? "Colocar alunos de exemplo" : "Apagar alunos de exemplo"; }
  finally { ocupado = false; }
}

/** quem precisa de atenção primeiro: dor, ficha vencida, sumido, ficha vencendo; depois pelo nome */
function prioridade(a: ResumoAluno) {
  const sit = situacaoFicha(a.validade);
  if (a.ultimoRetorno?.dor && a.ultimoRetorno.data === a.ultimo) return 0;
  if (sit.tipo === "vencida") return 1;
  if (diasSem(a) >= 7) return 2;
  if (sit.tipo === "vence") return 3;
  return 4;
}

function contarAlertas(l: ResumoAluno[]) {
  let vence = 0, sumido = 0, dor = 0;
  for (const a of l) {
    const sit = situacaoFicha(a.validade);
    if (sit.tipo === "vencida" || sit.tipo === "vence") vence++;
    if (diasSem(a) >= 7) sumido++;
    if (a.ultimoRetorno?.dor && a.ultimoRetorno.data === a.ultimo) dor++;
  }
  return { vence, sumido, dor };
}
/** dias desde o último treino (ou desde o cadastro, para quem nunca treinou) */
function diasSem(a: ResumoAluno) {
  const ref = a.ultimo ? new Date(a.ultimo + "T12:00").getTime() : a.criado;
  return Math.floor((Date.now() - ref) / 86400e3);
}

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function listaHtml() {
  if (!lista) return erroLista
    ? `<p class="al-vazio">${esc(erroLista)} <button class="btn sm" type="button" id="al-tentar">Tentar de novo</button></p>`
    : `<p class="al-vazio" role="status">Carregando alunos…</p>`;
  if (!lista.length) return `<div class="al-vazio"><b>Nenhum aluno ainda.</b> Cadastre o primeiro, escolha um modelo de ficha e mande o link pelo WhatsApp. Quando ele encostar o celular na tag, a ficha dele abre naquele aparelho.</div>`;
  const f = semAcento(filtro.trim());
  const vistos = lista.filter((a) => !f || semAcento(a.nome).includes(f)).sort((a, b) => prioridade(a) - prioridade(b) || a.nome.localeCompare(b.nome, "pt-BR"));
  if (!vistos.length) return `<p class="al-vazio">Nenhum aluno com "${esc(filtro)}".</p>`;
  return `<ul class="al-lista">${vistos.map((a) => {
    const sit = situacaoFicha(a.validade), parado = diasSem(a);
    const prev = Math.max(1, a.previstos || 3);
    const r = a.ultimoRetorno && a.ultimoRetorno.data === a.ultimo ? a.ultimoRetorno : null;
    return `<li><button type="button" class="al-it" data-al="${esc(a.id)}" aria-label="Abrir ficha de ${esc(a.nome)}">
      <span class="al-av" aria-hidden="true">${esc(iniciais(a.nome))}</span>
      <span class="al-nome"><b>${esc(a.nome)}</b><small class="${parado >= 7 ? "warn" : ""}">${a.ultimo ? "Treinou: " + quando(a.ultimo).toLowerCase() : "Ainda não treinou"}</small></span>
      <span class="al-sem"><span class="num"><b>${a.semana}</b> de ${prev}</span><small>treinos na semana</small><i class="al-barra" aria-hidden="true"><i style="transform:scaleX(${Math.min(1, a.semana / prev).toFixed(3)})"></i></i></span>
      <span class="al-tags">
        ${sit.tipo === "vencida" ? `<span class="pill crit">Ficha vencida</span>` : sit.tipo === "vence" ? `<span class="pill no">Vence ${sit.dias === 0 ? "hoje" : "em " + sit.dias + "d"}</span>` : sit.tipo === "ok" ? `<span class="pill ok">Até ${dataCurta(a.validade)}</span>` : ""}
        ${r?.dor ? `<span class="pill crit">Sentiu dor</span>` : r?.sensacao === "pesado" ? `<span class="pill no">Achou pesado</span>` : r?.sensacao === "leve" ? `<span class="pill neon">Achou leve</span>` : ""}
        ${a.exemplo ? `<span class="pill ex">Exemplo</span>` : ""}
      </span>
      <span class="al-ir" aria-hidden="true">Ficha ›</span></button></li>`;
  }).join("")}</ul>`;
}

/** planilha dos alunos (abre no Excel e no Google Planilhas) */
function baixarPlanilhaAlunos() {
  if (!lista) return;
  // texto que começa com = + - @ vira fórmula no Excel: o apóstrofo faz ficar só texto
  const cel = (v: string | number) => { let t = String(v); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return /[;"\n]/.test(t) ? `"${t.replace(/"/g, `""`)}"` : t; };
  const linhas = [["Aluno", "Último treino", "Treinos na semana", "Dias previstos", "Ficha válida até", "Último retorno"]]
    .concat(lista.map((a) => {
      const r = a.ultimoRetorno && a.ultimoRetorno.data === a.ultimo ? a.ultimoRetorno : null;
      return [a.nome, a.ultimo ? dataCurta(a.ultimo) : "Nunca", String(a.semana), String(a.previstos), a.validade ? dataCurta(a.validade) : "", r?.dor ? "Sentiu dor" : r?.sensacao || ""];
    }));
  // ponto e vírgula e BOM: é o que o Excel em português abre direto, com acentos
  const csv = "﻿" + linhas.map((l) => l.map(cel).join(";")).join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = `alunos-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  toast("Planilha de alunos baixada");
}

const iniciais = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

async function recarregar(forcar = false) {
  if (carregando && !forcar) return;
  carregando = true;
  try {
    const r = await listarAlunos();
    lista = r.alunos; erroLista = "";
  } catch (e) {
    if ((e as { status?: number }).status === 401 || (e as { status?: number }).status === 404) {
      sairAcademia(); lista = null;
      toast("A chave desta academia não vale mais. Entre de novo");
      window.dispatchEvent(new Event("tf-academia"));
      return;
    }
    if (!lista) erroLista = "Sem conexão com o servidor.";
  } finally { carregando = false; }
  if (!document.getElementById("alunos") || !instrutor()) return;
  const box = document.getElementById("al-lista");
  const antes = box?.innerHTML;
  renderAlunos(false);
  if (!RM && antes?.includes("Carregando")) animate("#al-lista .al-lista > li", { opacity: [0, 1], transform: ["translateY(8px)", "none"] }, { duration: 0.3, delay: stagger(0.04) });
}

/** atualização periódica (o aluno marcou exercício no celular): só enquanto o painel está à vista */
let relogio = 0;
export function vigiarAlunos(ligado: boolean) {
  clearInterval(relogio);
  if (ligado) relogio = window.setInterval(() => { if (!document.hidden && instrutor() && !editorAberto) void recarregar(); }, 15000);
}

function semAcademia(el: HTMLElement) {
  el.innerHTML = `
    <div class="al-ativar">
      <div class="al-ativar-t"><span class="k">Novo · Área do aluno</span><h2>Cada aluno com a sua ficha no celular</h2>
        <p>O instrutor monta a ficha semanal, o aluno recebe um link pelo WhatsApp e, quando encosta o celular na tag do aparelho, vê o que fazer ali: séries, carga e o vídeo. A academia acompanha quem está treinando.</p></div>
      <div class="al-form al-abrir" id="al-abrir-box">
        <button class="btn" type="button" id="al-abrir">Ativar área do aluno</button>
        <button class="btn sm al-link" type="button" id="al-tenho-1">Já tenho a chave</button>
      </div>
      <form class="al-form" id="al-criar" novalidate hidden>
        <div class="f"><label for="al-nome-ac">Nome da academia</label><input type="text" id="al-nome-ac" autocomplete="organization" maxlength="60" placeholder="Ex.: Academia Força Total"></div>
        <button class="btn primary" type="submit">Ativar área do aluno</button>
        <button class="btn sm al-link" type="button" id="al-tenho">Já tenho a chave</button>
      </form>
      <form class="al-form" id="al-entrar" novalidate hidden>
        <div class="f"><label for="al-cod">Código da academia</label><input type="text" id="al-cod" autocomplete="off" maxlength="6" placeholder="6 letras" style="text-transform:uppercase"></div>
        <div class="f"><label for="al-chave-in">Chave do instrutor</label><input type="text" id="al-chave-in" autocomplete="off" maxlength="32" spellcheck="false"></div>
        <button class="btn primary" type="submit">Entrar</button>
        <button class="btn sm al-link" type="button" id="al-volta">Criar uma academia nova</button>
      </form>
    </div>`;
  const criar = $<HTMLFormElement>("al-criar"), entrar = $<HTMLFormElement>("al-entrar");
  $("al-tenho").onclick = () => { criar.hidden = true; entrar.hidden = false; $("al-cod").focus(); };
  // o cartão fica fechado no fim do painel: o formulário só aparece quando a academia decide ativar
  const abrirBox = $("al-abrir-box");
  $("al-abrir").onclick = () => { abrirBox.hidden = true; criar.hidden = false; $("al-nome-ac").focus(); };
  $("al-tenho-1").onclick = () => { abrirBox.hidden = true; entrar.hidden = false; $("al-cod").focus(); };
  $("al-volta").onclick = () => { entrar.hidden = true; criar.hidden = false; $("al-nome-ac").focus(); };
  criar.onsubmit = async (e) => {
    e.preventDefault();
    const nome = $<HTMLInputElement>("al-nome-ac").value.trim();
    if (!nome) { toast("Digite o nome da academia"); $("al-nome-ac").focus(); return; }
    const b = criar.querySelector<HTMLButtonElement>("[type=submit]")!;
    b.disabled = true; b.textContent = "Ativando…";
    try {
      await criarAcademia(nome);
      lista = [];
      mostrarChave();
      window.dispatchEvent(new Event("tf-academia"));
      toast("Área do aluno ativada. Cadastre o primeiro aluno");
    } catch (er) { toast((er as Error).message || "Sem conexão. Tente de novo"); b.disabled = false; b.textContent = "Ativar área do aluno"; }
  };
  entrar.onsubmit = async (e) => {
    e.preventDefault();
    const cod = $<HTMLInputElement>("al-cod").value.trim().toUpperCase(), chave = $<HTMLInputElement>("al-chave-in").value.trim().toLowerCase();
    if (!/^[A-Z0-9]{6}$/.test(cod) || !/^[a-f0-9]{32}$/.test(chave)) { toast("Confira o código (6 letras) e a chave (32 caracteres)"); return; }
    try { await entrarAcademia(cod, chave); lista = null; window.dispatchEvent(new Event("tf-academia")); toast("Painel conectado"); }
    catch (er) { toast((er as Error).message); }
  };
}

/* ---------- editor da ficha (gaveta larga) ---------- */
let editorAberto = false, abridor: HTMLElement | null = null;
let ed: { id: string | null; nome: string; ficha: Ficha; treinos: Registro[] } | null = null;

export function montarEditor() {
  const d = document.createElement("aside");
  d.className = "drawer largo";
  d.id = "drawer-aluno";
  d.setAttribute("role", "dialog");
  d.setAttribute("aria-modal", "true");
  d.setAttribute("aria-labelledby", "ed-title");
  d.hidden = true;
  d.innerHTML = `<div class="dr-h"><h2 id="ed-title">Novo aluno</h2><button class="x" type="button" id="ed-x" aria-label="Fechar">${icone("fechar")}</button></div>
    <div class="dr-b" id="ed-b"></div>
    <div class="dr-f" id="ed-f"></div>`;
  document.body.appendChild(d);
  const sc = document.createElement("div");
  sc.className = "scrim"; sc.id = "scrim-aluno"; sc.hidden = true;
  document.body.appendChild(sc);
  $("ed-x").onclick = fecharEditor;
  sc.onclick = fecharEditor;
  document.addEventListener("keydown", (e) => {
    if (!editorAberto) return;
    if (e.key === "Escape") fecharEditor();
    if (e.key === "Tab") {
      const f = [...d.querySelectorAll<HTMLElement>("button, input, select, textarea, a[href]")].filter((x) => !(x as HTMLButtonElement).disabled && x.offsetParent);
      const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { z.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === z) { a.focus(); e.preventDefault(); }
    }
  });
}

async function abrirEditor(id: string | null, de?: HTMLElement) {
  abridor = de || null;
  const d = $("drawer-aluno"), sc = $("scrim-aluno");
  d.hidden = sc.hidden = false;
  editorAberto = true;
  document.body.classList.add("travado");
  $("view-painel").inert = true;
  if (RM) { d.style.transform = "none"; sc.style.opacity = "1"; }
  else {
    animate(sc, { opacity: [0, 1] }, { duration: 0.25 });
    animate(d, { transform: ["translateX(100%)", "translateX(0%)"] }, { type: "spring", bounce: 0, visualDuration: 0.38 });
  }
  if (!id) {
    ed = { id: null, nome: "", ficha: fichaVazia(), treinos: [] };
    desenharEditor();
    setTimeout(() => $("ed-nome").focus(), RM ? 0 : 120);
    return;
  }
  const nome = lista?.find((a) => a.id === id)?.nome || "Aluno";
  $("ed-title").textContent = nome;
  $("ed-b").innerHTML = `<p class="al-vazio" role="status">Abrindo a ficha…</p>`;
  $("ed-f").innerHTML = "";
  try {
    const r = await lerAluno(id);
    if (!editorAberto) return;
    ed = { id, nome: r.aluno.nome, ficha: r.aluno.ficha, treinos: r.treinos };
    if (!ed.ficha.treinos.length) ed.ficha.treinos = fichaVazia().treinos;
    desenharEditor();
    $("ed-x").focus();
  } catch (e) {
    $("ed-b").innerHTML = `<p class="al-vazio">${esc((e as Error).message)}</p>`;
  }
}

function fecharEditor() {
  if (!editorAberto) return;
  editorAberto = false;
  const d = $("drawer-aluno"), sc = $("scrim-aluno");
  document.body.classList.remove("travado");
  $("view-painel").inert = false;
  const fim = () => { d.hidden = sc.hidden = true; };
  if (RM) fim();
  else {
    animate(sc, { opacity: 0 }, { duration: 0.22 });
    animate(d, { transform: "translateX(100%)" }, { duration: 0.28, ease: "easeIn" }).finished.then(fim);
  }
  if (abridor && document.body.contains(abridor)) abridor.focus();
  else document.getElementById("al-novo")?.focus();
}
export const editorEstaAberto = () => editorAberto;

/** aparelhos com tag primeiro, depois exercícios livres */
function opcoesExercicio(it: Item) {
  const ms = S.machines.map((m) => `<option value="m:${esc(m.slug)}"${it.slug === m.slug ? " selected" : ""}>${esc(m.name)}</option>`).join("");
  const livre = !it.slug;
  const outro = livre && !LIVRES.includes(it.nome);
  return `<optgroup label="Aparelhos com tag (abre o vídeo)">${ms}</optgroup>
    <optgroup label="Sem tag">${LIVRES.map((n) => `<option value="l:${esc(n)}"${livre && it.nome === n ? " selected" : ""}>${esc(n)}</option>`).join("")}<option value="outro"${outro ? " selected" : ""}>Outro… (digitar)</option></optgroup>`;
}

function treinoHtml(t: Treino, ti: number) {
  return `<fieldset class="ed-tr" data-ti="${ti}">
    <legend class="sr">Treino ${esc(t.id)}</legend>
    <div class="ed-tr-h">
      <span class="ed-letra" aria-hidden="true">${esc(t.id)}</span>
      <div class="f"><label for="ed-tn-${ti}">Nome do treino ${esc(t.id)}</label><input type="text" id="ed-tn-${ti}" data-tnome value="${esc(t.nome)}" maxlength="60"></div>
      <button class="btn sm" type="button" data-rmtr aria-label="Remover treino ${esc(t.id)}">Remover</button>
    </div>
    <div class="ed-dias" role="group" aria-label="Dias do treino ${esc(t.id)}">${DIAS.map((d, i) => `<button type="button" class="ed-dia" data-dia="${i}" aria-pressed="${t.dias.includes(i)}">${d}</button>`).join("")}</div>
    <ol class="ed-itens">${t.itens.map((it, ii) => `<li class="ed-it" data-ii="${ii}">
      <span class="ed-n num" aria-hidden="true">${ii + 1}</span>
      <div class="ed-campos">
        <div class="f ed-ex"><label for="ed-ex-${ti}-${ii}">Exercício</label><select id="ed-ex-${ti}-${ii}" data-ex>${opcoesExercicio(it)}</select>
          <input type="text" data-outro placeholder="Nome do exercício" maxlength="60" value="${!it.slug && !LIVRES.includes(it.nome) ? esc(it.nome) : ""}" hidden aria-label="Nome do exercício"></div>
        <div class="f"><label for="ed-se-${ti}-${ii}">Séries</label><input type="number" id="ed-se-${ti}-${ii}" data-series min="1" max="10" inputmode="numeric" value="${it.series}"></div>
        <div class="f"><label for="ed-re-${ti}-${ii}">Repetições</label><input type="text" id="ed-re-${ti}-${ii}" data-reps maxlength="16" value="${esc(it.reps)}"></div>
        <div class="f"><label for="ed-ca-${ti}-${ii}">Carga</label><input type="text" id="ed-ca-${ti}-${ii}" data-carga maxlength="20" placeholder="Ex.: 20 kg" value="${esc(it.carga)}"></div>
        <div class="f"><label for="ed-de-${ti}-${ii}">Descanso</label><input type="text" id="ed-de-${ti}-${ii}" data-desc maxlength="16" placeholder="60 s" value="${esc(it.descanso)}"></div>
        <div class="f ed-obs"><label for="ed-ob-${ti}-${ii}">Observação</label><input type="text" id="ed-ob-${ti}-${ii}" data-obs maxlength="140" placeholder="Opcional" value="${esc(it.obs)}"></div>
      </div>
      <div class="ed-it-a">
        <button class="x sm" type="button" data-sobe aria-label="Subir exercício ${ii + 1}" ${ii === 0 ? "disabled" : ""}>↑</button>
        <button class="x sm" type="button" data-rmit aria-label="Remover exercício ${ii + 1}">${icone("fechar")}</button>
      </div>
    </li>`).join("")}</ol>
    <button class="btn sm" type="button" data-addit>+ Adicionar exercício</button>
  </fieldset>`;
}

/** lê os campos do editor para ed.ficha (antes de redesenhar ou salvar) */
function lerEditor() {
  if (!ed) return;
  ed.nome = $<HTMLInputElement>("ed-nome").value.trim();
  ed.ficha.validade = $<HTMLInputElement>("ed-val").value;
  ed.ficha.obs = $<HTMLTextAreaElement>("ed-obs").value.trim();
  document.querySelectorAll<HTMLFieldSetElement>("#ed-b .ed-tr").forEach((fs) => {
    const t = ed!.ficha.treinos[+fs.dataset.ti!];
    t.nome = fs.querySelector<HTMLInputElement>("[data-tnome]")!.value.trim() || "Treino " + t.id;
    t.dias = [...fs.querySelectorAll<HTMLButtonElement>("[data-dia][aria-pressed=true]")].map((b) => +b.dataset.dia!);
    fs.querySelectorAll<HTMLLIElement>(".ed-it").forEach((li) => {
      const it = t.itens[+li.dataset.ii!];
      const v = li.querySelector<HTMLSelectElement>("[data-ex]")!.value;
      if (v.startsWith("m:")) { it.slug = v.slice(2); it.nome = S.machines.find((m) => m.slug === it.slug)?.name || it.nome; }
      else if (v.startsWith("l:")) { it.slug = null; it.nome = v.slice(2); }
      else { it.slug = null; it.nome = li.querySelector<HTMLInputElement>("[data-outro]")!.value.trim() || "Exercício"; }
      it.series = Math.min(10, Math.max(1, +li.querySelector<HTMLInputElement>("[data-series]")!.value || 3));
      it.reps = li.querySelector<HTMLInputElement>("[data-reps]")!.value.trim() || "10";
      it.carga = li.querySelector<HTMLInputElement>("[data-carga]")!.value.trim();
      it.descanso = li.querySelector<HTMLInputElement>("[data-desc]")!.value.trim();
      it.obs = li.querySelector<HTMLInputElement>("[data-obs]")!.value.trim();
    });
  });
}

const novoItem = (): Item => ({ slug: S.machines[0]?.slug || null, nome: S.machines[0]?.name || "Exercício", series: 3, reps: "10–12", carga: "", descanso: "60 s", obs: "" });
const proximaLetra = (f: Ficha) => "ABCDEFG".split("").find((l) => !f.treinos.some((t) => t.id === l)) || "G";

function desenharEditor(foco?: string) {
  if (!ed) return;
  const novo = !ed.id;
  const outros = (lista || []).filter((a) => a.id !== ed!.id && a.treinos > 0);
  $("ed-title").textContent = novo ? "Novo aluno" : ed.nome || "Aluno";
  $("ed-b").innerHTML = `
    <div class="f"><label for="ed-nome">Nome do aluno</label><input type="text" id="ed-nome" autocomplete="off" maxlength="60" value="${esc(ed.nome)}" placeholder="Nome e sobrenome"><span class="hint">Só o nome: a ficha não pede CPF, telefone nem dados de saúde.</span></div>
    ${novo ? "" : historicoHtml()}
    <div class="ed-linha">
      <div class="f"><label for="ed-modelo">Começar de um modelo</label><select id="ed-modelo"><option value="">Escolha um modelo…</option><optgroup label="Modelos">${MODELOS.map((m) => `<option value="${m.id}">${esc(m.nome)} · ${esc(m.desc)}</option>`).join("")}</optgroup>${outros.length ? `<optgroup label="Copiar a ficha de um aluno">${outros.map((a) => `<option value="a:${esc(a.id)}">${esc(a.nome)}</option>`).join("")}</optgroup>` : ""}</select></div>
      <div class="f"><label for="ed-val">Ficha válida até</label><input type="date" id="ed-val" value="${esc(ed.ficha.validade)}"></div>
    </div>
    <div class="f"><label for="ed-obs">Recado para o aluno</label><textarea id="ed-obs" maxlength="280" rows="2" placeholder="Ex.: Aqueça 5 min na esteira antes de começar">${esc(ed.ficha.obs)}</textarea></div>
    <div class="ed-trs" id="ed-trs">${ed.ficha.treinos.map(treinoHtml).join("")}</div>
    ${ed.ficha.treinos.length < 7 ? `<button class="btn" type="button" id="ed-addtr">+ Adicionar treino ${proximaLetra(ed.ficha)}</button>` : ""}
    ${novo ? "" : `<section class="ed-sec"><h3>Link do aluno</h3><p class="hint">O link abre a ficha no celular do aluno. Se ele perder o celular ou o link vazar, gere um novo: o antigo para de funcionar.</p>
      <div class="acts"><button class="btn sm" type="button" id="ed-link">Gerar link novo</button><button class="btn sm perigo" type="button" id="ed-apagar">Apagar aluno</button></div></section>`}`;
  $("ed-f").innerHTML = `<button class="btn" type="button" id="ed-cancel">Cancelar</button><button class="btn primary" type="button" id="ed-salvar">${novo ? "Cadastrar e gerar link" : "Salvar ficha"}</button>`;
  ligarEditor();
  if (foco) document.getElementById(foco)?.focus();
}

function ligarEditor() {
  const b = $("ed-b");
  $("ed-cancel").onclick = fecharEditor;
  $("ed-salvar").onclick = salvar;
  $<HTMLSelectElement>("ed-modelo").onchange = async (e) => {
    const v = (e.target as HTMLSelectElement).value;
    if (v.startsWith("a:") && ed) {
      // ficha de outro aluno como ponto de partida (a validade e o recado continuam os deste)
      try {
        const r = await lerAluno(v.slice(2));
        if (!editorAberto || !ed) return;
        lerEditor();
        ed.ficha.treinos = structuredClone(r.aluno.ficha.treinos);
        desenharEditor("ed-modelo");
        toast(`Ficha de ${r.aluno.nome} copiada. Ajuste o que precisar`);
      } catch (er) { toast((er as Error).message); }
      return;
    }
    const m = MODELOS.find((x) => x.id === v);
    if (!m || !ed) return;
    lerEditor();
    ed.ficha.treinos = m.ficha().treinos.map((t) => ({ ...t, itens: t.itens.filter((it) => !it.slug || S.machines.some((x) => x.slug === it.slug)) }));
    desenharEditor("ed-modelo");
    toast(`Modelo aplicado: ${m.nome}. Ajuste o que precisar`);
  };
  $("ed-addtr")?.addEventListener("click", () => {
    lerEditor();
    const id = proximaLetra(ed!.ficha);
    ed!.ficha.treinos.push({ id, nome: "Treino " + id, dias: [], itens: [novoItem()] });
    desenharEditor(`ed-tn-${ed!.ficha.treinos.length - 1}`);
  });
  b.querySelectorAll<HTMLFieldSetElement>(".ed-tr").forEach((fs) => {
    const ti = +fs.dataset.ti!;
    fs.querySelectorAll<HTMLButtonElement>("[data-dia]").forEach((x) => (x.onclick = () => x.setAttribute("aria-pressed", String(x.getAttribute("aria-pressed") !== "true"))));
    fs.querySelector<HTMLButtonElement>("[data-rmtr]")!.onclick = () => {
      lerEditor();
      if (ed!.ficha.treinos.length === 1) { toast("A ficha precisa de pelo menos um treino"); return; }
      ed!.ficha.treinos.splice(ti, 1);
      // letras seguem em ordem (A, B, C…) depois de tirar um treino
      ed!.ficha.treinos.forEach((t, i) => { const l = "ABCDEFG"[i]; if (t.nome === "Treino " + t.id) t.nome = "Treino " + l; t.id = l; });
      desenharEditor();
    };
    fs.querySelector<HTMLButtonElement>("[data-addit]")!.onclick = () => {
      lerEditor();
      const t = ed!.ficha.treinos[ti];
      if (t.itens.length >= 20) { toast("Até 20 exercícios por treino"); return; }
      t.itens.push(novoItem());
      desenharEditor(`ed-ex-${ti}-${t.itens.length - 1}`);
    };
    fs.querySelectorAll<HTMLLIElement>(".ed-it").forEach((li) => {
      const ii = +li.dataset.ii!;
      const sel = li.querySelector<HTMLSelectElement>("[data-ex]")!, outro = li.querySelector<HTMLInputElement>("[data-outro]")!;
      const mostrarOutro = () => { outro.hidden = sel.value !== "outro"; };
      mostrarOutro();
      sel.onchange = () => { mostrarOutro(); if (!outro.hidden) outro.focus(); };
      li.querySelector<HTMLButtonElement>("[data-rmit]")!.onclick = () => {
        lerEditor();
        const t = ed!.ficha.treinos[ti];
        if (t.itens.length === 1) { toast("O treino precisa de pelo menos um exercício"); return; }
        t.itens.splice(ii, 1);
        desenharEditor();
      };
      li.querySelector<HTMLButtonElement>("[data-sobe]")!.onclick = () => {
        lerEditor();
        const t = ed!.ficha.treinos[ti];
        [t.itens[ii - 1], t.itens[ii]] = [t.itens[ii], t.itens[ii - 1]];
        desenharEditor(`ed-ex-${ti}-${ii - 1}`);
      };
    });
  });
  document.getElementById("ed-link")?.addEventListener("click", async () => {
    if (!ed?.id) return;
    try { const r = await novoLink(ed.id); mostrarLink(ed.id, ed.nome, r.token, false); }
    catch (e) { toast((e as Error).message); }
  });
  let confirmar = false;
  document.getElementById("ed-apagar")?.addEventListener("click", async (e) => {
    const bt = e.currentTarget as HTMLButtonElement;
    if (!confirmar) { confirmar = true; bt.textContent = "Confirmar: apagar ficha e treinos"; setTimeout(() => { confirmar = false; if (bt.isConnected) bt.textContent = "Apagar aluno"; }, 4000); return; }
    try {
      await apagarAluno(ed!.id!);
      lista = lista?.filter((a) => a.id !== ed!.id) || null;
      fecharEditor(); renderAlunos(); toast("Aluno e todos os treinos dele foram apagados");
    } catch (er) { toast((er as Error).message); }
  });
}

async function salvar() {
  if (!ed) return;
  lerEditor();
  if (!ed.nome) { toast("Digite o nome do aluno"); $("ed-nome").focus(); $("ed-nome").setAttribute("aria-invalid", "true"); return; }
  const bt = $<HTMLButtonElement>("ed-salvar");
  bt.disabled = true; bt.textContent = "Salvando…";
  try {
    if (!ed.id) {
      const r = await cadastrarAluno(ed.nome, ed.ficha);
      ed.id = r.aluno.id;
      mostrarLink(r.aluno.id, r.aluno.nome, r.token, true);
    } else {
      await salvarAluno(ed.id, ed.nome, ed.ficha);
      toast("Ficha salva. O aluno vê na próxima vez que abrir");
      fecharEditor();
    }
    void recarregar();
  } catch (e) {
    toast((e as Error).message || "Sem conexão. A ficha não foi salva");
    bt.disabled = false; bt.textContent = ed.id ? "Salvar ficha" : "Cadastrar e gerar link";
  }
}

/** depois de cadastrar (ou gerar link novo): QR Code, WhatsApp e copiar */
function mostrarLink(id: string, nome: string, token: string, novo: boolean) {
  const s = instrutor()!;
  const link = linkDoAluno(s.cod, id, token);
  const primeiro = nome.split(/\s+/)[0];
  const msg = `Oi, ${primeiro}! Sua ficha de treino da ${s.nome} está pronta. Abra no seu celular: ${link}\n\nNa academia, encoste o celular na tag de cada aparelho para ver suas séries, a carga e o vídeo.`;
  $("ed-title").textContent = novo ? `${nome} cadastrado` : "Link novo";
  $("ed-b").innerHTML = `<div class="ed-pronto">
    <p>${novo ? "Mande este link para o aluno. Ele abre uma vez e o celular fica conectado." : "O link antigo parou de funcionar. Mande este para o aluno."}</p>
    <div class="ed-qr">${qrSvg(link, "QR Code do link de " + esc(nome))}</div>
    <p class="hint">Na academia, o aluno aponta a câmera para este QR Code.</p>
    <div class="linkbox"><code id="ed-l">${esc(link)}</code></div>
    <div class="acts">
      <a class="btn primary" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">Enviar pelo WhatsApp</a>
      <button class="btn" type="button" id="ed-copiar">Copiar link</button>
      <a class="btn" href="${esc(link)}" target="_blank" rel="noopener">Abrir como aluno</a>
    </div>
    <p class="hint">O link é pessoal: quem tiver o link vê a ficha deste aluno. Não poste em grupos.</p></div>`;
  $("ed-f").innerHTML = `<button class="btn primary" type="button" id="ed-ok">Pronto</button>`;
  $("ed-copiar").onclick = () => copiar(link, "Link copiado");
  $("ed-ok").onclick = fecharEditor;
  $("ed-ok").focus();
}

/** últimos treinos e a carga de cada exercício ao longo do tempo */
function historicoHtml() {
  if (!ed) return "";
  const regs = ed.treinos.filter((r) => Object.values(r.itens).some((x) => x.feito || x.cargas.length));
  if (!regs.length) return `<section class="ed-sec"><h3>Treinos feitos</h3><p class="hint">Ainda sem treino registrado. Cada exercício que o aluno marcar no celular aparece aqui.</p></section>`;
  const cargas = ed.ficha.treinos.flatMap((t) => t.itens.map((it, i) => {
    const k = chaveItem(t, i);
    const pts = regs.slice().reverse().map((r) => ({ d: r.data, c: r.itens[k]?.cargas.filter(Boolean).pop() })).filter((p) => p.c) as { d: string; c: string }[];
    return pts.length ? { nome: `${t.id} · ${it.nome}`, pts: pts.slice(-6) } : null;
  })).filter(Boolean) as { nome: string; pts: { d: string; c: string }[] }[];
  return `<section class="ed-sec"><h3>Treinos feitos <small>últimas 6 semanas</small></h3>
    <ul class="ed-hist">${regs.slice(0, 8).map((r) => {
      const t = ed!.ficha.treinos.find((x) => x.id === r.treino);
      const n = Object.values(r.itens).filter((x) => x.feito).length;
      return `<li><span class="num">${dataCurta(r.data)}</span><b>${esc(t ? `${t.id} · ${t.nome}` : "Treino " + r.treino)}</b><small>${n} ${n === 1 ? "exercício" : "exercícios"}</small>
        ${r.dor ? `<span class="pill crit">Sentiu dor</span>` : r.sensacao ? `<span class="pill ${r.sensacao === "pesado" ? "no" : r.sensacao === "leve" ? "neon" : "ok"}">${{ leve: "Leve", ok: "Na medida", pesado: "Pesado" }[r.sensacao]}</span>` : ""}</li>`;
    }).join("")}</ul>
    ${cargas.length ? `<h3>Evolução de carga</h3><ul class="ed-cargas">${cargas.map((c) => `<li><b>${esc(c.nome)}</b><span>${c.pts.map((p) => `<span title="${dataCurta(p.d)}">${esc(p.c)}</span>`).join(`<i aria-hidden="true">→</i>`)}</span></li>`).join("")}</ul>` : ""}
  </section>`;
}

function copiar(t: string, ok: string) {
  if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => toast(ok), () => toast("Não deu para copiar. Selecione e use Ctrl+C"));
  else toast("Selecione e use Ctrl+C");
}
