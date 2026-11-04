// Visão do aluno: o celular que abre ao encostar na tag NFC do aparelho.
import { animate, inView } from "motion";
import { DADOS, carregarRoteiro } from "./data/carregar";
import { S, blobs, bySlug, contarTreino, save, type Maquina } from "./estado";
import { criarPlayer } from "./player/player";
import { montarLinha } from "./player/timeline";
import { icone } from "./ui/icones";
import { $, RM, ago, esc, toast } from "./ui/util";
import { anilha, animarSeletor, animarSeries, barraSeries, cronometro, girarAnilha, lerAjuste, lerSeries, seletor } from "./ui/academia";
import { lerDescanso, ligarSeries } from "./ui/series";
import { cancelarChamado, criarChamado, salaAtual } from "./sala";

type Player = ReturnType<typeof criarPlayer>;
let player: Player | null = null;
let atual: string | null = null;
let geracao = 0;

export function pararAluno() {
  player?.destruir();
  player = null;
}

/** Roteiro simples para aparelhos sem roteiro gravado: um trecho por passo, sem voz. */
function linhaDePassos(m: Maquina) {
  const n = m.steps.length, por = Math.max(4, (m.dur || 30) / n);
  return montarLinha(
    m.steps.map((s, i) => ({ id: "p" + i, ch: "Passo " + (i + 1), cam: "", step: i, pausa: 0, say: s })),
    Object.fromEntries(m.steps.map((s, i) => [("p" + i), estimado(s, por)])),
    () => "",
  );
}
function estimado(s: string, dur: number) {
  // sem áudio: tempos por sílaba espalhados na duração do passo
  const ws = s.split(/\s+/), sil = ws.map((w) => Math.max(1, (w.match(/[aeiouáéíóúâêôãõà]+/gi) || []).length));
  const tot = sil.reduce((a, b) => a + b, 0), fala = dur * 0.8;
  let t = 0.3;
  return { dur, words: ws.map((w, i) => { const d = (fala * sil[i]) / tot; const r = { w, t, d }; t += d; return r; }) };
}

export async function renderAluno(slug: string, contarToque: boolean) {
  const m = bySlug(slug)!;
  const g = ++geracao;
  if (contarToque && slug !== atual) { m.t7++; S.extra++; save(); }
  atual = slug;
  pararAluno();
  const blob = blobs[slug];
  const temRoteiro = !!m.roteiro && m.video && !blob;
  const sc = $("p-scroll");
  sc.innerHTML = `
    <div class="p-head"><span class="gym">${esc(DADOS.academia)}</span><span class="p-head-r">${salaAtual() ? `<span class="ao-vivo-chip" title="Ligado ao painel da sala ${esc(salaAtual()!)}"><i aria-hidden="true"></i><span class="av-wait">Conectando</span><span class="av-ok">Ao vivo</span><span class="av-off">Sem conexão</span></span>` : ""}<span class="tagcode">${esc(m.tag)}</span></span></div>
    ${!m.video
      ? `<div class="player vazio"><div>${icone("nfc", "vazio-ic")}<b>Vídeo em gravação</b><p>A academia ainda está gravando este aparelho. Siga o passo a passo ou chame um instrutor.</p></div></div>`
      : blob
        ? `<div class="player"><video src="${blob}" controls playsinline autoplay muted preload="auto"></video></div>`
        : `<div id="player"></div>`}
    ${temRoteiro ? `<div class="chapters" id="chapters" role="group" aria-label="Capítulos"></div>` : ""}
    <div class="m-title"><h1>${esc(m.name)}</h1><span class="chip">${esc(m.group)}</span></div>
    ${m.video && !blob ? `<p class="note">${temRoteiro ? "Demonstração com instrutora 3D. Na versão real toca o vídeo gravado pela academia." : "Prévia da demonstração. Na versão real toca o vídeo gravado pela academia."}</p>` : ""}
    ${cartoes(m)}
    <section class="sec"><h2>Passo a passo</h2><ol class="steps" id="steps">${m.steps.map((s) => `<li><span>${esc(s)}</span></li>`).join("")}</ol></section>
    ${m.errs?.length ? `<section class="sec"><h2>Evite</h2><ul class="errs">${m.errs.map((e) => `<li>${esc(e)}</li>`).join("")}</ul></section>` : ""}
    <section class="sec" id="fbsec"><h2>Esse vídeo te ajudou?</h2><div class="fb"><button class="btn" type="button" data-fb="yes">Ajudou</button><button class="btn" type="button" data-fb="no">Não ajudou</button></div></section>
    <p class="p-foot">${esc(DADOS.academia)} · com tecnologia ToqueFit</p>`;
  tinhaChamado = false;
  desenharCta();
  sc.scrollTop = 0;
  revelar(sc);
  animarSeries(sc);
  animarSeletor(sc);
  const se = lerSeries(m.sets || "");
  if (se) ligarSeries(sc.querySelector<HTMLElement>(".peca.series")!, se.n, lerDescanso(m.rest || ""), () => { contarTreino("series", slug); renderLista(slug); });

  const fb = $("fbsec");
  const obrigado = () => {
    fb.innerHTML = `<h2>Esse vídeo te ajudou?</h2><p class="thanks">${icone("check")} Obrigado! Sua resposta vai para a academia.</p>`;
    if (!RM) animate(fb.querySelector(".thanks")!, { opacity: [0, 1], transform: ["translateY(4px)", "none"] }, { duration: 0.3 });
  };
  sc.querySelectorAll<HTMLButtonElement>("[data-fb]").forEach((b) => (b.onclick = () => {
    const sim = b.dataset.fb === "yes";
    S.help[sim ? "yes" : "no"]++;
    save();
    if (sim) return obrigado();
    // não ajudou: um toque diz o porquê, e a academia sabe o que regravar
    fb.innerHTML = `<h2>O que faltou?</h2><div class="motivos" role="group" aria-label="Motivo">${MOTIVOS.map((m) => `<button class="btn sm" type="button" data-mot="${esc(m)}">${esc(m)}</button>`).join("")}</div>`;
    fb.querySelectorAll<HTMLButtonElement>("[data-mot]").forEach((x) => (x.onclick = () => {
      S.motivos[x.dataset.mot!] = (S.motivos[x.dataset.mot!] || 0) + 1;
      save();
      obrigado();
    }));
    (fb.querySelector("[data-mot]") as HTMLElement).focus();
  }));
  $("taglink").textContent = "#m-" + slug;
  renderLista(slug);

  const host = document.getElementById("player");
  if (!host) return;
  const steps = [...document.querySelectorAll<HTMLLIElement>("#steps li")];
  const marcarPasso = (i: number) => { $("steps").classList.add("live"); steps.forEach((li, k) => li.classList.toggle("on", k === i)); };
  const sem3d = new URLSearchParams(location.search).has("sem3d");
  if (temRoteiro) {
    const r = await carregarRoteiro(m.roteiro!);
    if (!r || g !== geracao) return;
    const chs = $("chapters");
    chs.innerHTML = r.linha.capitulos.map((c) => `<button type="button" data-t="${c.t0}" aria-current="false">${esc(c.ch)}</button>`).join("");
    player = criarPlayer(host, {
      linha: r.linha, instrutora: r.instrutora, selos: r.selos, reduzido: RM, sem3d, roteiro: m.roteiro, fim: proximoPasso(m),
      onTrecho(tr) {
        marcarPasso(tr.step);
        const bts = [...chs.querySelectorAll<HTMLButtonElement>("button")];
        const idx = bts.findIndex((b) => b.textContent === tr.ch);
        // capítulos anteriores ficam marcados como vistos
        bts.forEach((b, k) => b.classList.toggle("visto", k < idx));
        bts.forEach((b) => {
          const on = b.textContent === tr.ch;
          if (on && b.getAttribute("aria-current") !== "true") {
            // rola só na horizontal (scrollIntoView também rolaria a tela do celular)
            chs.scrollTo({ left: b.offsetLeft - (chs.clientWidth - b.offsetWidth) / 2, behavior: RM ? "auto" : "smooth" });
            if (!RM) animate(b, { transform: ["scale(.94)", "scale(1)"] }, { type: "spring", bounce: 0.3, visualDuration: 0.3 });
          }
          b.setAttribute("aria-current", String(on));
        });
      },
      onFim() { steps.forEach((li) => li.classList.remove("on")); $("steps").classList.remove("live"); contarTreino("fins", slug); renderLista(slug); },
    });
    chs.querySelectorAll<HTMLButtonElement>("button").forEach((b) => (b.onclick = () => player?.seek(+b.dataset.t!)));
  } else {
    player = criarPlayer(host, {
      linha: linhaDePassos(m), instrutora: DADOS.instrutorPadrao, reduzido: RM, sem3d, fim: proximoPasso(m),
      onTrecho(tr) { marcarPasso(tr.step); },
      onFim() { steps.forEach((li) => li.classList.remove("on")); $("steps").classList.remove("live"); contarTreino("fins", slug); renderLista(slug); },
    });
  }
  if (import.meta.env.DEV) {
    // atalhos de teste: __ir("descida", "Desça") pausa e pula para a palavra (ou segundos) do trecho
    const w = window as unknown as { __player: Player; __ir: (id: string, k: string | number) => string };
    w.__player = player;
    w.__ir = (id, k) => {
      const p = player!, tr = p.linha.trechos.find((x) => x.id === id);
      if (!tr) return "trecho não existe: " + id;
      p.pausar();
      p.posicionar(tr.t0 + (typeof k === "string" ? tr.cue(k) : k));
      window.scrollTo({ top: 0, behavior: "instant" });
      return "ok";
    };
  }
}

/**
 * Blocos abaixo da dobra aparecem subindo quando o aluno rola até eles (uma vez só).
 * No computador quem rola é a tela do celular; no celular, a própria página.
 */
function revelar(sc: HTMLElement) {
  if (RM) return;
  const raiz = window.innerWidth > 820 ? sc : undefined;
  const limite = raiz ? sc.getBoundingClientRect().bottom : window.innerHeight;
  sc.querySelectorAll<HTMLElement>(":scope > .pecas, :scope > .sec, :scope > .p-foot").forEach((el) => {
    if (el.getBoundingClientRect().top < limite - 24) return; // já está à vista: fica como está
    el.style.opacity = "0";
    const parar = inView(el, () => {
      parar();
      animate(el, { opacity: [0, 1], transform: ["translateY(16px)", "none"] }, { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] });
    }, { root: raiz, amount: 0.2 });
  });
}

const MOTIVOS = ["O ajuste não ficou claro", "Rápido demais", "Meu aparelho é diferente", "Outro motivo"];

/** chamado do aluno neste aparelho; "sync" quando quem mudou foi o painel em outra aba */
let tinhaChamado = false;
const cancelados = new Set<string>();
export function desenharCta(origem: "local" | "sync" = "local") {
  const slug = atual;
  if (!slug) return;
  const c = S.calls.find((x) => x.slug === slug && !x.done);
  if (origem === "sync" && tinhaChamado && !c) toast("Seu chamado foi atendido");
  tinhaChamado = !!c;
  const cta = $("p-cta");
  // só anima quando o estado muda (não a cada troca de aparelho)
  const mudou = cta.dataset.estado !== undefined && cta.dataset.estado !== (c ? "espera" : "livre");
  cta.dataset.estado = c ? "espera" : "livre";
  const entrar = () => { if (mudou && !RM) animate(cta.firstElementChild!, { opacity: [0, 1], transform: ["scale(.96)", "scale(1)"] }, { type: "spring", bounce: 0.3, visualDuration: 0.35 }); };
  if (c) {
    cta.innerHTML = `<div class="cta-espera" role="status">${icone("check", "ce-ic")}<span><b>Instrutor avisado</b><small>Aguarde no aparelho · chamou ${ago(c.at)}</small></span><button class="btn sm" type="button" id="cancelar">Cancelar</button></div>`;
    $("cancelar").onclick = async () => {
      // pelo id: a consulta da sala (ou outra aba) troca os objetos da lista a cada poucos segundos
      S.calls = S.calls.filter((x) => x.id !== c.id);
      save();
      desenharCta();
      document.getElementById("call")?.focus();
      if (typeof c.id === "string" && c.id.startsWith("tmp-")) cancelados.add(c.id); // o servidor ainda vai responder
      if (!salaAtual() || typeof c.id !== "string" || c.id.startsWith("tmp-")) { toast("Chamado cancelado"); return; }
      try { await cancelarChamado(c.id); toast("Chamado cancelado"); }
      catch { toast("Sem conexão: o instrutor ainda vê o chamado"); }
    };
    cta.classList.toggle("tracar", mudou && !RM);
    entrar();
  } else {
    cta.innerHTML = `<button class="btn primary" type="button" id="call">${icone("chamar")} Chamar instrutor</button>`;
    $("call").onclick = async () => {
      // aparece na hora; com sala ao vivo, o servidor confirma em seguida
      const novo = { id: salaAtual() ? "tmp-" + Date.now() : S.nextCall++, slug, at: Date.now(), done: false };
      const tmp = novo.id;
      S.calls.unshift(novo);
      save();
      desenharCta();
      document.getElementById("cancelar")?.focus();
      if (!salaAtual()) { toast("Instrutor avisado"); return; }
      try {
        const doServidor = await criarChamado(slug);
        // o aluno cancelou enquanto o pedido estava no ar: apaga também no servidor
        if (cancelados.delete(String(tmp))) { void cancelarChamado(String(doServidor.id)).catch(() => {}); return; }
        // a consulta da sala pode ter trazido este mesmo chamado antes da resposta: não duplica
        if (S.calls.some((x) => x.id === doServidor.id)) S.calls = S.calls.filter((x) => x !== novo);
        else Object.assign(novo, doServidor);
        save();
        toast("Instrutor avisado");
      } catch {
        // não deixa o aluno esperando um instrutor que não foi avisado
        cancelados.delete(String(tmp));
        S.calls = S.calls.filter((x) => x.id !== tmp);
        save();
        desenharCta();
        toast("Sem conexão: o instrutor não foi avisado. Tente de novo");
      }
    };
    entrar();
  }
}

/** Cartão do fim do vídeo: a série que o aluno vai fazer agora. */
function proximoPasso(m: Maquina) {
  const se = lerSeries(m.sets || "");
  const texto = se ? `${se.n} séries de ${se.reps} repetições` : m.sets || "Siga o passo a passo abaixo";
  // próximo aparelho com vídeo na ordem da academia: o aluno segue o treino sem voltar à lista
  const lista = S.machines.filter((x) => x.video || x.slug === m.slug);
  const prox = lista[(lista.findIndex((x) => x.slug === m.slug) + 1) % lista.length];
  return {
    titulo: "Agora é com você",
    texto: m.rest ? `${texto} · descanso de ${m.rest}` : texto,
    proximo: prox && prox.slug !== m.slug ? { texto: "Próximo: " + prox.name, ir: () => tocarTag(prox.slug) } : undefined,
  };
}

/** Séries como anilhas na barra e ajuste como o pino seletor da máquina. */
function cartoes(m: Maquina) {
  const se = lerSeries(m.sets || ""), aj = lerAjuste(m.adjust || "");
  const series = se
    ? `<div class="peca series"><span class="k">Séries</span>
        ${barraSeries(se.n)}
        <p class="pv"><b class="num">${se.n}</b> séries</p>
        <p class="ps">de ${esc(se.reps)} repetições</p>
        ${m.rest ? `<p class="ps">${cronometro()}Descanso ${esc(m.rest)}</p>` : ""}
        <div class="serie-ctl" aria-live="polite"></div></div>`
    : `<div class="peca series"><span class="k">Séries</span><p class="pv"><b>${esc(m.sets || "—")}</b></p>${m.rest ? `<p class="ps">${cronometro()}Descanso ${esc(m.rest)}</p>` : ""}</div>`;
  const ajuste = aj
    ? `<div class="peca ajuste"><span class="k">Ajuste</span>
        ${seletor(aj.pos)}
        <p class="pv">${esc(aj.peca)} · posição <b class="num">${aj.pos}</b></p>
        ${aj.resto ? `<p class="ps">${esc(aj.resto.charAt(0).toUpperCase() + aj.resto.slice(1))}</p>` : ""}</div>`
    : `<div class="peca ajuste"><span class="k">Ajuste</span><p class="pv livre">${esc(m.adjust || "Sem ajuste")}</p></div>`;
  return `<div class="pecas">${series}${ajuste}</div>`;
}

/** o que o aluno já fez hoje: aparelho com série marcada ou vídeo visto até o fim */
const feitoHoje = (slug: string) => (S.series[slug] || 0) + (S.fins[slug] || 0) > 0;
function resumoHoje() {
  const feitos = S.machines.filter((m) => feitoHoje(m.slug)).length;
  const series = Object.values(S.series).reduce((a, b) => a + b, 0);
  const el = $("treino-hoje");
  el.hidden = !feitos;
  if (feitos) el.innerHTML = `${icone("check")}<span>Treino de hoje: <b>${feitos} ${feitos > 1 ? "aparelhos" : "aparelho"}</b>${series ? ` · ${series} ${series > 1 ? "séries" : "série"}` : ""}</span>`;
}

const jaFeitos = new Set<string>();
let listaPronta = false;
function renderLista(slug: string) {
  resumoHoje();
  const ml = $("mlist");
  ml.innerHTML = S.machines.map((m) => `<button class="mbtn${feitoHoje(m.slug) ? " feito" : ""}" type="button" data-go="${m.slug}" aria-current="${m.slug === slug}">
      ${anilha("mb-an")}<span class="mb-t"><b>${esc(m.name)}</b><small><span class="tg">${esc(m.tag)}</span> · ${esc(m.group)}${!m.video ? " · sem vídeo" : m.roteiro ? " · instrutora 3D" : ""}</small></span>${feitoHoje(m.slug) ? `<span class="mb-ok" title="Feito hoje">${icone("check")}<span class="sr">Feito hoje</span></span>` : ""}</button>`).join("");
  // aparelho que acabou de ser concluído: o ✓ entra com uma mola
  for (const m of S.machines) {
    if (!feitoHoje(m.slug) || jaFeitos.has(m.slug)) continue;
    jaFeitos.add(m.slug);
    const ok = ml.querySelector(`[data-go="${m.slug}"] .mb-ok`);
    if (listaPronta && ok && !RM) animate(ok, { transform: ["scale(0) rotate(-40deg)", "scale(1) rotate(0deg)"] }, { type: "spring", bounce: 0.45, visualDuration: 0.45 });
  }
  listaPronta = true;
  ml.querySelectorAll<HTMLButtonElement>("[data-go]").forEach((b) => (b.onclick = () => { girarAnilha(b.querySelector(".mb-an")); tocarTag(b.dataset.go!); }));
}

/** Simula a leitura da tag: anel NFC, depois abre o aparelho. */
export function tocarTag(slug: string) {
  if (slug === atual) return;
  const n = $("nfc"), m = bySlug(slug)!;
  $("nfc-t").innerHTML = `Tag ${esc(m.tag)} lida<small>Abrindo ${esc(m.name)}…</small>`;
  n.classList.remove("show");
  void n.offsetWidth;
  n.classList.add("show");
  if (window.innerWidth <= 820) window.scrollTo({ top: 0, behavior: RM ? "auto" : "smooth" });
  setTimeout(() => { location.hash = "m-" + slug; }, RM ? 0 : 520);
  setTimeout(() => n.classList.remove("show"), RM ? 300 : 1200);
}

export const slugAtual = () => atual;
export function esquecerAtual() { atual = null; }
