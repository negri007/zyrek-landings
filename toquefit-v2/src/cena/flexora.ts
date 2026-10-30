// Cena da cadeira flexora: pernas estendidas sobre o rolo, a instrutora puxa o rolo para baixo do banco.
import * as THREE from "three";
import type { CenaRoteiro, OpcoesCena } from "./motor";
import type { Enquadramento } from "./camera";
import { QUADRIL, T, criarCadeira } from "./cadeira";
import { montarEstudio } from "./estudio";
import { cenaComRoteiro, type PoseBase } from "./roteiro3d";
import { V, ciclo, lerp, seg } from "./util3d";
import type { Trecho } from "../player/timeline";

/** posição de partida: pernas quase estendidas sobre o rolo (graus a partir da canela na vertical) */
const INICIO = 72;
/** fim da flexão: rolo embaixo do banco, joelho a ~75° */
const FIM = -15;
/** a volta encurtada para no meio do caminho */
const MEIO = 30;

interface Pose extends PoseBase {
  ang: number;
  tranco: number;
  eixo: boolean;
  /** linha tracejada até onde a perna deveria voltar (erro de encurtar o movimento) */
  falta: boolean;
}

const CAMS: Record<string, Enquadramento> = {
  side: { p: [0.15, -0.4, 6.4], l: [0.1, -0.55, 0], u: [0, 1, 0] },
  close: { p: [1.7, -0.25, 4.3], l: [0.55, -0.65, 0], u: [0, 1, 0] },
  tq: { p: [3.2, 0.8, 5.0], l: [0.25, -0.55, 0], u: [0, 1, 0] },
  lento: { p: [1.1, -0.75, 3.9], l: [0.4, -0.95, 0], u: [0, 1, 0] },
};

export function criarFlexora(o: OpcoesCena): CenaRoteiro {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  montarEstudio(scene);
  const maq = new THREE.Group();
  maq.scale.setScalar(1.7);
  maq.position.y = -1.62;
  scene.add(maq);
  const cad = criarCadeira(maq, { flexora: true, reduzido: o.reduzido });
  const quadrilLbl = QUADRIL.clone().add(V(-0.04, -0.06, 0.24));
  /** quanto a carga subiu: 0 com as pernas estendidas, 1 no fim da flexão */
  const carga = (ang: number) => Math.max(0, (INICIO - ang) / (INICIO - FIM));

  // marcação do erro: até onde a canela deveria voltar
  const faltaMat = new THREE.MeshBasicMaterial({ color: 0xff7a66, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
  const falta = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 8), faltaMat);
  falta.renderOrder = 3; maq.add(falta);
  let faltaOp = 0;

  function pose(tr: Trecho, u: number): Pose {
    const P: Pose = { ang: INICIO, tranco: 0, eixo: false, falta: false, labels: [] };
    const D = tr.t1 - tr.t0;
    switch (tr.id) {
      case "ajuste": {
        P.eixo = true;
        if (u > tr.cue("joelho") - 0.2) P.labels.push({ tx: "Eixo da máquina no joelho", at: cad.eixo.clone().setZ(0.36) });
        if (u > tr.cue("rolo")) P.labels.push({ tx: "Rolo atrás do tornozelo", at: cad.rolo(INICIO) });
        break;
      }
      case "apoio": {
        if (u > tr.cue("apoio") - 0.2) P.labels.push({ tx: "Apoio travando as coxas", at: cad.eixo.clone().add(V(-0.12, 0.32, 0.24)) });
        if (u > tr.cue("alças")) P.labels.push({ tx: "Alças laterais", at: V(0.12, 0.47, 0.32) });
        break;
      }
      case "flexao": {
        const c = tr.cue("Flexione"), e = tr.cue("banco") + 0.3;
        P.ang = lerp(INICIO, FIM, seg(u, c, e));
        if (u > e - 0.3) P.labels.push({ tx: "Rolo embaixo do banco", at: cad.rolo(FIM) });
        break;
      }
      case "pico": {
        P.ang = FIM;
        if (u > tr.cue("Segure") + 0.3) P.labels.push({ tx: "Posterior contraído", at: QUADRIL.clone().add(V(0.25, -0.06, 0.2)) });
        break;
      }
      case "volta": {
        const c = tr.cue("Volte");
        P.ang = lerp(FIM, INICIO, seg(u, c, c + 2.4));
        if (u > tr.cue("estender") - 0.2) P.labels.push({ tx: "Volta controlada até o fim", at: cad.rolo(INICIO) });
        break;
      }
      case "quadril-errado": {
        const c = tr.cue("Puxar") - 0.5, fim = tr.cue("Assim") + 0.9;
        if (u > c && u < fim) {
          const k = ciclo(u - c, 0.35, 0.05, 0.6, 0.15);
          P.ang = lerp(INICIO, FIM, k);
          P.tranco = k;
        }
        if (u > tr.cue("quadril") - 0.2 && u < fim) P.labels.push({ tx: "Quadril saiu do banco", at: quadrilLbl, tom: "bad" });
        break;
      }
      case "curto-errado": {
        // flexiona e volta só até a metade: a perna nunca estende de novo
        const c = tr.cue("Voltar") - 0.4;
        if (u > c) P.ang = lerp(MEIO, FIM, ciclo(u - c, 0.9, 0.1, 0.9, 0.1));
        else P.ang = lerp(INICIO, MEIO, seg(u, 0, Math.max(0.3, c)));
        P.falta = u > tr.cue("metade") - 0.2 && u < D - 0.4;
        if (P.falta) P.labels.push({ tx: "Faltou estender", at: cad.rolo(INICIO), tom: "bad" });
        break;
      }
      case "certo": {
        const c = tr.cue("certo") - 0.3;
        if (u > c) P.ang = lerp(INICIO, FIM, ciclo(u - c, 1.2, 0.5, 2.2, 0.4));
        if (u > tr.cue("todo") - 0.2) P.labels.push({ tx: "Movimento completo", at: cad.eixo.clone().add(V(0.05, 0.1, 0.22)) });
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
    aplicar(P, now, dt) {
      cad.aplicar(P.ang, P.tranco, carga(P.ang), 0, P.eixo, now, dt);
      // linha do eixo até onde o rolo deveria voltar
      faltaOp = o.reduzido ? +P.falta : faltaOp + ((P.falta ? 1 : 0) - faltaOp) * Math.min(1, dt * 6);
      faltaMat.opacity = 0.9 * faltaOp;
      falta.visible = faltaOp > 0.02;
      if (falta.visible) {
        const a = cad.eixo.clone().setZ(0.2), b = cad.rolo(INICIO).setZ(0.2), d = b.clone().sub(a);
        falta.position.copy(a).addScaledVector(d, 0.5);
        falta.scale.set(1.4, d.length(), 1.4);
        falta.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
      }
    },
    carregar: cad.carregar,
  });
}
