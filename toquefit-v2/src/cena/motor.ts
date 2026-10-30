// Renderizador único reaproveitado entre os aparelhos. Só desenha quando o player está na tela e a aba visível.
import * as THREE from "three";
import type { Linha } from "../player/timeline";
import type { Caixa } from "./rotulos";

export interface Cena {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  frame(now: number, dt: number): void;
  resize?(w: number, h: number): void;
}

/** O que o player passa para uma cena com instrutora e roteiro. */
export interface OpcoesCena {
  linha: () => Linha;
  tempo: () => number;
  overlay: HTMLElement;
  reduzido: boolean;
  /** caixas da interface por cima do vídeo (aviso, selos) que os rótulos também devem evitar */
  evitar?: () => Caixa[];
}

/** Cena com instrutora: carrega o modelo e ajuda o player a achar espaço livre na tela. */
export interface CenaRoteiro extends Cena {
  pronto: boolean;
  /** "manequim" quando o modelo não carregou e a cena usa o boneco de reserva; rejeita quando não há reserva */
  carregar(onProg: (p: number) => void): Promise<"modelo" | "manequim">;
  livre(cands: { x: number; y: number }[], w: number, h: number, margem?: number, topo?: number, evitar?: Caixa[], folga?: number): { x: number; y: number };
}

export class Motor {
  readonly renderer: THREE.WebGLRenderer;
  readonly canvas: HTMLCanvasElement;
  private cena: Cena | null = null;
  private host: HTMLElement | null = null;
  private raf = 0;
  private last = 0;
  private naTela = false;
  private ro = new ResizeObserver(() => this.size());
  private io = new IntersectionObserver((es) => {
    this.naTela = es.some((e) => e.isIntersecting);
    this.agenda();
  }, { threshold: 0.01 });

  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.canvas = this.renderer.domElement;
    this.canvas.setAttribute("aria-hidden", "true");
    document.addEventListener("visibilitychange", () => this.agenda());
  }

  montar(host: HTMLElement, cena: Cena) {
    this.cena = cena;
    if (this.host) { this.ro.unobserve(this.host); this.io.unobserve(this.host); }
    this.host = host;
    host.prepend(this.canvas);
    this.ro.observe(host);
    this.io.observe(host);
    this.size();
    this.agenda();
  }

  desmontar() {
    if (this.host) { this.ro.unobserve(this.host); this.io.unobserve(this.host); }
    this.host = null;
    this.cena = null;
    this.canvas.remove();
    this.agenda();
  }

  get ativo() { return this.raf !== 0; }

  private size() {
    const h = this.host, c = this.cena;
    if (!h || !c) return;
    const w = h.clientWidth, ht = h.clientHeight;
    if (!w || !ht) return;
    this.renderer.setSize(w, ht, false);
    c.camera.aspect = w / ht;
    c.camera.updateProjectionMatrix();
    c.resize?.(w, ht);
  }

  private agenda() {
    const deve = !!this.cena && this.naTela && !document.hidden && this.canvas.isConnected;
    if (deve && !this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.loop);
    } else if (!deve && this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  /** Desenha um quadro mesmo parado (ex.: depois de pular de capítulo com o player fora da tela). */
  desenhar() {
    if (!this.cena) return;
    this.cena.frame(performance.now(), 0);
    this.renderer.render(this.cena.scene, this.cena.camera);
  }

  private loop = (now: number) => {
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    if (this.cena) {
      this.cena.frame(now, dt);
      this.renderer.render(this.cena.scene, this.cena.camera);
    }
    this.raf = requestAnimationFrame(this.loop);
  };
}

let unico: Motor | null | undefined;
/** null quando o navegador não tem WebGL. */
export function motor(): Motor | null {
  if (unico !== undefined) return unico;
  try {
    const t = document.createElement("canvas");
    if (!(t.getContext("webgl2") || t.getContext("webgl"))) throw new Error("sem webgl");
    unico = new Motor();
  } catch {
    unico = null;
  }
  return unico;
}
