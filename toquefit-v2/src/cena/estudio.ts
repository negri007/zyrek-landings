// Estúdio comum às cenas com instrutora: luz, piso em grade e os materiais dos aparelhos.
import * as THREE from "three";

export const NEON = 0xf3ff2c;
export const CRIT = 0xff6a55;

export function montarEstudio(scene: THREE.Scene, piso = -1.62) {
  scene.add(new THREE.AmbientLight(0x8a96a8, 1.1));
  scene.add(new THREE.HemisphereLight(0xdfe6ee, 0x2a2f36, 1.3));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(4, 6, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(NEON, 0.7);
  rim.position.set(-5, 3, -4);
  scene.add(rim);
  // luz de cima para os membros não sumirem contra o fundo escuro nas vistas superiores
  const topo = new THREE.DirectionalLight(0xffffff, 1.4);
  topo.position.set(1, 8, 0);
  scene.add(topo);
  const neonL = new THREE.PointLight(NEON, 14, 14, 2);
  neonL.position.set(-2.5, 2.2, 2.5);
  scene.add(neonL);
  const grid = new THREE.GridHelper(10, 20, 0x3a4048, 0x262b31);
  grid.position.y = piso;
  scene.add(grid);
}

/** Materiais dos aparelhos e do manequim de reserva. */
export function materiais() {
  return {
    metal: new THREE.MeshStandardMaterial({ color: 0x6a727c, metalness: 0.8, roughness: 0.35 }),
    anilha: new THREE.MeshStandardMaterial({ color: 0x2a2f36, metalness: 0.55, roughness: 0.45 }),
    estofado: new THREE.MeshStandardMaterial({ color: 0x1a1d22, roughness: 0.8 }),
    neon: new THREE.MeshStandardMaterial({ color: NEON, emissive: NEON, emissiveIntensity: 0.55, roughness: 0.4 }),
    pele: new THREE.MeshStandardMaterial({ color: 0xd8dde3, roughness: 0.55, metalness: 0.05 }),
    blusa: new THREE.MeshStandardMaterial({ color: 0x30363e, roughness: 0.6 }),
    calca: new THREE.MeshStandardMaterial({ color: 0x22262c, roughness: 0.7 }),
  };
}
