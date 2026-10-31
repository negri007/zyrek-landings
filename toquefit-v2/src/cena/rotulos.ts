// Rótulos em HTML sobre a cena 3D, posicionados para não cobrir braços, pernas, rosto nem a interface do player.
import * as THREE from "three";
import type { V3 } from "./util3d";

export interface Rotulo<P = V3> { tx: string; at: P; tom?: "bad" | "good" | "dim" }
export interface Segmento { ax: number; ay: number; bx: number; by: number }
export interface Caixa { x: number; y: number; w: number; h: number }

export interface OpcoesRotulos {
  overlay: HTMLElement;
  camera: THREE.Camera;
  /** grupo do aparelho: os pontos são dados nas coordenadas locais dele */
  raiz: THREE.Object3D;
  /** partes do corpo e do aparelho que os rótulos não podem cobrir, em pares de pontos locais */
  obstaculos(): { a: V3; b: V3 }[];
  /** caixas da interface por cima do vídeo (aviso, selos) que também devem ficar livres */
  evitar?: () => Caixa[];
}

export function criarRotulos(o: OpcoesRotulos) {
  const pool: HTMLSpanElement[] = [];
  let W = 1, H = 1;
  const _w = new THREE.Vector3();
  const proj = (v: V3) => {
    _w.copy(v);
    o.raiz.localToWorld(_w);
    _w.project(o.camera);
    return { x: ((_w.x + 1) / 2) * W, y: ((1 - _w.y) / 2) * H, z: _w.z };
  };
  const segs: Segmento[] = [];
  function obstaculos() {
    segs.length = 0;
    for (const p of o.obstaculos()) { const A = proj(p.a), B = proj(p.b); segs.push({ ax: A.x, ay: A.y, bx: B.x, by: B.y }); }
    return segs;
  }
  function distSegRet(s: Segmento, x: number, y: number, w: number, h: number) {
    // distância aproximada: amostra o segmento
    let m = Infinity;
    for (let k = 0; k <= 8; k++) {
      const px = s.ax + ((s.bx - s.ax) * k) / 8, py = s.ay + ((s.by - s.ay) * k) / 8;
      const dx = Math.max(x - px, 0, px - (x + w)), dy = Math.max(y - py, 0, py - (y + h));
      m = Math.min(m, Math.hypot(dx, dy));
    }
    return m;
  }
  /**
   * Escolhe, entre posições candidatas (em ordem de preferência), a primeira caixa que fica longe
   * do corpo, do aparelho e dos elementos da interface passados em `evitar`.
   */
  function livre(cands: { x: number; y: number }[], w: number, h: number, margem = 8, topo = 52, evitar: Caixa[] = [], folga = 30) {
    const ss = obstaculos();
    let best = { ...cands[0], i: 0 }, bs = -Infinity;
    for (let i = 0; i < cands.length; i++) {
      const c = cands[i];
      const x = Math.max(margem, Math.min(W - w - margem, c.x)), y = Math.max(topo, Math.min(H - h - margem, c.y));
      let s = Infinity;
      for (const sg of ss) s = Math.min(s, distSegRet(sg, x - 6, y - 6, w + 12, h + 12));
      for (const r of evitar) {
        const dx = Math.max(r.x - (x + w), 0, x - (r.x + r.w)), dy = Math.max(r.y - (y + h), 0, y - (r.y + r.h));
        s = Math.min(s, Math.hypot(dx, dy) - 4);
      }
      if (s >= folga) return { x, y, i };
      if (s > bs + 0.5) { bs = s; best = { x, y, i }; }
    }
    return best;
  }

  function desenhar(list: Rotulo[]) {
    while (pool.length < list.length) {
      const sp = document.createElement("span");
      sp.className = "lbl";
      o.overlay.appendChild(sp);
      pool.push(sp);
    }
    // cada rótulo desvia da interface e dos rótulos já colocados neste quadro
    const ocupadas: Caixa[] = list.length ? (o.evitar?.() || []).slice() : [];
    for (let i = 0; i < pool.length; i++) {
      const sp = pool[i], L = list[i];
      if (!L) { sp.style.opacity = "0"; continue; }
      if (sp.dataset.t !== L.tx) { sp.textContent = L.tx; sp.dataset.t = L.tx; }
      const c = "lbl" + (L.tom ? " " + L.tom : "");
      if (sp.className !== c) sp.className = c;
      const pt = proj(L.at);
      const w = sp.offsetWidth, h = sp.offsetHeight, g = 26;
      const cands = [
        { x: pt.x - w / 2, y: pt.y - h - g }, { x: pt.x - w / 2, y: pt.y + g },
        { x: pt.x + g, y: pt.y - h / 2 }, { x: pt.x - w - g, y: pt.y - h / 2 },
        { x: pt.x + g, y: pt.y - h - g }, { x: pt.x - w - g, y: pt.y - h - g },
        { x: pt.x + g, y: pt.y + g }, { x: pt.x - w - g, y: pt.y + g },
        { x: pt.x - w / 2, y: pt.y - 2 * h - g }, { x: pt.x - w / 2, y: pt.y + h + g },
      ];
      // o lado escolhido no quadro anterior vem primeiro: o rótulo não fica pulando de um lado para o outro
      const ant = sp.dataset.t === L.tx ? Number(sp.dataset.k) : NaN;
      const ordem = Number.isInteger(ant) && ant < cands.length ? [ant, ...cands.keys()].filter((k, j, a) => a.indexOf(k) === j) : [...cands.keys()];
      const pos = livre(ordem.map((k) => cands[k]), w, h, 8, 56, ocupadas);
      sp.dataset.k = String(ordem[pos.i]);
      ocupadas.push({ x: pos.x - 4, y: pos.y - 4, w: w + 8, h: h + 8 });
      sp.style.transform = `translate(${pos.x.toFixed(1)}px,${pos.y.toFixed(1)}px)`;
      sp.style.opacity = pt.z < 1 ? "1" : "0";
    }
  }

  return { resize(w: number, h: number) { W = w; H = h; }, livre, desenhar };
}
