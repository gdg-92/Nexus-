// Met en cache l'interface et le script WebLLM.
// Les poids du modèle sont mis en cache par WebLLM lui-même.
const CACHE = "ia-hors-ligne-v3";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  const same = url.origin === location.origin;
  const cdn = url.hostname === "cdn.jsdelivr.net";
  if (!same && !cdn) return;

  const save = res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  };

  if (same) {
    // Réseau d'abord (pour recevoir les mises à jour), cache si hors ligne
    e.respondWith(fetch(e.request).then(save).catch(() => caches.match(e.request, { ignoreSearch: true })));
  } else {
    // Script WebLLM : cache d'abord
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(save)));
  }
});
