// Cena do leg press 45°: banco reclinado, plataforma no trilho a 45° e a instrutora com pernas e braços por IK.
// Coordenadas locais do aparelho: x para a plataforma, y para cima, z para os lados; 1 unidade ≈ 85 cm.
import * as THREE from "three";
import type { CenaRoteiro, OpcoesCena } from "./motor";
import { criarRig, type Enquadramento } from "./camera";
import { NEON, materiais, montarEstudio, sombra } from "./estudio";
import { carregarModelo, criarPessoa, ik2, type Pessoa } from "./pessoa";
import { criarSuavizador } from "./roteiro3d";
import { criarRotulos, type Rotulo } from "./rotulos";
import { V, lerp, rep, seg, suave, type V3 } from "./util3d";
import { trechoEm, type Trecho } from "../player/timeline";

const ENCOSTO = 38; // inclinação do encosto em relação ao chão (graus)
const QUADRIL = V(0, 0.56, 0); // centro do quadril sentado
const th = (ENCOSTO * Math.PI) / 180;
/** ao longo do tronco, do quadril para a cabeça */
const T = V(-Math.cos(th), Math.sin(th), 0);
/** normal do peito (para longe do encosto) */
const N = V(Math.sin(th), Math.cos(th), 0);
/** trilho a 45°, do quadril para a plataforma */
const R = V(Math.SQRT1_2, Math.SQRT1_2, 0);
/** no plano da plataforma, para o lado da cabeça */
const RP = V(-Math.SQRT1_2, Math.SQRT1_2, 0);

interface Pose {
  /** extensão das pernas: 1 = em cima (quase estendidas), 0 = joelhos a 90°, negativo = mais fundo que 90° */
  ext: number;
  /** quanto o quadril descola do banco (graus de giro do corpo em volta dos ombros) */
  quadril: number;
  /** 0 = joelhos na linha dos pés, 1 = caindo para dentro */
  valgo: number;
  /** 0 = travas fechadas, 1 = abertas */
  trava: number;
  /** opacidade da plataforma e das anilhas (vista de frente: translúcida para mostrar as pernas) */
  plat: number;
  cunha: "" | "ok" | "bad";
  /** linhas pé → joelho nos capítulos de joelho */
  guias: boolean;
  /** contorno vermelho dos joelhos caídos, para comparar com o certo */
  fantasma: boolean;
  labels: Rotulo[];
}

const CAMS: Record<string, Enquadramento> = {
  side: { p: [0.5, 0.0, 8.8], l: [0.5, -0.22, 0], u: [0, 1, 0] },
  close: { p: [0.75, 0.2, 4.6], l: [0.4, -0.12, 0], u: [0, 1, 0] },
  tq: { p: [3.3, 1.5, 6.3], l: [0.35, -0.3, 0], u: [0, 1, 0] },
  // de cima, cabeça no alto da tela: mostra se o joelho acompanha a linha do pé sem os tênis na frente
  cima: { p: [0.35, 5.2, 0.001], l: [0.35, -0.3, 0], u: [-1, 0, 0] },
  // replay em câmera lenta: perto do joelho, na altura dele, para ver o ângulo de 90°
  lento: { p: [0.75, 0.1, 3.0], l: [0.15, -0.2, 0], u: [0, 1, 0] },
};

export function criarLegPress(o: OpcoesCena): CenaRoteiro {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  montarEstudio(scene);
  const { metal, anilha, estofado, neon } = materiais();

  const maq = new THREE.Group();
  maq.scale.setScalar(1.7);
  maq.position.y = -1.62;
  scene.add(maq);
  sombra(maq, 0.4, 0, 2.8, 1.1);
  const _up = V(0, 1, 0), _v = V();
  /** caixa centrada em `c`, comprimento `w` ao longo da direção `dir` (no plano xy) */
  const peca = (w: number, h: number, d: number, m: THREE.Material, c: V3, dir = V(1, 0, 0), pai: THREE.Object3D = maq) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    b.position.copy(c);
    b.rotation.z = Math.atan2(dir.y, dir.x);
    pai.add(b);
    return b;
  };
  /** cilindro entre dois pontos */
  const tubo = (r: number, a: V3, b: V3, m: THREE.Material, pai: THREE.Object3D = maq) => {
    const d = b.clone().sub(a);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 14), m);
    c.position.copy(a).add(b).multiplyScalar(0.5);
    c.quaternion.setFromUnitVectors(_up, d.normalize());
    pai.add(c);
    return c;
  };

  // ---- estrutura fixa: base, banco reclinado, trilhos ----
  peca(2.5, 0.05, 0.62, metal, V(0.35, 0.025, 0));
  const assento = QUADRIL.clone().add(V(0.1, -0.13, 0));
  peca(0.46, 0.07, 0.44, estofado, assento, V(Math.cos(0.3), Math.sin(0.3), 0));
  const encosto = QUADRIL.clone().addScaledVector(T, 0.5).addScaledVector(N, -0.14);
  peca(0.9, 0.07, 0.46, estofado, encosto, T);
  peca(0.18, 0.06, 0.3, estofado, QUADRIL.clone().addScaledVector(T, 1.0).addScaledVector(N, -0.11), T);
  // pés do banco
  tubo(0.03, assento.clone().add(V(0, -0.04, 0)), V(assento.x, 0.05, 0), metal);
  tubo(0.03, encosto.clone().addScaledVector(T, 0.25).addScaledVector(N, -0.04), V(encosto.x - 0.25 * Math.cos(th), 0.05, 0), metal);
  // trilhos a 45°, abaixo da plataforma
  const trilho0 = QUADRIL.clone().addScaledVector(R, 0.42).addScaledVector(RP, -0.26);
  const trilho1 = QUADRIL.clone().addScaledVector(R, 1.78).addScaledVector(RP, -0.26);
  for (const z of [-0.26, 0.26]) {
    tubo(0.022, trilho0.clone().setZ(z), trilho1.clone().setZ(z), metal);
    tubo(0.026, trilho1.clone().setZ(z), V(trilho1.x, 0.05, z), metal);
    tubo(0.026, trilho0.clone().setZ(z), V(trilho0.x, 0.05, z), metal);
  }

  // ---- travas ao lado do assento: alavancas que giram para fora ----
  const PIVO = QUADRIL.clone().add(V(0.02, -0.06, 0));
  const BRACO_TRAVA = V(0.05, 0.15, 0);
  const travas = [-1, 1].map((sd) => {
    const g = new THREE.Group();
    g.position.copy(PIVO).setZ(0.31 * sd);
    maq.add(g);
    tubo(0.016, V(), BRACO_TRAVA, metal, g);
    const pega = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.09, 14), neon);
    pega.position.copy(BRACO_TRAVA);
    pega.quaternion.setFromUnitVectors(_up, BRACO_TRAVA.clone().normalize());
    g.add(pega);
    return { g, sd };
  });
  const pontaTrava = (sd: number, k: number) => {
    const a = k * 1.15 * sd;
    return PIVO.clone().setZ(0.31 * sd).add(V(BRACO_TRAVA.x, BRACO_TRAVA.y * Math.cos(a), BRACO_TRAVA.y * Math.sin(a)));
  };

  // ---- carrinho: plataforma e anilhas (materiais próprios para ficarem translúcidos na vista de frente) ----
  const platMats = [metal.clone(), anilha.clone(), neon.clone()];
  for (const m of platMats) m.transparent = true;
  const [platMetal, platAnilha, platNeon] = platMats;
  let platOp = 1;
  const carro = new THREE.Group();
  maq.add(carro);
  peca(0.05, 0.66, 0.74, platMetal, V(), R, carro);
  for (const sd of [-1, 1]) peca(0.06, 0.66, 0.025, platNeon, V(0.006, 0.006, 0.36 * sd), R, carro);
  const fundo = V().addScaledVector(R, 0.16).addScaledVector(RP, -0.2);
  peca(0.3, 0.12, 0.6, platMetal, fundo, R, carro);
  for (const sd of [-1, 1]) {
    const chifre = fundo.clone().addScaledVector(RP, 0.1);
    tubo(0.03, chifre.clone().setZ(0.3 * sd), chifre.clone().setZ(0.62 * sd), platMetal, carro);
    for (const [z, r] of [[0.42, 0.23], [0.48, 0.23], [0.54, 0.18]] as const) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.045, 36), platAnilha);
      p.rotation.x = Math.PI / 2;
      p.position.copy(chifre).setZ(z * sd);
      carro.add(p);
    }
    const aro = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.009, 8, 48), platNeon);
    aro.position.copy(chifre).setZ(0.4 * sd);
    carro.add(aro);
  }

  // ---- marcações: cunha do ângulo do joelho e linhas pé → joelho ----
  const N_CUNHA = 24;
  // por cima da perna (sem teste de profundidade): o ângulo fica no plano dela, dentro da calça.
  // A calça é amarela como o neon, então o medidor tem fundo escuro e só o contorno colorido.
  const cunhaMat = {
    bad: new THREE.MeshBasicMaterial({ color: 0x3a120c, transparent: true, side: THREE.DoubleSide, depthWrite: false, depthTest: false }),
    ok: new THREE.MeshBasicMaterial({ color: 0x0b0d10, transparent: true, side: THREE.DoubleSide, depthWrite: false, depthTest: false }),
  };
  const bordaMat = {
    bad: new THREE.LineBasicMaterial({ color: 0xff7a66, transparent: true, depthTest: false }),
    ok: new THREE.LineBasicMaterial({ color: NEON, transparent: true, depthTest: false }),
  };
  const leque = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array((N_CUNHA + 2) * 3), 3));
    const idx: number[] = [];
    for (let i = 1; i <= N_CUNHA; i++) idx.push(0, i, i + 1);
    g.setIndex(idx);
    const m = new THREE.Mesh(g, cunhaMat.ok);
    m.renderOrder = 2; m.visible = false; maq.add(m);
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.BufferAttribute(new Float32Array((N_CUNHA + 3) * 3), 3));
    const l = new THREE.Line(lg, bordaMat.ok);
    l.renderOrder = 3; l.visible = false; maq.add(l);
    return { m, l, op: 0 };
  };
  // só o joelho do lado da câmera: de lado, as duas cunhas se sobrepõem
  const cunha = leque();
  // traços em tubo fino (linhas de WebGL têm 1 px e somem na tela do celular), sempre por cima do corpo
  const tracoG = new THREE.CylinderGeometry(1, 1, 1, 8);
  const traco = (mat: THREE.Material) => {
    const t = new THREE.Mesh(tracoG, mat);
    t.renderOrder = 3; t.visible = false; maq.add(t);
    return t;
  };
  const guiaMat = new THREE.MeshBasicMaterial({ color: NEON, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
  const fantMat = new THREE.MeshBasicMaterial({ color: 0xff7a66, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
  const guias = [traco(guiaMat), traco(guiaMat)];
  const fantasmas = [[traco(fantMat), traco(fantMat)], [traco(fantMat), traco(fantMat)]];
  let guiaOp = 0, fantOp = 0;
  const pontos = (t: THREE.Mesh, a: V3, b: V3, r = 0.009) => {
    const d = _v.copy(b).sub(a);
    t.position.copy(a).addScaledVector(d, 0.5);
    t.scale.set(r, d.length(), r);
    t.quaternion.setFromUnitVectors(_up, d.normalize());
  };

  // ---- medidas (trocadas ao carregar o modelo) ----
  let HUM: Pessoa | null = null;
  let D90 = 0.7, D160 = 0.98, LC = 0.49, LP = 0.5;
  const distDe = (graus: number) => Math.sqrt(LC * LC + LP * LP - 2 * LC * LP * Math.cos((graus * Math.PI) / 180));
  /** distância quadril → tornozelo para uma extensão (aceita valores fora de 0..1) */
  const distExt = (e: number) => lerp(D90, D160, e);
  const ombros = V();
  let baseQ = new THREE.Quaternion(), basePos = V();

  // ---- coreografia: cada trecho usa o tempo das palavras ditas ----
  function pose(tr: Trecho, u: number): Pose {
    const P: Pose = { ext: 1, quadril: 0, valgo: 0, trava: 1, plat: 1, cunha: "", guias: false, fantasma: false, labels: [] };
    const D = tr.t1 - tr.t0;
    const joelho = V(0.08, 1.06, 0.2);
    switch (tr.id) {
      case "posicao": {
        // começa com a plataforma apoiada nas travas, joelhos um pouco dobrados
        P.ext = 0.86; P.trava = 0;
        P.labels.push({ tx: "Costas inteiras no encosto", at: QUADRIL.clone().addScaledVector(T, 0.55).addScaledVector(N, -0.1).setZ(0.24) });
        if (u > tr.cue("quadril")) P.labels.push({ tx: "Quadril encaixado", at: QUADRIL.clone().add(V(0.02, -0.04, 0.2)) });
        break;
      }
      case "pes": {
        P.ext = 0.86; P.trava = 0; P.guias = true;
        if (u > tr.cue("largura") - 0.2) P.labels.push({ tx: "Largura do quadril", at: pePlataforma(0.86).add(V(0, 0.08, 0.2)) });
        break;
      }
      case "destravar": {
        const c = tr.cue("Empurre"), g = tr.cue("gire");
        P.ext = lerp(0.86, 1, seg(u, c, c + 0.9));
        P.trava = seg(u, g, g + 1.0);
        if (u > g - 0.2 && u < D - 0.3) P.labels.push({ tx: "Gire as travas para fora", at: pontaTrava(1, P.trava).add(V(0, 0.04, 0.06)) });
        break;
      }
      case "descida": {
        // a descida dura os 3 segundos que a instrutora fala; embaixo, os joelhos fecham 90°
        const a = tr.cue("Desça"), p = rep(u - a, 3, 1.0, 1.6);
        P.ext = 1 - p;
        P.cunha = p > 0.6 ? "ok" : "";
        if (p > 0.95) P.labels.push({ tx: "Joelhos a 90°", at: joelho });
        break;
      }
      case "quadril-errado": {
        const c = tr.cue("demais"), fim = tr.cue("lombar") + 0.8;
        const p = u < c ? seg(u, c - 1.2, c + 0.6) : u < fim ? 1 : 1 - seg(u, fim, fim + 1.4);
        // fundo demais: o quadril descola do banco e a lombar arredonda
        P.ext = lerp(1, -0.45, p);
        P.quadril = 13 * seg(p, 0.45, 1);
        P.cunha = p > 0.5 ? "bad" : "";
        if (p > 0.7) P.labels.push({ tx: "Quadril saiu do banco", at: QUADRIL.clone().add(V(0.02, -0.02, 0.22)), tom: "bad" });
        break;
      }
      case "joelhos-errado": {
        const c = tr.cue("caindo"), fim = tr.cue("machucam") + 0.6;
        const p = u < c ? seg(u, c - 1.4, c) : u < fim ? 1 : 1 - seg(u, fim, fim + 1.2);
        P.ext = lerp(1, 0.15, p);
        P.valgo = seg(p, 0.3, 1);
        P.plat = 0.14; P.guias = true;
        if (p > 0.8) P.labels.push({ tx: "Joelhos para dentro", at: joelho.clone().setZ(0), tom: "bad" });
        break;
      }
      case "joelhos-certo": {
        const c = tr.cue("certo"), fim = tr.cue("fora") + 0.6;
        const p = u < c ? seg(u, c - 1.0, c + 0.4) : u < fim ? 1 : 1 - seg(u, fim, fim + 1.2);
        P.ext = lerp(1, 0.15, p);
        P.plat = 0.14; P.guias = true;
        P.fantasma = p > 0.5;
        if (u > tr.cue("linha")) P.labels.push({ tx: "Joelho na linha do pé", at: joelho });
        break;
      }
      case "subida": {
        // desce antes da fala; o "Empurre" começa a subida, que para antes de travar os joelhos
        const c = tr.cue("Empurre"), e = tr.cue("final") + 0.2;
        const p = u < c ? seg(u, 0, Math.min(1.3, c)) : 1 - seg(u, c, e);
        P.ext = lerp(0.96, 0, p);
        if (u > c - 0.2 && u < e) P.labels.push({ tx: "Força no calcanhar", at: pePlataforma(P.ext).add(V(0, -0.1, 0.22)) });
        if (u >= e - 0.4) P.labels.push({ tx: "Joelhos sem travar", at: joelho });
        break;
      }
      case "travar": {
        const g = tr.cue("gire");
        P.trava = 1 - seg(u, g, g + 1.0);
        P.ext = u < g + 1.0 ? 1 : lerp(1, 0.86, seg(u, g + 1.1, g + 2.0));
        if (u > g - 0.2 && u < D - 0.6) P.labels.push({ tx: "Travas fechadas antes de sair", at: pontaTrava(1, P.trava).add(V(0, 0.04, 0.06)) });
        break;
      }
    }
    return P;
  }

  /** centro dos pés na plataforma para uma extensão */
  const ALINHA = V().addScaledVector(RP, -0.02);
  function pePlataforma(e: number) {
    return QUADRIL.clone().addScaledVector(R, distExt(e)).add(ALINHA);
  }

  const joelhos = [V(), V()], tornozelos = [V(), V()], quadris = [V(), V()];
  const _q = new THREE.Quaternion(), _z = V(0, 0, 1);
  function aplicar(P: Pose) {
    const pe = pePlataforma(P.ext);
    carro.position.copy(pe).addScaledVector(R, 0.075).addScaledVector(RP, 0.06);
    // gira para fora, junto com a mão (pontaTrava usa o mesmo ângulo)
    travas.forEach((t) => (t.g.rotation.x = t.sd * P.trava * 1.15));
    if (!HUM) return;
    const h = HUM;
    // quadril descolando: o corpo gira em volta da linha dos ombros
    _q.setFromAxisAngle(_z, (P.quadril * Math.PI) / 180);
    h.grupo.quaternion.copy(_q).multiply(baseQ);
    h.grupo.position.copy(basePos).sub(ombros).applyQuaternion(_q).add(ombros);
    h.grupo.updateMatrixWorld(true);
    h.curvarColuna();
    for (let i = 0; i < 2; i++) {
      const s = h.side[i], sd = s.sd;
      const ankle = pe.clone().setZ(0.13 * sd);
      // joelho acompanha a ponta do pé (levemente para fora); no valgo cai para a linha do meio
      const bend = RP.clone().add(V(0, 0, lerp(0.28, -1.1, P.valgo) * sd));
      const ponta = ankle.clone().addScaledVector(RP, 0.2).addScaledVector(R, 0.06).add(V(0, 0, 0.05 * sd));
      const r = h.setLeg(s, ankle, bend, ponta);
      joelhos[i].copy(r.K); tornozelos[i].copy(r.A); quadris[i].copy(r.Q);
      // braços nas travas
      const G = pontaTrava(sd, P.trava);
      const eixoTrava = G.clone().sub(PIVO.clone().setZ(0.31 * sd));
      h.segurar(s, G, { eixo: eixoTrava, palma: V(0, 0, -sd), bend: V(0.15, -0.55, 0.85 * sd), clavicula: 0.12 });
    }
    // cabeça olhando para os joelhos
    const pesc = h.loc(h.B.Neck);
    h.aim(h.B.Neck, pesc.clone().addScaledVector(T, 0.2).addScaledVector(N, 0.07));
  }

  const medida = [0, 0]; // ângulo real do joelho, em graus (conferido nos testes)
  const _a = V(), _b = V(), _ax = V();
  function atualizarMarcas(P: Pose, dt: number) {
    platOp = suave(platOp, P.plat, dt, 8, o.reduzido);
    for (const m of platMats) { m.opacity = platOp; m.depthWrite = platOp > 0.98; }
    for (let i = 0; i < 2; i++) {
      const K = joelhos[i];
      _a.copy(quadris[i]).sub(K).normalize();
      _b.copy(tornozelos[i]).sub(K).normalize();
      const ang = _a.angleTo(_b);
      medida[i] = Math.round((ang * 180) / Math.PI);
      if (i === 0) continue;
      const c = cunha;
      c.op = suave(c.op, P.cunha ? 1 : 0, dt, 8, o.reduzido);
      c.m.visible = c.l.visible = c.op > 0.02;
      if (!c.m.visible) continue;
      if (P.cunha) { c.m.material = cunhaMat[P.cunha]; c.l.material = bordaMat[P.cunha]; }
      (c.m.material as THREE.MeshBasicMaterial).opacity = 0.62 * c.op;
      (c.l.material as THREE.LineBasicMaterial).opacity = c.op;
      _ax.crossVectors(_a, _b).normalize();
      const Rr = 0.26;
      const pos = c.m.geometry.getAttribute("position") as THREE.BufferAttribute;
      const lin = c.l.geometry.getAttribute("position") as THREE.BufferAttribute;
      pos.setXYZ(0, K.x, K.y, K.z); lin.setXYZ(0, K.x, K.y, K.z);
      for (let k = 0; k <= N_CUNHA; k++) {
        _v.copy(_a).applyAxisAngle(_ax, (ang * k) / N_CUNHA).multiplyScalar(Rr).add(K);
        pos.setXYZ(k + 1, _v.x, _v.y, _v.z); lin.setXYZ(k + 1, _v.x, _v.y, _v.z);
      }
      lin.setXYZ(N_CUNHA + 2, K.x, K.y, K.z);
      pos.needsUpdate = true; lin.needsUpdate = true;
      c.m.geometry.computeBoundingSphere();
    }
    // linha certa: do tornozelo passando pelo joelho alinhado com o pé
    guiaOp = suave(guiaOp, P.guias ? 1 : 0, dt, 6, o.reduzido);
    guiaMat.opacity = 0.9 * guiaOp;
    fantOp = suave(fantOp, P.fantasma ? 1 : 0, dt, 6, o.reduzido);
    fantMat.opacity = 0.9 * fantOp;
    for (let i = 0; i < 2; i++) {
      const sd = i ? 1 : -1;
      guias[i].visible = guiaOp > 0.02;
      const A = tornozelos[i], Q = quadris[i];
      const ideal = ik2(Q, A, LC, LP, RP.clone().add(V(0, 0, 0.28 * sd))).M;
      if (guias[i].visible) pontos(guias[i], A, ideal.clone().sub(A).multiplyScalar(1.35).add(A));
      const vis = fantOp > 0.02;
      const [f1, f2] = fantasmas[i];
      f1.visible = f2.visible = vis;
      if (vis) {
        const caido = ik2(Q, A, LC, LP, RP.clone().add(V(0, 0, -1.1 * sd))).M;
        pontos(f1, Q, caido, 0.006); pontos(f2, caido, A, 0.006);
      }
    }
  }

  const rig = criarRig(camera, CAMS, o.reduzido, ["cima"]);
  const rotulos = criarRotulos({
    overlay: o.overlay, camera, raiz: maq, evitar: o.evitar,
    obstaculos() {
      const pts: { a: V3; b: V3 }[] = [];
      for (let i = 0; i < 2; i++) pts.push({ a: quadris[i], b: joelhos[i] }, { a: joelhos[i], b: tornozelos[i] });
      if (HUM) {
        const cab = HUM.cabeca();
        pts.push({ a: cab, b: cab.clone().addScaledVector(T, 0.14) });
        for (const s of HUM.side) pts.push({ a: s.S, b: pontaTrava(s.sd, 0) });
      }
      return pts;
    },
  });

  let ultimoTr = "";
  const suavizar = criarSuavizador(o.reduzido);
  const cena: CenaRoteiro & { medida: number[]; cams: typeof CAMS; dbg: () => unknown } = {
    scene, camera, pronto: false, medida, cams: CAMS,
    dbg: () => ({ cunha: [cunha.m.visible, cunha.op], guia: [guias[1].visible, guiaOp], fant: fantOp, k: joelhos[1].toArray(), q: quadris[1].toArray() }),
    resize(w, h) { rotulos.resize(w, h); },
    livre: rotulos.livre,
    frame(now, dt) {
      const L = o.linha();
      const t = Math.max(0, Math.min(L.dur - 0.001, o.tempo()));
      const tr = trechoEm(L, t);
      let u = t - tr.t0, camNome = tr.cam, chave = tr.id, P: Pose;
      const r = tr.replay;
      if (r && u >= r.em) {
        // replay: a descida revista a 0,5×, depois as pernas voltam para cima antes do próximo capítulo
        const dur = (r.ate - r.de) / r.vel, depois = u - r.em - dur;
        P = pose(tr, depois < 0 ? r.de + (u - r.em) * r.vel : r.ate);
        if (depois > 0) { P.ext = lerp(P.ext, 1, seg(depois, 0, 0.9)); P.cunha = ""; }
        else { P.plat = 0.35; camNome = "lento"; chave = tr.id + ":replay"; }
      } else P = pose(tr, u);
      // emendas entre trechos viram transições; o replay entra com corte de câmera e pode pular
      suavizar(P, t, dt, chave !== ultimoTr && chave.endsWith(":replay"));
      aplicar(P);
      atualizarMarcas(P, dt);
      if (chave !== ultimoTr) { rig.ir(camNome, !ultimoTr || chave.endsWith(":replay")); ultimoTr = chave; }
      rig.quadro(now, dt);
      rotulos.desenhar(P.labels);
    },
    async carregar(onProg) {
      // sem o modelo não há o que demonstrar: o player mostra a imagem estática
      const modelo = await carregarModelo(onProg);
      HUM = criarPessoa(modelo, maq, {
        inclinacao: ENCOSTO,
        posicao(loc, B) {
          const q = loc(B.LeftUpLeg).add(loc(B.RightUpLeg)).multiplyScalar(0.5);
          return QUADRIL.clone().sub(q);
        },
      });
      const s = HUM.side[0];
      LC = s.Lc; LP = s.Lp; D90 = distDe(90); D160 = distDe(158);
      ombros.copy(HUM.side[0].S).add(HUM.side[1].S).multiplyScalar(0.5);
      baseQ = HUM.grupo.quaternion.clone(); basePos = HUM.grupo.position.clone();
      cena.pronto = true;
      return "modelo";
    },
  };
  return cena;
}
