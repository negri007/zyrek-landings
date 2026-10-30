// Pilha de anilhas em 3D para os aparelhos que ainda não têm roteiro próprio.
import * as THREE from "three";
import type { Cena } from "./motor";

export function criarPilha(o: { tocando: () => boolean; reduzido: boolean }): Cena {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  scene.add(new THREE.AmbientLight(0x8a96a8, 1.1));
  scene.add(new THREE.HemisphereLight(0xdfe6ee, 0x2a2f36, 1.2));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(4, 6, 5);
  scene.add(key);
  const neonL = new THREE.PointLight(0xf3ff2c, 16, 12, 2);
  neonL.position.set(-2.5, 2.2, 2.5);
  scene.add(neonL);

  const metal = new THREE.MeshStandardMaterial({ color: 0x6a727c, metalness: 0.8, roughness: 0.35 });
  const plateM = new THREE.MeshStandardMaterial({ color: 0x2a2f36, metalness: 0.55, roughness: 0.45 });
  const hotM = new THREE.MeshStandardMaterial({ color: 0x2f3420, metalness: 0.5, roughness: 0.4, emissive: 0xf3ff2c, emissiveIntensity: 0.12 });
  const edgeN = new THREE.LineBasicMaterial({ color: 0xf3ff2c });
  const edgeG = new THREE.LineBasicMaterial({ color: 0x3e454e });
  const root = new THREE.Group();
  scene.add(root);
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 1.3), metal);
  base.position.y = -1.55; root.add(base);
  for (const x of [-1.15, 1.15]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.5, 0.12), metal); c.position.set(x, 0.2, 0); root.add(c); }
  const topBar = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.12, 0.12), metal);
  topBar.position.y = 1.95; root.add(topBar);
  for (const x of [-0.35, 0.35]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.4, 12), metal); r.position.set(x, 0.2, 0); root.add(r); }
  const plateG = new THREE.BoxGeometry(1.7, 0.17, 0.95);
  const eg = new THREE.EdgesGeometry(plateG);
  const lift = new THREE.Group();
  root.add(lift);
  for (let i = 0; i < 12; i++) {
    const hot = i >= 8;
    const m = new THREE.Mesh(plateG, hot ? hotM : plateM);
    m.position.y = -1.38 + i * 0.2;
    m.add(new THREE.LineSegments(eg, hot ? edgeN : edgeG));
    (hot ? lift : root).add(m);
  }
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.7, 12), new THREE.MeshStandardMaterial({ color: 0xf3ff2c, emissive: 0xf3ff2c, emissiveIntensity: 0.6 }));
  pin.rotation.z = Math.PI / 2; pin.position.set(0.9, -1.38 + 8 * 0.2, 0); lift.add(pin);
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1, 8), metal);
  lift.add(cable);
  const grid = new THREE.GridHelper(10, 20, 0x3a4048, 0x262b31);
  grid.position.y = -1.62; scene.add(grid);

  const t0 = performance.now();
  return {
    scene, camera,
    frame(now) {
      const t = (now - t0) / 1000, tocando = o.tocando();
      const ang = o.reduzido ? 0.5 : 0.5 + Math.sin(t * 0.25) * 0.45;
      camera.position.set(Math.sin(ang) * 8.2, 1.6 + Math.sin(t * 0.2) * 0.15, Math.cos(ang) * 8.2);
      camera.lookAt(0, 0.05, 0);
      const y = tocando ? Math.max(0, Math.sin(t * 2.4)) * 0.85 : o.reduzido ? 0 : Math.max(0, Math.sin(t * 0.9)) * 0.08;
      lift.position.y = y;
      const topP = -1.38 + 11 * 0.2 + 0.085, len = Math.max(0.05, 1.89 - (topP + y));
      cable.scale.y = len; cable.position.y = topP + len / 2;
      hotM.emissiveIntensity = tocando ? 0.18 + Math.max(0, Math.sin(t * 2.4)) * 0.25 : 0.12;
    },
  };
}
