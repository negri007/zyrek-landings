// Coisas do celular durante o treino: tela acesa enquanto o vídeo ou o descanso correm, e o bipe do fim do descanso.

let trava: WakeLockSentinel | null = null;
let pedindo = false;
const motivos = new Set<string>();

async function sincronizar() {
  const quer = motivos.size > 0 && !document.hidden;
  if (quer && !trava && !pedindo && "wakeLock" in navigator) {
    pedindo = true;
    try {
      trava = await navigator.wakeLock.request("screen");
      trava.addEventListener("release", () => { trava = null; });
    } catch { /* bateria fraca ou navegador recusou: a tela apaga como sempre */ }
    pedindo = false;
    // o motivo pode ter acabado enquanto o pedido estava no ar
    if (!motivos.size) void trava?.release();
  } else if (!quer && trava) {
    void trava.release();
    trava = null;
  }
}
// o navegador solta a trava quando a aba sai da tela; ao voltar, pede de novo
document.addEventListener("visibilitychange", () => void sincronizar());

/** Mantém a tela do celular acesa enquanto algum motivo ("video", "descanso") estiver ligado. */
export function telaAcesa(motivo: string, ligada: boolean) {
  if (ligada) motivos.add(motivo);
  else motivos.delete(motivo);
  void sincronizar();
}

let audio: AudioContext | null = null;
/** Precisa ser chamado dentro de um toque do aluno: o navegador só libera som depois disso. */
export function prepararBipe() {
  try { audio ||= new AudioContext(); if (audio.state === "suspended") void audio.resume(); } catch { audio = null; }
}
/** Dois bipes curtos, baixos, para quem deixou o celular no banco. */
export function bipe() {
  if (!audio) return;
  const t0 = audio.currentTime;
  for (const [k, f] of [[0, 880], [0.22, 1175]] as const) {
    const o = audio.createOscillator(), g = audio.createGain();
    o.frequency.value = f;
    g.gain.setValueAtTime(0, t0 + k);
    g.gain.linearRampToValueAtTime(0.09, t0 + k + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + k + 0.18);
    o.connect(g).connect(audio.destination);
    o.start(t0 + k);
    o.stop(t0 + k + 0.2);
  }
}
