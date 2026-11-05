import { defineConfig, type Plugin } from "vite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Só no npm run dev: atende /api/salas/... com a mesma função que vai para a Netlify,
 * guardando os chamados num Netlify Blobs local (pasta .netlify/blobs-dev). Assim a sala ao vivo
 * funciona no computador sem instalar a Netlify CLI.
 */
function funcoesLocais(): Plugin {
  return {
    name: "toquefit-funcoes-locais",
    apply: "serve",
    async configureServer(server) {
      const { BlobsServer } = await import("@netlify/blobs/server");
      const pasta = join(server.config.root, ".netlify", "blobs-dev");
      mkdirSync(pasta, { recursive: true });
      const blobs = new BlobsServer({ directory: pasta, token: "dev" });
      const { port } = await blobs.start();
      const url = `http://localhost:${port}`;
      (globalThis as { netlifyBlobsContext?: string }).netlifyBlobsContext =
        Buffer.from(JSON.stringify({ edgeURL: url, uncachedEdgeURL: url, token: "dev", siteID: "dev" })).toString("base64");
      server.httpServer?.once("close", () => void blobs.stop());
      const funcoes = ["chamados.mjs", "academias.mjs"].map((f) => pathToFileURL(join(server.config.root, "netlify", "functions", f)).href);
      /** "/api/salas/:sala/chamados" vira uma regex que devolve { sala } */
      const casar = (padrao: string, caminho: string) => {
        const nomes: string[] = [];
        const re = new RegExp("^" + padrao.replace(/:(\w+)/g, (_, n) => { nomes.push(n); return "([^/]+)"; }) + "$");
        const m = caminho.match(re);
        return m ? Object.fromEntries(nomes.map((n, i) => [n, decodeURIComponent(m[i + 1])])) : null;
      };
      server.middlewares.use(async (req, res, next) => {
        const caminho = (req.url || "").split("?")[0];
        if (!caminho.startsWith("/api/")) return next();
        try {
          // recarrega a cada pedido: editar a função vale sem reiniciar o servidor
          let achou: { fn: (r: Request, c: unknown) => Promise<Response>; params: Record<string, string> } | null = null;
          for (const f of funcoes) {
            const mod = await import(f + "?t=" + Date.now());
            for (const p of mod.config.path as string[]) {
              const params = casar(p, caminho);
              if (params) { achou = { fn: mod.default, params }; break; }
            }
            if (achou) break;
          }
          if (!achou) return next();
          const partes: Buffer[] = [];
          for await (const p of req) partes.push(p as Buffer);
          const corpo = partes.length ? Buffer.concat(partes) : undefined;
          const r: Response = await achou.fn(new Request("http://localhost" + req.url, { method: req.method, headers: req.headers as Record<string, string>, body: corpo }),
            { params: achou.params });
          res.statusCode = r.status;
          r.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await r.arrayBuffer()));
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ erro: String(e) }));
        }
      });
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [funcoesLocais()],
  build: { target: "es2022", chunkSizeWarningLimit: 900 },
});
