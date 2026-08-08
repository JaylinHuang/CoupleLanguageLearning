// PWA Service Worker：页面走网络优先（离线回退缓存），静态资源缓存优先
const CACHE = "couple-language-learning-v1";
const PRECACHE = ["/manifest.json", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // 页面导航：网络优先，成功后缓存副本；离线时回退到缓存（支持离线打开 /review 复习）
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached ?? caches.match("/review")),
        ),
    );
    return;
  }

  // 静态资源（JS/CSS/图标/笔顺数据）：缓存优先
  const cacheable =
    req.url.includes("/_next/static/") ||
    req.url.includes("/icons/") ||
    req.url.includes("cdn.jsdelivr.net/npm/hanzi-writer-data") ||
    req.url.endsWith("/manifest.json");

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res.ok && cacheable) {
            const clone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);
    }),
  );
});
