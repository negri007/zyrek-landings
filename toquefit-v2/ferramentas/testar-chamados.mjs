// Testa netlify/functions/chamados.mjs contra o servidor local oficial do Netlify Blobs: npm run testar:api
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PROJ = join(dirname(fileURLToPath(import.meta.url)), "..");
const { BlobsServer } = await import(pathToFileURL(join(PROJ, "node_modules/@netlify/blobs/dist/server.js")));
const dir = mkdtempSync(join(tmpdir(), "blobs-"));
const server = new BlobsServer({ directory: dir, token: "t", port: 8971 });
await server.start();
globalThis.netlifyBlobsContext = Buffer.from(JSON.stringify({ edgeURL: "http://localhost:8971", uncachedEdgeURL: "http://localhost:8971", token: "t", siteID: "teste" })).toString("base64");
const fn = (await import(pathToFileURL(join(PROJ, "netlify/functions/chamados.mjs")))).default;

const chamar = async (metodo, sala, id, body) => {
  const req = new Request(`http://x/api/salas/${sala}/chamados${id ? "/" + id : ""}`, { method: metodo, body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body) });
  const r = await fn(req, { params: id ? { sala, id } : { sala } });
  const txt = r.status === 204 ? "" : await r.text();
  return { s: r.status, b: txt ? JSON.parse(txt) : null };
};
let falhas = 0;
const conf = (nome, ok, extra = "") => { console.log((ok ? "ok    " : "FALHOU") + " " + nome + (extra ? "  " + extra : "")); if (!ok) falhas++; };

try {
  let r = await chamar("GET", "TESTE1");
  conf("sala vazia", r.s === 200 && r.b.chamados.length === 0);
  r = await chamar("POST", "teste1", null, { slug: "leg-press-45" });
  conf("cria chamado (sala em minúsculas vira maiúsculas)", r.s === 201 && /^[a-f0-9]{16}$/.test(r.b.chamado.id), JSON.stringify(r.b));
  const id = r.b.chamado.id;
  await chamar("POST", "TESTE1", null, { slug: "remada-baixa" });
  r = await chamar("GET", "TESTE1");
  conf("lista os 2, mais novo primeiro", r.b.chamados.length === 2 && r.b.chamados[0].slug === "remada-baixa");
  r = await chamar("GET", "OUTRA1");
  conf("outra sala não vê os chamados", r.b.chamados.length === 0);
  r = await chamar("PATCH", "TESTE1", id);
  conf("atende", r.s === 200 && r.b.chamado.done === true && r.b.chamado.doneAt > 0);
  r = await chamar("DELETE", "TESTE1", id);
  conf("cancela", r.s === 204);
  r = await chamar("GET", "TESTE1");
  conf("sobra 1", r.b.chamados.length === 1);
  r = await chamar("PATCH", "TESTE1", "0123456789abcdef");
  conf("atender inexistente = 404", r.s === 404);
  r = await chamar("POST", "NOMES1", null, { slug: "supino-reto", nome: "  Ana Maria Souza " });
  conf("chamado guarda só o primeiro nome", r.s === 201 && r.b.chamado.nome === "Ana", JSON.stringify(r.b));
  conf("sala inválida = 400", (await chamar("GET", "xx")).s === 400);
  conf("sala com barra = 400", (await chamar("GET", "AB/CD1")).s === 400);
  conf("slug com HTML = 400", (await chamar("POST", "TESTE1", null, { slug: "<script>" })).s === 400);
  conf("slug número = 400", (await chamar("POST", "TESTE1", null, { slug: 42 })).s === 400);
  conf("corpo não JSON = 400", (await chamar("POST", "TESTE1", null, "nao json")).s === 400);
  conf("id fora do formato = 400", (await chamar("PATCH", "TESTE1", "../../x")).s === 400);
  conf("método errado = 405", (await chamar("PUT", "TESTE1")).s === 405);
  for (let i = 0; i < 40; i++) await chamar("POST", "CHEIA1", null, { slug: "supino-reto" });
  r = await chamar("POST", "CHEIA1", null, { slug: "supino-reto" });
  conf("41º chamado na sala = 429", r.s === 429 && (await chamar("GET", "CHEIA1")).b.chamados.length === 40, String(r.s));
} finally {
  await server.stop();
  rmSync(dir, { recursive: true, force: true });
}
console.log(falhas ? `\n${falhas} falha(s)` : "\nTudo certo");
process.exit(falhas ? 1 : 0);
