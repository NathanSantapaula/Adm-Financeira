/* Abre o site sem internet: busca na rede primeiro (o cliente sempre recebe a versão nova) e, sem conexão, usa a última cópia guardada.
   Só arquivos do próprio site; Supabase, fontes e CDN passam direto. Os dados do cliente continuam vindo do banco. */
const CACHE = 'aven-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then((res) => {
    // shortcut: cópias de versões antigas (?v=) ficam no cache até o navegador limpar; trocar CACHE se o espaço virar problema
    if (res.ok) { const c = res.clone(); caches.open(CACHE).then((k) => k.put(r, c)); }
    return res;
  }).catch(() => caches.match(r).then((m) => m || (r.mode === 'navigate' ? caches.match('./') : Response.error()))));
});
