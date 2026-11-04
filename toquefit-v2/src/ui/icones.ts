// Ícones de traço (24×24), herdam a cor do texto.
const P: Record<string, string> = {
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>',
  pausa: '<path d="M8 5v14M16 5v14"/>',
  repetir: '<path d="M4 12a8 8 0 1 0 2.6-5.9"/><path d="M4 4.5V9h4.5"/>',
  som: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
  mudo: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9.5 5 5"/><path d="m21 9.5-5 5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  lento: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  nfc: '<path d="M7 8.5a5 5 0 0 1 0 7"/><path d="M11 5.5a9.5 9.5 0 0 1 0 13"/><path d="M15 3a13 13 0 0 1 0 18"/>',
  chamar: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/>',
  fechar: '<path d="M6 6l12 12M18 6 6 18"/>',
  tela: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
  sairTela: '<path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5"/>',
  girar: '<path d="M3.5 12c0 2.5 3.8 4.5 8.5 4.5s8.5-2 8.5-4.5-3.8-4.5-8.5-4.5"/><path d="m9.5 14.5 2.5 2-2.5 2.2"/><path d="M12 3.5v4"/>',
  enviar: '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/>',
};

export const icone = (n: keyof typeof P | string, cls = "") =>
  `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ""}</svg>`;
