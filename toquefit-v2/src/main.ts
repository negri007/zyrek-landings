import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/figtree";
import "@fontsource-variable/jetbrains-mono";
import "./styles/app.css";
import "./styles/telas.css";
import "./styles/fichas.css";
import { CHAVE, S, bySlug, fresh, recarregar, save } from "./estado";
import { atendendo, entrarNaSala, sairDaSala, salaAtual, sincronizarSala } from "./sala";
import { definirOrigem, desenharCta, esquecerAtual, pararAluno, renderAluno, renderLista, slugAtual } from "./aluno";
import { aluno, instrutor, lerLinkDeAcesso, nomeAcademia } from "./conta";
import { editorEstaAberto, montarEditor, vigiarAlunos } from "./alunos";
import { renderMeuTreino } from "./meutreino";
import { ligarGaveta, renderPainel, fecharGaveta } from "./painel";
import { icone } from "./ui/icones";
import { animate } from "motion";
import { $, RM, entrar, esc, toast } from "./ui/util";

const GRUPOS = ["Peito", "Costas", "Pernas", "Ombros", "Braços", "Glúteos", "Abdômen", "Cardio"];

$("app").innerHTML = `
<div class="bg" aria-hidden="true"><div class="floor"></div></div>
<header class="demobar"><div class="demobar-in gutter">
  <div class="brand"><span class="logo">${icone("nfc")}</span><span>Toque<em>Fit</em></span></div>
  <nav class="tabs" aria-label="Visões da demonstração">
    <a class="tab" id="tab-aluno" href="#m-supino-reto">Celular do aluno</a>
    <a class="tab" id="tab-painel" href="#painel">Painel da academia</a>
  </nav>
  <span class="credit">Dados de exemplo</span>
</div></header>

<main class="wrap gutter">
  <section id="view-aluno" class="palco" hidden aria-label="Celular do aluno">
    <div class="phone-wrap"><div class="float">
      <div class="phone" id="phone">
        <div class="screen">
          <div class="notch" aria-hidden="true"></div>
          <div class="nfc" id="nfc" aria-hidden="true">
            <div>
              <div class="rings"><span></span><span></span><span></span>${icone("nfc", "nfc-ic")}</div>
              <p id="nfc-t">Tag lida<small>Abrindo aparelho…</small></p>
            </div>
          </div>
          <div class="p-scroll" id="p-scroll"></div>
          <div class="p-cta" id="p-cta"></div>
        </div>
      </div>
    </div></div>

    <aside class="aside">
      <div class="aside-h">
        <h2>Encostou o celular, o vídeo já começa</h2>
        <span class="aside-k">Outros aparelhos</span>
        <a class="btn sm so-m" href="#painel">Ver o painel da academia</a>
        <p class="hide-m">O aluno aproxima o celular da tag NFC do aparelho e o vídeo abre tocando, sem app e sem precisar rolar a tela. Escolha um aparelho para simular.</p>
      </div>
      <a class="meu-link" id="meu-link" href="#treino" hidden><b>Meu treino</b><span>A ficha que o instrutor montou para este aluno</span></a>
      <p class="treino-hoje" id="treino-hoje" aria-live="polite" hidden></p>
      <div class="mlist" id="mlist" role="group" aria-label="Aparelhos com tag"></div>
      <div class="linkbox hide-m"><span>Link gravado nesta tag termina em</span><code id="taglink">#m-supino-reto</code></div>
    </aside>
  </section>

  <section id="view-painel" class="painel" hidden aria-labelledby="painel-t">
    <div class="ph">
      <div>
        <p class="ph-vivo" id="ph-vivo" aria-live="polite"></p>
        <h1 id="painel-t">${esc(nomeAcademia())}</h1>
        <p class="ph-sub" id="ph-sub"></p>
      </div>
      <div class="acts">
        <button class="btn" type="button" id="av-ligar" hidden>${icone("nfc")} Testar no celular</button>
        <div class="mais" id="mais">
          <button class="btn" type="button" id="mais-b" aria-haspopup="true" aria-expanded="false" aria-controls="mais-m">Mais<span class="mais-seta" aria-hidden="true"></span></button>
          <div class="mais-m" id="mais-m" hidden>
            <button type="button" id="planilha">Baixar planilha</button>
            <button type="button" id="etiquetas">Imprimir etiquetas</button>
            <button type="button" id="reset">Restaurar exemplo</button>
          </div>
        </div>
        <button class="btn primary" type="button" id="add">Cadastrar aparelho</button>
      </div>
    </div>
    <section class="card ao-vivo" id="ao-vivo" aria-label="Teste com um celular de verdade"></section>
    <section class="card agora" aria-label="Precisa de atenção agora">
      <div class="ag-col">
        <div class="card-h"><h2>Alunos esperando instrutor</h2><span id="ccount"></span></div>
        <ul class="calls" id="calls" aria-live="polite"></ul>
      </div>
      <div class="ag-col">
        <div class="card-h"><h2>Aparelhos sem vídeo</h2><span id="vcount"></span></div>
        <ul class="calls pend" id="pend"></ul>
      </div>
    </section>
    <section class="card alunos" id="alunos" aria-label="Alunos e fichas"></section>
    <div class="kpis" id="kpis"></div>
    <div class="card chart"><div class="card-h"><h2>Toques por dia</h2><span>Últimos 14 dias</span></div><div id="chart"></div></div>
    <div class="card aparelhos"><div class="card-h"><h2>Aparelhos</h2><span id="mcount"></span></div>
      <div class="tbl-wrap"><table>
        <thead><tr><th scope="col">Aparelho</th><th scope="col">Tag</th><th scope="col">Toques 7 dias</th><th scope="col">Treino hoje</th><th scope="col"><span class="sr">Ações</span></th></tr></thead>
        <tbody id="tbody"></tbody>
      </table></div>
    </div>
    <p class="demo-note">Números de exemplo. Na versão real, cada academia entra com login próprio e vê só os dados dela.</p>
  </section>
</main>
<footer class="rodape gutter">Demonstração feita pela <b>Zyrek</b></footer>

<div class="scrim" id="scrim" hidden></div>
<aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-labelledby="dr-title" hidden>
  <div class="dr-h"><h2 id="dr-title">Editar aparelho</h2><button class="x" type="button" id="dr-x" aria-label="Fechar">${icone("fechar")}</button></div>
  <form class="dr-b" id="form" novalidate>
    <div class="f"><label for="f-name">Nome do aparelho</label><input type="text" id="f-name" autocomplete="off" aria-describedby="f-name-err"><span class="err" id="f-name-err" hidden>Digite o nome do aparelho.</span></div>
    <div class="f"><label for="f-group">Grupo muscular</label><select id="f-group">${GRUPOS.map((g) => `<option>${g}</option>`).join("")}</select></div>
    <div class="f"><label for="f-video">Vídeo explicativo</label>
      <div class="drop">${icone("enviar", "drop-ic")}<span class="cur" id="f-video-cur">Nenhum vídeo enviado</span><input type="file" id="f-video" accept="video/*"><span class="hint">Grave com o celular, de preferência com o instrutor. O vídeo aparece na hora para quem encostar na tag.</span></div></div>
    <div class="f"><label for="f-adjust">Ajuste antes de começar</label><input type="text" id="f-adjust" autocomplete="off" aria-describedby="h-adj"><span class="hint" id="h-adj">Ex.: Banco na posição 4</span></div>
    <div class="f"><label for="f-sets">Séries sugeridas</label><input type="text" id="f-sets" autocomplete="off" aria-describedby="h-sets"><span class="hint" id="h-sets">Ex.: 3 × 10–12</span></div>
    <div class="f"><label for="f-steps">Passo a passo</label><textarea id="f-steps" aria-describedby="h-steps"></textarea><span class="hint" id="h-steps">Um passo por linha.</span></div>
    <div class="f" id="f-link-wrap"><span class="lab">Tag e QR Code</span>
      <div class="tagqr"><div id="f-qr"></div><div class="tagqr-t"><div class="linkbox"><code id="f-link"></code></div><div class="tagqr-a"><button type="button" class="btn sm" id="f-copy">Copiar link</button><button type="button" class="btn sm" id="f-print">Imprimir etiqueta</button></div></div></div>
      <span class="hint">Grave esse link na tag NFC. O QR Code da etiqueta abre o mesmo vídeo em celulares sem NFC.</span></div>
  </form>
  <div class="dr-f"><button class="btn" id="dr-cancel" type="button">Cancelar</button><button class="btn primary" id="dr-save" type="button">Salvar aparelho</button></div>
</aside>
<div class="folha-etiquetas" id="folha" aria-hidden="true"></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>`;

ligarGaveta();
montarEditor();
// sem handler inline (a política de segurança da página bloqueia): Enter num campo da gaveta não recarrega a página
$("form").addEventListener("submit", (e) => e.preventDefault());

/* ---------- Rotas por hash: #m-<aparelho> e #painel ---------- */
let visao: "aluno" | "painel" | null = null;
/** troca de tela com View Transitions (a pílula da aba desliza, o conteúdo cruza); sem suporte, troca na hora */
let primeira = true, emTransicao = false;
function comTransicao(fn: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  const usar = !primeira && !RM && !!doc.startViewTransition;
  primeira = false;
  emTransicao = usar; // com transição, a entrada própria da tela não roda (seriam duas animações)
  if (usar) doc.startViewTransition!(fn);
  else fn();
}
function mostrar(v: "aluno" | "painel") {
  const a = $("view-aluno"), p = $("view-painel");
  a.hidden = v !== "aluno";
  document.documentElement.classList.toggle("app-aluno", v === "aluno");
  p.hidden = v !== "painel";
  if (visao !== v) { if (!emTransicao) entrar(v === "aluno" ? a : p.querySelector(".ph")!); visao = v; }
  $("tab-aluno").setAttribute("aria-current", v === "aluno" ? "page" : "false");
  $("tab-painel").setAttribute("aria-current", v === "painel" ? "page" : "false");
  $<HTMLAnchorElement>("tab-aluno").href = aluno() && !slugAtual() ? "#treino" : "#m-" + (slugAtual() || S.machines[0].slug);
  $("meu-link").hidden = !aluno();
  // com a área do aluno ativa, alunos e fichas são reais; só gráficos e toques continuam de exemplo
  document.querySelector(".credit")!.textContent = instrutor() ? "Gráficos de exemplo" : "Dados de exemplo";
  $("meu-link").setAttribute("aria-current", String(location.hash === "#treino"));
  vigiarAlunos(v === "painel");
}

// links curtos gravados nas tags (/N/A01) e nos QR das tampas (/Q/A01): abrem o aparelho e contam a origem
const curto = location.pathname.match(/^\/(n|q)\/([a-z0-9]+)\/?$/i);
if (curto) {
  const cod = curto[2].toUpperCase();
  const m = S.machines.find((x) => x.tag.toUpperCase().endsWith("-" + cod));
  definirOrigem(curto[1].toLowerCase() === "q" ? "qr" : "nfc");
  history.replaceState(null, "", "/#m-" + (m ? m.slug : S.machines[0].slug));
}

function rota() {
  // link pessoal aberto com a página já aberta (só o # muda, sem recarregar)
  if (location.hash.startsWith("#acesso=")) { lerLinkDeAcesso(); window.dispatchEvent(new Event("tf-aluno")); return; }
  // trocar de aparelho só mexe no conteúdo do celular; trocar de visão mexe na tela toda
  const vai = location.hash === "#painel" ? "painel" : "aluno";
  document.documentElement.classList.toggle("vt-aparelho", vai === visao);
  comTransicao(trocarTela);
}
function trocarTela() {
  const h = location.hash.replace("#", "");
  fecharGaveta();
  if (h === "painel") {
    pararAluno();
    mostrar("painel");
    renderPainel(true);
    return;
  }
  if (h === "treino") {
    // a ficha do aluno abre dentro do mesmo celular, no lugar da página do aparelho
    pararAluno();
    esquecerAtual();
    mostrar("aluno");
    document.title = "Meu treino · ToqueFit";
    renderMeuTreino();
    renderLista(""); // no computador, a lista ao lado simula encostar na tag de um aparelho
    return;
  }
  // app instalado (ou endereço sem #): aluno conectado abre direto na ficha dele
  if (!h && aluno()) { location.replace("#treino"); return; }
  let slug = h.startsWith("m-") ? h.slice(2) : null;
  if (!slug || !bySlug(slug)) slug = slugAtual() && bySlug(slugAtual()!) ? slugAtual()! : S.machines[0].slug;
  mostrar("aluno");
  document.title = bySlug(slug)!.name + " · ToqueFit";
  renderAluno(slug, true);
  // a aba volta para o aparelho que está aberto agora (mostrar() roda antes de ele ser trocado)
  $<HTMLAnchorElement>("tab-aluno").href = "#m-" + slug;
}
window.addEventListener("hashchange", rota);

/* os chamados mudaram fora desta página (outra aba ou a sala ao vivo): redesenha e avisa */
const pendentes = () => S.calls.filter((c) => !c.done).length;
function chamadosMudaram(antes: number) {
  const pend = pendentes();
  if (visao === "painel") {
    if (!document.getElementById("drawer")!.hidden || editorEstaAberto()) return; // não mexe no painel com uma gaveta aberta
    renderPainel(false);
    if (pend > antes) {
      toast("Novo chamado: aluno esperando instrutor");
      const li = document.querySelector<HTMLElement>("#calls .wait");
      if (li && !RM) animate(li, { backgroundColor: ["rgba(255, 181, 71, .22)", "rgba(255, 181, 71, 0)"] }, { duration: 1.6 });
    }
  } else desenharCta("sync");
}

/* celular do aluno e painel abertos em abas diferentes: o que um salva aparece no outro na hora */
window.addEventListener("storage", (e) => {
  if (e.key !== CHAVE) return;
  const antes = pendentes();
  recarregar();
  chamadosMudaram(antes);
});

/* sala ao vivo: celular e painel em aparelhos diferentes, pelo servidor (netlify/functions/chamados.mjs) */
let sincronia: ReturnType<typeof sincronizarSala> | null = null;
function ligarSala() {
  sincronia?.parar();
  sincronia = null;
  delete document.documentElement.dataset.conexao;
  if (!salaAtual()) return;
  sincronia = sincronizarSala((lista) => {
    const antes = pendentes();
    // o que o servidor manda vale, com duas exceções do que esta página fez e ainda não foi confirmado:
    // o atendimento em andamento (não pode voltar a "esperando") e o chamado recém-feito pelo aluno
    // (fica, a menos que a lista já traga o mesmo chamado do servidor)
    const doServidor = lista.map((c) => (atendendo.has(String(c.id)) ? { ...c, done: true } : c));
    const novos = S.calls.filter((c) => typeof c.id === "string" && c.id.startsWith("tmp-")
      && !doServidor.some((x) => !x.done && x.slug === c.slug && x.at >= c.at - 10e3));
    S.calls = [...novos, ...doServidor];
    save();
    chamadosMudaram(antes);
  }, (estado) => {
    document.documentElement.dataset.conexao = estado;
    if (visao === "painel" && document.getElementById("drawer")!.hidden && !editorEstaAberto()) renderPainel(false);
    else if (visao === "aluno") desenharCta();
  });
}
window.addEventListener("tf-sala", () => {
  // saiu da sala: volta para os chamados de exemplo
  if (!salaAtual()) { S.calls = fresh().calls; save(); }
  ligarSala();
  if (visao === "painel") renderPainel(false);
  else desenharCta();
});
/* academia com área do aluno: o código dela é a sala; o aluno conectado entra nela sozinho */
let codConta: string | null = null;
function salaDaConta() {
  const c = aluno()?.cod || instrutor()?.cod || null;
  // desconectou: sai da sala que era da academia (uma sala de teste aberta à mão continua)
  if (codConta && codConta !== c && salaAtual() === codConta) sairDaSala();
  if (c) entrarNaSala(c);
  codConta = c;
}
for (const ev of ["tf-academia", "tf-aluno"]) window.addEventListener(ev, () => {
  salaDaConta();
  $("painel-t").textContent = nomeAcademia();
  window.dispatchEvent(new Event("tf-sala"));
  rota();
});
salaDaConta();
ligarSala();

/* depois da primeira visita, a página e a instrutora abrem mesmo com o Wi-Fi da academia fraco */
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => { navigator.serviceWorker.register(import.meta.env.BASE_URL + "sw.js").catch(() => {}); });
}

/* inclinação 3D do celular no computador */
(() => {
  const palco = $("view-aluno"), ph = $("phone");
  let raf = 0;
  palco.addEventListener("pointermove", (e) => {
    if (RM || innerWidth <= 820 || e.pointerType !== "mouse") return;
    const r = ph.getBoundingClientRect();
    const cx = (e.clientX - (r.left + r.width / 2)) / innerWidth, cy = (e.clientY - (r.top + r.height / 2)) / innerHeight;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { ph.style.setProperty("--ry", (-8 + cx * 10).toFixed(2) + "deg"); ph.style.setProperty("--rx", (3 - cy * 6).toFixed(2) + "deg"); });
  });
  palco.addEventListener("pointerleave", () => { ph.style.setProperty("--ry", "-8deg"); ph.style.setProperty("--rx", "3deg"); });
})();

/* no celular, o primeiro toque na tela do aluno esconde as barras do navegador (Android; o iPhone não deixa) */
(() => {
  const celular = matchMedia("(max-width: 820px) and (pointer: coarse)");
  const doc = document.documentElement;
  const imersivo = () => {
    if (!celular.matches || visao !== "aluno" || document.fullscreenElement || !document.fullscreenEnabled || !doc.requestFullscreen) return;
    document.removeEventListener("click", imersivo, true);
    doc.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
  };
  document.addEventListener("click", imersivo, true);
})();

rota();
