const VERSION = "mozg-site-patricia-v10";
const HOME_PATH = "/node-vitepress-patricia/";
const APP_SHELL = [
  "/node-vitepress-patricia/",
  "/node-vitepress-patricia/manifest.json",
  "/node-vitepress-patricia/logo-mini.svg",
  "/node-vitepress-patricia/logo-mini.png",
  "/node-vitepress-patricia/og.jpg",
  "/node-vitepress-patricia/data/site-catalog.json",
  "/node-vitepress-patricia/data/site-audit.json",
  "/node-vitepress-patricia/data/site-discovery.json",
  "/node-vitepress-patricia/data/site-portfolio.json",
  "/node-vitepress-patricia/data/site-projects.json",
  "/node-vitepress-patricia/data/site-capabilities.json",
  "/node-vitepress-patricia/data/site-stacks.json",
  "/node-vitepress-patricia/data/site-operations.json",
  "/node-vitepress-patricia/data/site-journeys.json",
  "/node-vitepress-patricia/data/site-trust.json",
  "/node-vitepress-patricia/llms.txt",
  "/node-vitepress-patricia/robots.txt",
  "/node-vitepress-patricia/contato",
  "/node-vitepress-patricia/presenca",
  "/node-vitepress-patricia/en/",
  "/node-vitepress-patricia/en/contact",
  "/node-vitepress-patricia/en/presence"
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => (key === VERSION ? null : caches.delete(key))),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            event.waitUntil(
              caches.open(VERSION).then((cache) => {
                cache.put(HOME_PATH, responseClone);
              }),
            );
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(VERSION);
          return cache.match(HOME_PATH) || Response.error();
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            event.waitUntil(
              caches.open(VERSION).then((cache) => {
                cache.put(event.request, responseClone);
              }),
            );
          }
          return response;
        })
        .catch(() => cachedResponse || Response.error());

      return cachedResponse || networkFetch;
    }),
  );
});
