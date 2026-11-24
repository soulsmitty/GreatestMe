/* GreatestMe offline support.
   The page and its settings: always fetch the newest copy when online (so updates show right away), fall back to the saved copy offline.
   Icons, fonts and the account library: saved copy first, refreshed in the background. Account data never goes through here. */
const CACHE = "greatestme-v4";
const SHELL = ["./", "./index.html", "./config.js", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png", "./vendor/supabase-2.118.0.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url); const same = u.origin === location.origin;
  const fresh = same && (e.request.mode === "navigate" || /\/(index\.html|config\.js|sw\.js)?$/.test(u.pathname) || u.pathname.endsWith("config.js"));
  const asset = same || /fonts\.(googleapis|gstatic)\.com/.test(u.host);
  if (!asset) return; // account traffic goes straight to the network
  if (fresh) {
    e.respondWith(fetch(e.request, { cache: "no-store" }).then(r => { if (r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(h => h || caches.match("./index.html"))));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c => { const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r && (r.ok || r.type === "opaque")) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net; }));
});
