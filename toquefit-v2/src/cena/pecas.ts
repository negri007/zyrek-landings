// Peças de aparelho em coordenadas locais: caixas, tubos e a pilha de anilhas dos aparelhos com cabo.
import * as THREE from "three";
import { CRIT, NEON } from "./estudio";
import { V, type V3 } from "./util3d";

const UP = V(0, 1, 0);

export function criarPecas(raiz: THREE.Object3D) {
  /** caixa centrada em `c`, comprimento `w` ao longo da direção `dir` (no plano xy) */
  const peca = (w: number, h: number, d: number, m: THREE.Material, c: V3, dir = V(1, 0, 0), pai: THREE.Object3D = raiz) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    b.position.copy(c);
    b.rotation.z = Math.atan2(dir.y, dir.x);
    pai.add(b);
    return b;
  };
  /** cilindro entre dois pontos */
  const tubo = (r: number, a: V3, b: V3, m: THREE.Material, pai: THREE.Object3D = raiz) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 14), m);
    pai.add(c);
    ligar(c, a, b);
    return c;
  };
  /** reposiciona um tubo de altura 1 entre dois pontos (para peças que se mexem) */
  const ligar = (c: THREE.Mesh, a: V3, b: V3) => {
    const d = b.clone().sub(a);
    c.position.copy(a).addScaledVector(d, 0.5);
    c.scale.y = Math.max(1e-3, d.length());
    c.quaternion.setFromUnitVectors(UP, d.normalize());
  };
  return { peca, tubo, ligar };
}

/**
 * Torre com a pilha de anilhas: as de cima (neon) sobem com a carga, as de baixo ficam.
 * `subir(k, batida)`: k = 0 parada, 1 = curso todo; batida acende em vermelho e faz a pilha quicar.
 */
export function criarPilhaPesos(raiz: THREE.Object3D, base: V3, mats: { metal: THREE.Material; anilha: THREE.MeshStandardMaterial }, curso = 0.32) {
  const { peca, tubo, ligar } = criarPecas(raiz);
  const ALTURA = 1.45, PASSO = 0.085, N = 10, QUENTES = 4;
  for (const x of [-0.2, 0.2]) tubo(0.018, base.clone().add(V(x, 0.05, 0)), base.clone().add(V(x, ALTURA, 0)), mats.metal);
  peca(0.56, 0.05, 0.3, mats.metal, base.clone().add(V(0, ALTURA + 0.02, 0)));
  const quente = mats.anilha.clone();
  quente.emissive = new THREE.Color(NEON);
  const levanta = new THREE.Group();
  levanta.position.copy(base);
  raiz.add(levanta);
  for (let i = 0; i < N; i++) {
    const subindo = i >= N - QUENTES;
    const c = V(0, 0.09 + i * PASSO, 0);
    if (subindo) peca(0.36, 0.075, 0.24, quente, c, undefined, levanta);
    else peca(0.36, 0.075, 0.24, mats.anilha, c.add(base));
  }
  const cabo = tubo(0.008, V(), V(0, 1, 0), mats.metal);
  return {
    /** ponto do meio da pilha, para rótulos */
    meio: base.clone().add(V(0.2, 0.9, 0)),
    subir(k: number, batida = 0, now = 0) {
      const quique = batida > 0 ? Math.sin(now / 38) * 0.012 * batida : 0;
      levanta.position.y = base.y + k * curso + quique;
      quente.emissive.setHex(batida > 0.05 ? CRIT : NEON);
      quente.emissiveIntensity = batida > 0.05 ? 0.25 + 0.45 * batida : 0.12 + 0.15 * k;
      const topo = levanta.position.y + 0.09 + (N - 1) * PASSO + 0.04;
      ligar(cabo, V(base.x, topo, base.z), V(base.x, base.y + ALTURA, base.z));
    },
  };
}
