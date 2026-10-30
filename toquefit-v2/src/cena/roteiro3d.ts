// O que toda cena com instrutora faz a cada quadro: acha o trecho do roteiro, calcula a pose,
// troca a câmera, roda o replay em câmera lenta e desenha os rótulos.
import * as THREE from "three";
import type { CenaRoteiro, OpcoesCena } from "./motor";
import { criarRig, type Enquadramento } from "./camera";
import { criarRotulos, type Rotulo } from "./rotulos";
import type { V3 } from "./util3d";
import { trechoEm, type Trecho } from "../player/timeline";

export interface PoseBase { labels: Rotulo[] }

export interface DefCena<P extends PoseBase> {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  /** grupo do aparelho: rótulos e obstáculos usam as coordenadas locais dele */
  raiz: THREE.Object3D;
  cams: Record<string, Enquadramento>;
  /** câmeras sem a deriva lenta (vistas de cima) */
  fixas?: string[];
  /** câmera usada durante o replay em câmera lenta */
  lento?: string;
  /** partes do corpo e do aparelho que os rótulos não podem cobrir */
  obstaculos(): { a: V3; b: V3 }[];
  pose(tr: Trecho, u: number): P;
  /** depois do replay: volta à posição de partida antes do próximo capítulo (`k` vai de 0 a 1) */
  aposReplay?(P: P, k: number): void;
  /** durante o replay (ex.: deixar o aparelho translúcido) */
  noReplay?(P: P): void;
  aplicar(P: P, now: number, dt: number): void;
  /** carrega o modelo e prepara as medidas; rejeita quando não dá (o player mostra a imagem estática) */
  carregar(onProg: (p: number) => void): Promise<void>;
}

export function cenaComRoteiro<P extends PoseBase>(o: OpcoesCena, d: DefCena<P>): CenaRoteiro {
  const rig = criarRig(d.camera, d.cams, o.reduzido, d.fixas);
  const rotulos = criarRotulos({ overlay: o.overlay, camera: d.camera, raiz: d.raiz, evitar: o.evitar, obstaculos: d.obstaculos });
  let ultimo = "";
  const suavizar = criarSuavizador(o.reduzido);
  const cena: CenaRoteiro = {
    scene: d.scene, camera: d.camera, pronto: false,
    resize(w, h) { rotulos.resize(w, h); },
    livre: rotulos.livre,
    frame(now, dt) {
      const L = o.linha();
      const t = Math.max(0, Math.min(L.dur - 0.001, o.tempo()));
      const tr = trechoEm(L, t);
      const u = t - tr.t0;
      let camNome = tr.cam, chave = tr.id, P: P;
      const r = tr.replay;
      if (r && u >= r.em) {
        // replay: o mesmo trecho revisto em câmera lenta, depois a pose volta à de partida
        const dur = (r.ate - r.de) / r.vel, depois = u - r.em - dur;
        P = d.pose(tr, depois < 0 ? r.de + (u - r.em) * r.vel : r.ate);
        if (depois > 0) d.aposReplay?.(P, Math.min(1, depois / 0.9));
        else { d.noReplay?.(P); camNome = d.lento || "lento"; chave = tr.id + ":replay"; }
      } else P = d.pose(tr, u);
      // o replay entra com corte de câmera: ali a pose pode pular de uma vez
      suavizar(P, t, dt, chave !== ultimo && chave.endsWith(":replay"));
      d.aplicar(P, now, dt);
      if (chave !== ultimo) { rig.ir(camNome, !ultimo || chave.endsWith(":replay")); ultimo = chave; }
      rig.quadro(now, dt);
      rotulos.desenhar(P.labels);
    },
    async carregar(onProg) {
      await d.carregar(onProg);
      cena.pronto = true;
      return "modelo";
    },
  };
  return cena;
}

/**
 * Suaviza os números da pose com uma mola criticamente amortecida: as emendas entre trechos
 * (cada trecho calcula a pose do zero) viram transições em vez de saltos, e as acelerações ficam macias.
 * Pula direto para a pose quando o vídeo é arrastado ou num corte de câmera.
 */
export function criarSuavizador(reduzido: boolean, tempo = 0.12) {
  const est = new Map<string, { v: number; vel: number }>();
  let ultimoT = NaN;
  const omega = 2 / tempo;
  return (P: object, t: number, dt: number, cortar = false) => {
    const salto = reduzido || cortar || !(Math.abs(t - ultimoT) < 0.4) || dt <= 0;
    ultimoT = t;
    const p = P as Record<string, unknown>;
    for (const k in p) {
      const alvo = p[k];
      if (typeof alvo !== "number" || !Number.isFinite(alvo)) continue;
      const e = est.get(k);
      if (!e || salto) { est.set(k, { v: alvo, vel: 0 }); continue; }
      // SmoothDamp: chega no alvo sem passar dele e sem tranco
      const x = omega * dt, ex = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
      const dif = e.v - alvo, tmp = (e.vel + omega * dif) * dt;
      e.vel = (e.vel - omega * tmp) * ex;
      e.v = alvo + (dif + tmp) * ex;
      p[k] = e.v;
    }
  };
}
