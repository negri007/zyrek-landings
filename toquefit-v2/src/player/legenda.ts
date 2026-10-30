// Legenda karaokê: frase em até 2 linhas, palavra falada acesa, ditas em branco, próximas em cinza.
// Termos marcados no roteiro entram com escala, peso e cor por significado.
import { animate } from "motion";
import type { Trecho } from "./timeline";

export class Legenda {
  readonly el: HTMLDivElement;
  private linhas: HTMLParagraphElement;
  private cursor: HTMLElement;
  private spans: HTMLSpanElement[] = [];
  private pagina: number[] = [];
  private trecho: Trecho | null = null;
  private atual = -2;
  private paginaAtual = -1;
  private acesos = new Set<number>();

  constructor(private reduzido: boolean) {
    this.el = document.createElement("div");
    this.el.className = "cap";
    this.el.innerHTML = `<p class="cap-l" aria-hidden="true"></p><i class="cap-cur" aria-hidden="true"></i><p class="sr" aria-live="polite"></p>`;
    this.linhas = this.el.querySelector(".cap-l")!;
    this.cursor = this.el.querySelector(".cap-cur")!;
    let larg = 0;
    new ResizeObserver(() => {
      const w = this.linhas.clientWidth;
      if (w && w !== larg) { larg = w; this.paginar(); }
    }).observe(this.linhas);
  }

  definir(tr: Trecho) {
    if (this.trecho === tr) return;
    this.trecho = tr;
    this.atual = -2;
    this.paginaAtual = -1;
    this.acesos.clear();
    this.linhas.textContent = "";
    this.spans = tr.palavras.map((p) => {
      const s = document.createElement("span");
      s.className = "w" + (p.tom ? ` em ${p.tom}` : "");
      if (p.tom) {
        s.dataset.w = p.w;
        s.innerHTML = `<b>${esc(p.w)}</b>`;
      } else s.textContent = p.w;
      this.linhas.append(s, " ");
      return s;
    });
    (this.el.querySelector(".sr") as HTMLElement).textContent = tr.palavras.map((p) => p.w).join(" ");
    this.paginar();
    this.cursor.style.opacity = "0";
  }

  /** Divide a frase em páginas de até 2 linhas, medindo a quebra real no tamanho atual. */
  private paginar() {
    if (!this.spans.length) return;
    for (const s of this.spans) s.hidden = false;
    // tolerância de meia linha: termos destacados (inline-grid) têm topo um pouco diferente
    const meia = parseFloat(getComputedStyle(this.linhas).lineHeight) / 2 || 10;
    let top = -1e9, linha = -1;
    this.pagina = this.spans.map((s) => {
      if (s.offsetTop > top + meia) { top = s.offsetTop; linha++; }
      return Math.floor(linha / 2);
    });
    this.paginaAtual = -1;
    this.mostrarPagina(Math.max(0, this.pagina[Math.max(0, this.atual)] ?? 0));
  }

  private mostrarPagina(p: number) {
    if (p === this.paginaAtual) return;
    const primeira = this.paginaAtual === -1;
    this.paginaAtual = p;
    this.spans.forEach((s, i) => (s.hidden = this.pagina[i] !== p));
    if (!primeira && !this.reduzido) animate(this.linhas, { opacity: [0, 1], transform: ["translateY(6px)", "none"] }, { duration: 0.28, ease: "easeOut" });
  }

  atualizar(t: number) {
    const tr = this.trecho;
    if (!tr) return;
    const ps = tr.palavras;
    let i = -1;
    for (let k = 0; k < ps.length; k++) if (t >= ps[k].t - 0.04) i = k;
    // depois da última palavra, ela continua acesa por um instante
    const fimFala = i >= 0 ? ps[i].t + ps[i].d + 0.25 : 0;
    const falando = i >= 0 && (i < ps.length - 1 || t < fimFala);
    const atual = falando ? i : i >= 0 ? ps.length : -1;
    if (atual === this.atual) return;
    this.atual = atual;
    for (let k = 0; k < this.spans.length; k++) {
      const s = this.spans[k];
      const est = k < atual ? "said" : k === atual ? "now" : "next";
      if (s.dataset.s !== est) { s.dataset.s = est; }
      if (k <= atual && ps[k].tom && !this.acesos.has(k)) {
        this.acesos.add(k);
        if (!this.reduzido) animate(s.firstElementChild as HTMLElement, { transform: ["scale(1)", "scale(1.16)", "scale(1)"] }, { duration: 0.5, ease: "easeOut" });
      }
    }
    const pg = this.pagina[Math.min(Math.max(atual, 0), ps.length - 1)] ?? 0;
    this.mostrarPagina(pg);
    this.moverCursor(atual < ps.length ? this.spans[atual] : null);
  }

  private moverCursor(s: HTMLSpanElement | null) {
    const c = this.cursor;
    if (!s || s.hidden) { c.style.opacity = "0"; return; }
    const x = s.offsetLeft, y = s.offsetTop + s.offsetHeight - 2, w = s.offsetWidth;
    const alvo = `translate(${x}px,${y}px) scaleX(${(w / 100).toFixed(3)})`;
    const era = c.style.opacity === "1";
    c.style.opacity = "1";
    if (this.reduzido || !era) { c.style.transform = alvo; return; }
    animate(c, { transform: alvo }, { duration: 0.16, ease: "easeOut" });
  }

  limpar() {
    this.trecho = null;
    this.linhas.textContent = "";
    this.spans = [];
    this.cursor.style.opacity = "0";
  }
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
