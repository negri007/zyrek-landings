// Instrutora a partir do modelo glTF (esqueleto Mixamo), com controles de pose em coordenadas locais do aparelho.
// Cada cena decide onde ela fica e calcula braços e pernas por IK de dois ossos.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { V, lerp, type V3 } from "./util3d";

let modelo: Promise<THREE.Object3D> | null = null;
/**
 * Baixa e decodifica o modelo da instrutora uma vez só; cada cena recebe uma cópia com esqueleto próprio,
 * porque a pose altera os ossos. Trocar de aparelho não baixa nem decodifica de novo.
 */
export async function carregarModelo(onProg: (p: number) => void) {
  if (!modelo) {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    modelo = loader.loadAsync(`${import.meta.env.BASE_URL}models/michelle.glb`, (e) => {
      if (e.total) onProg(e.loaded / e.total);
    }).then((g) => g.scene);
    // se falhar (rede caiu), a próxima cena tenta de novo
    modelo.catch(() => (modelo = null));
  }
  const original = await modelo;
  onProg(1);
  return cloneSkinned(original);
}

/** Resolve uma cadeia de dois ossos: devolve a junta do meio (cotovelo/joelho) e a ponta alcançável. */
export function ik2(S: V3, alvo: V3, L1: number, L2: number, bend: V3, suav?: { n: V3 | null }) {
  const d = alvo.clone().sub(S);
  const dl = Math.min(Math.max(d.length(), 0.05), L1 + L2 - 0.001);
  const u = d.normalize();
  const a = (L1 * L1 - L2 * L2 + dl * dl) / (2 * dl), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const n = bend.clone().sub(u.clone().multiplyScalar(bend.dot(u))).normalize();
  // suaviza a direção da junta entre quadros para não haver torção brusca
  if (suav) {
    if (suav.n) n.lerp(suav.n, 0.35).normalize();
    suav.n = (suav.n || V()).copy(n);
  }
  const M = S.clone().add(u.clone().multiplyScalar(a)).add(n.multiplyScalar(h));
  return { M, P: S.clone().add(u.multiplyScalar(dl)) };
}

export interface Ancora {
  /** inclinação do tronco em relação ao chão, em graus: 0 = deitada com a cabeça para -x, 90 = sentada ereta */
  inclinacao: number;
  /** deslocamento (local) que leva o corpo, já girado, para o lugar certo no aparelho */
  posicao(loc: (b: THREE.Object3D) => V3, B: Record<string, THREE.Bone>): V3;
}

export type Pessoa = ReturnType<typeof criarPessoa>;
export type Lado = Pessoa["side"][number];

export function criarPessoa(model: THREE.Object3D, raiz: THREE.Group, ancora: Ancora) {
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
  raiz.add(hum);
  hum.scale.setScalar(2.05 / H);
  // modelo em pé olhando para +z → cabeça ao longo do tronco inclinado, peito para cima
  const th = (ancora.inclinacao * Math.PI) / 180, c = Math.cos(th), s = Math.sin(th);
  hum.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(0, 0, -1), V(-c, s, 0), V(s, c, 0)));
  const loc = (b: THREE.Object3D) => { raiz.updateMatrixWorld(true); return raiz.worldToLocal(b.getWorldPosition(V())); };
  hum.updateMatrixWorld(true);
  hum.position.add(ancora.posicao(loc, B));
  hum.updateMatrixWorld(true);

  const Y = V(0, 1, 0);
  const _q = new THREE.Quaternion(), _pq = new THREE.Quaternion();
  /** Gira o osso para apontar para um ponto (local do aparelho), mantendo a torção de repouso. */
  function aim(bone: THREE.Bone, tLocal: V3) {
    bone.parent!.updateMatrixWorld(true);
    const tw = raiz.localToWorld(tLocal.clone());
    const bw = bone.getWorldPosition(V());
    const d = tw.sub(bw).normalize();
    bone.parent!.getWorldQuaternion(_pq).invert();
    const rq = bone.userData.rq as THREE.Quaternion;
    const rd = Y.clone().applyQuaternion(rq);
    bone.quaternion.setFromUnitVectors(rd, d.applyQuaternion(_pq)).multiply(rq);
    bone.updateMatrixWorld(true);
  }
  const dist = (a: THREE.Object3D, b: THREE.Object3D) => loc(a).distanceTo(loc(b));

  const side = (["Left", "Right"] as const).map((P, i) => {
    const A = B[P + "Arm"], F = B[P + "ForeArm"], U = B[P + "UpLeg"], K = B[P + "Leg"], Ft = B[P + "Foot"];
    return {
      sd: i ? 1 : -1, P, A, F, U, K, Ft,
      /** clavícula: sobe e avança um pouco junto com o braço */
      C: B[P + "Shoulder"] as THREE.Bone | undefined,
      /** ombro e quadril na pose de repouso */
      S: loc(A), Q: loc(U),
      L1: dist(A, F), L2: dist(F, B[P + "Hand"]),
      Lc: dist(U, K), Lp: dist(K, Ft),
      hand: null as unknown as { hand: THREE.Bone; fl: V3; pl: V3; palmLen: number },
      fing: [] as { b: THREE.Bone; axl: V3; amt: number; rel: number }[],
      braco: { n: null as V3 | null },
      perna: { n: null as V3 | null },
      dbg: undefined as Record<string, number[]> | undefined,
    };
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

  /** k = 0: mão relaxada; k = 1: fechada em volta de uma barra */
  function setGrip(sd: Lado, k: number) {
    for (const f of sd.fing) f.b.quaternion.copy(f.b.userData.rq).multiply(_q.setFromAxisAngle(f.axl, lerp(f.rel, f.amt, k)));
  }
  const _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _qw = new THREE.Quaternion();
  const _tr = new THREE.Quaternion(), _ti = new THREE.Quaternion(), _tw = new THREE.Quaternion(), _meia = new THREE.Quaternion();
  /** h = direção dos dedos, nw = normal da palma (locais); k = 0: punho reto, 1: mão nessa orientação */
  function orientHand(sd: Lado, h: V3, nw: V3, k: number) {
    const Hd = sd.hand, yl = Hd.fl, nl = Hd.pl, zl = yl.clone().cross(nl);
    const zw = h.clone().cross(nw);
    _m1.makeBasis(yl, nl, zl);
    _m2.makeBasis(h, nw, zw).multiply(_m1.transpose());
    _qw.setFromRotationMatrix(_m2);
    Hd.hand.parent!.updateMatrixWorld(true);
    const pq = Hd.hand.parent!.getWorldQuaternion(new THREE.Quaternion()).invert();
    const tq = pq.multiply(raiz.getWorldQuaternion(new THREE.Quaternion())).multiply(_qw);
    Hd.hand.quaternion.copy(Hd.hand.userData.rq).slerp(tq, k);
    // metade da torção do punho vai para o antebraço: sem isso o pulso torce como embalagem de bala
    const F = Hd.hand.parent as THREE.Bone;
    _tr.copy(Hd.hand.quaternion).multiply(_ti.copy(Hd.hand.userData.rq).invert());
    _tw.set(0, _tr.y, 0, _tr.w);
    if (_tw.lengthSq() > 1e-8) {
      _tw.normalize();
      _meia.identity().slerp(_tw, 0.5);
      F.quaternion.multiply(_meia);
      F.updateMatrixWorld(true);
      Hd.hand.quaternion.premultiply(_meia.invert());
    }
    Hd.hand.updateMatrixWorld(true);
  }

  const _sh = V(), _sn = V(), _sd = V();
  /**
   * Segura uma barra ou pegador. G = ponto da barra no meio da mão; eixo = direção da barra;
   * palma = para onde a palma olha; bend = para onde o cotovelo aponta; clavicula = quanto o ombro acompanha a mão.
   * O punho fica alinhado com o antebraço e os dedos fecham em volta da barra.
   */
  function segurar(s: Lado, G: V3, o: { eixo: V3; palma: V3; bend: V3; clavicula?: number; aperto?: number }) {
    const eixo = o.eixo.clone().normalize();
    const C = s.C;
    if (C) {
      C.quaternion.copy(C.userData.rq as THREE.Quaternion);
      C.updateMatrixWorld(true);
      const k = o.clavicula ?? 0.2;
      if (k > 0) {
        const pc = loc(C), resto = loc(s.A).sub(pc), len = resto.length();
        const paraMao = G.clone().sub(pc).normalize();
        aim(C, pc.clone().addScaledVector(resto.normalize().lerp(paraMao, k).normalize(), len));
      }
    }
    const S = loc(s.A);
    // primeira estimativa dos dedos: do ombro para a barra, sem a parte ao longo dela
    _sh.copy(G).sub(S).addScaledVector(eixo, -G.clone().sub(S).dot(eixo)).normalize();
    let E = V(), W = V();
    for (let i = 0; i < 2; i++) {
      _sn.crossVectors(eixo, _sh).normalize();
      if (_sn.dot(o.palma) < 0) _sn.negate();
      W = G.clone().addScaledVector(_sh, -s.hand.palmLen * 0.62).addScaledVector(_sn, -0.028);
      const r = ik2(S, W, s.L1, s.L2, o.bend, i ? s.braco : undefined);
      E = r.M; W = r.P;
      // punho reto: os dedos seguem o antebraço, contornando a barra
      _sd.copy(W).sub(E);
      _sd.addScaledVector(eixo, -_sd.dot(eixo));
      if (_sd.lengthSq() > 1e-6) _sh.copy(_sd.normalize());
    }
    _sn.crossVectors(eixo, _sh).normalize();
    if (_sn.dot(o.palma) < 0) _sn.negate();
    aim(s.A, E); aim(s.F, W);
    orientHand(s, _sh.clone(), _sn.clone(), 1);
    setGrip(s, o.aperto ?? 1);
    return { E, W, S };
  }
  /** Perna inteira: quadril → joelho → tornozelo, com o pé apontando para `ponta`. */
  function setLeg(sd: Lado, ankle: V3, bend: V3, ponta: V3) {
    const Q = loc(sd.U);
    const { M, P } = ik2(Q, ankle, sd.Lc, sd.Lp, bend, sd.perna);
    aim(sd.U, M); aim(sd.K, P); aim(sd.Ft, ponta);
    return { Q, K: M, A: P };
  }

  // postura do corpo inteiro: giro em volta de um ponto (ex.: quadril descolando, tronco jogando para trás)
  const baseQ = hum.quaternion.clone(), basePos = hum.position.clone();
  const _gq = new THREE.Quaternion(), Z = V(0, 0, 1);
  /** Gira o corpo `graus` em volta do eixo lateral (z) passando por `pivo`, e desloca por `desl`. 0 = postura de partida. */
  function girarCorpo(graus: number, pivo: V3, desl?: V3) {
    _gq.setFromAxisAngle(Z, (graus * Math.PI) / 180);
    hum.quaternion.copy(_gq).multiply(baseQ);
    hum.position.copy(basePos).sub(pivo).applyQuaternion(_gq).add(pivo);
    if (desl) hum.position.add(desl);
    hum.updateMatrixWorld(true);
  }
  const coluna = ["Spine", "Spine1", "Spine2"].map((n) => B[n]).filter(Boolean);
  const calma = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const _pw = new THREE.Quaternion(), _cq = new THREE.Quaternion(), _ax = V();
  /**
   * Curva a coluna em volta do eixo lateral, dividido entre as três vértebras do esqueleto.
   * Positivo arredonda para a frente (lombar curvada); negativo arqueia para trás.
   * Soma uma respiração leve (o peito sobe e desce), para a instrutora não ficar parada como estátua.
   */
  function curvarColuna(graus = 0) {
    const resp = calma ? 0 : Math.sin((performance.now() / 1000) * 2.1) * 1.4;
    const por = (((graus - resp) / coluna.length) * Math.PI) / 180;
    raiz.updateMatrixWorld(true);
    const zMundo = Z.clone().transformDirection(raiz.matrixWorld);
    for (const b of coluna) {
      b.parent!.updateMatrixWorld(true);
      b.parent!.getWorldQuaternion(_pw).invert();
      _ax.copy(zMundo).applyQuaternion(_pw).normalize();
      b.quaternion.copy(b.userData.rq as THREE.Quaternion).premultiply(_cq.setFromAxisAngle(_ax, -por));
      b.updateMatrixWorld(true);
    }
  }

  const cab = B.Head, _ce = new THREE.Euler(), _cq2 = new THREE.Quaternion(), GR = Math.PI / 180;
  /**
   * Cabeça viva: acena de leve enquanto a instrutora fala (fala = 0 a 1) e balança devagar quando está calada.
   * Mexe só no osso da cabeça; o pescoço continua com cada cena.
   */
  function animarCabeca(fala: number, s: number) {
    if (!cab) return;
    cab.quaternion.copy(cab.userData.rq as THREE.Quaternion);
    if (!calma) {
      const aceno = Math.sin(s * 8.3) * 2.4 * fala + Math.sin(s * 0.9) * 1.1;
      const giro = Math.sin(s * 0.53) * 2.6 + Math.sin(s * 5.1) * 0.8 * fala;
      cab.quaternion.multiply(_cq2.setFromEuler(_ce.set(aceno * GR, giro * GR, 0)));
    }
    cab.updateMatrixWorld(true);
  }

  return {
    B, grupo: hum, side, loc, aim, setGrip, orientHand, segurar, animarCabeca, setLeg, girarCorpo, curvarColuna,
    cabeca: () => loc(B.Head),
    /** ombro onde está agora (depois de girar o corpo ou curvar a coluna) */
    ombro: (s: { A: THREE.Bone }) => loc(s.A),
  };
}
