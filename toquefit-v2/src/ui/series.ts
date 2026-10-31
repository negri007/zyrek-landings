// Contador de séries no celular do aluno: cada série feita tira uma anilha da barra e abre o descanso.
// Fica só na página aberta (é a sessão de treino daquele aparelho, não vai para o painel).
import { animate } from "motion";
import { RM, toast } from "./util";

/** "60 a 90 s" → 60; "2 min" → 120. Sem número, 60 s. */
export function lerDescanso(s: string) {
  const m = s.match(/(\d+)\s*(?:a\s*\d+\s*)?(s|seg|min)/i);
  if (!m) return 60;
  return m[2].toLowerCase().startsWith("min") ? +m[1] * 60 : +m[1];
}

const mmss = (s: number) => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
const ordinal = (i: number) => `${i}ª`;

/** Liga o cartão de séries: `card` contém a .barra-series e o .serie-ctl. */
export function ligarSeries(card: HTMLElement, n: number, descanso: number, aoMarcar?: () => void) {
  const ctl = card.querySelector<HTMLElement>(".serie-ctl");
  const pls = [...card.querySelectorAll<SVGRectElement>(".barra-series .pl")];
  if (!ctl || !pls.length) return;
  let feitas = 0, timer = 0;

  const botao = (txt: string, extra = "") => `<button class="btn sm primary" type="button" data-serie ${extra}>${txt}</button>`;
  function pronto() {
    ctl!.innerHTML = feitas >= n
      ? `<p class="serie-ok">Séries concluídas</p>`
      : botao(`Fiz a ${ordinal(feitas + 1)} série`);
    ctl!.querySelector<HTMLButtonElement>("[data-serie]")?.addEventListener("click", marcar);
  }

  function marcar() {
    const pl = pls[pls.length - 1 - feitas];
    feitas++;
    aoMarcar?.();
    // a anilha da série feita sai da barra, de fora para dentro, como no aparelho
    pl.classList.add("feita");
    if (!RM) animate(pl, { transform: ["translateX(0)", "translateX(14px)"], opacity: [1, 0.16] }, { type: "spring", bounce: 0.2, visualDuration: 0.4 });
    if (feitas >= n) { pronto(); toast("Séries concluídas. Bom treino!"); return; }
    descansar();
  }

  function descansar() {
    const fim = Date.now() + descanso * 1000;
    ctl!.innerHTML = `<p class="desc-t"><span>Descanso</span><b class="num">${mmss(descanso)}</b></p>
      <div class="desc-barra" aria-hidden="true"><i></i></div>
      <button class="btn sm" type="button" data-pular>Pular descanso</button>`;
    const t = ctl!.querySelector<HTMLElement>(".desc-t b")!, barra = ctl!.querySelector<HTMLElement>(".desc-barra i")!;
    ctl!.querySelector<HTMLButtonElement>("[data-pular]")!.addEventListener("click", acabou);
    const passo = () => {
      // a página trocou de aparelho: para o relógio
      if (!ctl!.isConnected) { clearInterval(timer); return; }
      const resta = Math.max(0, Math.ceil((fim - Date.now()) / 1000));
      t.textContent = mmss(resta);
      barra.style.transform = `scaleX(${(resta / descanso).toFixed(3)})`;
      if (resta <= 0) { acabou(); navigator.vibrate?.([120, 80, 120]); toast(`Bora para a ${ordinal(feitas + 1)} série`); }
    };
    clearInterval(timer);
    timer = window.setInterval(passo, 250);
    passo();
  }

  function acabou() {
    clearInterval(timer);
    pronto();
  }

  pronto();
}
