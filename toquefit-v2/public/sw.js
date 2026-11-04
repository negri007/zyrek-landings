// Guarda a demonstração no celular depois da primeira visita: Wi-Fi fraco na academia não trava o vídeo.
// Arquivos com nome versionado (assets, modelo, imagens) vêm do cache; a página sempre tenta a rede primeiro.
const VERSAO = "toquefit-1";
const FIXOS = ["/assets/", "/models/", "/img/"];

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  // áudio fica de fora: o navegador pede pedaços (Range) e o cache só guarda respostas inteiras
  if (FIXOS.some((p) => url.pathname.startsWith(p))) {
    e.respondWith(caches.open(VERSAO).then(async (c) => {
      const salvo = await c.match(req);
      if (salvo) return salvo;
      const r = await fetch(req);
      if (r.status === 200) c.put(req, r.clone());
      return r;
    }));
  } else if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((r) => {
      if (r.status === 200) { const copia = r.clone(); caches.open(VERSAO).then((c) => c.put("/", copia)); }
      return r;
    }).catch(() => caches.match("/").then((r) => r || Response.error())));
  }
});
