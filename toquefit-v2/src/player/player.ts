// Player do roteiro: relógio guiado pelo áudio, legenda, números de ênfase, cena 3D e controles.
import { animate } from "motion";
import { infoCena } from "../cena/catalogo";
import type { CenaRoteiro, Motor } from "../cena/motor";
import { Legenda } from "./legenda";
import { trechoEm, type Destaque, type Linha, type Trecho } from "./timeline";
import { icone } from "../ui/icones";
import { esc } from "../ui/util";

export interface OpcoesPlayer {
  linha: Linha;
  instrutora: string;
  selos?: Record<string, { tx: string; tom: "bad" | "good" }>;
  reduzido: boolean;
  /** roteiro gravado: abre a cena 3D da instrutora; sem ele, a pilha de anilhas */
  roteiro?: string;
  /** cartão no fim do vídeo: o que o aluno faz agora */
  fim?: { titulo: string; texto: string; proximo?: { texto: string; ir: () => void } };
  /** só para testes: usa a imagem estática no lugar da cena 3D */
  sem3d?: boolean;
  onTrecho?(tr: Trecho): void;
  onFim?(): void;
}

const mmss = (s: number) => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

let somLiberado = false; // depois do primeiro toque, a voz fica ligada nas próximas páginas

export function criarPlayer(host: HTMLElement, o: OpcoesPlayer) {
  const L = o.linha;
  const info = infoCena(o.roteiro);
  const temVoz = L.trechos.some((x) => x.audio);
  host.classList.add("player");
  host.innerHTML = `
    <div class="stage" data-loading>
      <div class="ov"></div>
      <div class="who"><b>${o.instrutora}</b></div>
      <span class="selo" hidden></span>
      <div class="big" aria-hidden="true"><span class="big-t"></span><i class="big-x"></i></div>
      <button class="ouvir" type="button" ${somLiberado || !temVoz ? "hidden" : ""}>${icone("som")}<span>Toque para ouvir a instrutora</span></button>
      <div class="carregando" role="status">
        <svg viewBox="0 0 160 70" aria-hidden="true">${info.desenho}</svg>
        <span class="c-t">${info.carregando}</span><span class="c-p num">0%</span>
      </div>
      <div class="replay" hidden>${icone("lento")} Replay em câmera lenta · 0,5×</div>
      ${o.fim ? `<div class="fim" hidden><b>${esc(o.fim.titulo)}</b><span>${esc(o.fim.texto)}</span><div class="fim-acts"><button class="btn sm" type="button" data-a="denovo">${icone("repetir")} Ver de novo</button>${o.fim.proximo ? `<button class="btn sm primary" type="button" data-a="proximo">${esc(o.fim.proximo.texto)}</button>` : ""}</div></div>` : ""}
    </div>
    <div class="ctl">
      <div class="bar" role="slider" tabindex="0" aria-label="Posição do vídeo" aria-valuemin="0" aria-valuemax="${Math.round(L.dur)}" aria-valuenow="0">
        <div class="bar-t"><i class="bar-f"></i></div>
        ${L.capitulos.slice(1).map((c) => `<span class="tick" style="left:${(c.t0 / L.dur) * 100}%"></span>`).join("")}
        <i class="bar-k"></i>
      </div>
      <div class="ctl-r">
        <button class="ib" data-a="play" type="button" aria-label="Pausar">${icone("pausa")}</button>
        <span class="tempo num"><span class="t-cur">0:00</span> / ${mmss(L.dur)}</span>
        <span class="sp"></span>
        <button class="ib" data-a="rep" type="button" aria-label="Repetir capítulo">${icone("repetir")}</button>
        <button class="ib txt" data-a="vel" type="button" aria-label="Velocidade 1×" aria-pressed="false">1×</button>
        <button class="ib txt" data-a="cc" type="button" aria-label="Legenda" aria-pressed="true">CC</button>
        ${temVoz ? `<button class="ib" data-a="som" type="button" aria-label="Voz da instrutora" aria-pressed="${somLiberado}">${icone(somLiberado ? "som" : "mudo")}</button>` : ""}
      </div>
    </div>`;
  const $ = <T extends HTMLElement = HTMLElement>(s: string) => host.querySelector(s) as T;
  const stage = $(".stage"), ov = $(".ov");
  const legenda = new Legenda(o.reduzido);
  host.insertBefore(legenda.el, $(".ctl"));

  // ---- estado ----
  let t = 0, tocando = false, vel = 1, som = somLiberado, cc = true, pronto = false, fim = false;
  let trAtual: Trecho | null = null;
  let destFeitos = new Set<string>();
  // um áudio por trecho, todos pré-carregados (são pequenos): trocar de trecho não recarrega nem busca no arquivo
  const vozes = new Map<string, HTMLAudioElement>();
  for (const tr of L.trechos) if (tr.audio) {
    const a = new Audio();
    a.preload = "auto";
    (a as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true;
    a.src = tr.audio;
    vozes.set(tr.id, a);
  }
  let voz: HTMLAudioElement = new Audio(); // o áudio do trecho atual

  // ---- cena 3D (three.js baixado só quando o player aparece na tela) ----
  let m: Motor | null = null;
  let cena: CenaRoteiro | null = null;
  /** libera a cena 3D da placa de vídeo quando o player sai da tela */
  let liberar: (() => void) | null = null;
  let destruido = false;
  const caixas = (sel: string[]) => {
    const sr = stage.getBoundingClientRect();
    return sel.map((s) => host.querySelector<HTMLElement>(s)).filter((e): e is HTMLElement => !!e && !e.hidden && !!e.offsetParent)
      .map((e) => { const r = e.getBoundingClientRect(); return { x: r.left - sr.left, y: r.top - sr.top, w: r.width, h: r.height }; });
  };
  const carreg = $(".carregando");
  const marcarPronto = (modo: string) => {
    if (destruido) return;
    pronto = true;
    stage.removeAttribute("data-loading");
    stage.dataset.modo = modo;
    if (o.reduzido) carreg.remove();
    else animate(carreg, { opacity: 0 }, { duration: 0.35 }).finished.then(() => carreg.remove());
    play();
  };
  // sem WebGL ou se algo falhar: imagem estática, nunca área vazia
  const estatica = () => {
    stage.insertAdjacentHTML("afterbegin", `<img class="estatica" src="${import.meta.env.BASE_URL}img/${info.estatica}" alt="">`);
    queueMicrotask(() => marcarPronto("estatico")); // depois que os controles abaixo existirem
  };
  const temWebGL = () => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } };
  if (o.sem3d || !temWebGL()) estatica();
  else {
    const io = new IntersectionObserver(async (es) => {
      if (!es.some((e) => e.isIntersecting)) return;
      io.disconnect();
      try {
        const mod = await import("../cena/carga");
        if (destruido) return;
        m = mod.motor();
        if (!m) { estatica(); return; }
        const criar = o.roteiro ? mod.CENAS[o.roteiro] : undefined;
        if (criar) {
          cena = criar({ linha: () => L, tempo: () => t, overlay: ov, reduzido: o.reduzido, evitar: () => caixas([".ouvir", ".selo", ".replay", ".who b", ".big.on"]) });
          if (import.meta.env.DEV) (window as unknown as { __cena: typeof cena }).__cena = cena;
          const minha = cena;
          liberar = () => mod.descartarCena(minha.scene);
          m.montar(stage, cena);
          const modo = await cena.carregar((p) => {
            $(".c-p").textContent = Math.round(p * 100) + "%";
            stage.style.setProperty("--prog", String(p));
          });
          // o aluno trocou de aparelho enquanto o modelo baixava: a instrutora que acabou de chegar também sai
          if (destruido) { liberar(); return; }
          marcarPronto(modo);
        } else {
          const pilha = mod.criarPilha({ tocando: () => tocando, reduzido: o.reduzido });
          liberar = () => mod.descartarCena(pilha.scene);
          m.montar(stage, pilha);
          marcarPronto("pilha");
        }
      } catch (e) {
        console.warn("[toquefit] cena 3D indisponível", e);
        m?.desmontar();
        estatica();
      }
    });
    io.observe(stage);
  }

  // ---- controles ----
  const bPlay = $("[data-a=play]"), bVel = $("[data-a=vel]"), bCc = $("[data-a=cc]"), bSom = $("[data-a=som]") || document.createElement("button"), bOuvir = $(".ouvir");
  const bar = $(".bar"), fill = $(".bar-f"), knob = $(".bar-k"), tCur = $(".t-cur");

  function setPlayIcon() {
    bPlay.innerHTML = icone(tocando ? "pausa" : fim ? "repetir" : "play");
    bPlay.setAttribute("aria-label", tocando ? "Pausar" : fim ? "Ver de novo" : "Tocar");
  }
  const cartaoFim = host.querySelector<HTMLElement>(".fim");
  function mostrarFim(v: boolean) {
    if (!cartaoFim || cartaoFim.hidden === !v) return;
    cartaoFim.hidden = !v;
    stage.classList.toggle("no-fim", v);
    if (v && !o.reduzido) animate(cartaoFim, { opacity: [0, 1], transform: ["translateY(14px) scale(.96)", "translateY(0px) scale(1)"] }, { type: "spring", bounce: 0.25, visualDuration: 0.45 });
  }
  function play() {
    if (!pronto) return;
    if (fim) { seek(0); fim = false; }
    mostrarFim(false);
    tocando = true;
    host.classList.add("tocando");
    setPlayIcon();
    syncVoz(true);
  }
  function pause() {
    tocando = false;
    host.classList.remove("tocando");
    voz.pause();
    setPlayIcon();
  }
  function seek(nt: number) {
    t = Math.max(0, Math.min(L.dur - 0.01, nt));
    fim = false;
    mostrarFim(false);
    destFeitos.clear(); // a janela de 1,5 s no laço impede que destaques antigos reapareçam
    esconderGrande();
    syncVoz(true);
    if (!tocando) m?.desenhar();
  }
  function ligarSom() {
    som = true;
    somLiberado = true;
    bSom.setAttribute("aria-pressed", "true");
    bSom.innerHTML = icone("som");
    // iPhone: cada elemento de áudio precisa tocar uma vez dentro do toque para ficar liberado
    const daVez = vozes.get(trechoEm(L, t).id);
    for (const a of vozes.values()) {
      if (a === daVez) continue;
      a.muted = true;
      a.play().then(() => { if (a !== voz) { a.pause(); a.currentTime = 0; } a.muted = false; }, () => { a.muted = false; });
    }
    if (!bOuvir.hidden) {
      if (o.reduzido) bOuvir.hidden = true;
      else animate(bOuvir, { opacity: 0, transform: "translate(-50%,-6px)" }, { duration: 0.25 }).finished.then(() => (bOuvir.hidden = true));
    }
    if (!tocando && pronto) play();
    syncVoz(true);
  }

  bPlay.onclick = () => (tocando ? pause() : play());
  bVel.onclick = () => {
    vel = vel === 1 ? 0.5 : 1;
    bVel.textContent = vel === 1 ? "1×" : "0,5×";
    bVel.setAttribute("aria-pressed", String(vel !== 1));
    bVel.setAttribute("aria-label", "Velocidade " + bVel.textContent);
    voz.playbackRate = vel;
  };
  bCc.onclick = () => {
    cc = !cc;
    bCc.setAttribute("aria-pressed", String(cc));
    host.classList.toggle("sem-cc", !cc);
  };
  bSom.onclick = () => {
    if (som) { som = false; voz.pause(); bSom.setAttribute("aria-pressed", "false"); bSom.innerHTML = icone("mudo"); }
    else ligarSom();
  };
  $("[data-a=rep]").onclick = () => {
    const c = L.capitulos.find((c) => t >= c.t0 && t < c.t1) || L.capitulos[0];
    seek(c.t0);
    if (!tocando) play();
  };
  bOuvir.onclick = ligarSom;
  // tocar no vídeo também libera a voz
  host.querySelector<HTMLElement>("[data-a=denovo]")?.addEventListener("click", play);
  host.querySelector<HTMLElement>("[data-a=proximo]")?.addEventListener("click", () => o.fim?.proximo?.ir());
  stage.addEventListener("pointerup", (e) => {
    if ((e.target as HTMLElement).closest("button")) return;
    if (!som && temVoz) ligarSom();
    else tocando ? pause() : play();
  });

  // barra de progresso arrastável
  const tDe = (x: number) => { const r = bar.getBoundingClientRect(); return ((x - r.left) / r.width) * L.dur; };
  bar.addEventListener("pointerdown", (e) => {
    bar.setPointerCapture(e.pointerId);
    seek(tDe(e.clientX));
    const mv = (ev: PointerEvent) => seek(tDe(ev.clientX));
    const up = () => { bar.removeEventListener("pointermove", mv); bar.removeEventListener("pointerup", up); };
    bar.addEventListener("pointermove", mv);
    bar.addEventListener("pointerup", up);
  });
  bar.addEventListener("keydown", (e) => {
    // espaço e K tocam/pausam, como nos players de vídeo
    if (e.key === " " || e.key === "k" || e.key === "K") { tocando ? pause() : play(); e.preventDefault(); return; }
    const passo = e.shiftKey ? 10 : 3;
    if (e.key === "ArrowRight") { seek(t + passo); e.preventDefault(); }
    else if (e.key === "ArrowLeft") { seek(t - passo); e.preventDefault(); }
    else if (e.key === "Home") { seek(0); e.preventDefault(); }
    else if (e.key === "End") { seek(L.dur); e.preventDefault(); }
  });

  // ---- voz sincronizada ----
  const vozDe = (tr: Trecho) => vozes.get(tr.id) === voz;
  let seekEm = 0;
  function syncVoz(forcar = false) {
    const tr = trechoEm(L, t), u = t - tr.t0 - tr.ini;
    const deve = som && tocando && !!tr.audio && u >= 0 && u < tr.fala - 0.04;
    const el = vozes.get(tr.id);
    if (!deve || !el) { if (!voz.paused) voz.pause(); return; }
    if (el !== voz) { voz.pause(); voz = el; forcar = true; }
    voz.playbackRate = vel;
    if (forcar && Math.abs(voz.currentTime - u) > 0.08) { voz.currentTime = u; seekEm = performance.now(); }
    if (voz.paused && (!voz.ended || forcar)) voz.play().catch(() => {});
  }

  // ---- números grandes ----
  const big = $(".big"), bigT = $(".big-t"), bigX = $(".big-x");
  let bigAnim: ReturnType<typeof animate> | null = null, bigAte = 0;
  function mostrarGrande(d: Destaque) {
    bigT.textContent = d.texto;
    big.className = "big on " + d.tom;
    const w = big.offsetWidth, h = big.offsetHeight, W = stage.clientWidth, H = stage.clientHeight;
    const evitar = caixas([".selo", ".ouvir", ".replay", ".who b", ".lbl[style*='opacity: 1']"]);
    const pos = cena?.pronto
      ? cena.livre([
        { x: W - w - 14, y: 54 }, { x: 14, y: 70 }, { x: W - w - 14, y: H * 0.34 }, { x: 14, y: H * 0.34 },
        { x: W - w - 14, y: H * 0.55 }, { x: 14, y: H * 0.55 }, { x: (W - w) / 2, y: 54 }, { x: W - w - 14, y: H - h - 14 }, { x: 14, y: H - h - 14 },
      ], w, h, 12, 50, evitar)
      : { x: W - w - 14, y: 54 };
    big.style.left = pos.x + "px";
    big.style.top = pos.y + "px";
    bigAte = performance.now() + 1700 / vel;
    bigAnim?.stop();
    if (o.reduzido) { big.style.opacity = "1"; return; }
    bigAnim = animate(big, { opacity: [0, 1], transform: ["scale(.82) translateY(10px)", "scale(1) translateY(0)"], filter: ["blur(6px)", "blur(0px)"] },
      { duration: 0.42, ease: [0.2, 0.8, 0.2, 1] });
    if (d.tom === "bad") animate(bigX, { transform: ["scaleX(0)", "scaleX(1)"] }, { duration: 0.32, delay: 0.3, ease: "easeOut" });
    else bigX.style.transform = "scaleX(0)";
  }
  function esconderGrande() {
    if (!big.classList.contains("on")) return;
    big.classList.remove("on");
    bigAnim?.stop();
    if (o.reduzido) { big.style.opacity = "0"; return; }
    bigAnim = animate(big, { opacity: 0, transform: "scale(1.04) translateY(-6px)", filter: "blur(4px)" }, { duration: 0.45, ease: "easeIn" });
  }

  const replayEl = $(".replay");

  // ---- selo certo/errado ----
  const selo = $(".selo");
  function mostrarSelo(tr: Trecho) {
    const s = o.selos?.[tr.id];
    if (!s) { if (!selo.hidden) { selo.hidden = true; } return; }
    selo.innerHTML = icone(s.tom === "bad" ? "x" : "check") + s.tx;
    selo.className = "selo " + s.tom;
    selo.hidden = false;
    if (o.reduzido) return;
    // certo entra com mola; errado chega com um tremor curto, como um "não" de cabeça
    if (s.tom === "good") animate(selo, { opacity: [0, 1], transform: ["scale(.6)", "scale(1)"] }, { type: "spring", bounce: 0.45, visualDuration: 0.35 });
    else animate(selo, { opacity: [0, 1, 1, 1, 1], transform: ["translateX(0)", "translateX(-6px)", "translateX(5px)", "translateX(-3px)", "translateX(0)"] }, { duration: 0.42, ease: "easeOut" });
  }

  // ---- laço da interface ----
  let last = performance.now(), raf = 0, audUlt = -1, audMexeu = 0, esperando = 0;
  const loop = (now: number) => {
    const dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    if (tocando && pronto) {
      // voz carregando: o vídeo espera (até 1,5 s), como um player de vídeo faz no buffer
      const trA = trechoEm(L, t);
      const espera = som && vozDe(trA) && !voz.paused && voz.readyState < 3;
      if (!espera) esperando = 0;
      if (espera && esperando < 1.5) esperando += dt;
      else t += dt * vel; // passou de 1,5 s: segue sem esperar mais a voz deste trecho
      // o áudio manda no relógio enquanto toca: a legenda acompanha a voz de verdade
      const tr = trechoEm(L, t);
      // (aparelho lento: o relógio salta para onde a voz está; diferença grande demais = áudio perdido, então ele volta ao relógio)
      const ct = voz.currentTime;
      if (ct !== audUlt) { audUlt = ct; audMexeu = now; }
      // só confia na voz enquanto ela está andando (áudio travado não pode segurar o vídeo)
      if (!voz.paused && !voz.ended && voz.readyState >= 2 && now - seekEm > 200 && now - audMexeu < 300 && vozDe(tr)) {
        const alvo = tr.t0 + tr.ini + voz.currentTime, dif = alvo - t;
        if (Math.abs(dif) > 0.8) { voz.currentTime = t - tr.t0 - tr.ini; seekEm = now; }
        else if (dif > 0 || dif < -0.08) t = alvo;
      }
      if (t >= L.dur) { t = L.dur - 0.01; tocando = false; fim = true; host.classList.remove("tocando"); voz.pause(); setPlayIcon(); mostrarFim(true); o.onFim?.(); }
      syncVoz();
    }
    const tr = trechoEm(L, t);
    if (tr !== trAtual) {
      trAtual = tr;
      legenda.definir(tr);
      mostrarSelo(tr);
      o.onTrecho?.(tr);
    }
    legenda.atualizar(t);
    const rp = tr.replay, uR = t - tr.t0;
    const emReplay = !!rp && uR >= rp.em && uR < rp.em + (rp.ate - rp.de) / rp.vel;
    if (emReplay !== !replayEl.hidden) {
      replayEl.hidden = !emReplay;
      stage.classList.toggle("em-replay", emReplay);
      if (emReplay && !o.reduzido) animate(replayEl, { opacity: [0, 1], transform: ["translateY(-6px)", "none"] }, { duration: 0.3 });
    }
    for (const d of tr.destaques) {
      const k = tr.id + ":" + d.grupo;
      if (d.grande && t >= d.t && t < d.t + 1.5 && !destFeitos.has(k)) { destFeitos.add(k); mostrarGrande(d); }
    }
    if (performance.now() > bigAte) esconderGrande();
    const f = t / L.dur;
    fill.style.transform = `scaleX(${f.toFixed(4)})`;
    knob.style.left = (f * 100).toFixed(2) + "%";
    tCur.textContent = mmss(t);
    bar.setAttribute("aria-valuenow", String(Math.round(t)));
    bar.setAttribute("aria-valuetext", `${mmss(t)} de ${mmss(L.dur)}, ${tr.ch}`);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  const vis = () => { if (document.hidden && tocando) { pause(); host.dataset.pausaAuto = "1"; } else if (!document.hidden && host.dataset.pausaAuto) { delete host.dataset.pausaAuto; play(); } };
  document.addEventListener("visibilitychange", vis);

  return {
    seek: (nt: number) => { seek(nt); if (!tocando) play(); },
    pausar: pause,
    linha: L,
    posicionar: (nt: number) => seek(nt),
    get t() { return t; },
    /** usado pelos testes: confere se o relógio está casado com a voz */
    estado: () => ({ t, tocando, som, vel, ct: voz.currentTime, rs: voz.readyState, sk: voz.seeking, pa: voz.paused, audio: voz.paused || voz.readyState < 3 || voz.seeking || !vozDe(trechoEm(L, t)) ? null : trechoEm(L, t).t0 + trechoEm(L, t).ini + voz.currentTime, src: voz.src.split("/").pop() }),
    destruir() {
      destruido = true;
      cancelAnimationFrame(raf);
      for (const a of vozes.values()) { a.pause(); a.removeAttribute("src"); a.load(); }
      document.removeEventListener("visibilitychange", vis);
      m?.desmontar();
      liberar?.();
    },
  };
}
