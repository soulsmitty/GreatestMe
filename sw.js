/* GreatestMe offline support: opens from the Home Screen without signal.
   App files: show the saved copy instantly, refresh it in the background. Account data never goes through here. */
const CACHE = "greatestme-v2";
const SHELL = ["./", "./index.html", "./config.js", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png", "./vendor/supabase-2.118.0.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  const app = u.origin === location.origin;
  const lib = /cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@/.test(u.href) || /fonts\.(googleapis|gstatic)\.com/.test(u.host);
  if (!app && !lib) return; // account traffic goes straight to the network
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: app });
    const net = fetch(e.request).then(r => { if (r && (r.ok || r.type === "opaque")) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
