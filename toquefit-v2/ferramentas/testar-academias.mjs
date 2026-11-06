// Testa netlify/functions/academias.mjs (área do aluno) contra o servidor local oficial do Netlify Blobs.
// Roda junto com os chamados em: npm run testar:api
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PROJ = join(dirname(fileURLToPath(import.meta.url)), "..");
const { BlobsServer } = await import(pathToFileURL(join(PROJ, "node_modules/@netlify/blobs/dist/server.js")));
const dir = mkdtempSync(join(tmpdir(), "blobs-"));
const server = new BlobsServer({ directory: dir, token: "t", port: 8972 });
await server.start();
globalThis.netlifyBlobsContext = Buffer.from(JSON.stringify({ edgeURL: "http://localhost:8972", uncachedEdgeURL: "http://localhost:8972", token: "t", siteID: "teste" })).toString("base64");
const mod = await import(pathToFileURL(join(PROJ, "netlify/functions/academias.mjs")));

/** acha o padrão do config.path, como a Netlify faz */
function params(caminho) {
  for (const p of mod.config.path) {
    const nomes = [];
    const m = caminho.match(new RegExp("^" + p.replace(/:(\w+)/g, (_, n) => { nomes.push(n); return "([^/]+)"; }) + "$"));
    if (m) return Object.fromEntries(nomes.map((n, i) => [n, m[i + 1]]));
  }
  return null;
}
const chamar = async (metodo, caminho, { body, cab = {} } = {}) => {
  const ps = params(caminho);
  if (!ps) return { s: 404, b: null };
  const req = new Request("http://x" + caminho, { method: metodo, headers: cab, body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body) });
  const r = await mod.default(req, { params: ps });
  const txt = r.status === 204 ? "" : await r.text();
  return { s: r.status, b: txt ? JSON.parse(txt) : null };
};
let falhas = 0;
const conf = (nome, ok, extra = "") => { console.log((ok ? "ok    " : "FALHOU") + " " + nome + (extra ? "  " + extra : "")); if (!ok) falhas++; };
const hoje = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const ficha = {
  validade: "2099-12-31",
  treinos: [
    { id: "A", nome: "Peito e costas", dias: [1, 3, 5], itens: [{ slug: "supino-reto", nome: "Supino reto", series: 4, reps: "8–12", carga: "20 kg" }, { slug: null, nome: "Flexão", series: 3, reps: "15" }] },
    { id: "B", nome: "Pernas", dias: [2, 4], itens: [{ slug: "leg-press-45", nome: "Leg press", series: 4, reps: "12", carga: "80 kg" }] },
  ],
};

try {
  let r = await chamar("POST", "/api/academias", { body: { nome: "Academia Teste" } });
  conf("cria academia", r.s === 201 && /^[A-Z0-9]{6}$/.test(r.b.cod) && /^[a-f0-9]{32}$/.test(r.b.chave), JSON.stringify(r.b));
  const { cod, chave } = r.b;
  const I = { "x-chave": chave };
  conf("criar sem nome = 400", (await chamar("POST", "/api/academias", { body: {} })).s === 400);
  conf("painel sem chave = 401", (await chamar("GET", `/api/academias/${cod}`)).s === 401);
  conf("painel com chave errada = 401", (await chamar("GET", `/api/academias/${cod}`, { cab: { "x-chave": "0".repeat(32) } })).s === 401);
  conf("academia inexistente = 404", (await chamar("GET", `/api/academias/ZZZZZZ`, { cab: I })).s === 404);
  r = await chamar("GET", `/api/academias/${cod}`, { cab: I });
  conf("painel vazio", r.s === 200 && r.b.alunos.length === 0 && r.b.academia.nome === "Academia Teste");

  r = await chamar("POST", `/api/academias/${cod}/alunos`, { cab: I, body: { nome: "  Ana <b>Silva</b> ", ficha } });
  conf("cadastra aluno com ficha", r.s === 201 && /^[a-f0-9]{12}$/.test(r.b.aluno.id) && /^[a-f0-9]{32}$/.test(r.b.token) && r.b.aluno.ficha.treinos.length === 2);
  conf("nome é guardado como texto (o HTML é escapado na tela)", r.b.aluno.nome === "Ana <b>Silva</b>");
  const { id } = r.b.aluno, token = r.b.token;
  const A = { "x-aluno": id, "x-token": token };
  conf("aluno sem nome = 400", (await chamar("POST", `/api/academias/${cod}/alunos`, { cab: I, body: { nome: "" } })).s === 400);

  r = await chamar("GET", `/api/academias/${cod}/eu`, { cab: A });
  conf("aluno abre a própria ficha", r.s === 200 && r.b.aluno.nome === "Ana <b>Silva</b>" && r.b.academia === "Academia Teste" && r.b.treinos.length === 0);
  conf("resposta do aluno não traz o hash do token", !JSON.stringify(r.b).includes("token"));
  conf("aluno com token errado = 401", (await chamar("GET", `/api/academias/${cod}/eu`, { cab: { ...A, "x-token": "f".repeat(32) } })).s === 401);
  conf("aluno sem cabeçalhos = 401", (await chamar("GET", `/api/academias/${cod}/eu`)).s === 401);
  conf("aluno não acessa o painel", (await chamar("GET", `/api/academias/${cod}`, { cab: { "x-chave": token } })).s === 401);

  r = await chamar("PUT", `/api/academias/${cod}/eu/treinos/${hoje}`, { cab: A, body: { treino: "A", itens: { "A.0": { feito: true, cargas: ["20", "22", "22"] }, x: { feito: true }, "../a": {} }, sensacao: "pesado", dor: true } });
  conf("registra o treino de hoje (descarta chave fora do formato)", r.s === 200 && r.b.treino.itens["A.0"].cargas.length === 3 && Object.keys(r.b.treino.itens).length === 1);
  conf("treino de outro mês = 400", (await chamar("PUT", `/api/academias/${cod}/eu/treinos/2020-01-01`, { cab: A, body: {} })).s === 400);
  conf("data fora do formato = 400", (await chamar("PUT", `/api/academias/${cod}/eu/treinos/hoje`, { cab: A, body: {} })).s === 400);
  r = await chamar("GET", `/api/academias/${cod}/eu`, { cab: A });
  conf("o treino volta para o aluno", r.b.treinos.length === 1 && r.b.treinos[0].sensacao === "pesado");

  r = await chamar("GET", `/api/academias/${cod}`, { cab: I });
  const a = r.b.alunos[0];
  conf("painel vê resumo: último treino, semana, dias previstos, retorno", a.ultimo === hoje && a.semana === 1 && a.previstos === 5 && a.ultimoRetorno?.dor === true, JSON.stringify(a));
  await chamar("PUT", `/api/academias/${cod}/eu/treinos/${hoje}`, { cab: A, body: { treino: "A", itens: { "A.0": { feito: true, cargas: ["22"] } }, sensacao: null, dor: false } });
  r = await chamar("GET", `/api/academias/${cod}`, { cab: I });
  conf("desmarcar dor e sensação tira o alerta do painel", r.b.alunos[0].ultimoRetorno === null, JSON.stringify(r.b.alunos[0].ultimoRetorno));
  r = await chamar("GET", `/api/academias/${cod}/alunos/${id}`, { cab: I });
  conf("instrutor vê os treinos do aluno, sem o hash do token", r.s === 200 && r.b.treinos.length === 1 && !("token" in r.b.aluno));

  r = await chamar("PUT", `/api/academias/${cod}/alunos/${id}`, { cab: I, body: { nome: "Ana Silva", ficha: { treinos: [{ nome: "Só A", itens: [{ nome: "Agachamento", series: 99 }] }, { nome: "vazio", itens: [] }] } } });
  conf("edita ficha (limita séries, tira treino vazio)", r.s === 200 && r.b.aluno.ficha.treinos.length === 1 && r.b.aluno.ficha.treinos[0].itens[0].series === 10);

  r = await chamar("POST", `/api/academias/${cod}/alunos/${id}/link`, { cab: I });
  conf("gera link novo", r.s === 200 && r.b.token !== token);
  const tokenNovo = r.b.token;
  conf("link antigo deixa de funcionar", (await chamar("GET", `/api/academias/${cod}/eu`, { cab: A })).s === 401);
  conf("link novo funciona", (await chamar("GET", `/api/academias/${cod}/eu`, { cab: { "x-aluno": id, "x-token": r.b.token } })).s === 200);

  const outra = (await chamar("POST", "/api/academias", { body: { nome: "Outra" } })).b;
  conf("outra academia não vê o aluno", (await chamar("GET", `/api/academias/${outra.cod}/alunos/${id}`, { cab: { "x-chave": outra.chave } })).s === 404);
  conf("chave de outra academia = 401", (await chamar("GET", `/api/academias/${cod}`, { cab: { "x-chave": outra.chave } })).s === 401);
  conf("id fora do formato = 400", (await chamar("GET", `/api/academias/${cod}/alunos/..%2F..`, { cab: I })).s === 400);

  // aparelhos com problema
  const B = { cab: { "x-aluno": id, "x-token": tokenNovo } };
  r = await chamar("POST", `/api/academias/${cod}/eu/problemas`, { ...B, body: { slug: "leg-press-45", tipo: "quebrado" } });
  conf("aluno avisa problema no aparelho", r.s === 201 && r.b.problema.quem === "Ana" && r.b.problema.vezes === 1, JSON.stringify(r.b));
  const pid = r.b.problema.id;
  r = await chamar("POST", `/api/academias/${cod}/eu/problemas`, { ...B, body: { slug: "leg-press-45", tipo: "quebrado" } });
  conf("o mesmo problema de novo só soma", r.s === 200 && r.b.problema.id === pid && r.b.problema.vezes === 2);
  conf("tipo inválido = 400", (await chamar("POST", `/api/academias/${cod}/eu/problemas`, { ...B, body: { slug: "leg-press-45", tipo: "<x>" } })).s === 400);
  conf("sem token não avisa", (await chamar("POST", `/api/academias/${cod}/eu/problemas`, { body: { slug: "leg-press-45", tipo: "quebrado" } })).s === 401);
  conf("aluno não lista os problemas", (await chamar("GET", `/api/academias/${cod}/problemas`, { cab: { "x-chave": "2".repeat(32) } })).s === 401);
  r = await chamar("POST", `/api/academias/${cod}/problemas`, { cab: I, body: { slug: "supino-reto", tipo: "limpeza" } });
  conf("equipe registra problema", r.s === 201 && r.b.problema.quem === "Equipe");
  r = await chamar("PATCH", `/api/academias/${cod}/problemas/${pid}`, { cab: I });
  conf("resolve problema", r.s === 200 && r.b.problema.resolvido === true);
  r = await chamar("GET", `/api/academias/${cod}/problemas`, { cab: I });
  conf("lista: aberto primeiro, resolvido depois", r.b.problemas.length === 2 && !r.b.problemas[0].resolvido && r.b.problemas[1].resolvido);
  conf("pid fora do formato = 400", (await chamar("PATCH", `/api/academias/${cod}/problemas/xyz`, { cab: I })).s === 400);

  const ontem = new Date(Date.now() - 3 * 3600e3 - 86400e3).toISOString().slice(0, 10);
  r = await chamar("POST", `/api/academias/${cod}/exemplo`, { cab: I, body: { alunos: [
    { nome: "Exemplo Um", ficha, treinos: [{ data: ontem, treino: "A", itens: { "A.0": { feito: true, cargas: ["20 kg"] } }, sensacao: "leve" }, { data: "2001-01-01", treino: "A", itens: {} }] },
    { nome: "Exemplo Dois", ficha, diasCadastro: 3 },
  ], problemas: [{ slug: "remada-baixa", tipo: "peca", quem: "Carla", horasAtras: 5 }
  ] } });
  conf("cria alunos de exemplo", r.s === 201 && r.b.criados === 2);
  conf("exemplo de novo = 409", (await chamar("POST", `/api/academias/${cod}/exemplo`, { cab: I, body: { alunos: [{ nome: "X", ficha }] } })).s === 409);
  conf("aluno não cria exemplo", (await chamar("POST", `/api/academias/${cod}/exemplo`, { cab: { "x-chave": "1".repeat(32) }, body: { alunos: [{ nome: "X" }] } })).s === 401);
  r = await chamar("GET", `/api/academias/${cod}`, { cab: I });
  const ex1 = r.b.alunos.find((a) => a.nome === "Exemplo Um");
  conf("exemplo aparece marcado, com o treino de ontem e sem a data antiga", ex1?.exemplo === true && ex1.ultimo === ontem && ex1.semana === 1 && ex1.ultimoRetorno?.sensacao === "leve", JSON.stringify(ex1));
  const ex2 = r.b.alunos.find((a) => a.nome === "Exemplo Dois");
  conf("exemplo pode ser aluno novo (cadastrado há 3 dias)", ex2 && Date.now() - ex2.criado < 4 * 86400e3 && Date.now() - ex2.criado > 2 * 86400e3);
  r = await chamar("GET", `/api/academias/${cod}/problemas`, { cab: I });
  conf("problema de exemplo aparece", r.b.problemas.some((x) => x.exemplo && x.slug === "remada-baixa" && x.quem === "Carla"));
  r = await chamar("DELETE", `/api/academias/${cod}/exemplo`, { cab: I });
  conf("apagar exemplos tira o problema de exemplo", !(await chamar("GET", `/api/academias/${cod}/problemas`, { cab: I })).b.problemas.some((x) => x.exemplo));
  conf("apaga só os exemplos", r.s === 200 && r.b.apagados === 2 && (await chamar("GET", `/api/academias/${cod}`, { cab: I })).b.alunos.length === 1);

  conf("apaga aluno",(await chamar("DELETE", `/api/academias/${cod}/alunos/${id}`, { cab: I })).s === 204);
  r = await chamar("GET", `/api/academias/${cod}`, { cab: I });
  conf("aluno e treinos somem", r.b.alunos.length === 0 && (await chamar("GET", `/api/academias/${cod}/alunos/${id}`, { cab: I })).s === 404);
} finally {
  await server.stop();
  rmSync(dir, { recursive: true, force: true });
}
console.log(falhas ? `\n${falhas} falha(s)` : "\nTudo certo");
process.exit(falhas ? 1 : 0);
