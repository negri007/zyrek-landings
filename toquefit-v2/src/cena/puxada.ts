// Cena da puxada frontal: sentada com as coxas presas no rolo, a instrutora puxa a barra larga que desce
// da polia no alto da torre. A pilha de anilhas fica atrás do banco.
// Coordenadas locais: x para a frente, y para cima, z para os lados; 1 unidade ≈ 85 cm.
import * as THREE from "three";
import type { CenaRoteiro, OpcoesCena } from "./motor";
import type { Enquadramento } from "./camera";
import { materiais, montarEstudio, sombra } from "./estudio";
import { criarPecas, criarPilhaPesos } from "./pecas";
import { carregarModelo, criarPessoa, type Pessoa } from "./pessoa";
import { cenaComRoteiro, type PoseBase } from "./roteiro3d";
import { V, ciclo, lerp, seg, suave, type V3 } from "./util3d";
import type { Trecho } from "../player/timeline";

const QUADRIL = V(0, 0.56, 0);
const TORRE_X = -0.42, TOPO_Y = 2.2, PEGA_Z = 0.44, INCLINA = 10;

interface Pose extends PoseBase {
  /** puxada: 0 = braços estendidos em cima, 1 = barra no alto do peito */
  puxa: number;
  /** tronco para trás, em graus */
  tronco: number;
  /** 0 = barra na frente do rosto, 1 = atrás da nuca */
  nuca: number;
  /** linhas brancas na largura dos ombros, para comparar com a pegada */
  ombros: boolean;
}

const CAMS: Record<string, Enquadramento> = {
  side: { p: [1.4, 0.3, 7.4], l: [0.0, 0.1, 0], u: [0, 1, 0] },
  tq: { p: [3.4, 0.9, 4.6], l: [0.0, 0.0, 0], u: [0, 1, 0] },
  front: { p: [4.4, 0.4, 0.001], l: [0.0, 0.05, 0], u: [0, 1, 0] },
  // de trás e do lado: mostra a barra passando atrás da cabeça
  tras: { p: [-3.0, 1.0, 3.4], l: [0.0, 0.0, 0], u: [0, 1, 0] },
  lento: { p: [1.8, 0.2, 3.8], l: [0.05, 0.0, 0], u: [0, 1, 0] },
};

export function criarPuxada(o: OpcoesCena): CenaRoteiro {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  montarEstudio(scene);
  const mats = materiais();
  const { metal, estofado, neon } = mats;
  const maq = new THREE.Group();
  maq.scale.setScalar(1.7);
  maq.position.y = -1.62;
  scene.add(maq);
  sombra(maq, -0.25, 0, 1.9, 1.1);
  const { peca, tubo, ligar } = criarPecas(maq);

  // ---- banco, rolo das coxas, torre com polia ----
  peca(1.5, 0.05, 0.7, metal, V(-0.1, 0.025, 0));
  peca(0.46, 0.07, 0.42, estofado, V(0.08, 0.445, 0));
  tubo(0.035, V(0.05, 0.41, 0), V(0.05, 0.05, 0), metal);
  tubo(0.032, V(TORRE_X, 0.05, 0), V(TORRE_X, TOPO_Y, 0), metal);
  const POLIA = V(0.08, TOPO_Y - 0.05, 0);
  tubo(0.03, V(TORRE_X, TOPO_Y, 0), V(POLIA.x + 0.05, TOPO_Y, 0), metal);
  const polia = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 8, 24), metal);
  polia.position.copy(POLIA); maq.add(polia);
  let ROLO = V(0.4, 0.74, 0); // trocado ao carregar o modelo: logo acima das coxas, perto dos joelhos
  const roloG = new THREE.Group();
  maq.add(roloG);
  for (const sd of [-1, 1]) {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.2, 20), estofado);
    r.rotation.x = Math.PI / 2; r.position.z = 0.13 * sd; roloG.add(r);
  }
  tubo(0.02, V(0, 0, -0.24), V(0, 0, 0.24), metal, roloG);
  const roloHaste = tubo(0.022, V(), V(0, 1, 0), metal);
  const PILHA = V(TORRE_X - 0.42, 0, 0);
  const pilha = criarPilhaPesos(maq, PILHA, mats, 0.45);

  // ---- barra larga e cabo ----
  const barra = new THREE.Group();
  maq.add(barra);
  tubo(0.016, V(0, 0, -0.62), V(0, 0, 0.62), metal, barra);
  for (const sd of [-1, 1]) {
    tubo(0.022, V(0, 0, 0.32 * sd), V(0, 0, 0.56 * sd), neon, barra);
    tubo(0.014, V(0, 0, 0.6 * sd), V(0, -0.05, 0.66 * sd), metal, barra);
  }
  const cabo = tubo(0.007, V(), V(0, 1, 0), metal);

  // ---- marcação: largura dos ombros ----
  const ombroMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
  const ombroL = [tubo(0.007, V(), V(0, 1, 0), ombroMat), tubo(0.007, V(), V(0, 1, 0), ombroMat)];
  for (const l of ombroL) l.renderOrder = 3;
  let ombroOp = 0;

  // ---- medidas (trocadas ao carregar o modelo) ----
  let HUM: Pessoa | null = null;
  let BRACO = 0.58;
  const cotovelos = [V(), V()], maos = [V(), V()], ombros = [V(), V()];
  const peito = V(), cabeca = V();

  function pose(tr: Trecho, u: number): Pose {
    const P: Pose = { puxa: 0, tronco: INCLINA, nuca: 0, ombros: false, labels: [] };
    const barraLbl = () => maos[1].clone().add(V(0, 0.1, 0.12));
    switch (tr.id) {
      case "ajuste": {
        P.tronco = 0;
        if (u > tr.cue("prender") - 0.2) P.labels.push({ tx: "Rolo sobre as coxas", at: ROLO.clone().add(V(0, 0.08, 0.24)) });
        break;
      }
      case "pegada": {
        P.tronco = 0;
        P.ombros = u > tr.cue("largura") - 0.3;
        if (u > tr.cue("pegada") - 0.2) P.labels.push({ tx: "Mãos além dos ombros", at: barraLbl() });
        break;
      }
      case "inclinacao": {
        P.tronco = INCLINA * seg(u, tr.cue("Incline"), tr.cue("trás") + 0.5);
        if (u > tr.cue("pouco")) P.labels.push({ tx: "Uns 10° para trás", at: peito.clone().add(V(0.1, 0.1, 0.24)) });
        break;
      }
      case "puxada": {
        const c = tr.cue("Puxe"), e = tr.cue("peito") + 0.3;
        P.puxa = seg(u, c, e);
        if (u > tr.cue("cotovelos") - 0.2) P.labels.push({ tx: "Cotovelos para baixo", at: cotovelos[1].clone().add(V(0.04, -0.06, 0.14)) });
        break;
      }
      case "volta": {
        const c = tr.cue("Volte");
        P.puxa = 1 - seg(u, c, c + 2);
        if (u > tr.cue("estender") - 0.2) P.labels.push({ tx: "Braços estendidos", at: barraLbl() });
        break;
      }
      case "nuca-errado": {
        const c = Math.max(0.2, tr.cue("Puxar") - 0.4), fim = tr.cue("Assim") + 0.9;
        P.tronco = 0;
        if (u > c && u < fim) { const k = ciclo(u - c, 0.9, 0.3, 0.9, 0.2, fim - c); P.puxa = k; P.nuca = 1; }
        if (u > tr.cue("força") - 0.2 && u < fim) P.labels.push({ tx: "Barra atrás da nuca", at: cabeca.clone().add(V(-0.12, 0.08, 0.22)), tom: "bad" });
        break;
      }
      case "balanco-errado": {
        // o tronco joga para trás a cada puxada para ajudar
        const c = Math.max(0.2, tr.cue("Balançar") - 0.4), fim = tr.cue("Assim") + 0.9;
        if (u > c && u < fim) { const k = ciclo(u - c, 0.5, 0.15, 0.7, 0.15, fim - c); P.puxa = k; P.tronco = INCLINA + 26 * k; }
        if (u > tr.cue("tira") - 0.2 && u < fim) P.labels.push({ tx: "Tronco balançando", at: cabeca.clone().add(V(-0.1, 0.12, 0.22)), tom: "bad" });
        break;
      }
      case "certo": {
        const c = Math.max(0.2, tr.cue("certo") - 0.3);
        if (u > c) P.puxa = ciclo(u - c, 1.1, 0.5, 2, 0.4, tr.t1 - tr.t0 - c - 0.4);
        if (u > tr.cue("tronco") - 0.2) P.labels.push({ tx: "Tronco firme, barra na frente", at: peito.clone().add(V(0.14, 0.02, 0.24)) });
        break;
      }
      case "final": {
        if (u > tr.cue("descanse")) P.labels.push({ tx: "1 min entre as séries", at: cabeca.clone().add(V(0, 0.2, 0.2)), tom: "dim" });
        break;
      }
    }
    return P;
  }

  function aplicar(P: Pose, now: number, dt: number) {
    roloG.position.copy(ROLO);
    ligar(roloHaste, V(ROLO.x, ROLO.y, -0.24), V(ROLO.x - 0.02, 0.05, -0.24));
    let B = V(0.05, 1.7, 0);
    if (HUM) {
      const h = HUM;
      h.girarCorpo(P.tronco, QUADRIL);
      h.curvarColuna();
      const S0 = h.ombro(h.side[0]).add(h.ombro(h.side[1])).multiplyScalar(0.5);
      cabeca.copy(h.cabeca());
      // em cima: braços quase estendidos acima dos ombros; embaixo: barra no alto do peito (ou atrás da nuca)
      const meioZ = PEGA_Z - Math.abs(h.side[1].S.z);
      const alto = S0.clone().add(V(0.04, Math.sqrt(Math.max(0.02, (BRACO * 0.95) ** 2 - meioZ ** 2)), 0));
      const frente = S0.clone().add(V(0.2, -0.04, 0));
      const atras = S0.clone().add(V(-0.16, 0.16, 0));
      B = alto.clone().lerp(P.nuca ? atras : frente, P.puxa);
      // cabeça desvia: para a frente quando a barra passa atrás da nuca
      const pesc = h.loc(h.B.Neck);
      h.aim(h.B.Neck, pesc.clone().add(V(0.05 + 0.18 * P.nuca * P.puxa, 0.2 - 0.06 * P.nuca * P.puxa, 0)));
      for (let i = 0; i < 2; i++) {
        const s = h.side[i], sd = s.sd;
        const Q = h.loc(s.U);
        const joelho = Q.clone().add(V(Math.cos(0.08) * s.Lc, Math.sin(0.08) * s.Lc, 0.04 * sd));
        const ankle = V(joelho.x + 0.04, Math.max(0.1, joelho.y - s.Lp), joelho.z);
        h.setLeg(s, ankle, V(0, 1, 0), ankle.clone().add(V(0.16, -0.04, 0.02 * sd)));
        // pegada pronada na barra: palmas para a frente; com os braços em cima o ombro sobe junto
        const G = B.clone().setZ(PEGA_Z * sd);
        const { E, W, S } = h.segurar(s, G, { eixo: V(0, 0, 1), palma: V(1, 0, 0), bend: V(-0.15, -1, 0.9 * sd), clavicula: 0.3 * (1 - P.puxa) + 0.08 });
        cotovelos[i].copy(E); maos[i].copy(W); ombros[i].copy(S);
        ombroL[i].visible = ombroOp > 0.02;
        if (ombroL[i].visible) ligar(ombroL[i], V(S.x + 0.03, S.y - 0.25, S.z), V(S.x + 0.03, alto.y + 0.12, S.z));
      }
      peito.copy(h.loc(h.B.Spine2));
    }
    barra.position.copy(B);
    ligar(cabo, B.clone().add(V(0, 0.02, 0)), POLIA.clone().add(V(0, -0.05, 0)));
    pilha.subir(0.1 + 0.8 * P.puxa, 0, now);
    ombroOp = suave(ombroOp, P.ombros ? 1 : 0, dt, 6, o.reduzido);
    ombroMat.opacity = 0.85 * ombroOp;
  }

  return cenaComRoteiro<Pose>(o, {
    scene, camera, raiz: maq, cams: CAMS,
    obstaculos() {
      const pts: { a: V3; b: V3 }[] = [];
      for (let i = 0; i < 2; i++) pts.push({ a: ombros[i], b: cotovelos[i] }, { a: cotovelos[i], b: maos[i] });
      pts.push({ a: cabeca, b: cabeca.clone().add(V(0, 0.14, 0)) });
      return pts;
    },
    pose,
    aposReplay(P, k) { P.puxa = lerp(P.puxa, 0, k); },
    aplicar,
    async carregar(onProg) {
      const modelo = await carregarModelo(onProg);
      const h = criarPessoa(modelo, maq, {
        inclinacao: 90,
        posicao(loc, B) {
          const q = loc(B.LeftUpLeg).add(loc(B.RightUpLeg)).multiplyScalar(0.5);
          return QUADRIL.clone().sub(q);
        },
      });
      const s = h.side[0];
      BRACO = s.L1 + s.L2;
      ROLO = QUADRIL.clone().add(V(s.Lc * 0.78, 0.15, 0));
      HUM = h;
    },
  });
}
