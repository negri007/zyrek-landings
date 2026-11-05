// Painel da academia: tudo o que o aluno faz no celular aparece aqui.
import { animate, stagger } from "motion";
import { DAILY, S, blobs, bySlug, restaurar, save } from "./estado";
import { esquecerAtual } from "./aluno";
import { $, RM, ago, contar, esc, fmt, toast } from "./ui/util";
import { animarBarraCarregada, barraCarregada } from "./ui/academia";
import { icone } from "./ui/icones";
import { linkDaTag, qrSvg } from "./ui/qr";
import { instrutor, nomeAcademia } from "./conta";
import { renderAlunos } from "./alunos";
import { atendendo, atenderChamado, atualizarSalaJa, criarSala, linkDaSala, sairDaSala, salaAtual } from "./sala";

const TOQUES_POR_ANILHA = 10;
/** medidor em forma de barra: eixo com recartilhado e anilhas na ponta */
const haltere = (w: number, cls = "") => `<div class="haltere ${cls}" data-w="${Math.max(0.06, w).toFixed(3)}" aria-hidden="true"><i class="h-eixo"></i><i class="h-fill"></i><span class="h-run"><span class="h-pl"><i></i><i></i><i></i></span></span></div>`;

/** Treino registrado hoje no celular dos alunos: séries marcadas e vídeos vistos até o fim. */
function hoje(slug: string) {
  const se = S.series[slug] || 0, fi = S.fins[slug] || 0;
  if (!se && !fi) return `<span class="hoje vazio">Sem registro</span>`;
  const partes = [se ? `${se} ${se > 1 ? "séries" : "série"}` : "", fi ? `${fi} ${fi > 1 ? "vídeos completos" : "vídeo completo"}` : ""].filter(Boolean);
  return `<span class="hoje">${partes.join("<br>")}</span>`;
}

/** Cartão da sala ao vivo: QR Code para o celular de teste entrar, e o estado da conexão. */
const textoConexao = () => {
  const c = document.documentElement.dataset.conexao;
  return c === "falhou" ? "Sem conexão com o servidor. Tentando de novo…" : c === "ok" ? "Conectado · atualiza a cada 4 segundos" : "Conectando…";
};
function renderAoVivo() {
  const el = $("ao-vivo"), sala = salaAtual();
  // a cada consulta só o estado muda: o QR e os botões só são refeitos quando a sala muda
  if (el.dataset.sala === (sala || "")) {
    const st = el.querySelector(".av-st");
    if (st && st.textContent !== textoConexao()) st.textContent = textoConexao();
    return;
  }
  el.dataset.sala = sala || "";
  el.classList.toggle("on", !!sala);
  if (!sala) {
    el.innerHTML = `<div class="av-t"><b>Teste com um celular de verdade</b><span>Conecte um celular e toque em "Chamar instrutor": o chamado aparece aqui na hora.</span></div>
      <button class="btn sm primary" type="button" id="av-ligar">${icone("nfc")} Conectar celular</button>`;
    $("av-ligar").onclick = () => { criarSala(); S.calls = []; save(); window.dispatchEvent(new Event("tf-sala")); };
    return;
  }
  const link = linkDaSala(sala, S.machines[0].slug);
  const daAcademia = instrutor()?.cod === sala; // sala fixa da área do aluno: não se encerra
  el.innerHTML = `<div class="av-qr">${qrSvg(link, "QR Code da sala " + sala)}</div>
    <div class="av-t"><b>Sala ao vivo <code class="av-cod">${sala}</code></b>
      <span>${daAcademia ? "Alunos conectados já entram nesta sala. Para testar sem login, aponte a câmera para o QR Code e toque em \"Chamar instrutor\"." : "Aponte a câmera do celular para o QR Code e toque em \"Chamar instrutor\" em qualquer aparelho."}</span>
      <span class="av-st" aria-live="polite">${textoConexao()}</span></div>
    ${daAcademia ? "" : `<button class="btn sm" type="button" id="av-sair">Encerrar sala</button>`}`;
  if (daAcademia) return;
  $("av-sair").onclick = () => { sairDaSala(); window.dispatchEvent(new Event("tf-sala")); };
}

export function renderPainel(animar: boolean) {
  renderAoVivo();
  renderAlunos(animar);
  const today = DAILY[13] + S.extra;
  const week = DAILY.slice(7, 13).reduce((a, b) => a + b, 0) + today;
  const prevWeek = DAILY.slice(0, 7).reduce((a, b) => a + b, 0);
  const diff = Math.round(((week - prevWeek) / prevWeek) * 100);
  const help = Math.round((S.help.yes / (S.help.yes + S.help.no)) * 100);
  const pend = S.calls.filter((c) => !c.done).length;
  const motivo = Object.entries(S.motivos).sort((a, b) => b[1] - a[1])[0]?.[0];
  // aba do navegador mostra quantos alunos estão esperando, como um contador de mensagens
  document.title = (pend ? `(${pend}) ` : "") + "Painel · ToqueFit";
  $("kpis").innerHTML = `
    <div class="card kpi hero"><span class="l">Toques hoje</span><span class="v num" data-n="${today}">${fmt(today)}</span><span class="s">Alunos que encostaram numa tag</span>
      <div class="kpi-barra">${barraCarregada(Math.round(today / (TOQUES_POR_ANILHA * 2)))}<span class="kb-leg">cada anilha = ${TOQUES_POR_ANILHA} toques</span></div></div>
    <div class="card kpi"><span class="l">Últimos 7 dias</span><span class="v num" data-n="${week}">${fmt(week)}</span><span class="s"><span class="${diff >= 0 ? "up" : "down"}">${diff >= 0 ? "+" : ""}${diff}%</span> sobre a semana anterior</span></div>
    <div class="card kpi"><span class="l">Vídeos que ajudaram</span><span class="v num" data-n="${help}" data-s="%">${help}%</span><span class="s">${fmt(S.help.yes + S.help.no)} respostas de alunos</span>${motivo ? `<span class="s motivo">Mais citado quando não ajuda: <b>${esc(motivo)}</b></span>` : ""}</div>`;
  if (animar) document.querySelectorAll<HTMLElement>("#kpis [data-n]").forEach((el) => contar(el, +el.dataset.n!, el.dataset.s));
  renderGrafico(today, animar);

  const sorted = S.machines.slice().sort((a, b) => b.t7 - a.t7);
  const max = sorted[0] ? sorted[0].t7 || 1 : 1;
  $("mcount").textContent = S.machines.length + " com tag NFC";
  const dia = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  $("ph-sub").textContent = dia.charAt(0).toUpperCase() + dia.slice(1) + " · " + S.machines.length + " aparelhos com tag";
  $("tbody").innerHTML = S.machines.map((m) => `<tr>
    <td><b>${esc(m.name)}</b><small>${esc(m.group)}</small></td>
    <td><span class="tg">${esc(m.tag)}</span></td>
    <td>${!m.video ? `<span class="pill no">Sem vídeo</span>` : m.roteiro ? `<span class="pill neon">Instrutora 3D</span>` : `<span class="pill ok">Com vídeo</span>`}</td>
    <td><div class="cell-n"><span class="num">${fmt(m.t7)}</span>${haltere(m.t7 / max, "mini-h")}</div></td>
    <td>${hoje(m.slug)}</td>
    <td><div class="row-acts"><a href="#m-${m.slug}" aria-label="Ver página do aparelho ${esc(m.name)}">Ver página</a><button type="button" data-edit="${m.slug}" aria-label="${m.video ? "Editar" : "Enviar vídeo do"} ${esc(m.name)}">${m.video ? "Editar" : "Enviar vídeo"}</button></div></td></tr>`).join("");
  // halteres: o eixo acende até o valor e as anilhas deslizam até lá
  const halteres = document.querySelectorAll<HTMLElement>(".haltere");
  halteres.forEach((h, k) => {
    const w = +h.dataset.w!, fill = h.querySelector<HTMLElement>(".h-fill")!, run = h.querySelector<HTMLElement>(".h-run")!;
    const fim = { fill: `scaleX(${w})`, run: `translateX(${(w * 100).toFixed(1)}%)` };
    if (!animar || RM) { fill.style.transform = fim.fill; run.style.transform = fim.run; return; }
    const op = { duration: 0.9, delay: 0.15 + k * 0.04, ease: [0.2, 0.8, 0.2, 1] as const };
    animate(fill, { transform: ["scaleX(0)", fim.fill] }, op);
    animate(run, { transform: ["translateX(0%)", fim.run] }, op);
  });
  if (animar) animarBarraCarregada($("kpis"));
  document.querySelectorAll<HTMLButtonElement>("[data-edit]").forEach((b) => (b.onclick = () => abrirGaveta(b.dataset.edit!, b)));

  // faixa "agora": o que a equipe resolve primeiro (aluno parado esperando, aparelho que a tag abre sem vídeo)
  const espera = S.calls.filter((c) => !c.done), atendidos = S.calls.filter((c) => c.done);
  $("ccount").textContent = pend ? pend + " aguardando" : "";
  $("calls").innerHTML = (espera.length
    ? espera.map((c) => {
      const m = bySlug(c.slug);
      const atraso = Date.now() - c.at > 5 * 60e3;
      return `<li class="wait${atraso ? " atraso" : ""}" data-id="${c.id}"><div><b>${c.nome ? `${esc(c.nome)} · ` : ""}${esc(m ? m.name : "Aparelho removido")}</b><small>${m ? esc(m.tag) + " · " : ""}chamou ${ago(c.at)}${atraso ? " · esperando faz tempo" : ""}</small></div><button class="btn sm primary" type="button" data-done="${c.id}" aria-label="Marcar chamado do ${esc(m ? m.name : "aparelho")} como atendido">Atendido</button></li>`;
    }).join("")
    : `<li class="empty-s">${icone("check", "ok-ic")}Ninguém esperando agora. Quando um aluno tocar em "Chamar instrutor", ele aparece aqui.</li>`)
    + (atendidos.length ? `<li class="hist">${atendidos.length} ${atendidos.length > 1 ? "chamados atendidos" : "chamado atendido"} · último ${ago(Math.max(...atendidos.map((c) => c.at)))}</li>` : "");
  const semVideo = S.machines.filter((m) => !m.video);
  $("vcount").textContent = semVideo.length ? String(semVideo.length) : "";
  $("pend").innerHTML = semVideo.length
    ? semVideo.map((m) => `<li><div><b>${esc(m.name)}</b><small>${fmt(m.t7)} ${m.t7 === 1 ? "aluno tocou" : "alunos tocaram"} na tag esta semana e não viram vídeo</small></div><button class="btn sm" type="button" data-edit="${m.slug}" aria-label="Enviar vídeo do ${esc(m.name)}">Enviar vídeo</button></li>`).join("")
    : `<li class="empty-s">${icone("check", "ok-ic")}Todos os aparelhos têm vídeo.</li>`;
  document.querySelectorAll<HTMLButtonElement>("#pend [data-edit]").forEach((b) => (b.onclick = () => abrirGaveta(b.dataset.edit!, b)));
  document.querySelectorAll<HTMLButtonElement>("[data-done]").forEach((b) => (b.onclick = async () => {
    const c = S.calls.find((x) => String(x.id) === b.dataset.done);
    if (c) c.done = true;
    save();
    if (salaAtual() && c && typeof c.id === "string" && !c.id.startsWith("tmp-")) {
      // o celular do aluno fica sabendo pelo servidor; se falhar, o chamado volta para a lista
      const id = c.id;
      atendendo.add(id); // até o servidor confirmar, a consulta da sala não traz o chamado de volta
      atenderChamado(id).then(() => { atendendo.delete(id); toast("Chamado atendido. O aluno já foi avisado"); atualizarSalaJa(); }, () => {
        atendendo.delete(id);
        const ainda = S.calls.find((x) => x.id === id);
        if (ainda) ainda.done = false;
        save(); renderPainel(false); toast("Sem conexão: o chamado continua aberto");
      });
    } else toast("Chamado marcado como atendido");
    // o chamado sai da lista encolhendo, e só então o painel é redesenhado
    const li = b.closest("li");
    if (li && !RM) {
      b.disabled = true;
      li.style.overflow = "hidden";
      await animate(li, { opacity: 0, transform: "translateX(16px)" }, { duration: 0.18, ease: "easeIn" }).finished;
      await animate(li, { height: [li.offsetHeight + "px", "0px"], paddingTop: "0px", paddingBottom: "0px" }, { duration: 0.22, ease: [0.4, 0, 0.2, 1] }).finished;
    }
    renderPainel(false);
  }));
  if (animar && !RM) animate(".painel .card", { opacity: [0, 1], transform: ["translateY(12px)", "none"] }, { duration: 0.3, delay: stagger(0.03), ease: [0.2, 0.7, 0.2, 1] });
}

let ultimoHoje = 0, larguraGrafico = 0;
const roGrafico = new ResizeObserver(() => {
  const w = $("chart").clientWidth;
  if (w && Math.abs(w - larguraGrafico) > 8) renderGrafico(ultimoHoje, false);
});

function renderGrafico(today: number, animar: boolean) {
  ultimoHoje = today;
  const box = $("chart");
  roGrafico.observe(box);
  // o SVG usa a largura real do cartão: texto do eixo fica sempre com 11 px, inclusive no celular
  const W = Math.max(280, Math.round(box.clientWidth || 640)), H = W < 480 ? 200 : 220, L = 30, R = 6, T = 22, B = 28;
  larguraGrafico = W;
  const data = DAILY.slice(0, 13).concat([today]);
  const max = Math.max(...data), step = 50, top = Math.ceil(max / step) * step;
  const y = (v: number) => T + (H - T - B) * (1 - v / top);
  const bw = (W - L - R) / data.length;
  const d0 = new Date(); d0.setHours(0, 0, 0, 0);
  let g = `<defs><linearGradient id="gBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A525C"/><stop offset="1" stop-color="#2A2F36"/></linearGradient>
  <linearGradient id="gNeon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3FF2C"/><stop offset="1" stop-color="#9AA41C"/></linearGradient>
  <filter id="glow" x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
  for (let v = 0; v <= top; v += step) g += `<line class="grid-l" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${L - 6}" y="${y(v) + 3.5}" text-anchor="end">${v}</text>`;
  data.forEach((v, i) => {
    // com o gráfico na largura toda, as colunas não engordam: ficam no máximo com 34 px
    const w = Math.min(bw * 0.6, 34), x = L + i * bw + (bw - w) / 2, isT = i === data.length - 1;
    const d = new Date(d0); d.setDate(d0.getDate() - (data.length - 1 - i));
    const dia = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    // cada coluna é uma pilha de placas, como a torre de pesos de uma máquina (uma placa a cada 10 toques)
    const hb = H - B - y(v), placas = Math.floor(v / 10);
    let cortes = "";
    for (let k = 1; k < placas; k++) { const yy = H - B - (hb * k) / (v / 10); cortes += `<line class="corte" x1="${x.toFixed(1)}" x2="${(x + w).toFixed(1)}" y1="${yy.toFixed(1)}" y2="${yy.toFixed(1)}"/>`; }
    g += `<g class="col${isT ? " today" : ""}"><rect class="b${isT ? " today" : ""}" x="${x.toFixed(1)}" y="${y(v).toFixed(1)}" width="${w.toFixed(1)}" height="${hb.toFixed(1)}" rx="3"/>${cortes}<title>${isT ? "Hoje" : dia}: ${v} toques</title></g>`;
    if (isT) g += `<text class="ax hoje" x="${x + w / 2}" y="${H - 9}" text-anchor="middle">Hoje</text><text class="vl" x="${x + w / 2}" y="${y(v) - 8}" text-anchor="middle">${v}</text>`;
    else if (i % 2 === 1 && i < data.length - 2) g += `<text class="ax" x="${x + w / 2}" y="${H - 9}" text-anchor="middle">${dia}</text>`;
  });
  $("chart").innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Toques por dia nos últimos 14 dias; hoje ${today}">${g}</svg>`;
  if (animar && !RM) animate("#chart g.col", { transform: ["scaleY(0)", "scaleY(1)"] }, { duration: 0.7, delay: stagger(0.035), ease: [0.2, 0.7, 0.2, 1] });
}

/* ---------- Etiquetas e planilha ---------- */

/** Folha A4 com as etiquetas: QR Code e aviso de NFC, para colar no aparelho junto com a tag. */
export function imprimirEtiquetas(slugs: string[]) {
  const ms = slugs.map(bySlug).filter((m): m is NonNullable<typeof m> => !!m);
  $("folha").innerHTML = ms.map((m) => `<div class="etq">
      <div class="etq-h"><span class="etq-logo">${icone("nfc")}</span><span>Toque<b>Fit</b></span><span class="etq-tag">${esc(m.tag)}</span></div>
      <b class="etq-n">${esc(m.name)}</b>
      ${qrSvg(linkDaTag(m.slug), "QR Code do " + esc(m.name))}
      <p class="etq-p">Encoste o celular aqui ou aponte a câmera para ver como usar o aparelho</p>
      <small class="etq-a">${esc(nomeAcademia())}</small></div>`).join("");
  document.body.classList.add("imprimindo");
  const fim = () => { document.body.classList.remove("imprimindo"); window.removeEventListener("afterprint", fim); };
  window.addEventListener("afterprint", fim);
  window.print();
}

/** Planilha com os números de cada aparelho (abre no Excel e no Google Planilhas). */
function baixarPlanilha() {
  const cel = (v: string | number) => { const t = String(v); return /[;"\n]/.test(t) ? `"${t.replace(/"/g, `""`)}"` : t; };
  const linhas = [["Aparelho", "Grupo", "Tag", "Vídeo", "Toques 7 dias", "Séries hoje", "Vídeos completos hoje", "Link"]]
    .concat(S.machines.map((m) => [m.name, m.group, m.tag, !m.video ? "Sem vídeo" : m.roteiro ? "Instrutora 3D" : "Com vídeo", String(m.t7), String(S.series[m.slug] || 0), String(S.fins[m.slug] || 0), linkDaTag(m.slug)]));
  // ponto e vírgula e BOM: é o que o Excel em português abre direto, com acentos
  const csv = "﻿" + linhas.map((l) => l.map(cel).join(";")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = `toquefit-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast("Planilha baixada");
}

/* ---------- Gaveta ---------- */
let editando: string | null = null, arquivo: File | null = null, abridor: HTMLElement | null = null, aberta = false;

function slugify(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "aparelho";
}

export function abrirGaveta(slug: string | null, de?: HTMLElement) {
  editando = slug; arquivo = null; abridor = de || null;
  const m = slug ? bySlug(slug) : null;
  $("dr-title").textContent = m ? m.name : "Novo aparelho";
  $("dr-save").textContent = m ? "Salvar aparelho" : "Cadastrar aparelho";
  $<HTMLInputElement>("f-name").value = m ? m.name : "";
  $<HTMLSelectElement>("f-group").value = m ? m.group : "Peito";
  $<HTMLInputElement>("f-adjust").value = m ? m.adjust : "";
  $<HTMLInputElement>("f-sets").value = m ? m.sets : "3 × 10–12";
  $<HTMLTextAreaElement>("f-steps").value = m ? m.steps.join("\n") : "";
  $<HTMLInputElement>("f-video").value = "";
  $("f-video-cur").textContent = m && m.video ? "Vídeo atual: " + (m.videoName || "vídeo.mp4") : "Nenhum vídeo enviado";
  $("f-link-wrap").hidden = !m;
  if (m) {
    $("f-link").textContent = linkDaTag(m.slug);
    $("f-qr").innerHTML = qrSvg(linkDaTag(m.slug), "QR Code do " + esc(m.name));
    $("f-print").onclick = () => imprimirEtiquetas([m.slug]);
  }
  $("f-name-err").hidden = true;
  $<HTMLInputElement>("f-name").removeAttribute("aria-invalid");
  const d = $("drawer"), sc = $("scrim");
  d.hidden = sc.hidden = false;
  aberta = true;
  document.body.classList.add("travado");
  $("view-painel").inert = true;
  if (RM) { d.style.transform = "none"; sc.style.opacity = "1"; }
  else {
    animate(sc, { opacity: [0, 1] }, { duration: 0.25 });
    animate(d, { transform: ["translateX(100%)", "translateX(0%)"] }, { type: "spring", bounce: 0, visualDuration: 0.38 });
  }
  setTimeout(() => $("f-name").focus(), RM ? 0 : 120);
}

export function fecharGaveta() {
  if (!aberta) return;
  aberta = false;
  const d = $("drawer"), sc = $("scrim");
  document.body.classList.remove("travado");
  $("view-painel").inert = false;
  const fim = () => { d.hidden = sc.hidden = true; };
  if (RM) fim();
  else {
    animate(sc, { opacity: 0 }, { duration: 0.22 });
    animate(d, { transform: "translateX(100%)" }, { duration: 0.28, ease: "easeIn" }).finished.then(fim);
  }
  if (abridor && document.body.contains(abridor)) abridor.focus();
}

export function ligarGaveta() {
  const nome = $<HTMLInputElement>("f-name"), err = $("f-name-err");
  const validar = () => { const ok = !!nome.value.trim(); err.hidden = ok; ok ? nome.removeAttribute("aria-invalid") : nome.setAttribute("aria-invalid", "true"); return ok; };
  nome.addEventListener("blur", validar);
  nome.addEventListener("input", () => { if (nome.value.trim()) validar(); });
  $<HTMLInputElement>("f-video").addEventListener("change", (e) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    arquivo = f || null;
    if (f) $("f-video-cur").textContent = "Novo vídeo: " + f.name;
  });
  $("f-copy").onclick = () => {
    const t = $("f-link").textContent || "";
    const sel = () => { const r = document.createRange(); r.selectNodeContents($("f-link")); const s = getSelection()!; s.removeAllRanges(); s.addRange(r); };
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => toast("Link copiado"), () => { sel(); toast("Selecionado. Use Ctrl+C para copiar"); });
    else sel();
  };
  $("dr-save").onclick = () => {
    if (!validar()) { nome.focus(); return; }
    const fields = {
      name: nome.value.trim(), group: $<HTMLSelectElement>("f-group").value,
      adjust: $<HTMLInputElement>("f-adjust").value.trim(), sets: $<HTMLInputElement>("f-sets").value.trim(),
      steps: $<HTMLTextAreaElement>("f-steps").value.split("\n").map((s) => s.trim()).filter(Boolean),
    };
    let m = editando ? bySlug(editando)! : null;
    if (m) Object.assign(m, fields);
    else {
      let s = slugify(fields.name);
      const base = s;
      let k = 2;
      while (bySlug(s)) s = base + "-" + k++;
      m = { slug: s, tag: "TF-A" + String(S.nextTag++).padStart(2, "0"), w: 0, video: false, dur: 0, rest: "", errs: [], t7: 0, videoName: "", ...fields };
      if (!m.steps.length) m.steps = ["Passo a passo ainda não cadastrado."];
      S.machines.push(m);
    }
    if (arquivo) {
      if (blobs[m.slug]) URL.revokeObjectURL(blobs[m.slug]);
      blobs[m.slug] = URL.createObjectURL(arquivo);
      m.video = true; m.videoName = arquivo.name;
      if (!m.dur) m.dur = 30;
    }
    save();
    const eraEdicao = !!editando, tinhaArquivo = !!arquivo;
    fecharGaveta();
    renderPainel(false);
    toast(eraEdicao ? (tinhaArquivo ? "Vídeo atualizado. Já aparece para os alunos" : "Aparelho salvo") : "Aparelho cadastrado com a tag " + m.tag);
  };
  $("dr-cancel").onclick = fecharGaveta;
  $("dr-x").onclick = fecharGaveta;
  $("scrim").onclick = fecharGaveta;
  document.addEventListener("keydown", (e) => {
    if (!aberta) return;
    if (e.key === "Escape") fecharGaveta();
    // mantém o foco dentro da gaveta
    if (e.key === "Tab") {
      const f = [...$("drawer").querySelectorAll<HTMLElement>("button, input, select, textarea, [tabindex]:not([tabindex='-1'])")].filter((x) => !x.hidden && x.offsetParent);
      const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { z.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === z) { a.focus(); e.preventDefault(); }
    }
  });
  $("add").onclick = (e) => abrirGaveta(null, e.currentTarget as HTMLElement);
  $("etiquetas").onclick = () => imprimirEtiquetas(S.machines.map((m) => m.slug));
  $("planilha").onclick = baixarPlanilha;
  let confirmar = false, tReset = 0;
  const bReset = $("reset");
  bReset.onclick = () => {
    if (!confirmar) {
      confirmar = true;
      bReset.textContent = "Confirmar: apagar alterações";
      bReset.classList.add("perigo");
      clearTimeout(tReset);
      tReset = window.setTimeout(() => { confirmar = false; bReset.textContent = "Restaurar exemplo"; bReset.classList.remove("perigo"); }, 4000);
      return;
    }
    confirmar = false;
    bReset.textContent = "Restaurar exemplo";
    bReset.classList.remove("perigo");
    Object.keys(blobs).forEach((k) => { URL.revokeObjectURL(blobs[k]); delete blobs[k]; });
    restaurar();
    esquecerAtual();
    renderPainel(true);
    toast("Dados de exemplo restaurados");
  };
}
