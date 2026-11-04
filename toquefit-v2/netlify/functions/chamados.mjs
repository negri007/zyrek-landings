// Chamados de "Chamar instrutor" entre aparelhos diferentes: o celular do aluno cria, o painel da academia vê e atende.
// Cada demonstração usa uma sala (código de 6 letras); cada chamado é um registro próprio no Netlify Blobs,
// sem contador compartilhado, e some sozinho depois de 12 horas.
// Em JavaScript (.mjs) de propósito: o empacotador da Netlify lê .mts com um parser que não roda com o TypeScript 7 do projeto.
//
//   GET    /api/salas/:sala/chamados          lista os chamados da sala
//   POST   /api/salas/:sala/chamados          { slug } cria um chamado
//   PATCH  /api/salas/:sala/chamados/:id      marca como atendido
//   DELETE /api/salas/:sala/chamados/:id      cancela (o aluno chamou sem querer)
import { getStore } from "@netlify/blobs";

/** @typedef {{ id: string, slug: string, at: number, done: boolean, doneAt?: number }} Chamado */

const SALA = /^[A-Z0-9]{6}$/;
const SLUG = /^[a-z0-9-]{1,48}$/;
const ID = /^[a-f0-9]{16}$/;
const VALIDADE = 12 * 3600e3;
const MAX_POR_SALA = 40;

const json = (body, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });
const novoId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 16);

/** @param {Request} req @param {import("@netlify/functions").Context} context */
export default async (req, context) => {
  const sala = (context.params.sala || "").toUpperCase();
  const id = context.params.id;
  if (!SALA.test(sala)) return json({ erro: "Sala inválida" }, 400);
  // forte: o painel precisa ver o chamado que o celular acabou de criar, não uma cópia de 60 s atrás
  const store = getStore({ name: "chamados", consistency: "strong" });
  const prefixo = sala + "/";

  if (!id) {
    if (req.method === "GET") {
      const { blobs } = await store.list({ prefix: prefixo });
      /** @type {Chamado[]} */
      const lista = [];
      const agora = Date.now();
      await Promise.all(blobs.map(async (b) => {
        const c = await store.get(b.key, { type: "json" });
        if (!c) return;
        if (agora - c.at > VALIDADE) { await store.delete(b.key); return; }
        lista.push(c);
      }));
      lista.sort((a, b) => b.at - a.at);
      return json({ chamados: lista });
    }
    if (req.method === "POST") {
      let body;
      try { body = await req.json(); } catch { return json({ erro: "Corpo precisa ser JSON" }, 400); }
      const slug = typeof body?.slug === "string" ? body.slug : "";
      if (!SLUG.test(slug)) return json({ erro: "Aparelho inválido" }, 400);
      const { blobs } = await store.list({ prefix: prefixo });
      if (blobs.length >= MAX_POR_SALA) return json({ erro: "Sala cheia: atenda ou encerre alguns chamados" }, 429);
      /** @type {Chamado} */
      const c = { id: novoId(), slug, at: Date.now(), done: false };
      await store.setJSON(prefixo + c.id, c, { onlyIfNew: true });
      return json({ chamado: c }, 201);
    }
    return json({ erro: "Método não suportado" }, 405);
  }

  if (!ID.test(id)) return json({ erro: "Chamado inválido" }, 400);
  const chave = prefixo + id;
  if (req.method === "PATCH") {
    const c = await store.get(chave, { type: "json" });
    if (!c) return json({ erro: "Chamado não encontrado" }, 404);
    if (!c.done) { c.done = true; c.doneAt = Date.now(); await store.setJSON(chave, c); }
    return json({ chamado: c });
  }
  if (req.method === "DELETE") {
    await store.delete(chave);
    return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  }
  return json({ erro: "Método não suportado" }, 405);
};

/** @type {import("@netlify/functions").Config} */
export const config = {
  path: ["/api/salas/:sala/chamados", "/api/salas/:sala/chamados/:id"],
  method: ["GET", "POST", "PATCH", "DELETE"],
  // painel e celular consultam a cada 4 s; isto deixa folga e barra quem tentar encher a sala
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 120 },
};
