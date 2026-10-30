// Cena da cadeira extensora: a instrutora estende as pernas no eixo da máquina e a pilha sobe junto.
import * as THREE from "three";
import type { CenaRoteiro, OpcoesCena } from "./motor";
import type { Enquadramento } from "./camera";
import { QUADRIL, T, criarCadeira } from "./cadeira";
import { montarEstudio } from "./estudio";
import { cenaComRoteiro, type PoseBase } from "./roteiro3d";
import { V, ciclo, seg } from "./util3d";
import type { Trecho } from "../player/timeline";

/** maior abertura da alavanca (graus a partir da canela na vertical): joelho a ~168°, sem travar */
const TOPO = 78;

interface Pose extends PoseBase {
  /** giro da alavanca: 0 = canela na vertical (joelho a 90°), TOPO = pernas quase estendidas */
  ang: number;
  /** quadril descolando do banco (impulso), de 0 a 1 */
  tranco: number;
  /** batida da pilha, de 0 a 1 */
  batida: number;
  eixo: boolean;
}

const CAMS: Record<string, Enquadramento> = {
  side: { p: [0.05, -0.35, 6.3], l: [0.0, -0.5, 0], u: [0, 1, 0] },
  // perto do joelho, de lado e um pouco à frente: mostra o eixo da máquina passando pelo joelho
  close: { p: [1.7, -0.2, 4.3], l: [0.55, -0.6, 0], u: [0, 1, 0] },
  tq: { p: [3.2, 0.9, 5.0], l: [0.2, -0.5, 0], u: [0, 1, 0] },
  // do outro lado do banco, para ver a pilha de anilhas batendo
  pilha: { p: [-0.5, 0.3, -5.0], l: [-1.0, -0.75, -0.5], u: [0, 1, 0] },
  lento: { p: [1.3, -0.55, 3.8], l: [0.45, -0.8, 0], u: [0, 1, 0] },
};

export function criarExtensora(o: OpcoesCena): CenaRoteiro {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  montarEstudio(scene);
  const maq = new THREE.Group();
  maq.scale.setScalar(1.7);
  maq.position.y = -1.62;
  scene.add(maq);
  const cad = criarCadeira(maq, { flexora: false, reduzido: o.reduzido });
  const quadrilLbl = QUADRIL.clone().add(V(-0.04, -0.06, 0.24));

  function pose(tr: Trecho, u: number): Pose {
    const P: Pose = { ang: 0, tranco: 0, batida: 0, eixo: false, labels: [] };
    const D = tr.t1 - tr.t0;
    switch (tr.id) {
      case "ajuste": {
        P.eixo = true;
        if (u > tr.cue("joelho") - 0.2) P.labels.push({ tx: "Eixo da máquina no joelho", at: cad.eixo.clone().setZ(0.36) });
        if (u > tr.cue("rolo")) P.labels.push({ tx: "Rolo acima do tornozelo", at: cad.rolo(0) });
        break;
      }
      case "posicao": {
        if (u > tr.cue("alças") - 0.2) P.labels.push({ tx: "Alças laterais", at: V(0.12, 0.47, 0.32) });
        if (u > tr.cue("quadril")) P.labels.push({ tx: "Quadril firme no banco", at: quadrilLbl });
        break;
      }
      case "subida": {
        const c = tr.cue("Estenda"), e = tr.cue("travar") + 0.4;
        P.ang = TOPO * seg(u, c, e);
        if (u > e - 0.3) P.labels.push({ tx: "Quase travar", at: cad.eixo.clone().add(V(0, 0.08, 0.22)) });
        break;
      }
      case "pico": {
        P.ang = TOPO;
        if (u > tr.cue("apertando") - 0.2) P.labels.push({ tx: "Coxa contraída", at: QUADRIL.clone().add(V(0.25, 0.08, 0.2)) });
        break;
      }
      case "descida": {
        const c = tr.cue("desça");
        P.ang = TOPO * (1 - seg(u, c, c + 2));
        if (u > tr.cue("bater") - 0.3) P.labels.push({ tx: "Pilha encosta de leve", at: cad.pilha.meio });
        break;
      }
      case "impulso-errado": {
        // chutes rápidos: o quadril descola a cada subida
        const c = tr.cue("Chutar") - 0.6, fim = tr.cue("Assim") + 0.9;
        if (u > c && u < fim) {
          const k = ciclo(u - c, 0.32, 0.05, 0.55, 0.15);
          P.ang = TOPO * k;
          P.tranco = k;
        }
        if (u > tr.cue("quadril") - 0.2 && u < fim) P.labels.push({ tx: "Quadril saiu do banco", at: quadrilLbl, tom: "bad" });
        break;
      }
      case "bater-errado": {
        // sobe controlado e solta de uma vez: a pilha cai e bate junto com a palavra "bater"
        const b = tr.cue("bater"), s = b - 0.62;
        P.ang = u < s ? TOPO * seg(u, 0.2, Math.max(0.3, s - 0.3)) : TOPO * (1 - seg(u, s + 0.2, s + 0.42));
        const t0 = s + 0.42;
        P.batida = u > t0 ? Math.max(0, 1 - (u - t0) / 1.8) : 0;
        if (u > b - 0.2 && u < D - 0.4) P.labels.push({ tx: "Carga batendo na pilha", at: cad.pilha.meio, tom: "bad" });
        break;
      }
      case "certo": {
        const c = tr.cue("certo") - 0.3;
        if (u > c) P.ang = TOPO * ciclo(u - c, 1.2, 0.5, 2, 0.4);
        if (u > tr.cue("controlando") - 0.2) P.labels.push({ tx: "Controle na subida e na descida", at: cad.eixo.clone().add(V(0.05, 0.1, 0.22)) });
        break;
      }
      case "final": {
        if (u > tr.cue("descanse")) P.labels.push({ tx: "1 min entre as séries", at: QUADRIL.clone().addScaledVector(T, 0.75).setZ(0.22), tom: "dim" });
        break;
      }
    }
    return P;
  }

  return cenaComRoteiro<Pose>(o, {
    scene, camera, raiz: maq, cams: CAMS,
    obstaculos: cad.obstaculos,
    pose,
    aplicar: (P, now, dt) => cad.aplicar(P.ang, P.tranco, P.ang / TOPO, P.batida, P.eixo, now, dt),
    carregar: cad.carregar,
  });
}
