// Área do aluno: a academia cadastra alunos, o instrutor monta a ficha semanal e o aluno abre pelo link pessoal
// (ou encostando na tag NFC do aparelho, já conectado). Tudo no Netlify Blobs, um registro por aluno e por dia de treino.
// Em JavaScript (.mjs) pelo mesmo motivo de chamados.mjs: o empacotador da Netlify não lê .mts com o TypeScript 7.
//
// Acesso sem senha, por chaves aleatórias:
//   instrutor  cabeçalho x-chave  (chave da academia, mostrada uma vez ao criar)
//   aluno      cabeçalho x-aluno + x-token (vêm no link pessoal; o servidor só guarda o hash)
//
//   POST   /api/academias                                   { nome }  cria a academia → { cod, chave }
//   GET    /api/academias/:cod                       instr.  academia + alunos com resumo da semana
//   POST   /api/academias/:cod/alunos                instr.  { nome, ficha } → { aluno, token }
//   GET    /api/academias/:cod/alunos/:id            instr.  aluno + últimos treinos
//   PUT    /api/academias/:cod/alunos/:id            instr.  { nome, ficha }
//   DELETE /api/academias/:cod/alunos/:id            instr.  apaga aluno e todos os treinos (LGPD)
//   POST   /api/academias/:cod/alunos/:id/link       instr.  link novo; o antigo deixa de funcionar
//   GET    /api/academias/:cod/eu                    aluno   academia, ficha e últimos treinos
//   PUT    /api/academias/:cod/eu/treinos/:data      aluno   { treino, itens, sensacao, dor } registra o dia
import { getStore } from "@netlify/blobs";

const COD = /^[A-Z0-9]{6}$/;
const ID = /^[a-f0-9]{12}$/;
const SEGREDO = /^[a-f0-9]{32}$/;
const DATA = /^\d{4}-\d{2}-\d{2}$/;
const SLUG = /^[a-z0-9-]{1,48}$/;
const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_ALUNOS = 300;
const DIAS_HISTORICO = 42;

const sem = { "cache-control": "no-store" };
const json = (body, status = 200) => Response.json(body, { status, headers: sem });
const erro = (msg, status = 400) => json({ erro: msg }, status);
const vazio = () => new Response(null, { status: 204, headers: sem });

const hex = (bytes) => Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, "0")).join("");
async function hash(s) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
}
/** compara sem parar no primeiro caractere diferente (não vaza o hash pelo tempo de resposta) */
function igual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
function novoCodigo() {
  const n = crypto.getRandomValues(new Uint32Array(6));
  return Array.from(n, (v) => LETRAS[v % LETRAS.length]).join("");
}

/* ---------- limpeza do que chega: só passa o formato esperado, com tamanho limitado ---------- */
const texto = (v, max) => (typeof v === "string" ? v.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max) : "");
const inteiro = (v, min, max, padrao) => (Number.isFinite(+v) ? Math.min(max, Math.max(min, Math.round(+v))) : padrao);

function limparFicha(f) {
  const treinos = Array.isArray(f?.treinos) ? f.treinos.slice(0, 7) : [];
  return {
    treinos: treinos.map((t, i) => ({
      id: texto(t?.id, 3) || String.fromCharCode(65 + i),
      nome: texto(t?.nome, 60) || "Treino " + String.fromCharCode(65 + i),
      dias: Array.isArray(t?.dias) ? [...new Set(t.dias.map((d) => inteiro(d, 0, 6, 0)))].sort() : [],
      itens: (Array.isArray(t?.itens) ? t.itens.slice(0, 20) : []).map((it) => ({
        slug: typeof it?.slug === "string" && SLUG.test(it.slug) ? it.slug : null,
        nome: texto(it?.nome, 60) || "Exercício",
        series: inteiro(it?.series, 1, 10, 3),
        reps: texto(it?.reps, 16) || "10",
        carga: texto(it?.carga, 20),
        descanso: texto(it?.descanso, 16),
        obs: texto(it?.obs, 140),
      })),
    })).filter((t) => t.itens.length),
    validade: typeof f?.validade === "string" && DATA.test(f.validade) ? f.validade : "",
    obs: texto(f?.obs, 280),
  };
}

function limparTreino(b) {
  const itens = {};
  // chave "A.0" = treino A, exercício 0: o aluno pode trocar de treino no meio do dia sem perder o que marcou
  const entrada = b?.itens && typeof b.itens === "object" ? Object.entries(b.itens).slice(0, 60) : [];
  for (const [k, v] of entrada) {
    if (!/^[A-Za-z0-9]{1,3}\.\d{1,2}$/.test(k)) continue;
    itens[k] = {
      feito: !!v?.feito,
      cargas: (Array.isArray(v?.cargas) ? v.cargas.slice(0, 10) : []).map((c) => texto(c, 12)),
    };
  }
  return {
    treino: texto(b?.treino, 3),
    itens,
    sensacao: ["leve", "ok", "pesado"].includes(b?.sensacao) ? b.sensacao : null,
    dor: !!b?.dor,
  };
}

/** dia de hoje no fuso de Brasília (o servidor roda em UTC) */
const hojeBR = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const diasAtras = (n) => new Date(Date.now() - 3 * 3600e3 - n * 86400e3).toISOString().slice(0, 10);

/** o que o painel vê de cada aluno sem abrir os treinos: datas tiradas só do nome das chaves */
function resumo(aluno, datas) {
  const desde7 = diasAtras(6);
  const previstos = new Set(aluno.ficha.treinos.flatMap((t) => t.dias)).size;
  return {
    id: aluno.id, nome: aluno.nome, criado: aluno.criado, atualizado: aluno.atualizado,
    validade: aluno.ficha.validade, treinos: aluno.ficha.treinos.length,
    ultimo: datas[0] || null,
    semana: datas.filter((d) => d >= desde7).length,
    previstos,
    ultimoRetorno: aluno.ultimoRetorno || null,
  };
}

/** @param {Request} req @param {import("@netlify/functions").Context} context */
export default async (req, context) => {
  const store = getStore({ name: "academias", consistency: "strong" });
  const { cod: codBruto, id, data } = context.params;
  const partes = new URL(req.url).pathname.split("/").filter(Boolean); // api, academias, cod, ...
  const corpo = async () => { try { return await req.json(); } catch { return null; } };

  /* ---------- criar academia ---------- */
  if (!codBruto) {
    if (req.method !== "POST") return erro("Método não suportado", 405);
    const b = await corpo();
    const nome = texto(b?.nome, 60);
    if (!nome) return erro("Digite o nome da academia");
    const chave = hex(16);
    for (let t = 0; t < 5; t++) {
      const cod = novoCodigo();
      const r = await store.setJSON(cod + "/meta", { cod, nome, chave: await hash(chave), criada: Date.now() }, { onlyIfNew: true });
      if (r.modified) return json({ cod, nome, chave }, 201);
    }
    return erro("Tente de novo", 503);
  }

  const cod = codBruto.toUpperCase();
  if (!COD.test(cod)) return erro("Academia inválida");
  const meta = await store.get(cod + "/meta", { type: "json" });
  if (!meta) return erro("Academia não encontrada", 404);
  const chaveAluno = (i) => `${cod}/alunos/${i}`;
  const prefTreinos = (i) => `${cod}/treinos/${i}/`;
  const datasDe = async (i) => (await store.list({ prefix: prefTreinos(i) })).blobs.map((b) => b.key.slice(-10)).sort().reverse();
  const ultimosTreinos = async (i, n = DIAS_HISTORICO) => {
    const limite = diasAtras(n);
    const datas = (await datasDe(i)).filter((d) => d >= limite);
    const lista = await Promise.all(datas.map((d) => store.get(prefTreinos(i) + d, { type: "json" })));
    return lista.filter(Boolean);
  };

  /* ---------- aluno: o próprio celular ---------- */
  if (partes[3] === "eu") {
    const idA = req.headers.get("x-aluno") || "", token = req.headers.get("x-token") || "";
    if (!ID.test(idA) || !SEGREDO.test(token)) return erro("Link inválido. Peça um link novo ao instrutor", 401);
    const aluno = await store.get(chaveAluno(idA), { type: "json" });
    if (!aluno || !igual(aluno.token, await hash(token))) return erro("Link expirado. Peça um link novo ao instrutor", 401);
    if (req.method === "GET" && partes.length === 4) {
      return json({ academia: meta.nome, aluno: { id: aluno.id, nome: aluno.nome, ficha: aluno.ficha, atualizado: aluno.atualizado }, treinos: await ultimosTreinos(idA) });
    }
    if (req.method === "PUT" && partes[4] === "treinos" && data) {
      if (!DATA.test(data) || data < diasAtras(1) || data > diasAtras(-1)) return erro("Só dá para registrar o treino de hoje");
      const t = { ...limparTreino(await corpo()), data, at: Date.now() };
      await store.setJSON(prefTreinos(idA) + data, t);
      // o painel mostra o retorno do último treino sem abrir os registros
      // (e desmarcar "senti dor" também tira o alerta do painel)
      const antes = aluno.ultimoRetorno;
      const agora = t.sensacao || t.dor ? { data, sensacao: t.sensacao, dor: t.dor } : antes?.data === data ? null : antes;
      if (JSON.stringify(antes ?? null) !== JSON.stringify(agora ?? null)) {
        aluno.ultimoRetorno = agora;
        await store.setJSON(chaveAluno(idA), aluno);
      }
      return json({ treino: t });
    }
    return erro("Método não suportado", 405);
  }

  /* ---------- instrutor ---------- */
  const chave = req.headers.get("x-chave") || "";
  if (!SEGREDO.test(chave) || !igual(meta.chave, await hash(chave))) return erro("Chave do instrutor inválida", 401);

  if (partes.length === 3) {
    if (req.method !== "GET") return erro("Método não suportado", 405);
    const { blobs } = await store.list({ prefix: cod + "/alunos/" });
    const alunos = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })))).filter(Boolean);
    const resumos = await Promise.all(alunos.map(async (a) => resumo(a, await datasDe(a.id))));
    resumos.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    return json({ academia: { cod, nome: meta.nome }, alunos: resumos, hoje: hojeBR() });
  }

  if (partes[3] !== "alunos") return erro("Endereço inválido", 404);

  if (!id) {
    if (req.method !== "POST") return erro("Método não suportado", 405);
    const b = await corpo();
    const nome = texto(b?.nome, 60);
    if (!nome) return erro("Digite o nome do aluno");
    const { blobs } = await store.list({ prefix: cod + "/alunos/" });
    if (blobs.length >= MAX_ALUNOS) return erro("Limite de alunos da demonstração atingido", 429);
    const token = hex(16), agora = Date.now();
    const aluno = { id: hex(6), nome, token: await hash(token), criado: agora, atualizado: agora, ficha: limparFicha(b?.ficha) };
    await store.setJSON(chaveAluno(aluno.id), aluno, { onlyIfNew: true });
    return json({ aluno: { id: aluno.id, nome, ficha: aluno.ficha }, token }, 201);
  }

  if (!ID.test(id)) return erro("Aluno inválido");
  const aluno = await store.get(chaveAluno(id), { type: "json" });
  if (!aluno) return erro("Aluno não encontrado", 404);

  if (partes[5] === "link") {
    if (req.method !== "POST") return erro("Método não suportado", 405);
    const token = hex(16);
    aluno.token = await hash(token);
    await store.setJSON(chaveAluno(id), aluno);
    return json({ token });
  }
  if (partes.length !== 5) return erro("Endereço inválido", 404);
  if (req.method === "GET") {
    const { token: _t, ...publico } = aluno;
    return json({ aluno: publico, treinos: await ultimosTreinos(id) });
  }
  if (req.method === "PUT") {
    const b = await corpo();
    const nome = texto(b?.nome, 60);
    if (!nome) return erro("Digite o nome do aluno");
    aluno.nome = nome;
    aluno.ficha = limparFicha(b?.ficha);
    aluno.atualizado = Date.now();
    await store.setJSON(chaveAluno(id), aluno);
    const { token: _t, ...publico } = aluno;
    return json({ aluno: publico });
  }
  if (req.method === "DELETE") {
    const { blobs } = await store.list({ prefix: prefTreinos(id) });
    await Promise.all(blobs.map((b) => store.delete(b.key)));
    await store.delete(chaveAluno(id));
    return vazio();
  }
  return erro("Método não suportado", 405);
};

/** @type {import("@netlify/functions").Config} */
export const config = {
  path: [
    "/api/academias",
    "/api/academias/:cod",
    "/api/academias/:cod/alunos",
    "/api/academias/:cod/alunos/:id",
    "/api/academias/:cod/alunos/:id/link",
    "/api/academias/:cod/eu",
    "/api/academias/:cod/eu/treinos/:data",
  ],
  method: ["GET", "POST", "PUT", "DELETE"],
  // vários celulares no mesmo Wi-Fi da academia saem pelo mesmo IP: o limite é por rede, não por aparelho
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 400 },
};
