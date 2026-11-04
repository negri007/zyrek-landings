// Câmera das cenas com roteiro: cada trecho pede um enquadramento e a troca acontece com easing e um leve
// deslocamento lateral, como um corte de vídeo editado.
import * as THREE from "three";
import { easeIO } from "./util3d";

export interface Enquadramento { p: number[]; l: number[]; u: number[] }

/** Câmera livre: o aluno arrasta para girar em volta do ponto que a aula estava mostrando. */
export interface Orbita {
  readonly livre: boolean;
  /** deslocamento do dedo ou do mouse em pixels */
  girar(dx: number, dy: number): void;
  /** f < 1 aproxima, f > 1 afasta */
  zoom(f: number): void;
  /** devolve a câmera ao enquadramento da aula, com transição */
  voltar(): void;
}

const PISO = -1.62; // altura do piso do estúdio: a câmera livre não desce abaixo dele

const DUR = 1.15;

/** `fixas` são as câmeras sem a deriva lenta (ex.: vistas de cima, onde ela tiraria o ângulo de esquadro). */
/** `raiz`: aparelho com a instrutora; a câmera livre gira em volta do centro dele, com tudo no quadro. */
export function criarRig(camera: THREE.PerspectiveCamera, cams: Record<string, Enquadramento>, reduzido: boolean, fixas: string[] = [], raiz?: THREE.Object3D) {
  const ini = cams.side || Object.values(cams)[0];
  const cam = { p: new THREE.Vector3(...(ini.p as [number, number, number])), l: new THREE.Vector3(...(ini.l as [number, number, number])), u: new THREE.Vector3(0, 1, 0) };
  const de = { p: new THREE.Vector3(), l: new THREE.Vector3(), u: new THREE.Vector3() };
  const _t = new THREE.Vector3(), _d = new THREE.Vector3(), _s = new THREE.Vector3();
  let atual = "", k01 = 1, lado = 1;
  // câmera livre: ângulos em volta do alvo e quanto ela pesa sobre a câmera da aula (0 a 1)
  const orb = { on: false, peso: 0, alvo: new THREE.Vector3(), centro: new THREE.Vector3(), yaw: 0, pitch: 0, raio: 1, raioFim: 1, raio0: 1 };
  const _o = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _caixa = new THREE.Box3(), _tam = new THREE.Vector3();
  /** centro e distância que mostram o aparelho inteiro */
  function enquadrarTudo() {
    if (!raiz) { orb.centro.copy(cam.l); return _o.copy(cam.p).sub(cam.l).length(); }
    // só o que aparece: sombras de contato e guias apagadas ficariam maiores que o aparelho
    _caixa.makeEmpty();
    raiz.traverseVisible((o) => {
      const m = o as THREE.Mesh, mat = m.material as THREE.Material | undefined;
      if (!m.isMesh || !mat || (mat.transparent && (!mat.depthWrite || mat.opacity < 0.3))) return;
      _caixa.expandByObject(m, (m as THREE.SkinnedMesh).isSkinnedMesh);
    });
    if (_caixa.isEmpty()) { orb.centro.copy(cam.l); return _o.copy(cam.p).sub(cam.l).length(); }
    _caixa.getCenter(orb.centro);
    _caixa.getSize(_tam);
    const meiaH = Math.hypot(_tam.x, _tam.z) / 2, tv = Math.tan((camera.fov * Math.PI) / 360);
    return Math.max(_tam.y / 2 / tv, meiaH / (tv * camera.aspect)) + meiaH * 0.35;
  }
  const orbita: Orbita = {
    get livre() { return orb.on; },
    girar(dx, dy) {
      if (!orb.on) {
        // começa de onde a câmera está agora: o primeiro arraste não dá salto
        // o olhar desliza do ponto do close para o centro do aparelho e a câmera recua até mostrar tudo
        if (orb.peso < 0.01) {
          orb.raioFim = orb.raio0 = enquadrarTudo();
          orb.alvo.copy(cam.l);
          _o.copy(camera.position).sub(orb.centro);
          orb.raio = Math.max(0.5, _o.length());
          orb.yaw = Math.atan2(_o.x, _o.z);
          orb.pitch = Math.max(-0.2, Math.min(1.3, Math.asin(Math.max(-1, Math.min(1, _o.y / orb.raio)))));
        }
        orb.on = true;
      }
      orb.yaw -= dx * 0.0085;
      orb.pitch = Math.max(-0.2, Math.min(1.3, orb.pitch + dy * 0.006));
    },
    zoom(f) {
      if (!orb.on) orbita.girar(0, 0);
      orb.raioFim = Math.max(orb.raio0 * 0.35, Math.min(orb.raio0 * 1.6, orb.raioFim * f));
    },
    voltar() { orb.on = false; },
  };

  return {
    orbita,
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
      // câmera livre por cima da câmera da aula: entra na hora, sai com transição
      orb.peso = orb.on ? 1 : reduzido ? 0 : Math.max(0, orb.peso - dt / 0.9);
      if (orb.peso > 0) {
        const a = reduzido ? 1 : 1 - Math.exp(-dt * 6);
        if (orb.on) { orb.alvo.lerp(orb.centro, a); orb.raio += (orb.raioFim - orb.raio) * a; }
        const cp = Math.cos(orb.pitch);
        _o.set(Math.sin(orb.yaw) * cp, Math.sin(orb.pitch), Math.cos(orb.yaw) * cp).multiplyScalar(orb.raio).add(orb.centro);
        _o.y = Math.max(PISO + 0.12, _o.y);
        const w = easeIO(orb.peso);
        camera.position.lerp(_o, w);
        _t.copy(cam.l).lerp(orb.alvo, w);
        camera.up.lerp(_up, w).normalize();
        camera.lookAt(_t);
      }
      // só em desenvolvimento: window.__olhar = { p: [x, y, z], l: [x, y, z] } prende a câmera num ponto para inspecionar detalhes
      const olhar = import.meta.env.DEV ? (window as unknown as { __olhar?: { p: number[]; l: number[] } }).__olhar : undefined;
      if (olhar) { camera.position.set(olhar.p[0], olhar.p[1], olhar.p[2]); camera.up.set(0, 1, 0); camera.lookAt(olhar.l[0], olhar.l[1], olhar.l[2]); }
      camera.updateMatrixWorld();
    },
  };
}
