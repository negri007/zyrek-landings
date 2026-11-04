// QR Code em SVG para a etiqueta do aparelho: quem não tem NFC (ou deixou desligado) aponta a câmera.
import qrcode from "qrcode-generator";

/** Link completo que a tag NFC e o QR abrem para este aparelho. */
export const linkDaTag = (slug: string) => location.origin + location.pathname + "#m-" + slug;

/** SVG quadrado, módulos escuros num único path; `margem` em módulos (a norma pede 4). */
export function qrSvg(texto: string, rotulo: string, margem = 4) {
  const q = qrcode(0, "M");
  q.addData(texto);
  q.make();
  const n = q.getModuleCount(), lado = n + margem * 2;
  let d = "";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += `M${x + margem} ${y + margem}h1v1h-1z`;
  return `<svg class="qr" viewBox="0 0 ${lado} ${lado}" role="img" aria-label="${rotulo}" shape-rendering="crispEdges"><rect width="${lado}" height="${lado}" fill="#fff"/><path d="${d}" fill="#14171B"/></svg>`;
}
