// Cena do desenvolvimento na máquina: sentada com as costas no encosto, a instrutora empurra os pegadores
// de um carrinho que corre em trilhos verticais atrás do banco. A pilha de anilhas sobe junto.
// Coordenadas locais: x para a frente, y para cima, z para os lados; 1 unidade ≈ 85 cm.
import * as THREE from "three";
import type { CenaRoteiro, OpcoesCena } from "./motor";
import type { Enquadramento } from "./camera";
import { materiais, montarEstudio } from "./estudio";
import { criarPecas, criarPilhaPesos } from "./pecas";
import { carregarModelo, criarPessoa, ik2, type Pessoa } from "./pessoa";
import { cenaComRoteiro, type PoseBase } from "./roteiro3d";
import { V, ciclo, lerp, seg, suave, type V3 } from "./util3d";
import type { Trecho } from "../player/timeline";

const ENCOSTO = 85;
const QUADRIL = V(0, 0.56, 0);
const th = (ENCOSTO * Math.PI) / 180;
const T = V(-Math.cos(th), Math.sin(th), 0);
const N = V(Math.sin(th), Math.cos(th), 0);
const TRILHO_X = -0.38, BRACO_Z = 0.42, PEGA_Z = 0.3;

interface Pose extends PoseBase {
  /** altura dos pegadores: 0 = queixo, 1 = quase travar; negativo = abaixo do queixo */
  alt: number;
  /** lombar arqueada, de 0 a 1 */
  arco: number;
  /** linha na altura do queixo */
  queixo: boolean;
  /** linhas verticais mãos → cotovelos (antebraço na vertical) */
  antebraco: boolean;
}

const CAMS: Record<string, Enquadramento> = {
  side: { p: [1.4, 0.0, 6.2], l: [0.0, -0.3, 0], u: [0, 1, 0] },
  tq: { p: [3.2, 0.7, 4.8], l: [0.0, -0.2, 0], u: [0, 1, 0] },
  // de frente: cotovelos embaixo das mãos
  front: { p: [4.2, 0.35, 0.001], l: [0.0, -0.05, 0], u: [0, 1, 0] },
  lento: { p: [1.7, 0.25, 3.6], l: [0.0, -0.05, 0], u: [0, 1, 0] },
};

export function criarDesenvolvimento(o: OpcoesCena): CenaRoteiro {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  montarEstudio(scene);
  const mats = materiais();
  const { metal, estofado, neon } = mats;
  const maq = new THREE.Group();
  maq.scale.setScalar(1.7);
  maq.position.y = -1.62;
  scene.add(maq);
  const { peca, tubo, ligar } = criarPecas(maq);

  // ---- banco, trilhos e carrinho ----
  peca(1.6, 0.05, 0.9, metal, V(-0.1, 0.025, 0));
  peca(0.46, 0.07, 0.42, estofado, V(0.12, 0.445, 0));
  peca(0.86, 0.07, 0.4, estofado, QUADRIL.clone().addScaledVector(T, 0.52).addScaledVector(N, -0.13), T);
  tubo(0.035, V(0.1, 0.41, 0), V(0.1, 0.05, 0), metal);
  for (const sd of [-1, 1]) tubo(0.026, V(TRILHO_X, 0.05, BRACO_Z * sd), V(TRILHO_X, 1.95, BRACO_Z * sd), metal);
  tubo(0.026, V(TRILHO_X, 1.95, -BRACO_Z), V(TRILHO_X, 1.95, BRACO_Z), metal);
  const carro = new THREE.Group();
  maq.add(carro);
  let PEGA_X = 0.04; // trocado ao carregar o modelo: um pouco à frente dos ombros
  tubo(0.024, V(TRILHO_X, 0, -BRACO_Z), V(TRILHO_X, 0, BRACO_Z), metal, carro);
  const bracos = [-1, 1].map((sd) => ({
    sd,
    braco: tubo(0.02, V(), V(0, 1, 0), metal, carro),
    pega: tubo(0.026, V(), V(0, 1, 0), neon, carro),
  }));
  function montarCarro() {
    for (const b of bracos) {
      ligar(b.braco, V(TRILHO_X, 0, BRACO_Z * b.sd), V(PEGA_X, 0, BRACO_Z * b.sd));
      ligar(b.pega, V(PEGA_X, 0, BRACO_Z * b.sd), V(PEGA_X, 0, (PEGA_Z - 0.06) * b.sd));
    }
  }
  montarCarro();

  // ---- pilha atrás do banco ----
  const PILHA = V(-0.95, 0, 0);
  const pilha = criarPilhaPesos(maq, PILHA, mats, 0.4);

  // ---- marcações ----
  const linhaMat = (cor: number) => new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
  const queixoMat = linhaMat(0xffffff), anteMat = linhaMat(0xffffff);
  const queixoL = tubo(0.008, V(), V(0, 1, 0), queixoMat); queixoL.renderOrder = 3;
  const antes = [tubo(0.008, V(), V(0, 1, 0), anteMat), tubo(0.008, V(), V(0, 1, 0), anteMat)];
  for (const a of antes) a.renderOrder = 3;
  let queixoOp = 0, anteOp = 0;

  // ---- medidas (trocadas ao carregar o modelo) ----
  let HUM: Pessoa | null = null;
  let Y_QUEIXO = 1.26, Y_TOPO = 1.62;
  const altY = (a: number) => lerp(Y_QUEIXO, Y_TOPO, a);
  const cotovelos = [V(), V()], maos = [V(), V()], ombros = [V(), V()];

  function pose(tr: Trecho, u: number): Pose {
    const P: Pose = { alt: 0, arco: 0, queixo: false, antebraco: false, labels: [] };
    const pegaLbl = () => V(PEGA_X, altY(P.alt) + 0.06, PEGA_Z + 0.04);
    switch (tr.id) {
      case "ajuste": {
        P.queixo = u > tr.cue("altura") - 0.3;
        if (P.queixo) P.labels.push({ tx: "Pegadores na altura do queixo", at: pegaLbl() });
        break;
      }
      case "posicao": {
        if (u > tr.cue("costas") - 0.2) P.labels.push({ tx: "Costas no encosto", at: QUADRIL.clone().addScaledVector(T, 0.4).add(V(-0.12, 0, 0.22)) });
        if (u > tr.cue("pés")) P.labels.push({ tx: "Pés firmes no chão", at: V(0.5, 0.06, 0.22) });
        break;
      }
      case "pegada": {
        P.antebraco = u > tr.cue("cotovelos") - 0.3;
        if (P.antebraco) P.labels.push({ tx: "Antebraço na vertical", at: V(PEGA_X, Y_QUEIXO - 0.2, 0.42) });
        break;
      }
      case "subida": {
        const c = tr.cue("Empurre"), e = tr.cue("travar") + 0.3;
        P.alt = seg(u, c, e);
        if (u > e - 0.3) P.labels.push({ tx: "Cotovelos sem travar", at: pegaLbl() });
        break;
      }
      case "descida": {
        const c = tr.cue("Desça");
        P.alt = 1 - seg(u, c, c + 2);
        P.queixo = u > c + 1.2;
        if (u > tr.cue("queixo") - 0.2) P.labels.push({ tx: "Até o queixo", at: pegaLbl() });
        break;
      }
      case "lombar-errado": {
        // empurra arqueando: a lombar sai do encosto a cada subida
        const c = tr.cue("Arquear") - 0.4, fim = tr.cue("Assim") + 0.9;
        if (u > c && u < fim) {
          const k = ciclo(u - c, 0.8, 0.2, 0.8, 0.1);
          P.alt = k;
          P.arco = Math.min(1, seg(u, c, c + 0.8)) * (0.6 + 0.4 * k);
        }
        if (u > tr.cue("força") - 0.2 && u < fim) P.labels.push({ tx: "Lombar fora do encosto", at: QUADRIL.clone().addScaledVector(T, 0.22).add(V(-0.1, 0, 0.24)), tom: "bad" });
        break;
      }
      case "fundo-errado": {
        const c = tr.cue("Descer"), fim = tr.cue("Assim") + 0.8;
        P.alt = u < c ? lerp(1, 0, seg(u, 0, Math.max(0.3, c))) : u < fim ? lerp(0, -0.55, seg(u, c, c + 0.9)) : lerp(-0.55, 0, seg(u, fim, fim + 1.0));
        P.queixo = true;
        if (u > tr.cue("abaixo") - 0.2 && u < fim + 0.6) P.labels.push({ tx: "Abaixo do queixo", at: pegaLbl(), tom: "bad" });
        break;
      }
      case "certo": {
        const c = tr.cue("certo") - 0.3;
        if (u > c) P.alt = ciclo(u - c, 1.2, 0.3, 2, 0.4);
        P.queixo = u > c;
        if (u > tr.cue("queixo") - 0.2) P.labels.push({ tx: "Do queixo até quase travar", at: V(PEGA_X, Y_TOPO + 0.1, 0.4) });
        break;
      }
      case "final": {
        if (u > tr.cue("descanse")) P.labels.push({ tx: "1 min entre as séries", at: QUADRIL.clone().addScaledVector(T, 0.75).setZ(0.24), tom: "dim" });
        break;
      }
    }
    return P;
  }

  function aplicar(P: Pose, now: number, dt: number) {
    const y = altY(P.alt);
    carro.position.y = y;
    pilha.subir(Math.max(0, (y - altY(-0.6)) / (Y_TOPO - altY(-0.6))), 0, now);
    queixoOp = suave(queixoOp, P.queixo ? 1 : 0, dt, 6, o.reduzido);
    queixoMat.opacity = 0.85 * queixoOp; queixoL.visible = queixoOp > 0.02;
    ligar(queixoL, V(PEGA_X + 0.02, Y_QUEIXO, -0.5), V(PEGA_X + 0.02, Y_QUEIXO, 0.5));
    anteOp = suave(anteOp, P.antebraco ? 1 : 0, dt, 6, o.reduzido);
    anteMat.opacity = 0.85 * anteOp;
    if (!HUM) return;
    const h = HUM;
    h.curvarColuna(-20 * P.arco);
    for (let i = 0; i < 2; i++) {
      const s = h.side[i], sd = s.sd;
      const S = h.ombro(s);
      const G = V(PEGA_X, y, PEGA_Z * sd);
      // cotovelos para baixo e um pouco para fora, embaixo das mãos
      const { M: E, P: W } = ik2(S, G, s.L1, s.L2, V(0.15, -1, 0.55 * sd), s.braco);
      h.aim(s.A, E); h.aim(s.F, W); h.setGrip(s, 1);
      cotovelos[i].copy(E); maos[i].copy(W); ombros[i].copy(S);
      antes[i].visible = anteOp > 0.02;
      if (antes[i].visible) ligar(antes[i], W.clone().add(V(0.03, 0.06, 0)), V(W.x + 0.03, W.y - 0.4, W.z));
    }
    const pesc = h.loc(h.B.Neck);
    h.aim(h.B.Neck, pesc.clone().addScaledVector(T, 0.2).addScaledVector(N, 0.03));
  }

  return cenaComRoteiro<Pose>(o, {
    scene, camera, raiz: maq, cams: CAMS,
    obstaculos() {
      const pts: { a: V3; b: V3 }[] = [];
      for (let i = 0; i < 2; i++) pts.push({ a: ombros[i], b: cotovelos[i] }, { a: cotovelos[i], b: maos[i] });
      if (HUM) { const cab = HUM.cabeca(); pts.push({ a: cab, b: cab.clone().addScaledVector(T, 0.14) }); }
      return pts;
    },
    pose,
    aposReplay(P, k) { P.alt = lerp(P.alt, 0, k); },
    aplicar,
    async carregar(onProg) {
      const modelo = await carregarModelo(onProg);
      const h = criarPessoa(modelo, maq, {
        inclinacao: ENCOSTO,
        posicao(loc, B) {
          const q = loc(B.LeftUpLeg).add(loc(B.RightUpLeg)).multiplyScalar(0.5);
          return QUADRIL.clone().sub(q);
        },
      });
      // sentada: coxas na horizontal, canelas na vertical, pés no chão
      for (const s of h.side) {
        const Q = h.loc(s.U);
        const joelho = Q.clone().add(V(s.Lc, 0, 0.04 * s.sd));
        const ankle = joelho.clone().add(V(0.02, -s.Lp, 0.02 * s.sd));
        h.setLeg(s, ankle, V(0, 1, 0), ankle.clone().add(V(0.16, -0.04, 0.02 * s.sd)));
      }
      const S = h.side[1].S, cab = h.cabeca();
      Y_QUEIXO = lerp(S.y, cab.y, 0.55);
      Y_TOPO = S.y + Math.sqrt(Math.max(0, (s1(h) * 0.97) ** 2 - (PEGA_Z - Math.abs(S.z)) ** 2));
      PEGA_X = S.x + 0.06;
      montarCarro();
      HUM = h;
    },
  });
}

/** comprimento do braço inteiro */
const s1 = (h: Pessoa) => h.side[0].L1 + h.side[0].L2;
