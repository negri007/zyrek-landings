import { animate } from "motion";

export const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
export const esc = (s: unknown) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
export const fmt = (n: number) => n.toLocaleString("pt-BR");
export const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;

export function ago(t: number) {
  const m = Math.max(0, Math.round((Date.now() - t) / 60e3));
  if (m < 1) return "agora";
  if (m < 60) return "há " + m + " min";
  return "há " + Math.round(m / 60) + " h";
}

let toastT = 0;
export function toast(msg: string) {
  const t = $("toast");
  t.textContent = msg;
  clearTimeout(toastT);
  if (RM) t.style.opacity = "1";
  else animate(t, { opacity: [0, 1], transform: ["translate(-50%, 14px)", "translate(-50%, 0)"] }, { type: "spring", bounce: 0.15, visualDuration: 0.35 });
  toastT = window.setTimeout(() => {
    if (RM) t.style.opacity = "0";
    else animate(t, { opacity: 0, transform: "translate(-50%, 8px)" }, { duration: 0.25, ease: "easeIn" });
  }, 2600);
}

/** contagem dos números do painel */
export function contar(el: HTMLElement, ate: number, sufixo = "") {
  if (RM) { el.textContent = fmt(ate) + sufixo; return; }
  animate(0, ate, { duration: 0.9, ease: [0.2, 0.7, 0.2, 1], onUpdate: (v) => (el.textContent = fmt(Math.round(v)) + sufixo) });
}

/** entrada curta de uma tela ou bloco */
export function entrar(el: Element, atraso = 0) {
  if (RM) return;
  animate(el, { opacity: [0, 1], transform: ["translateY(10px)", "none"] }, { duration: 0.42, delay: atraso, ease: [0.2, 0.7, 0.2, 1] });
}
