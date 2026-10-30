// Peças de academia desenhadas em SVG: anilha, barra carregada, pino seletor e cronômetro.
// Cada uma carrega um dado de verdade (séries, posição do ajuste, toques), não é enfeite.
import { animate, stagger } from "motion";
import { RM } from "./util";

/** Anilha vista de frente: aro, sulco, cubo e as três pegadas vazadas. */
export function anilha(cls = "") {
  return `<svg class="anilha ${cls}" viewBox="0 0 40 40" aria-hidden="true">
    <circle class="an-corpo" cx="20" cy="20" r="19"/>
    <circle class="an-aro" cx="20" cy="20" r="16.2"/>
    <path class="an-pega" d="M20 6.2a2.3 2.3 0 0 1 0 4.6a2.3 2.3 0 0 1 0-4.6zM8.1 27a2.3 2.3 0 0 1 4 -2.3a2.3 2.3 0 0 1-4 2.3zM31.9 27a2.3 2.3 0 0 0-4-2.3a2.3 2.3 0 0 0 4 2.3z"/>
    <circle class="an-cubo" cx="20" cy="20" r="6.4"/>
    <circle class="an-furo" cx="20" cy="20" r="3.1"/>
  </svg>`;
}

/** Lê "3 × 8–12" como 3 séries de 8–12 repetições. */
export function lerSeries(s: string) {
  const m = s.match(/^\s*(\d+)\s*[×x]\s*(.+)$/i);
  return m ? { n: Math.min(6, +m[1]), reps: m[2].trim() } : null;
}

/** Barra vista de lado com uma anilha por série, presa pela trava. */
export function barraSeries(n: number) {
  const pl = Array.from({ length: n }, (_, i) => `<rect class="pl" x="${70 + i * 11}" y="${6 + (i % 2) * 0}" width="9" height="40" rx="2"/>`).join("");
  const trava = 70 + n * 11 + 1;
  return `<svg class="barra-series" viewBox="0 0 150 52" aria-hidden="true">
    <rect class="eixo" x="0" y="23" width="150" height="6" rx="2"/>
    <rect class="recart" x="4" y="23" width="44" height="6"/>
    <rect class="colar" x="60" y="14" width="7" height="24" rx="1.5"/>
    ${pl}
    <rect class="trava" x="${trava}" y="17" width="6" height="18" rx="1.5"/>
  </svg>`;
}

/** Lê "Banco na posição 3 · pés…" como posição 3 do banco, e o resto como observação. */
export function lerAjuste(s: string) {
  const m = s.match(/^(.*?)\s*(?:na\s+)?(posição|altura|nível)\s*(\d+)\s*(?:·\s*(.*))?$/i);
  if (!m) return null;
  return { peca: m[1].trim() || "Ajuste", pos: +m[3], resto: (m[4] || "").trim() };
}

/** Régua de furos numerados com o pino na posição certa. */
export function seletor(pos: number, total = Math.max(8, pos + 1)) {
  const w = 132, gap = w / (total - 1);
  const furos = Array.from({ length: total }, (_, i) => {
    const x = 6 + i * gap, on = i + 1 === pos;
    return `<circle class="furo${on ? " on" : ""}" cx="${x}" cy="14" r="3.2"/><text class="fn${on ? " on" : ""}" x="${x}" y="34">${i + 1}</text>`;
  }).join("");
  const px = 6 + (pos - 1) * gap;
  return `<svg class="seletor" viewBox="0 0 144 38" aria-hidden="true">
    <rect class="trilho" x="0" y="7" width="144" height="14" rx="3"/>
    ${furos}
    <g class="pino" style="--px:${px}px"><rect x="${px - 2.2}" y="-2" width="4.4" height="17" rx="2"/><circle cx="${px}" cy="-4" r="4.4"/></g>
  </svg>`;
}

/** Cronômetro de descanso: o ponteiro dá uma volta quando o cartão aparece. */
export function cronometro() {
  return `<svg class="crono" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13.5" r="8"/><path d="M10 3h4M12 3v2.5M18.5 7l1.4-1.4"/><path class="ponteiro" d="M12 13.5V9"/></svg>`;
}

/** Barra olímpica com anilhas dos dois lados (painel: cada anilha = um tanto de toques). */
export function barraCarregada(porLado: number) {
  const n = Math.max(0, Math.min(6, porLado));
  const lado = (s: 1 | -1) => Array.from({ length: n }, (_, i) => {
    const x = s > 0 ? 196 + i * 9 : 84 - 7 - i * 9, h = 44 - Math.max(0, i - 3) * 6;
    return `<rect class="pl ${s > 0 ? "d" : "e"}" x="${x}" y="${30 - h / 2}" width="7" height="${h}" rx="1.5"/>`;
  }).join("");
  return `<svg class="barra-carregada" viewBox="0 0 280 60" aria-hidden="true">
    <rect class="eixo" x="6" y="27" width="268" height="6" rx="2"/>
    <rect class="recart" x="104" y="27" width="72" height="6"/>
    <rect class="colar" x="84" y="20" width="6" height="20" rx="1.5"/><rect class="colar" x="190" y="20" width="6" height="20" rx="1.5"/>
    ${lado(-1)}${lado(1)}
  </svg>`;
}

/* ---------- animações de entrada (uma por peça, curtas) ---------- */
const EASE = [0.2, 0.8, 0.2, 1] as const;

export function animarSeries(root: ParentNode) {
  if (RM) return;
  const pls = root.querySelectorAll(".barra-series .pl");
  if (pls.length) animate(pls, { transform: ["translateX(46px)", "translateX(0)"], opacity: [0, 1] }, { type: "spring", bounce: 0.25, visualDuration: 0.42, delay: stagger(0.09, { startDelay: 0.25 }) });
  const tr = root.querySelector(".barra-series .trava");
  if (tr) animate(tr, { transform: ["translateX(40px)", "translateX(0)"], opacity: [0, 1] }, { duration: 0.3, delay: 0.3 + pls.length * 0.09, ease: EASE });
  const p = root.querySelector(".crono .ponteiro");
  if (p) animate(p, { transform: ["rotate(0deg)", "rotate(360deg)"] }, { duration: 1.1, delay: 0.3, ease: EASE });
}

export function animarSeletor(root: ParentNode) {
  if (RM) return;
  const p = root.querySelector(".seletor .pino");
  if (p) animate(p, { transform: ["translateY(-16px)", "translateY(0)"], opacity: [0, 1] }, { type: "spring", bounce: 0.45, visualDuration: 0.45, delay: 0.35 });
}

export function animarBarraCarregada(root: ParentNode) {
  if (RM) return;
  const e = root.querySelectorAll(".barra-carregada .pl.e"), d = root.querySelectorAll(".barra-carregada .pl.d");
  const op = { type: "spring" as const, bounce: 0.2, visualDuration: 0.4 };
  if (e.length) animate(e, { transform: ["translateX(-60px)", "translateX(0)"], opacity: [0, 1] }, { ...op, delay: stagger(0.08, { startDelay: 0.2 }) });
  if (d.length) animate(d, { transform: ["translateX(60px)", "translateX(0)"], opacity: [0, 1] }, { ...op, delay: stagger(0.08, { startDelay: 0.2 }) });
}

/** Gira a anilha da tag quando o aluno encosta. */
export function girarAnilha(el: Element | null) {
  if (!el || RM) return;
  animate(el, { transform: ["rotate(0deg)", "rotate(300deg)"] }, { type: "spring", bounce: 0.2, visualDuration: 0.7 });
}
