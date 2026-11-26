/*
 * Service worker da Batatas da Val.
 * Estratégia: rede primeiro, cache como rede de segurança. Assim o cliente
 * nunca vê um cardápio velho quando está online, mas consegue abrir o site
 * (e o cardápio salvo) quando a internet cai.
 */
const CACHE = "bdv-v1";
const SHELL = ["/", "/logo.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL).catch(() => undefined)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Painel, API e páginas de pedido são sempre ao vivo.
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/admin") || url.pathname.startsWith("/pedido")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && (request.mode === "navigate" || url.pathname.startsWith("/_next/static"))) {
          const copy = response.clone();
          void caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          const shell = await caches.match("/");
          if (shell) return shell;
        }
        return new Response("Sem conexão", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }),
  );
});
