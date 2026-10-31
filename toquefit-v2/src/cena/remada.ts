// Cena da remada baixa: sentada no banco baixo com os pés no apoio, a instrutora puxa o triângulo pelo cabo
// que sai da polia na frente. A pilha de anilhas fica na torre da frente.
// Coordenadas locais: x para a frente, y para cima, z para os lados; 1 unidade ≈ 85 cm.
import * as THREE from "three";
import type { CenaRoteiro, OpcoesCena } from "./motor";
import type { Enquadramento } from "./camera";
import { materiais, montarEstudio, sombra } from "./estudio";
import { criarPecas, criarPilhaPesos } from "./pecas";
import { carregarModelo, criarPessoa, type Pessoa } from "./pessoa";
import { cenaComRoteiro, type PoseBase } from "./roteiro3d";
import { V, ciclo, lerp, seg, type V3 } from "./util3d";
import type { Trecho } from "../player/timeline";

const QUADRIL = V(0, 0.36, 0);
const PE = V(0.93, 0.3, 0); // tornozelos no apoio: joelhos levemente dobrados
const POLIA = V(1.22, 0.4, 0);

interface Pose extends PoseBase {
  /** puxada: 0 = braços estendidos, 1 = triângulo no abdômen */
  puxa: number;
  /** tronco: positivo joga para trás, negativo inclina para a frente (graus) */
  tronco: number;
  /** lombar curvada, de 0 a 1 */
  curva: number;
  /** escápulas apertadas: peito sobe um pouco, de 0 a 1 */
  escapulas: number;
}

const CAMS: Record<string, Enquadramento> = {
  side: { p: [0.85, -0.3, 7.0], l: [0.85, -0.6, 0], u: [0, 1, 0] },
  tq: { p: [3.4, 0.7, 4.8], l: [0.7, -0.75, 0], u: [0, 1, 0] },
  // de trás e de cima: mostra as escápulas
  costas: { p: [-2.6, 1.3, 2.0], l: [0.15, -0.5, 0], u: [0, 1, 0] },
  lento: { p: [0.7, -0.55, 3.6], l: [0.55, -0.7, 0], u: [0, 1, 0] },
};

export function criarRemada(o: OpcoesCena): CenaRoteiro {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  montarEstudio(scene);
  const mats = materiais();
  const { metal, estofado, neon } = mats;
  const maq = new THREE.Group();
  maq.scale.setScalar(1.7);
  maq.position.y = -1.62;
  scene.add(maq);
  sombra(maq, 0.55, 0, 2.8, 0.9);
  const { peca, tubo, ligar } = criarPecas(maq);

  // ---- banco baixo, apoio dos pés, torre com polia ----
  peca(2.4, 0.05, 0.5, metal, V(0.45, 0.025, 0));
  peca(0.95, 0.07, 0.36, estofado, V(-0.12, 0.25, 0));
  for (const x of [-0.5, 0.25]) tubo(0.03, V(x, 0.22, 0), V(x, 0.05, 0), metal);
  const apoioPe = PE.clone().add(V(0.09, 0.05, 0));
  peca(0.04, 0.26, 0.46, metal, apoioPe, V(Math.cos(1.35), Math.sin(1.35), 0));
  for (const sd of [-1, 1]) peca(0.045, 0.27, 0.02, neon, apoioPe.clone().add(V(0, 0, 0.23 * sd)), V(Math.cos(1.35), Math.sin(1.35), 0));
  tubo(0.026, apoioPe.clone().add(V(0.02, -0.12, 0)), V(apoioPe.x + 0.05, 0.05, 0), metal);
  tubo(0.03, V(POLIA.x + 0.06, 0.05, -0.12), V(POLIA.x + 0.06, 1.5, -0.12), metal);
  const polia = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 8, 24), metal);
  polia.position.copy(POLIA); maq.add(polia);
  const PILHA = V(1.55, 0, 0);
  const pilha = criarPilhaPesos(maq, PILHA, mats, 0.45);

  // ---- cabo e triângulo ----
  const cabo = tubo(0.007, V(), V(0, 1, 0), metal);
  const tri = new THREE.Group();
  maq.add(tri);
  // triângulo: duas pegas quase verticais, palmas viradas uma para a outra
  for (const sd of [-1, 1]) {
    tubo(0.012, V(0.09, 0, 0), V(0, 0.055, 0.065 * sd), metal, tri);
    tubo(0.012, V(0.09, 0, 0), V(0, -0.055, 0.065 * sd), metal, tri);
    tubo(0.02, V(0, -0.055, 0.065 * sd), V(0, 0.055, 0.065 * sd), neon, tri);
  }

  // ---- medidas (trocadas ao carregar o modelo) ----
  let HUM: Pessoa | null = null;
  let ALCANCE = 0.55, Y_PEGA = 0.66, X_PERTO = 0.16;
  const cotovelos = [V(), V()], maos = [V(), V()], ombros = [V(), V()];
  const pescoco = V(), lombar = V();

  function pose(tr: Trecho, u: number): Pose {
    const P: Pose = { puxa: 0, tronco: 0, curva: 0, escapulas: 0, labels: [] };
    const D = tr.t1 - tr.t0;
    const costasLbl = () => lombar.clone().add(V(-0.12, 0.06, 0.24));
    switch (tr.id) {
      case "posicao": {
        if (u > tr.cue("coluna") - 0.2) P.labels.push({ tx: "Coluna reta", at: costasLbl() });
        if (u > tr.cue("joelhos")) P.labels.push({ tx: "Joelhos levemente dobrados", at: V(0.48, 0.58, 0.22) });
        break;
      }
      case "puxada": {
        const c = tr.cue("Puxe"), e = tr.cue("corpo") + 0.3;
        P.puxa = seg(u, c, e);
        if (u > tr.cue("cotovelos") - 0.2) P.labels.push({ tx: "Cotovelos rentes ao corpo", at: cotovelos[1].clone().add(V(-0.05, -0.04, 0.12)) });
        break;
      }
      case "escapulas": {
        P.puxa = 1;
        P.escapulas = seg(u, tr.cue("aperte") - 0.1, tr.cue("aperte") + 0.6) * (1 - seg(u, D - 1.0, D - 0.3));
        if (u > tr.cue("aperte")) P.labels.push({ tx: "Escápulas juntas", at: pescoco.clone().add(V(-0.14, -0.12, 0)) });
        break;
      }
      case "volta": {
        const c = tr.cue("Volte");
        P.puxa = 1 - seg(u, c, c + 2);
        if (u > tr.cue("curvar") - 0.2) P.labels.push({ tx: "Costas paradas", at: costasLbl() });
        break;
      }
      case "lombar-errado": {
        // estica para alcançar mais longe e arredonda as costas na volta de cada repetição
        const c = Math.max(0.2, tr.cue("Curvar") - 0.4), fim = tr.cue("Assim") + 0.9;
        if (u > c && u < fim) {
          const k = ciclo(u - c, 0.9, 0.2, 0.9, 0.2, fim - c);
          P.puxa = k;
          P.curva = 1 - k;
          P.tronco = -14 * (1 - k);
        }
        if (u > tr.cue("machuca") - 0.2 && u < fim) P.labels.push({ tx: "Lombar curvada", at: costasLbl(), tom: "bad" });
        break;
      }
      case "tronco-errado": {
        // cada puxada vem com o tronco jogando para trás
        const c = Math.max(0.2, tr.cue("Jogar") - 0.4), fim = tr.cue("Assim") + 0.9;
        if (u > c && u < fim) {
          const k = ciclo(u - c, 0.55, 0.15, 0.8, 0.2, fim - c);
          P.puxa = k;
          P.tronco = 22 * k;
        }
        if (u > tr.cue("rouba") - 0.2 && u < fim) P.labels.push({ tx: "Tronco balançando", at: pescoco.clone().add(V(-0.1, 0.06, 0.2)), tom: "bad" });
        break;
      }
      case "certo": {
        const c = Math.max(0.2, tr.cue("certo") - 0.3);
        if (u > c) P.puxa = ciclo(u - c, 1.1, 0.5, 2, 0.4, tr.t1 - tr.t0 - c - 0.4);
        if (u > tr.cue("tronco") - 0.2) P.labels.push({ tx: "Tronco parado, braços puxando", at: costasLbl() });
        break;
      }
      case "final": {
        if (u > tr.cue("descanse")) P.labels.push({ tx: "1 min entre as séries", at: pescoco.clone().add(V(0, 0.2, 0.2)), tom: "dim" });
        break;
      }
    }
    return P;
  }

  function aplicar(P: Pose, now: number) {
    // triângulo: na frente dos ombros com os braços estendidos, encostando no abdômen no fim da puxada
    const alcance = ALCANCE + 0.14 * P.curva;
    const H = V(lerp(alcance, X_PERTO, P.puxa), Y_PEGA, 0);
    pilha.subir(0.15 + 0.75 * P.puxa, 0, now);
    if (HUM) {
      const h = HUM;
      h.girarCorpo(P.tronco, QUADRIL);
      h.curvarColuna(28 * P.curva - 6 * P.escapulas);
      // com o tronco inclinado, o triângulo vai junto (as mãos ficam na frente do corpo)
      const S0 = h.ombro(h.side[0]).add(h.ombro(h.side[1])).multiplyScalar(0.5);
      H.x += S0.x;
      for (let i = 0; i < 2; i++) {
        const s = h.side[i], sd = s.sd;
        const ankle = PE.clone().setZ(0.11 * sd);
        h.setLeg(s, ankle, V(-0.2, 1, 0.12 * sd), ankle.clone().add(V(0.04, 0.17, 0.02 * sd)));
        // pegas do triângulo: palmas uma para a outra, cotovelos para trás rentes ao corpo; o ombro avança no alcance
        const G = H.clone().add(V(0.02, 0, 0.065 * sd));
        const { E, W, S } = h.segurar(s, G, { eixo: V(0, 1, 0), palma: V(0, 0, -sd), bend: V(-1, -0.35, 0.18 * sd), clavicula: 0.18 * (1 - P.puxa) + 0.05 });
        cotovelos[i].copy(E); maos[i].copy(W); ombros[i].copy(S);
      }
      pescoco.copy(h.loc(h.B.Neck));
      lombar.copy(h.loc(h.B.Spine));
      h.aim(h.B.Neck, pescoco.clone().add(V(0.06, 0.2, 0)));
    }
    tri.position.copy(H).add(V(0.02, 0, 0));
    ligar(cabo, tri.position.clone().add(V(0.08, 0, 0)), POLIA.clone().add(V(-0.04, 0, 0)));
  }

  return cenaComRoteiro<Pose>(o, {
    scene, camera, raiz: maq, cams: CAMS,
    obstaculos() {
      const pts: { a: V3; b: V3 }[] = [];
      for (let i = 0; i < 2; i++) pts.push({ a: ombros[i], b: cotovelos[i] }, { a: cotovelos[i], b: maos[i] });
      if (HUM) { const cab = HUM.cabeca(); pts.push({ a: cab, b: cab.clone().add(V(0, 0.14, 0)) }); }
      return pts;
    },
    pose,
    aposReplay(P, k) { P.puxa = lerp(P.puxa, 0, k); },
    aplicar: (P, now) => aplicar(P, now),
    async carregar(onProg) {
      const modelo = await carregarModelo(onProg);
      const h = criarPessoa(modelo, maq, {
        inclinacao: 90,
        posicao(loc, B) {
          const q = loc(B.LeftUpLeg).add(loc(B.RightUpLeg)).multiplyScalar(0.5);
          return QUADRIL.clone().sub(q);
        },
      });
      const S = h.side[1].S, L = h.side[1].L1 + h.side[1].L2;
      Y_PEGA = QUADRIL.y + 0.3;
      ALCANCE = Math.sqrt(Math.max(0.05, (L * 0.96) ** 2 - (S.y - Y_PEGA) ** 2));
      X_PERTO = 0.13;
      HUM = h;
    },
  });
}
