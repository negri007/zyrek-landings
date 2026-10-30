import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/figtree";
import "@fontsource-variable/jetbrains-mono";
import "./styles/app.css";
import "./styles/telas.css";
import { DADOS } from "./data/carregar";
import { S, bySlug } from "./estado";
import { pararAluno, renderAluno, slugAtual } from "./aluno";
import { ligarGaveta, renderPainel, fecharGaveta } from "./painel";
import { icone } from "./ui/icones";
import { $, RM, entrar, esc } from "./ui/util";

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
        <p class="hide-m">O aluno aproxima o celular da tag NFC do aparelho e o vídeo abre tocando, sem app e sem precisar rolar a tela. Escolha um aparelho para simular.</p>
      </div>
      <div class="mlist" id="mlist" role="group" aria-label="Aparelhos com tag"></div>
      <div class="linkbox hide-m"><span>Link gravado nesta tag termina em</span><code id="taglink">#m-supino-reto</code></div>
    </aside>
  </section>

  <section id="view-painel" class="painel" hidden aria-labelledby="painel-t">
    <div class="ph">
      <div>
        <h1 id="painel-t">${esc(DADOS.academia)}</h1>
      </div>
      <div class="acts">
        <button class="btn" type="button" id="reset">Restaurar exemplo</button>
        <button class="btn primary" type="button" id="add">Cadastrar aparelho</button>
      </div>
    </div>
    <div class="kpis" id="kpis"></div>
    <div class="grid">
      <div class="card chart"><div class="card-h"><h2>Toques por dia</h2><span>Últimos 14 dias</span></div><div id="chart"></div></div>
      <div class="card"><div class="card-h"><h2>Mais acessados</h2><span>7 dias</span></div><ul class="top" id="top"></ul></div>
      <div class="card"><div class="card-h"><h2>Aparelhos</h2><span id="mcount"></span></div>
        <div class="tbl-wrap"><table>
          <thead><tr><th scope="col">Aparelho</th><th scope="col">Tag</th><th scope="col">Vídeo</th><th scope="col">Toques 7 dias</th><th scope="col"><span class="sr">Ações</span></th></tr></thead>
          <tbody id="tbody"></tbody>
        </table></div>
      </div>
      <div class="card"><div class="card-h"><h2>Chamados</h2><span id="ccount"></span></div><ul class="calls" id="calls" aria-live="polite"></ul></div>
    </div>
    <p class="demo-note">Números de exemplo. Na versão real, cada academia entra com login próprio e vê só os dados dela.</p>
  </section>
</main>
<footer class="rodape gutter">Demonstração feita pela <b>Zyrek</b></footer>

<div class="scrim" id="scrim" hidden></div>
<aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-labelledby="dr-title" hidden>
  <div class="dr-h"><h2 id="dr-title">Editar aparelho</h2><button class="x" type="button" id="dr-x" aria-label="Fechar">${icone("fechar")}</button></div>
  <form class="dr-b" id="form" novalidate onsubmit="return false">
    <div class="f"><label for="f-name">Nome do aparelho</label><input type="text" id="f-name" autocomplete="off" aria-describedby="f-name-err"><span class="err" id="f-name-err" hidden>Digite o nome do aparelho.</span></div>
    <div class="f"><label for="f-group">Grupo muscular</label><select id="f-group">${GRUPOS.map((g) => `<option>${g}</option>`).join("")}</select></div>
    <div class="f"><label for="f-video">Vídeo explicativo</label>
      <div class="drop">${icone("enviar", "drop-ic")}<span class="cur" id="f-video-cur">Nenhum vídeo enviado</span><input type="file" id="f-video" accept="video/*"><span class="hint">Grave com o celular, de preferência com o instrutor. O vídeo aparece na hora para quem encostar na tag.</span></div></div>
    <div class="f"><label for="f-adjust">Ajuste antes de começar</label><input type="text" id="f-adjust" autocomplete="off" aria-describedby="h-adj"><span class="hint" id="h-adj">Ex.: Banco na posição 4</span></div>
    <div class="f"><label for="f-sets">Séries sugeridas</label><input type="text" id="f-sets" autocomplete="off" aria-describedby="h-sets"><span class="hint" id="h-sets">Ex.: 3 × 10–12</span></div>
    <div class="f"><label for="f-steps">Passo a passo</label><textarea id="f-steps" aria-describedby="h-steps"></textarea><span class="hint" id="h-steps">Um passo por linha.</span></div>
    <div class="f" id="f-link-wrap"><span class="lab">Link da tag</span><div class="linkbox"><code id="f-link"></code><button type="button" class="btn sm" id="f-copy">Copiar</button></div><span class="hint">Grave esse final junto com o link da demonstração na tag NFC.</span></div>
  </form>
  <div class="dr-f"><button class="btn" id="dr-cancel" type="button">Cancelar</button><button class="btn primary" id="dr-save" type="button">Salvar aparelho</button></div>
</aside>
<div class="toast" id="toast" role="status" aria-live="polite"></div>`;

ligarGaveta();

/* ---------- Rotas por hash: #m-<aparelho> e #painel ---------- */
let visao: "aluno" | "painel" | null = null;
function mostrar(v: "aluno" | "painel") {
  const a = $("view-aluno"), p = $("view-painel");
  a.hidden = v !== "aluno";
  p.hidden = v !== "painel";
  if (visao !== v) { entrar(v === "aluno" ? a : p.querySelector(".ph")!); visao = v; }
  $("tab-aluno").setAttribute("aria-current", v === "aluno" ? "page" : "false");
  $("tab-painel").setAttribute("aria-current", v === "painel" ? "page" : "false");
  $<HTMLAnchorElement>("tab-aluno").href = "#m-" + (slugAtual() || S.machines[0].slug);
}

function rota() {
  const h = location.hash.replace("#", "");
  fecharGaveta();
  if (h === "painel") {
    pararAluno();
    mostrar("painel");
    renderPainel(true);
    document.title = "Painel · ToqueFit";
    return;
  }
  let slug = h.startsWith("m-") ? h.slice(2) : null;
  if (!slug || !bySlug(slug)) slug = slugAtual() && bySlug(slugAtual()!) ? slugAtual()! : S.machines[0].slug;
  mostrar("aluno");
  document.title = bySlug(slug)!.name + " · ToqueFit";
  renderAluno(slug, true);
}
window.addEventListener("hashchange", rota);

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

rota();
