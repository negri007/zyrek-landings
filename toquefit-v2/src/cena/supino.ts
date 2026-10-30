// Cena do supino: banco, barra e a instrutora (modelo Michelle) com pose calculada por IK de dois ossos.
// Sem o modelo, usa o manequim simples da referência.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import type { Cena } from "./motor";
import { trechoEm, type Linha, type Trecho } from "../player/timeline";

type V3 = THREE.Vector3;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const easeIO = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const cl = (k: number) => Math.max(0, Math.min(1, k));
const seg = (u: number, a: number, b: number) => easeIO(cl((u - a) / Math.max(1e-3, b - a)));

export interface Rotulo { tx: string; at: V3 | "cotovelo"; tom?: "bad" | "good" | "dim" }

interface Pose {
  bx: number; by: number; grip: number;
  mix: number; // 0 = mãos soltas ao lado do corpo, 1 = segurando a barra
  ang: number; // ângulo do braço em relação ao tronco (graus): 90 errado, ~45 certo
  cunha: "" | "bad" | "ok";
  depth: boolean; width: boolean;
  barra: number; // opacidade da barra (1 = normal)
  anilhas?: number; // opacidade só das anilhas (replay: a barra fica sólida para ver até onde desce)
  fantasma: boolean; // contorno vermelho do 90° para comparar com o certo
  labels: Rotulo[];
}

export interface Segmento { ax: number; ay: number; bx: number; by: number }

const CAMS: Record<string, { p: number[]; l: number[]; u: number[] }> = {
  side: { p: [-0.4, -0.05, 7], l: [-0.5, -0.65, 0], u: [0, 1, 0] },
  close: { p: [-0.9, 3.3, 2.5], l: [-1, -0.4, 0], u: [0, 1, 0] },
  top: { p: [-0.6, 6.4, 0.001], l: [-0.6, -0.7, 0], u: [-1, 0, 0] },
  front: { p: [3.0, 4.7, 1.3], l: [-1.15, -0.55, 0], u: [0, 1, 0] },
  tq: { p: [2.2, 2.8, 6], l: [-0.7, -0.5, 0], u: [0, 1, 0] },
  // de cima, cabeça no alto da tela: o ângulo do cotovelo fica no plano da imagem, sem perspectiva achatando
  // replay em câmera lenta: de lado, na altura do peito, para ver até onde a barra desce
  lento: { p: [-0.75, 0.25, 3.3], l: [-1.0, -0.45, 0], u: [0, 1, 0] },
  cima: { p: [0.7, 3.35, 0.001], l: [-0.9, -0.5, 0], u: [-1, 0, 0] },
};

export interface OpcoesSupino {
  linha: () => Linha;
  tempo: () => number;
  overlay: HTMLElement;
  reduzido: boolean;
  /** caixas da interface por cima do vídeo (aviso, selos) que os rótulos também devem evitar */
  evitar?: () => { x: number; y: number; w: number; h: number }[];
}

export function criarSupino(o: OpcoesSupino) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  scene.add(new THREE.AmbientLight(0x8a96a8, 1.1));
  scene.add(new THREE.HemisphereLight(0xdfe6ee, 0x2a2f36, 1.3));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(4, 6, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xf3ff2c, 0.7);
  rim.position.set(-5, 3, -4);
  scene.add(rim);
  // luz de cima para o braço não sumir contra o fundo escuro na vista superior
  const topo = new THREE.DirectionalLight(0xffffff, 1.4);
  topo.position.set(1, 8, 0);
  scene.add(topo);
  const neonL = new THREE.PointLight(0xf3ff2c, 14, 14, 2);
  neonL.position.set(-2.5, 2.2, 2.5);
  scene.add(neonL);

  const metal = new THREE.MeshStandardMaterial({ color: 0x6a727c, metalness: 0.8, roughness: 0.35 });
  const plateM = new THREE.MeshStandardMaterial({ color: 0x2a2f36, metalness: 0.55, roughness: 0.45 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xd8dde3, roughness: 0.55, metalness: 0.05 });
  const topM = new THREE.MeshStandardMaterial({ color: 0x30363e, roughness: 0.6 });
  const legM = new THREE.MeshStandardMaterial({ color: 0x22262c, roughness: 0.7 });
  const neonM = new THREE.MeshStandardMaterial({ color: 0xf3ff2c, emissive: 0xf3ff2c, emissiveIntensity: 0.55, roughness: 0.4 });
  const padM = new THREE.MeshStandardMaterial({ color: 0x1a1d22, roughness: 0.8 });

  const grid = new THREE.GridHelper(10, 20, 0x3a4048, 0x262b31);
  grid.position.y = -1.62;
  scene.add(grid);

  const benchG = new THREE.Group();
  benchG.scale.setScalar(1.7);
  benchG.position.y = -1.62;
  scene.add(benchG);
  const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    b.position.set(x, y, z);
    benchG.add(b);
    return b;
  };
  const ball = (r: number, m: THREE.Material, v: V3, sc?: [number, number, number]) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), m);
    b.position.copy(v);
    if (sc) b.scale.set(...sc);
    benchG.add(b);
    return b;
  };
  box(1.62, 0.08, 0.32, padM, -0.36, 0.45, 0);
  for (const x of [-0.85, 0.35]) { box(0.06, 0.41, 0.06, metal, x, 0.205, 0); box(0.06, 0.04, 0.42, metal, x, 0.02, 0); }
  const hooks: THREE.Mesh[] = [];
  for (const z of [-0.55, 0.55]) { box(0.05, 1.45, 0.05, metal, -0.88, 0.725, z); hooks.push(box(0.1, 0.03, 0.05, metal, -0.83, 1.105, z)); }

  // ---- manequim (reserva quando o modelo não carrega) ----
  const nBody = benchG.children.length;
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.135, 0.95, 22), topM);
  torso.rotation.z = Math.PI / 2; torso.scale.set(0.75, 1, 1.3); torso.position.set(-0.3, 0.6, 0); benchG.add(torso);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.152, 0.152, 0.04, 22), neonM);
  band.rotation.z = Math.PI / 2; band.scale.set(0.75, 1, 1.3); band.position.set(-0.05, 0.6, 0); benchG.add(band);
  ball(0.15, legM, V(0.2, 0.58, 0), [1, 0.72, 1.25]);
  ball(0.11, skin, V(-0.99, 0.66, 0));
  const UP = V(0, 1, 0);
  const limb = (r: number, m: THREE.Material) => {
    const g = new THREE.Group();
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.88, 1, 14), m);
    g.add(c); g.userData.c = c; benchG.add(g);
    return g;
  };
  const setLimb = (g: THREE.Group, a: V3, b: V3) => {
    const d = b.clone().sub(a);
    g.position.copy(a).add(b).multiplyScalar(0.5);
    (g.userData.c as THREE.Mesh).scale.y = d.length();
    g.quaternion.setFromUnitVectors(UP, d.normalize());
  };
  setLimb(limb(0.045, skin), V(-0.8, 0.63, 0), V(-0.92, 0.66, 0));
  for (const sd of [-1, 1]) {
    const hip = V(0.25, 0.56, 0.1 * sd), knee = V(0.62, 0.63, 0.17 * sd), ank = V(0.72, 0.09, 0.24 * sd);
    setLimb(limb(0.07, legM), hip, knee); setLimb(limb(0.055, legM), knee, ank); ball(0.06, legM, knee);
    box(0.18, 0.06, 0.09, neonM, ank.x + 0.05, 0.04, ank.z);
  }
  const arms = [-1, 1].map((sd) => ({
    sd, S: V(-0.72, 0.66, 0.2 * sd), up: limb(0.05, skin), fo: limb(0.04, skin),
    el: ball(0.045, skin, V()), ha: ball(0.04, skin, V()), sh: ball(0.065, topM, V(-0.72, 0.66, 0.2 * sd)),
    E: V(), H: V(),
  }));
  const manq = benchG.children.slice(nBody);
  const mostrarManequim = (v: boolean) => manq.forEach((m) => (m.visible = v));

  // ---- barra ----
  // materiais próprios da barra: no capítulo Cotovelos ela fica translúcida para mostrar o braço embaixo
  const barMats = [metal.clone(), plateM.clone(), neonM.clone()];
  for (const m of barMats) m.transparent = true;
  const [barMetal, barPlate, barNeon] = barMats;
  let barOp = 1, anOp = 1;
  const barG = new THREE.Group();
  benchG.add(barG);
  const barM = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.5, 10), barMetal);
  barM.rotation.x = Math.PI / 2; barG.add(barM);
  for (const sd of [-1, 1]) {
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 36), barPlate);
    pl.rotation.x = Math.PI / 2; pl.position.z = 0.6 * sd; barG.add(pl);
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.01, 8, 48), barNeon);
    r.position.z = 0.6 * sd + 0.026 * sd; barG.add(r);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 12), barMetal);
    col.rotation.x = Math.PI / 2; col.position.z = 0.55 * sd; barG.add(col);
  }

  // ---- guias (desenhadas atrás do corpo: testam profundidade, então o braço sempre fica na frente) ----
  const lineN = new THREE.MeshBasicMaterial({ color: 0xf3ff2c, transparent: true, opacity: 0.9 });
  const lineW = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
  const guide = (w: number, h: number, d: number, m: THREE.Material) => {
    const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    g.visible = false; benchG.add(g);
    return g;
  };
  const depthLine = guide(0.014, 0.005, 0.8, lineN);
  const shL = [-1, 1].map(() => guide(0.75, 0.004, 0.008, lineW));
  const grL = [-1, 1].map(() => guide(0.75, 0.004, 0.012, lineN));

  // cunha do ângulo braço × tronco, no plano do ombro
  const N_CUNHA = 28;
  const cunhaMat = {
    bad: new THREE.MeshBasicMaterial({ color: 0xff6a55, transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false }),
    ok: new THREE.MeshBasicMaterial({ color: 0xf3ff2c, transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false }),
  };
  const bordaMat = {
    bad: new THREE.LineBasicMaterial({ color: 0xff7a66, transparent: true }),
    ok: new THREE.LineBasicMaterial({ color: 0xf3ff2c, transparent: true }),
  };
  const cunhas = [-1, 1].map(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array((N_CUNHA + 2) * 3), 3));
    const idx: number[] = [];
    for (let i = 1; i <= N_CUNHA; i++) idx.push(0, i, i + 1);
    g.setIndex(idx);
    const m = new THREE.Mesh(g, cunhaMat.ok);
    m.renderOrder = 2; m.visible = false; benchG.add(m);
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.BufferAttribute(new Float32Array((N_CUNHA + 3) * 3), 3));
    const l = new THREE.Line(lg, bordaMat.ok);
    l.renderOrder = 3; l.visible = false; benchG.add(l);
    return { m, l, op: 0 };
  });

  const fantMat = new THREE.LineDashedMaterial({ color: 0xff7a66, dashSize: 0.03, gapSize: 0.022, transparent: true, opacity: 0 });
  const fantasmas = [-1, 1].map(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array((N_CUNHA + 3) * 3), 3));
    const l = new THREE.Line(g, fantMat);
    l.renderOrder = 3; l.visible = false; benchG.add(l);
    return l;
  });
  let fantOp = 0;

  // ---- medidas (manequim; trocadas ao carregar o modelo) ----
  let TOP = 1.12, BOT = 0.77, RX = -0.82, RY = 1.14, PX = -0.7, BX = -0.6, GP = 0.42, GO = 0.56, GC = 0.2, SZ = 0.2;
  let HUM: ReturnType<typeof criarPessoa> | null = null;
  const L1 = 0.3, L2 = 0.29;

  function rep(u: number, d: number, h: number, up: number) {
    if (u < 0) return 0;
    if (u < d) return easeIO(u / d);
    if (u < d + h) return 1;
    if (u < d + h + up) return 1 - easeIO((u - d - h) / up);
    return 0;
  }
  // fundo: onde a barra toca o peito (BX = linha do mamilo; menor = mais perto do pescoço)
  const atP = (p: number, fundo = BX) => ({ bx: lerp(PX, fundo, p), by: lerp(TOP, BOT, p) });

  // ---- coreografia: cada trecho usa o tempo das palavras ditas ----
  function pose(tr: Trecho, u: number): Pose {
    const P: Pose = { bx: PX, by: TOP, grip: GP, mix: 1, ang: 52, cunha: "", depth: false, width: false, barra: 1, fantasma: false, labels: [] };
    const D = tr.t1 - tr.t0;
    switch (tr.id) {
      case "posicao": {
        P.bx = RX; P.by = RY;
        const c = tr.cue("olhos");
        P.mix = seg(u, c, Math.min(D - 0.4, c + 2.4));
        P.labels.push({ tx: "Pés firmes no chão", at: V(0.8, 0.14, 0.26) });
        if (u > c) P.labels.push({ tx: "Olhos sob a barra", at: V(-1, 0.84, 0) });
        break;
      }
      case "pegada": {
        P.width = true;
        const c = tr.cue("tire");
        if (u < c) { P.bx = RX; P.by = RY; }
        else if (u < c + 1.2) { P.bx = RX; P.by = lerp(RY, RY + 0.07, seg(u, c, c + 1.2)); }
        else { const k = seg(u, c + 1.2, c + 2.6); P.bx = lerp(RX, PX, k); P.by = lerp(RY + 0.07, TOP, k); }
        P.labels.push({ tx: "Largura dos ombros", at: V(-0.15, TOP + 0.18, -SZ), tom: "dim" },
          { tx: "Mãos um pouco mais abertas", at: V(-1.05, TOP + 0.19, GP) });
        break;
      }
      case "descida": {
        // a descida dura exatamente os 2 segundos que a instrutora fala
        const a = tr.cue("Desça"), p = rep(u - a, 2, 1.1, 1.4);
        Object.assign(P, atP(p));
        P.depth = p > 0.4;
        if (p > 0.92) P.labels.push({ tx: "Até aqui: encosta de leve no peito", at: V(BX, 0.78, 0.2) });
        break;
      }
      case "cotovelos-errado": {
        const c = tr.cue("90"), fim = tr.cue("ombro") + 0.5;
        const p = u < c ? seg(u, c - 1.7, c) : u < fim ? 1 : 1 - seg(u, fim, fim + 1.4);
        // errado: cotovelos na linha dos ombros, barra descendo para o pescoço, pegada mais aberta
        Object.assign(P, atP(p, BX - 0.13));
        P.grip = GP + 0.09;
        P.ang = 90;
        P.cunha = p > 0.35 ? "bad" : "";
        P.barra = 1 - 0.75 * p;
        break;
      }
      case "cotovelos-certo": {
        const c = tr.cue("45"), fim = tr.cue("corpo") + 0.6;
        const p = u < c ? seg(u, c - 1.6, c) : u < fim ? 1 : 1 - seg(u, fim, fim + 1.4);
        // certo: cotovelos para o quadril, barra no meio do peito, antebraço na vertical
        const k = seg(u, 0, 1.0);
        Object.assign(P, atP(p, BX + 0.05));
        P.grip = lerp(GP + 0.09, GP - 0.02, k);
        P.ang = lerp(90, 45, k);
        P.cunha = p > 0.35 ? "ok" : "";
        P.fantasma = p > 0.35;
        P.barra = 1 - 0.75 * p;
        break;
      }
      case "subida": {
        // desce antes da fala; o "Empurre" começa a subida, que termina junto com "braços"
        const c = tr.cue("Empurre"), e = tr.cue("braços") + 0.3;
        const p = u < c ? seg(u, 0, Math.min(1.5, c)) : 1 - seg(u, c, e);
        Object.assign(P, atP(p));
        if (u > c && u < e) P.labels.push({ tx: "Solte o ar ao subir", at: V(P.bx, P.by + 0.14, 0) });
        P.labels.push({ tx: "Quadril no banco", at: V(0.2, 0.46, 0.3) });
        break;
      }
      case "pegada-aberta": case "pegada-fechada": case "pegada-padrao": {
        const i = ["pegada-aberta", "pegada-fechada", "pegada-padrao"].indexOf(tr.id);
        const alvo = [GO, GC, GP][i], antes = [GP, GO, GC][i];
        const c = tr.cue(["aberta", "fechada", "padrão"][i]);
        P.width = true;
        P.grip = lerp(antes, alvo, seg(u, c - 0.2, c + 0.6));
        Object.assign(P, atP(rep(u - c - 0.9, 1.4, 0.2, 1)));
        P.labels.push({ tx: ["Aberta · mais peito", "Fechada · mais tríceps", "Padrão · equilíbrio"][i], at: V(P.bx - 0.3, P.by + 0.12, P.grip) });
        break;
      }
      case "suporte": {
        const c = tr.cue("volte");
        if (u >= c && u < c + 1.5) { const k = seg(u, c, c + 1.5); P.bx = lerp(PX, RX, k); P.by = lerp(TOP, RY + 0.08, k); }
        else if (u >= c + 1.5) { P.bx = RX; P.by = lerp(RY + 0.08, RY, seg(u, c + 1.5, c + 2.4)); }
        P.mix = 1 - seg(u, D - 2.0, D - 0.6);
        if (u > c && u < c + 2.6) P.labels.push({ tx: "Braços estendidos ao voltar", at: V(P.bx, P.by + 0.14, 0.2) });
        break;
      }
    }
    return P;
  }

  const _b = V(), _t = V();
  function bendDe(ang: number, sd: number) {
    const a = (ang * Math.PI) / 180;
    return _b.set(Math.cos(a) * 0.95, -0.3, Math.sin(a) * sd);
  }

  function aplicar(P: Pose) {
    barG.position.set(P.bx, P.by, 0);
    for (let idx = 0; idx < arms.length; idx++) {
      const a = arms[idx];
      const G = _t.set(P.bx, P.by, P.grip * a.sd);
      const bend = bendDe(P.ang, a.sd);
      if (HUM) {
        const sd = HUM.side[idx];
        const solta = sd.S.clone().add(V(0.36, -0.24, 0.1 * a.sd));
        const alvo = solta.lerp(G, easeIO(P.mix));
        const k = easeIO(cl((P.mix - 0.82) / 0.18));
        const r = HUM.setArm(sd, alvo, bend, k);
        a.E.copy(r.E); a.H.copy(r.H);
        continue;
      }
      const H = V(-0.42, 0.5, 0.3 * a.sd).lerp(G, P.mix);
      const d = H.clone().sub(a.S);
      const dl = Math.min(Math.max(d.length(), 0.05), L1 + L2 - 0.001);
      const u = d.clone().normalize();
      const aa = (L1 * L1 - L2 * L2 + dl * dl) / (2 * dl), h = Math.sqrt(Math.max(0, L1 * L1 - aa * aa));
      const n = bend.clone().sub(u.clone().multiplyScalar(bend.dot(u))).normalize();
      const E = a.S.clone().add(u.clone().multiplyScalar(aa)).add(n.multiplyScalar(h));
      const Hr = a.S.clone().add(u.multiplyScalar(dl));
      setLimb(a.up, a.S, E); setLimb(a.fo, E, Hr); a.el.position.copy(E); a.ha.position.copy(Hr);
      a.E.copy(E); a.H.copy(Hr);
    }
    depthLine.visible = P.depth;
    depthLine.position.set(BX, BOT - 0.025, 0);
    shL.forEach((g, i) => { g.visible = P.width; g.position.set(-0.7, TOP + 0.18, SZ * (i ? 1 : -1)); });
    grL.forEach((g, i) => { g.visible = P.width; g.position.set(-0.7, TOP + 0.19, P.grip * (i ? 1 : -1)); });
  }

  const medida = [0, 0]; // ângulo real braço × tronco, em graus (conferido nos testes)
  function atualizarCunhas(P: Pose, dt: number) {
    const k = o.reduzido ? 1 : 1 - Math.exp(-dt * 10);
    barOp += (P.barra - barOp) * k;
    anOp += ((P.anilhas ?? P.barra) - anOp) * k;
    barMetal.opacity = barOp; barMetal.depthWrite = barOp > 0.98;
    for (const m of [barPlate, barNeon]) { m.opacity = anOp; m.depthWrite = anOp > 0.98; }
    for (let i = 0; i < 2; i++) {
      const c = cunhas[i], a = arms[i];
      const alvo = P.cunha ? 1 : 0;
      c.op += (alvo - c.op) * (o.reduzido ? 1 : 1 - Math.exp(-dt * 8));
      const vis = c.op > 0.02;
      c.m.visible = c.l.visible = vis;
      if (!vis) continue;
      if (P.cunha) { c.m.material = cunhaMat[P.cunha]; c.l.material = bordaMat[P.cunha]; }
      (c.m.material as THREE.MeshBasicMaterial).opacity = 0.5 * c.op;
      (c.l.material as THREE.LineBasicMaterial).opacity = c.op;
      const S = HUM ? HUM.side[i].S : a.S;
      const dir = a.E.clone().sub(S); dir.y = 0;
      const ang = Math.atan2(Math.abs(dir.z), dir.x); // 0 = ao longo do tronco (para os pés)
      medida[i] = Math.round((ang * 180) / Math.PI);
      const R = (HUM ? HUM.side[i].L1 : L1) * 1.25; // maior que o braço: a silhueta do braço aparece contra a cunha
      const y = Math.min(S.y, arms[0].E.y, arms[1].E.y) - 0.07;
      const pos = c.m.geometry.getAttribute("position") as THREE.BufferAttribute;
      const lin = c.l.geometry.getAttribute("position") as THREE.BufferAttribute;
      pos.setXYZ(0, S.x, y, S.z);
      lin.setXYZ(0, S.x, y, S.z);
      for (let k = 0; k <= N_CUNHA; k++) {
        const th = (ang * k) / N_CUNHA;
        const x = S.x + Math.cos(th) * R, z = S.z + Math.sin(th) * R * a.sd;
        pos.setXYZ(k + 1, x, y, z);
        lin.setXYZ(k + 1, x, y, z);
      }
      lin.setXYZ(N_CUNHA + 2, S.x, y, S.z);
      pos.needsUpdate = true; lin.needsUpdate = true;
      c.m.geometry.computeBoundingSphere();
    }
    fantOp += ((P.fantasma ? 1 : 0) - fantOp) * (o.reduzido ? 1 : 1 - Math.exp(-dt * 6));
    fantMat.opacity = 0.9 * fantOp;
    for (let i = 0; i < 2; i++) {
      const l = fantasmas[i], a = arms[i];
      l.visible = fantOp > 0.02;
      if (!l.visible) continue;
      const S = HUM ? HUM.side[i].S : a.S;
      const R = (HUM ? HUM.side[i].L1 : L1) * 1.25, y = Math.min(S.y, arms[0].E.y, arms[1].E.y) - 0.065;
      const at = l.geometry.getAttribute("position") as THREE.BufferAttribute;
      at.setXYZ(0, S.x, y, S.z);
      for (let k = 0; k <= N_CUNHA; k++) {
        const th = (Math.PI / 2) * (k / N_CUNHA);
        at.setXYZ(k + 1, S.x + Math.cos(th) * R, y, S.z + Math.sin(th) * R * a.sd);
      }
      at.setXYZ(N_CUNHA + 2, S.x, y, S.z);
      at.needsUpdate = true;
      l.computeLineDistances();
      l.geometry.computeBoundingSphere();
    }
  }

  // ---- câmera: transição com easing e leve deslocamento lateral, como corte de vídeo editado ----
  const cam = { p: V(...(CAMS.side.p as [number, number, number])), l: V(...(CAMS.side.l as [number, number, number])), u: V(0, 1, 0) };
  const de = { p: V(), l: V(), u: V() };
  let camAtual = "", camT = 1, camLado = 1;
  const DUR_CAM = 1.15;
  function irPara(nome: string, imediato: boolean) {
    if (nome === camAtual) return;
    de.p.copy(cam.p); de.l.copy(cam.l); de.u.copy(cam.u);
    camAtual = nome;
    camT = imediato || o.reduzido ? 1 : 0;
    camLado = -camLado;
  }

  // ---- rótulos em HTML, posicionados para não cobrir braços nem rosto ----
  const pool: HTMLSpanElement[] = [];
  let W = 1, Hh = 1;
  const proj = (v: V3) => {
    const w = v.clone();
    benchG.localToWorld(w);
    w.project(camera);
    return { x: ((w.x + 1) / 2) * W, y: ((1 - w.y) / 2) * Hh, z: w.z };
  };
  const segs: Segmento[] = [];
  function obstaculos(): Segmento[] {
    segs.length = 0;
    const pts: { a: V3; b: V3 }[] = [];
    for (let i = 0; i < 2; i++) {
      const S = HUM ? HUM.side[i].S : arms[i].S;
      pts.push({ a: S, b: arms[i].E }, { a: arms[i].E, b: arms[i].H });
    }
    const cabeca = HUM ? HUM.cabeca() : V(-0.99, 0.66, 0);
    pts.push({ a: cabeca, b: cabeca.clone().add(V(0.12, 0, 0)) });
    pts.push({ a: V(BX - 0.02, barG.position.y, -0.45), b: V(BX - 0.02, barG.position.y, 0.45) });
    for (const p of pts) { const A = proj(p.a), B = proj(p.b); segs.push({ ax: A.x, ay: A.y, bx: B.x, by: B.y }); }
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
   * de braços, rosto, barra e dos elementos da interface passados em `evitar`.
   */
  function livre(cands: { x: number; y: number }[], w: number, h: number, margem = 8, topo = 52,
    evitar: { x: number; y: number; w: number; h: number }[] = [], folga = 30) {
    const ss = obstaculos();
    let best = cands[0], bs = -Infinity;
    for (const c of cands) {
      const x = Math.max(margem, Math.min(W - w - margem, c.x)), y = Math.max(topo, Math.min(Hh - h - margem, c.y));
      let s = Infinity;
      for (const sg of ss) s = Math.min(s, distSegRet(sg, x - 6, y - 6, w + 12, h + 12));
      for (const r of evitar) {
        const dx = Math.max(r.x - (x + w), 0, x - (r.x + r.w)), dy = Math.max(r.y - (y + h), 0, y - (r.y + r.h));
        s = Math.min(s, Math.hypot(dx, dy) - 4);
      }
      if (s >= folga) return { x, y };
      if (s > bs + 0.5) { bs = s; best = { x, y }; }
    }
    return best;
  }

  function desenharRotulos(list: Rotulo[]) {
    const ov = o.overlay;
    while (pool.length < list.length) {
      const sp = document.createElement("span");
      sp.className = "lbl";
      ov.appendChild(sp);
      pool.push(sp);
    }
    const ev = list.length ? o.evitar?.() || [] : [];
    for (let i = 0; i < pool.length; i++) {
      const sp = pool[i], L = list[i];
      if (!L) { sp.style.opacity = "0"; continue; }
      if (sp.dataset.t !== L.tx) { sp.textContent = L.tx; sp.dataset.t = L.tx; }
      const c = "lbl" + (L.tom ? " " + L.tom : "");
      if (sp.className !== c) sp.className = c;
      const pt = proj(L.at === "cotovelo" ? arms[1].E : L.at);
      const w = sp.offsetWidth, h = sp.offsetHeight;
      const g = 26;
      const pos = livre([
        { x: pt.x - w / 2, y: pt.y - h - g }, { x: pt.x - w / 2, y: pt.y + g },
        { x: pt.x + g, y: pt.y - h / 2 }, { x: pt.x - w - g, y: pt.y - h / 2 },
      ], w, h, 8, 56, ev);
      sp.style.transform = `translate(${pos.x.toFixed(1)}px,${pos.y.toFixed(1)}px)`;
      sp.style.opacity = pt.z < 1 ? "1" : "0";
    }
  }

  let ultimoTr = "";
  const cena: Cena & {
    carregar(onProg: (p: number) => void): Promise<"modelo" | "manequim">;
    livre: typeof livre;
    medida: number[];
    cams: typeof CAMS;
    dbg: () => unknown;
    pronto: boolean;
  } = {
    scene, camera, pronto: false,
    resize(w, h) { W = w; Hh = h; },
    frame(now, dt) {
      const L = o.linha();
      const t = Math.max(0, Math.min(L.dur - 0.001, o.tempo()));
      const tr = trechoEm(L, t);
      let u = t - tr.t0, camNome = tr.cam, chave = tr.id, P: Pose;
      const r = tr.replay;
      if (r && u >= r.em) {
        // replay: o mesmo trecho revisto a 0,5×, depois a barra volta para cima antes do próximo capítulo
        const dur = (r.ate - r.de) / r.vel, depois = u - r.em - dur;
        P = pose(tr, depois < 0 ? r.de + (u - r.em) * r.vel : r.ate);
        if (depois > 0) Object.assign(P, atP(1 - seg(depois, 0, 0.9)));
        else { P.depth = true; P.anilhas = 0.18; camNome = "lento"; chave = tr.id + ":replay"; }
      } else P = pose(tr, u);
      aplicar(P);
      atualizarCunhas(P, dt);
      if (chave !== ultimoTr) { irPara(camNome, !ultimoTr || chave.endsWith(":replay")); ultimoTr = chave; }
      const C = CAMS[camAtual] || CAMS.side;
      camT = Math.min(1, camT + dt / DUR_CAM);
      const k = easeIO(camT);
      const drift = o.reduzido || camAtual === "top" ? 0 : 0.14, ts = now / 1000;
      _t.set(C.p[0] + Math.sin(ts * 0.3) * drift, C.p[1], C.p[2] + Math.cos(ts * 0.27) * drift);
      cam.p.lerpVectors(de.p, _t, k);
      // deslocamento lateral que some no fim da transição
      if (k < 1) {
        const dir = V(...(C.l as [number, number, number])).sub(_t).normalize();
        const lado = dir.cross(V(...(C.u as [number, number, number]))).normalize();
        cam.p.addScaledVector(lado, Math.sin(Math.PI * k) * 0.6 * camLado);
      }
      cam.l.lerpVectors(de.l, _t.set(C.l[0], C.l[1], C.l[2]), k);
      cam.u.lerpVectors(de.u, _t.set(C.u[0], C.u[1], C.u[2]), k);
      camera.position.copy(cam.p);
      camera.up.copy(cam.u).normalize();
      camera.lookAt(cam.l);
      camera.updateMatrixWorld();
      desenharRotulos(P.labels);
    },
    livre,
    medida,
    cams: CAMS,
    dbg: () => HUM?.side.map((x) => x.dbg),
    async carregar(onProg) {
      try {
        const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
        const g = await loader.loadAsync(`${import.meta.env.BASE_URL}models/michelle.glb`, (e) => {
          if (e.total) onProg(e.loaded / e.total);
        });
        HUM = criarPessoa(g.scene, benchG);
        mostrarManequim(false);
        SZ = Math.abs(HUM.side[0].S.z); GP = 0.3; GO = 0.4; GC = 0.15; TOP = 1.31; RY = 1.33; BOT = 0.87;
        hooks.forEach((h) => (h.position.y = RY - 0.035));
        cena.pronto = true;
        return "modelo";
      } catch (e) {
        console.warn("[toquefit] modelo 3D indisponível, usando manequim", e);
        HUM = null;
        mostrarManequim(true);
        cena.pronto = true;
        return "manequim";
      }
    },
  };
  mostrarManequim(true);
  return cena;
}

// Cria a pessoa a partir do modelo glTF e expõe controles de pose (coordenadas locais do banco).
function criarPessoa(model: THREE.Object3D, benchG: THREE.Group) {
  const B: Record<string, THREE.Bone> = {};
  model.traverse((o) => {
    if ((o as THREE.Bone).isBone) { B[o.name.replace(/^mixamorig[:_]?/, "")] = o as THREE.Bone; o.userData.rq = o.quaternion.clone(); }
    if ((o as THREE.Mesh).isMesh) { o.frustumCulled = false; }
  });
  model.updateMatrixWorld(true);
  const wp = (b: THREE.Object3D) => b.getWorldPosition(V());
  const H = wp(B.HeadTop_End).y - Math.min(wp(B.LeftToe_End).y, wp(B.LeftFoot).y);
  const hum = new THREE.Group();
  hum.add(model);
  benchG.add(hum);
  hum.scale.setScalar(2.05 / H);
  hum.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(0, 0, -1), V(-1, 0, 0), V(0, 1, 0)));
  const loc = (b: THREE.Object3D) => { benchG.updateMatrixWorld(true); return benchG.worldToLocal(b.getWorldPosition(V())); };
  hum.updateMatrixWorld(true);
  const la = loc(B.LeftArm), ra = loc(B.RightArm), s1 = loc(B.Spine1);
  hum.position.x += -0.72 - (la.x + ra.x) / 2;
  hum.position.y += 0.685 - s1.y;
  hum.position.z += -(la.z + ra.z) / 2;
  hum.updateMatrixWorld(true);
  const Y = V(0, 1, 0);
  const _q = new THREE.Quaternion(), _pq = new THREE.Quaternion();
  function aim(bone: THREE.Bone, tLocal: V3) {
    bone.parent!.updateMatrixWorld(true);
    const tw = benchG.localToWorld(tLocal.clone());
    const bw = bone.getWorldPosition(V());
    const d = tw.sub(bw).normalize();
    bone.parent!.getWorldQuaternion(_pq).invert();
    const rq = bone.userData.rq as THREE.Quaternion;
    const rd = Y.clone().applyQuaternion(rq);
    bone.quaternion.setFromUnitVectors(rd, d.applyQuaternion(_pq)).multiply(rq);
    bone.updateMatrixWorld(true);
  }
  const dist = (a: THREE.Object3D, b: THREE.Object3D) => loc(a).distanceTo(loc(b));
  type Lado = {
    sd: number; P: string; A: THREE.Bone; F: THREE.Bone; U: THREE.Bone; K: THREE.Bone; Ft: THREE.Bone;
    S: V3; L1: number; L2: number;
    hand: { hand: THREE.Bone; fl: V3; pl: V3; palmLen: number };
    fing: { b: THREE.Bone; axl: V3; amt: number; rel: number }[];
    nPrev: V3 | null;
    dbg?: Record<string, number[]>;
  };
  const side: Lado[] = (["Left", "Right"] as const).map((P, i) => ({
    sd: i ? 1 : -1, P, A: B[P + "Arm"], F: B[P + "ForeArm"], U: B[P + "UpLeg"], K: B[P + "Leg"], Ft: B[P + "Foot"],
    S: V(), L1: 0, L2: 0, hand: null as never, fing: [], nPrev: null,
  }));
  side.forEach((s) => { s.S = loc(s.A); s.L1 = dist(s.A, s.F); s.L2 = dist(s.F, B[s.P + "Hand"]); });
  // pernas: joelhos dobrados, pés no chão
  side.forEach((s) => {
    const hp = loc(s.U), Lt = dist(s.U, s.K), Ls = dist(s.K, s.Ft);
    const knee = hp.clone().add(V(0.92, -0.12, 0.12 * s.sd).normalize().multiplyScalar(Lt));
    const dy = 0.1 - knee.y, dz = 0.05 * s.sd, dx = Math.sqrt(Math.max(0, Ls * Ls - dy * dy - dz * dz));
    const ank = knee.clone().add(V(dx, dy, dz));
    aim(s.U, knee); aim(s.K, ank); aim(s.Ft, ank.clone().add(V(1, -0.25, 0)));
  });
  // mão: eixos da palma calculados a partir do esqueleto, no referencial do osso da mão
  side.forEach((sd) => {
    const P = sd.P, hand = B[P + "Hand"], i1 = B[P + "HandIndex1"], p1 = B[P + "HandPinky1"], m1 = B[P + "HandMiddle1"], t1 = B[P + "HandThumb1"];
    const f = i1.position.clone().add(p1.position).normalize();
    const across = p1.position.clone().sub(i1.position).normalize();
    const palm = f.clone().cross(across).normalize();
    if (palm.dot(t1.position) < 0) palm.negate();
    const fo = f.clone().sub(palm.clone().multiplyScalar(f.dot(palm))).normalize();
    sd.hand = { hand, fl: fo, pl: palm, palmLen: dist(hand, m1) };
    const ax = across.clone();
    if (ax.clone().cross(fo).dot(palm) < 0) ax.negate();
    // fechamento por falange; "rel" é a curvatura de mão relaxada (sem segurar nada)
    const amts = [1.2, 1.3, 0.95];
    for (const fn of ["Index", "Middle", "Ring", "Pinky"]) {
      const C = new THREE.Quaternion();
      for (let k = 1; k <= 3; k++) {
        const b = B[P + "Hand" + fn + k];
        if (!b) break;
        C.multiply(b.userData.rq);
        sd.fing.push({ b, axl: ax.clone().applyQuaternion(C.clone().invert()), amt: amts[k - 1], rel: 0.14 + 0.03 * k });
      }
    }
    // polegar discreto: pouca rotação, só nas falanges de ponta, para não deformar a malha
    const C = new THREE.Quaternion();
    for (const [k, a] of [[1, 0.06], [2, 0.22], [3, 0.2]] as const) {
      const b = B[P + "HandThumb" + k];
      if (!b) continue;
      C.multiply(b.userData.rq);
      sd.fing.push({ b, axl: ax.clone().add(palm.clone().multiplyScalar(-0.4)).normalize().applyQuaternion(C.clone().invert()), amt: a, rel: 0.05 });
    }
  });
  function setGrip(sd: Lado, k: number) {
    for (const f of sd.fing) f.b.quaternion.copy(f.b.userData.rq).multiply(_q.setFromAxisAngle(f.axl, lerp(f.rel, f.amt, k)));
  }
  const _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _qw = new THREE.Quaternion();
  function orientHand(sd: Lado, h: V3, nw: V3, k: number) {
    const Hd = sd.hand, yl = Hd.fl, nl = Hd.pl, zl = yl.clone().cross(nl);
    const zw = h.clone().cross(nw);
    _m1.makeBasis(yl, nl, zl);
    _m2.makeBasis(h, nw, zw).multiply(_m1.transpose());
    _qw.setFromRotationMatrix(_m2);
    Hd.hand.parent!.updateMatrixWorld(true);
    const pq = Hd.hand.parent!.getWorldQuaternion(new THREE.Quaternion()).invert();
    const tq = pq.multiply(_qw);
    // k = 0: punho reto (rotação de repouso em relação ao antebraço); k = 1: palma na barra
    Hd.hand.quaternion.copy(Hd.hand.userData.rq).slerp(tq, k);
    Hd.hand.updateMatrixWorld(true);
  }
  const cabecaB = B.Head;
  return {
    side,
    cabeca: () => loc(cabecaB),
    setArm(s: Lado, G: V3, bend: V3, k: number) {
      // G = centro da barra na mão; k = 0 solta, 1 segurando
      const h = V(-0.42, 0.9, 0).normalize(), nw = V(1, 0, 0).sub(h.clone().multiplyScalar(h.x)).normalize();
      const W = G.clone().sub(h.clone().multiplyScalar(s.hand.palmLen * 0.62 * k)).sub(nw.clone().multiplyScalar(0.028 * k));
      const S = s.S, L1 = s.L1, L2 = s.L2;
      const d = W.clone().sub(S);
      const dl = Math.min(Math.max(d.length(), 0.05), L1 + L2 - 0.001);
      const u = d.clone().normalize();
      const aa = (L1 * L1 - L2 * L2 + dl * dl) / (2 * dl), hh = Math.sqrt(Math.max(0, L1 * L1 - aa * aa));
      const n = bend.clone().sub(u.clone().multiplyScalar(bend.dot(u))).normalize();
      // suaviza a direção do cotovelo entre quadros para não haver torção brusca
      if (s.nPrev) { n.lerp(s.nPrev, 0.35).normalize(); }
      s.nPrev = (s.nPrev || V()).copy(n);
      const E = S.clone().add(u.clone().multiplyScalar(aa)).add(n.multiplyScalar(hh));
      const Wp = S.clone().add(u.multiplyScalar(dl));
      aim(s.A, E); aim(s.F, Wp); orientHand(s, h, nw, k); setGrip(s, k);
      if (import.meta.env.DEV) s.dbg = { S: S.toArray(), E: E.toArray(), Ereal: loc(s.F).toArray(), W: Wp.toArray(), Wreal: loc(B[s.P + "Hand"]).toArray() };
      return { E, H: Wp };
    },
  };
}
