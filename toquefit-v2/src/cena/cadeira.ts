// Cadeira de perna (extensora e flexora): banco quase reto, alavanca que gira no eixo do joelho,
// rolo na canela, alças ao lado do assento e a pilha de anilhas atrás. A instrutora é posta sentada
// com o joelho exatamente no eixo, e as pernas seguem a alavanca.
// Coordenadas locais: x para a frente, y para cima, z para os lados; 1 unidade ≈ 85 cm.
import * as THREE from "three";
import { materiais } from "./estudio";
import { criarPecas, criarPilhaPesos } from "./pecas";
import { carregarModelo, criarPessoa, ik2, type Pessoa } from "./pessoa";
import { V, suave, type V3 } from "./util3d";

export const ENCOSTO = 80; // inclinação do encosto em relação ao chão (graus)
export const QUADRIL = V(0, 0.6, 0);
const th = (ENCOSTO * Math.PI) / 180;
export const T = V(-Math.cos(th), Math.sin(th), 0); // ao longo do tronco, para a cabeça
export const N = V(Math.sin(th), Math.cos(th), 0); // normal do peito
const ROLO = 0.4; // distância do eixo ao rolo, ao longo da canela

export interface OpcoesCadeira {
  /** flexora: rolo atrás do tornozelo e apoio por cima das coxas */
  flexora: boolean;
  reduzido: boolean;
}

export function criarCadeira(maq: THREE.Group, o: OpcoesCadeira) {
  const mats = materiais();
  const { metal, estofado, neon } = mats;
  const { peca, tubo, ligar } = criarPecas(maq);

  // ---- banco e estrutura ----
  peca(1.9, 0.05, 0.6, metal, V(-0.15, 0.025, 0));
  peca(0.54, 0.07, 0.44, estofado, V(0.14, 0.485, 0));
  peca(0.82, 0.07, 0.44, estofado, QUADRIL.clone().addScaledVector(T, 0.5).addScaledVector(N, -0.15), T);
  tubo(0.035, V(0.1, 0.45, 0), V(0.1, 0.05, 0), metal);
  tubo(0.03, QUADRIL.clone().addScaledVector(T, 0.3).addScaledVector(N, -0.2), V(-0.25, 0.05, 0), metal);
  for (const sd of [-1, 1]) {
    tubo(0.016, V(-0.02, 0.47, 0.25 * sd), V(-0.02, 0.47, 0.31 * sd), metal);
    tubo(0.024, V(-0.02, 0.47, 0.31 * sd), V(0.2, 0.47, 0.31 * sd), neon);
  }

  // ---- alavanca: gira no eixo da máquina, alinhado com o joelho ----
  const eixo = V(0.49, 0.6, 0); // trocado ao carregar o modelo (fica exatamente no joelho)
  const lado = o.flexora ? -0.075 : 0.07; // rolo na frente (extensora) ou atrás (flexora) da canela
  const alav = new THREE.Group();
  maq.add(alav);
  const cubo = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 24), metal);
  cubo.rotation.x = Math.PI / 2; cubo.position.z = -0.33; alav.add(cubo);
  const tampa = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.008, 8, 32), neon);
  tampa.position.z = -0.29; alav.add(tampa);
  tubo(0.022, V(0, 0, -0.33), V(lado, -ROLO, -0.33), metal, alav);
  tubo(0.016, V(lado, -ROLO, -0.33), V(lado, -ROLO, 0.2), metal, alav);
  const rolo = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.42, 20), estofado);
  rolo.rotation.x = Math.PI / 2; rolo.position.set(lado, -ROLO, 0); alav.add(rolo);
  const pe = tubo(0.03, V(), V(0, 1, 0), metal);
  // flexora: apoio que trava as coxas por cima
  const apoio = new THREE.Group();
  if (o.flexora) {
    maq.add(apoio);
    tubo(0.02, V(0, 0, -0.33), V(0, 0.32, -0.33), metal, apoio);
    tubo(0.016, V(0, 0.32, -0.33), V(0, 0.32, 0.2), metal, apoio);
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.42, 20), estofado);
    p.rotation.x = Math.PI / 2; p.position.set(0, 0.32, 0); apoio.add(p);
  }

  // ---- pilha de anilhas atrás do banco ----
  const PILHA = V(-0.72, 0, -0.5);
  const pilha = criarPilhaPesos(maq, PILHA, mats);

  // ---- marcação: eixo da máquina passando pelo joelho (branco: a calça já é amarela) ----
  const eixoMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
  const eixoL = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1, 10), eixoMat);
  eixoL.rotation.x = Math.PI / 2; eixoL.scale.y = 1.05; eixoL.renderOrder = 3; maq.add(eixoL);
  let eixoOp = 0;

  let HUM: Pessoa | null = null;
  let LP = 0.5;
  const ombros = V();
  const joelhos = [V(), V()], tornozelos = [V(), V()], quadris = [V(), V()];

  return {
    eixo, pilha, PILHA,
    joelhos, tornozelos, quadris,
    get pessoa() { return HUM; },
    /** ponto do rolo para rótulos, com a alavanca parada em `ang` */
    rolo: (ang: number) => {
      const a = (ang * Math.PI) / 180;
      return eixo.clone().add(V(lado * Math.cos(a) + ROLO * Math.sin(a), lado * Math.sin(a) - ROLO * Math.cos(a), 0.22));
    },
    /**
     * ang: giro da alavanca em graus, 0 = canela na vertical (joelho a 90°), positivo estende a perna.
     * tranco: o corpo sobe e joga para trás (0 a 1). k: quanto a carga subiu (0 a 1).
     */
    aplicar(ang: number, tranco: number, k: number, batida: number, mostrarEixo: boolean, now: number, dt: number) {
      const a = (ang * Math.PI) / 180;
      alav.position.copy(eixo);
      alav.rotation.z = a;
      apoio.position.copy(eixo).add(V(-0.12, 0, 0));
      pilha.subir(k, batida, now);
      eixoOp = suave(eixoOp, mostrarEixo ? 1 : 0, dt, 6, o.reduzido);
      eixoMat.opacity = 0.9 * eixoOp;
      eixoL.visible = eixoOp > 0.02;
      eixoL.position.copy(eixo);
      if (!HUM) return;
      const h = HUM;
      h.girarCorpo(-9 * tranco, ombros, V(0, 0.06 * tranco, 0));
      h.curvarColuna();
      const can = V(Math.sin(a), -Math.cos(a), 0), frente = V(Math.cos(a), Math.sin(a), 0);
      for (let i = 0; i < 2; i++) {
        const s = h.side[i], sd = s.sd;
        const ankle = eixo.clone().setZ(s.Q.z).addScaledVector(can, LP);
        const ponta = ankle.clone().addScaledVector(frente, 0.16).add(V(0, 0, 0.03 * sd));
        const r = h.setLeg(s, ankle, V(0, 1, 0), ponta);
        joelhos[i].copy(r.K); tornozelos[i].copy(r.A); quadris[i].copy(r.Q);
        const { M: E, P: W } = ik2(h.ombro(s), V(0.1, 0.48, 0.31 * sd), s.L1, s.L2, V(-0.4, -0.3, 0.85 * sd), s.braco);
        h.aim(s.A, E); h.aim(s.F, W); h.setGrip(s, 1);
      }
      const pesc = h.loc(h.B.Neck);
      h.aim(h.B.Neck, pesc.clone().addScaledVector(T, 0.2).addScaledVector(N, 0.06));
    },
    obstaculos() {
      const pts: { a: V3; b: V3 }[] = [];
      for (let i = 0; i < 2; i++) pts.push({ a: quadris[i], b: joelhos[i] }, { a: joelhos[i], b: tornozelos[i] });
      if (HUM) { const cab = HUM.cabeca(); pts.push({ a: cab, b: cab.clone().addScaledVector(T, 0.14) }); }
      return pts;
    },
    async carregar(onProg: (p: number) => void) {
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
      eixo.copy(QUADRIL).add(V(s.Lc, 0, 0));
      ligar(pe, V(eixo.x - 0.02, 0.05, -0.33), V(eixo.x - 0.02, eixo.y, -0.33));
      ombros.copy(HUM.side[0].S).add(HUM.side[1].S).multiplyScalar(0.5);
    },
  };
}
