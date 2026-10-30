// Pequenas funções de animação usadas pelas coreografias.
import * as THREE from "three";

export type V3 = THREE.Vector3;
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const easeIO = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const cl = (k: number) => Math.max(0, Math.min(1, k));
/** 0 → 1 com easing entre os tempos a e b */
export const seg = (u: number, a: number, b: number) => easeIO(cl((u - a) / Math.max(1e-3, b - a)));
/** Uma repetição: desce em d, segura h, sobe em up. Devolve 0 (em cima) → 1 (embaixo) → 0. */
export function rep(u: number, d: number, h: number, up: number) {
  if (u < 0) return 0;
  if (u < d) return easeIO(u / d);
  if (u < d + h) return 1;
  if (u < d + h + up) return 1 - easeIO((u - d - h) / up);
  return 0;
}
/** Aproxima `atual` de `alvo` de forma independente da taxa de quadros. */
export const suave = (atual: number, alvo: number, dt: number, vel: number, reduzido: boolean) =>
  reduzido ? alvo : atual + (alvo - atual) * (1 - Math.exp(-dt * vel));
/** Repetições seguidas: sobe em `up`, segura `top`, desce em `down`, descansa `pausa`. Devolve 0 → 1 → 0. */
export function ciclo(u: number, up: number, top: number, down: number, pausa = 0.3) {
  const per = up + top + down + pausa, k = ((u % per) + per) % per;
  if (k < up) return seg(k, 0, up);
  if (k < up + top) return 1;
  if (k < up + top + down) return 1 - seg(k, up + top, up + top + down);
  return 0;
}
