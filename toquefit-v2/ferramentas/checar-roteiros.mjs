// Confere os roteiros com instrutora 3D antes de publicar:
//   - toda palavra usada em tr.cue("...") na cena existe na fala do trecho (senão o movimento começa no 0 sem aviso);
//   - todo trecho do roteiro tem coreografia na cena, e toda coreografia aponta para um trecho que existe;
//   - o roteiro está registrado nos três lugares (dados, cenas e catálogo).
// Uso: npm run checar
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (p) => readFileSync(join(RAIZ, p), "utf8");
const semAcento = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const limpar = (s) => s.replace(/\[\[([^\]|]+)(\|[^\]]*)?\]\]/g, "$1");

// cena de cada roteiro, lida do registro em carga.ts
const carga = ler("src/cena/carga.ts");
const imports = Object.fromEntries([...carga.matchAll(/import \{ (\w+) \} from "\.\/(\w+)"/g)].map((m) => [m[1], m[2]]));
const cenas = [...carga.matchAll(/"?([\w-]+)"?: (criar\w+),/g)].map((m) => ({ slug: m[1], arquivo: imports[m[2]] }));
const catalogo = ler("src/cena/catalogo.ts"), dados = ler("src/data/carregar.ts"), aparelhos = ler("src/data/aparelhos.json");

let erros = 0;
const falha = (msg) => { console.log("  ✗ " + msg); erros++; };
for (const { slug, arquivo } of cenas) {
  console.log(`${slug} (src/cena/${arquivo}.ts)`);
  if (!arquivo) { falha("cena registrada em carga.ts sem import"); continue; }
  const rot = JSON.parse(ler(`src/data/roteiros/${slug}.json`));
  const src = ler(`src/cena/${arquivo}.ts`);
  if (!new RegExp(`"?${slug}"?:`).test(catalogo)) falha("faltou no catalogo.ts");
  if (!new RegExp(`"?${slug}"?:`).test(dados)) falha("faltou no carregar.ts");
  if (!aparelhos.includes(`"roteiro": "${slug}"`)) falha('nenhum aparelho com "roteiro" apontando para ele em aparelhos.json');
  // cada bloco case "id": ... até o próximo case (ou o fim do switch)
  const blocos = [...src.matchAll(/((?:case "[^"]+":\s*)+)([\s\S]*?)(?=\n\s*case "|\n\s*}\n\s*return P)/g)];
  const vistos = new Set();
  for (const b of blocos) {
    const casos = [...b[1].matchAll(/case "([^"]+)"/g)].map((m) => m[1]);
    const cues = [...b[2].matchAll(/\.cue\("([^"]+)"\)/g)].map((m) => m[1]);
    const lista = [...b[2].matchAll(/\.cue\(\[([^\]]+)\]/g)].flatMap((m) => [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]));
    for (const id of casos) {
      vistos.add(id);
      const tr = rot.trechos.find((t) => t.id === id);
      if (!tr) { falha(`case "${id}" não existe no roteiro`); continue; }
      const palavras = limpar(tr.say).split(/\s+/).map(semAcento);
      const tem = (c) => palavras.some((p) => p.startsWith(semAcento(c)));
      for (const c of cues) if (!tem(c)) falha(`${id}: cue("${c}") não está na fala`);
      // cue([...]) escolhe uma palavra por trecho: basta uma estar na fala
      if (lista.length && !lista.some(tem)) falha(`${id}: nenhuma palavra de cue([${lista.join(", ")}]) está na fala`);
    }
  }
  for (const t of rot.trechos) if (!vistos.has(t.id)) falha(`trecho "${t.id}" sem coreografia na cena`);
  console.log(`  ${rot.trechos.length} trechos conferidos`);
}
console.log(erros ? `\n${erros} problema(s).` : "\nTudo certo.");
process.exit(erros ? 1 : 0);
