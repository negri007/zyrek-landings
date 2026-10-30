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
