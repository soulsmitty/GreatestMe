/* GreatestMe offline support.
   The page and its settings: always fetch the newest copy when online (so updates show right away), fall back to the saved copy offline.
   Icons, fonts and the account library: saved copy first, refreshed in the background. Account data never goes through here. */
const CACHE = "greatestme-v6";
const SHELL = ["./", "./index.html", "./config.js", "./icons/manifest-greatestme.webmanifest", "./icons/icon-180-greatestme.png", "./icons/icon-192-greatestme.png", "./icons/icon-512-greatestme.png", "./icons/icon.svg", "./vendor/supabase-2.118.0.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url); const same = u.origin === location.origin;
  const fresh = same && (e.request.mode === "navigate" || /\/(index\.html|config\.js|sw\.js)?$/.test(u.pathname) || u.pathname.endsWith("config.js"));
  const asset = same || /fonts\.(googleapis|gstatic)\.com/.test(u.host);
  if (!asset) return; // account traffic goes straight to the network
  if (fresh) { // newest copy when the network answers quickly; the saved copy after 2.5 s on a slow connection (the newer one is still saved for next time)
    const net = fetch(e.request, { cache: "no-store" }).then(r => { if (r.ok) { const c2 = r.clone(); e.waitUntil(caches.open(CACHE).then(c => c.put(e.request, c2))); } return r; });
    const saved = () => caches.match(e.request, { ignoreSearch: true }).then(h => h || (e.request.mode === "navigate" ? caches.match("./index.html") : undefined));
    e.respondWith(new Promise(resolve => { let done = false; const finish = r => { if (!done && r) { done = true; resolve(r); } };
      const t = setTimeout(() => saved().then(finish), 2500);
      net.then(r => { clearTimeout(t); finish(r); }).catch(() => { clearTimeout(t); saved().then(h => { if (h) finish(h); else if (!done) { done = true; resolve(Response.error()); } }); }); }));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c => { const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r && (r.ok || r.type === "opaque")) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net; }));
});
