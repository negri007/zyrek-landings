// Cena da cadeira extensora: banco quase reto, alavanca girando no eixo do joelho, rolo no tornozelo
// e a pilha de anilhas que sobe junto. A instrutora usa as mesmas peças do leg press (IK de pernas e braços).
// Coordenadas locais do aparelho: x para a frente, y para cima, z para os lados; 1 unidade ≈ 85 cm.
import * as THREE from "three";
import type { CenaRoteiro, OpcoesCena } from "./motor";
import { criarRig, type Enquadramento } from "./camera";
import { CRIT, NEON, materiais, montarEstudio } from "./estudio";
import { carregarModelo, criarPessoa, ik2, type Pessoa } from "./pessoa";
import { criarRotulos, type Rotulo } from "./rotulos";
import { V, seg, suave, type V3 } from "./util3d";
import { trechoEm, type Trecho } from "../player/timeline";

const ENCOSTO = 80; // inclinação do encosto em relação ao chão (graus)
const QUADRIL = V(0, 0.6, 0);
const th = (ENCOSTO * Math.PI) / 180;
const T = V(-Math.cos(th), Math.sin(th), 0); // ao longo do tronco, para a cabeça
const N = V(Math.sin(th), Math.cos(th), 0); // normal do peito
/** maior abertura da alavanca (graus a partir da canela na vertical): joelho a ~168°, sem travar */
const TOPO = 78;
const ROLO = 0.4; // distância do eixo ao rolo, ao longo da canela

interface Pose {
  /** giro da alavanca em graus: 0 = canela na vertical (joelho a 90°), TOPO = pernas quase estendidas */
  ang: number;
  /** quadril descolando do banco (impulso): sobe e o tronco joga para trás, de 0 a 1 */
  tranco: number;
  /** batida da pilha: 0 a 1, acende as anilhas em vermelho e faz a pilha quicar */
  batida: number;
  eixo: boolean;
  labels: Rotulo[];
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
  const { metal, anilha, estofado, neon } = materiais();

  const maq = new THREE.Group();
  maq.scale.setScalar(1.7);
  maq.position.y = -1.62;
  scene.add(maq);
  const _up = V(0, 1, 0);
  const peca = (w: number, h: number, d: number, m: THREE.Material, c: V3, dir = V(1, 0, 0), pai: THREE.Object3D = maq) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    b.position.copy(c);
    b.rotation.z = Math.atan2(dir.y, dir.x);
    pai.add(b);
    return b;
  };
  const tubo = (r: number, a: V3, b: V3, m: THREE.Material, pai: THREE.Object3D = maq) => {
    const d = b.clone().sub(a);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 14), m);
    c.position.copy(a).add(b).multiplyScalar(0.5);
    c.quaternion.setFromUnitVectors(_up, d.normalize());
    pai.add(c);
    return c;
  };

  // ---- banco e estrutura ----
  peca(1.9, 0.05, 0.6, metal, V(-0.15, 0.025, 0));
  peca(0.54, 0.07, 0.44, estofado, V(0.14, 0.485, 0));
  peca(0.82, 0.07, 0.44, estofado, QUADRIL.clone().addScaledVector(T, 0.5).addScaledVector(N, -0.15), T);
  tubo(0.035, V(0.1, 0.45, 0), V(0.1, 0.05, 0), metal);
  tubo(0.03, QUADRIL.clone().addScaledVector(T, 0.3).addScaledVector(N, -0.2), V(-0.25, 0.05, 0), metal);
  // alças ao lado do assento
  for (const sd of [-1, 1]) {
    tubo(0.016, V(-0.02, 0.47, 0.25 * sd), V(-0.02, 0.47, 0.31 * sd), metal);
    tubo(0.024, V(-0.02, 0.47, 0.31 * sd), V(0.2, 0.47, 0.31 * sd), neon);
  }

  // ---- alavanca: gira no eixo da máquina, alinhado com o joelho ----
  let EIXO = V(0.49, 0.6, 0); // trocado ao carregar o modelo (fica exatamente no joelho)
  const alav = new THREE.Group();
  maq.add(alav);
  const cubo = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 24), metal);
  cubo.rotation.x = Math.PI / 2; cubo.position.z = -0.33; alav.add(cubo);
  const tampa = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.008, 8, 32), neon);
  tampa.position.z = -0.29; alav.add(tampa);
  tubo(0.022, V(0, 0, -0.33), V(0, -ROLO, -0.33), metal, alav);
  tubo(0.016, V(0.07, -ROLO, -0.33), V(0.07, -ROLO, 0.2), metal, alav);
  const rolo = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.42, 20), estofado);
  rolo.rotation.x = Math.PI / 2; rolo.position.set(0.07, -ROLO, 0); alav.add(rolo);
  // suporte do eixo até o chão
  const pe = tubo(0.03, V(), V(0, 1, 0), metal);

  // ---- pilha de anilhas atrás do banco ----
  const PILHA = V(-0.72, 0, -0.5);
  for (const x of [-0.2, 0.2]) tubo(0.018, PILHA.clone().add(V(x, 0.05, 0)), PILHA.clone().add(V(x, 1.45, 0)), metal);
  peca(0.56, 0.05, 0.3, metal, PILHA.clone().add(V(0, 1.47, 0)));
  const pilhaMat = anilha.clone(), pilhaQuente = anilha.clone();
  pilhaQuente.emissive = new THREE.Color(NEON); pilhaQuente.emissiveIntensity = 0.12;
  const levanta = new THREE.Group();
  maq.add(levanta);
  for (let i = 0; i < 10; i++) {
    const quente = i >= 6;
    const p = peca(0.36, 0.075, 0.24, quente ? pilhaQuente : pilhaMat, PILHA.clone().add(V(0, 0.09 + i * 0.085, 0)), undefined, quente ? levanta : maq);
    if (quente) p.position.sub(PILHA);
  }
  levanta.position.copy(PILHA);
  const cabo = tubo(0.008, V(), V(0, 1, 0), metal);

  // ---- marcações: eixo da máquina passando pelo joelho (branco: a calça já é amarela) ----
  const eixoMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
  const eixoL = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1, 10), eixoMat);
  eixoL.rotation.x = Math.PI / 2; eixoL.scale.y = 1.05; eixoL.renderOrder = 3; maq.add(eixoL);
  let eixoOp = 0;

  // ---- medidas (trocadas ao carregar o modelo) ----
  let HUM: Pessoa | null = null;
  const ombros = V();
  let baseQ = new THREE.Quaternion(), basePos = V();
  let LP = 0.5;

  // ---- coreografia ----
  /** repetições controladas: sobe em `up`, segura `top`, desce em `down` */
  const ciclo = (u: number, up: number, top: number, down: number, pausa = 0.3) => {
    const per = up + top + down + pausa, k = ((u % per) + per) % per;
    if (k < up) return seg(k, 0, up);
    if (k < up + top) return 1;
    if (k < up + top + down) return 1 - seg(k, up + top, up + top + down);
    return 0;
  };
  function pose(tr: Trecho, u: number): Pose {
    const P: Pose = { ang: 0, tranco: 0, batida: 0, eixo: false, labels: [] };
    const D = tr.t1 - tr.t0;
    const meioCoxa = QUADRIL.clone().add(V(0.25, 0.08, 0.2));
    switch (tr.id) {
      case "ajuste": {
        P.eixo = true;
        if (u > tr.cue("joelho") - 0.2) P.labels.push({ tx: "Eixo da máquina no joelho", at: EIXO.clone().setZ(0.36) });
        if (u > tr.cue("rolo")) P.labels.push({ tx: "Rolo acima do tornozelo", at: EIXO.clone().add(V(0.07, -ROLO, 0.22)) });
        break;
      }
      case "posicao": {
        if (u > tr.cue("alças") - 0.2) P.labels.push({ tx: "Alças laterais", at: V(0.12, 0.47, 0.32) });
        if (u > tr.cue("quadril")) P.labels.push({ tx: "Quadril firme no banco", at: QUADRIL.clone().add(V(-0.04, -0.06, 0.24)) });
        break;
      }
      case "subida": {
        const c = tr.cue("Estenda"), e = tr.cue("travar") + 0.4;
        P.ang = TOPO * seg(u, c, e);
        if (u > e - 0.3) P.labels.push({ tx: "Quase travar", at: EIXO.clone().add(V(0, 0.08, 0.22)) });
        break;
      }
      case "pico": {
        P.ang = TOPO;
        if (u > tr.cue("apertando") - 0.2) P.labels.push({ tx: "Coxa contraída", at: meioCoxa });
        break;
      }
      case "descida": {
        const c = tr.cue("desça");
        P.ang = TOPO * (1 - seg(u, c, c + 2));
        if (u > tr.cue("bater") - 0.3) P.labels.push({ tx: "Pilha encosta de leve", at: PILHA.clone().add(V(0.2, 0.9, 0)) });
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
        if (u > tr.cue("quadril") - 0.2 && u < fim) P.labels.push({ tx: "Quadril saiu do banco", at: QUADRIL.clone().add(V(-0.04, -0.06, 0.24)), tom: "bad" });
        break;
      }
      case "bater-errado": {
        // sobe controlado e solta de uma vez: a pilha cai e bate
        const s = tr.cue("Soltar"), b = tr.cue("bater");
        P.ang = u < s ? TOPO * seg(u, 0.2, Math.max(0.3, s - 0.3)) : TOPO * (1 - seg(u, s + 0.2, s + 0.42));
        const t0 = s + 0.42;
        P.batida = u > t0 ? Math.max(0, 1 - (u - t0) / 1.8) : 0;
        if (u > b - 0.2 && u < D - 0.4) P.labels.push({ tx: "Carga batendo na pilha", at: PILHA.clone().add(V(0.2, 0.9, 0)), tom: "bad" });
        break;
      }
      case "certo": {
        const c = tr.cue("certo") - 0.3;
        if (u > c) P.ang = TOPO * ciclo(u - c, 1.2, 0.5, 2, 0.4);
        if (u > tr.cue("controlando") - 0.2) P.labels.push({ tx: "Controle na subida e na descida", at: EIXO.clone().add(V(0.05, 0.1, 0.22)) });
        break;
      }
      case "final": {
        if (u > tr.cue("descanse")) P.labels.push({ tx: "1 min entre as séries", at: QUADRIL.clone().addScaledVector(T, 0.75).setZ(0.22), tom: "dim" });
        break;
      }
    }
    return P;
  }

  const _q = new THREE.Quaternion(), _z = V(0, 0, 1);
  const joelhos = [V(), V()], tornozelos = [V(), V()], quadris = [V(), V()];
  function aplicar(P: Pose, now: number) {
    const a = (P.ang * Math.PI) / 180;
    alav.position.copy(EIXO);
    alav.rotation.z = a;
    // canela: do eixo para baixo, girando para a frente
    const can = V(Math.sin(a), -Math.cos(a), 0);
    // pilha sobe com a alavanca; na batida, quica e acende em vermelho
    const quique = P.batida > 0 ? Math.sin(now / 38) * 0.012 * P.batida : 0;
    levanta.position.y = (P.ang / TOPO) * 0.32 + quique;
    pilhaQuente.emissive.setHex(P.batida > 0.05 ? CRIT : NEON);
    pilhaQuente.emissiveIntensity = P.batida > 0.05 ? 0.25 + 0.45 * P.batida : 0.12 + 0.15 * (P.ang / TOPO);
    const topoPilha = levanta.position.y + 0.09 + 9 * 0.085 + 0.04;
    cabo.position.set(PILHA.x, (topoPilha + 1.45) / 2, PILHA.z);
    cabo.scale.y = Math.max(0.02, 1.45 - topoPilha);
    if (!HUM) return;
    const h = HUM;
    // tranco: o corpo sobe e joga para trás, girando em volta dos ombros
    _q.setFromAxisAngle(_z, (-9 * P.tranco * Math.PI) / 180);
    h.grupo.quaternion.copy(_q).multiply(baseQ);
    h.grupo.position.copy(basePos).sub(ombros).applyQuaternion(_q).add(ombros).add(V(0, 0.06 * P.tranco, 0));
    h.grupo.updateMatrixWorld(true);
    for (let i = 0; i < 2; i++) {
      const s = h.side[i], sd = s.sd;
      const ankle = EIXO.clone().setZ(h.side[i].Q.z).addScaledVector(can, LP);
      const ponta = ankle.clone().add(V(Math.cos(a), Math.sin(a), 0).multiplyScalar(0.16)).add(V(0, 0, 0.03 * sd));
      const r = h.setLeg(s, ankle, V(0, 1, 0), ponta);
      joelhos[i].copy(r.K); tornozelos[i].copy(r.A); quadris[i].copy(r.Q);
      const G = V(0.1, 0.48, 0.31 * sd);
      const { M: E, P: W } = ik2(s.S, G, s.L1, s.L2, V(-0.4, -0.3, 0.85 * sd), s.braco);
      h.aim(s.A, E); h.aim(s.F, W); h.setGrip(s, 1);
    }
    const pesc = h.loc(h.B.Neck);
    h.aim(h.B.Neck, pesc.clone().addScaledVector(T, 0.2).addScaledVector(N, 0.06));
  }

  const rig = criarRig(camera, CAMS, o.reduzido);
  const rotulos = criarRotulos({
    overlay: o.overlay, camera, raiz: maq, evitar: o.evitar,
    obstaculos() {
      const pts: { a: V3; b: V3 }[] = [];
      for (let i = 0; i < 2; i++) pts.push({ a: quadris[i], b: joelhos[i] }, { a: joelhos[i], b: tornozelos[i] });
      if (HUM) { const cab = HUM.cabeca(); pts.push({ a: cab, b: cab.clone().addScaledVector(T, 0.14) }); }
      return pts;
    },
  });

  let ultimoTr = "";
  const cena: CenaRoteiro & { cams: typeof CAMS } = {
    scene, camera, pronto: false, cams: CAMS,
    resize(w, h) { rotulos.resize(w, h); },
    livre: rotulos.livre,
    frame(now, dt) {
      const L = o.linha();
      const t = Math.max(0, Math.min(L.dur - 0.001, o.tempo()));
      const tr = trechoEm(L, t);
      let u = t - tr.t0, camNome = tr.cam, chave = tr.id, P: Pose;
      const r = tr.replay;
      if (r && u >= r.em) {
        // replay: a descida revista a 0,5×
        const dur = (r.ate - r.de) / r.vel, depois = u - r.em - dur;
        P = pose(tr, depois < 0 ? r.de + (u - r.em) * r.vel : r.ate);
        if (depois <= 0) { camNome = "lento"; chave = tr.id + ":replay"; }
      } else P = pose(tr, u);
      aplicar(P, now);
      eixoOp = suave(eixoOp, P.eixo ? 1 : 0, dt, 6, o.reduzido);
      eixoMat.opacity = 0.9 * eixoOp;
      eixoL.visible = eixoOp > 0.02;
      eixoL.position.copy(EIXO);
      if (chave !== ultimoTr) { rig.ir(camNome, !ultimoTr || chave.endsWith(":replay")); ultimoTr = chave; }
      rig.quadro(now, dt);
      rotulos.desenhar(P.labels);
    },
    async carregar(onProg) {
      const modelo = await carregarModelo(onProg);
      HUM = criarPessoa(modelo, maq, {
        inclinacao: ENCOSTO,
        posicao(loc, B) {
          const q = loc(B.LeftUpLeg).add(loc(B.RightUpLeg)).multiplyScalar(0.5);
          return QUADRIL.clone().sub(q);
        },
      });
      const s = HUM.side[0];
      LP = s.Lp;
      // eixo da máquina exatamente no joelho: coxa na horizontal sobre o banco
      EIXO = QUADRIL.clone().add(V(s.Lc, 0, 0));
      pe.position.set(EIXO.x - 0.02, (EIXO.y + 0.05) / 2, -0.33);
      pe.scale.y = EIXO.y - 0.05;
      ombros.copy(HUM.side[0].S).add(HUM.side[1].S).multiplyScalar(0.5);
      baseQ = HUM.grupo.quaternion.clone(); basePos = HUM.grupo.position.clone();
      cena.pronto = true;
      return "modelo";
    },
  };
  return cena;
}
