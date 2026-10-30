// Câmera das cenas com roteiro: cada trecho pede um enquadramento e a troca acontece com easing e um leve
// deslocamento lateral, como um corte de vídeo editado.
import * as THREE from "three";
import { easeIO } from "./util3d";

export interface Enquadramento { p: number[]; l: number[]; u: number[] }

const DUR = 1.15;

/** `fixas` são as câmeras sem a deriva lenta (ex.: vistas de cima, onde ela tiraria o ângulo de esquadro). */
export function criarRig(camera: THREE.PerspectiveCamera, cams: Record<string, Enquadramento>, reduzido: boolean, fixas: string[] = []) {
  const ini = cams.side || Object.values(cams)[0];
  const cam = { p: new THREE.Vector3(...(ini.p as [number, number, number])), l: new THREE.Vector3(...(ini.l as [number, number, number])), u: new THREE.Vector3(0, 1, 0) };
  const de = { p: new THREE.Vector3(), l: new THREE.Vector3(), u: new THREE.Vector3() };
  const _t = new THREE.Vector3(), _d = new THREE.Vector3(), _s = new THREE.Vector3();
  let atual = "", k01 = 1, lado = 1;

  return {
    get atual() { return atual; },
    ir(nome: string, imediato: boolean) {
      if (nome === atual) return;
      de.p.copy(cam.p); de.l.copy(cam.l); de.u.copy(cam.u);
      atual = nome;
      k01 = imediato || reduzido ? 1 : 0;
      lado = -lado;
    },
    quadro(now: number, dt: number) {
      const C = cams[atual] || ini;
      k01 = Math.min(1, k01 + dt / DUR);
      const k = easeIO(k01);
      const drift = reduzido || fixas.includes(atual) ? 0 : 0.14, ts = now / 1000;
      _t.set(C.p[0] + Math.sin(ts * 0.3) * drift, C.p[1], C.p[2] + Math.cos(ts * 0.27) * drift);
      cam.p.lerpVectors(de.p, _t, k);
      // deslocamento lateral que some no fim da transição
      if (k < 1) {
        _d.set(C.l[0], C.l[1], C.l[2]).sub(_t).normalize();
        _s.set(C.u[0], C.u[1], C.u[2]);
        cam.p.addScaledVector(_d.cross(_s).normalize(), Math.sin(Math.PI * k) * 0.3 * lado);
      }
      cam.l.lerpVectors(de.l, _t.set(C.l[0], C.l[1], C.l[2]), k);
      cam.u.lerpVectors(de.u, _t.set(C.u[0], C.u[1], C.u[2]), k);
      camera.position.copy(cam.p);
      camera.up.copy(cam.u).normalize();
      camera.lookAt(cam.l);
      camera.updateMatrixWorld();
    },
  };
}
