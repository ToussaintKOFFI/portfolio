const CACHE_NAME = "toussaint-portfolio-v8";
const APP_SHELL = [
  "./",
  "./certifications/",
  "./merci/",
  "./manifest.webmanifest",
  "./assets/js/pwa.js",
  "./assets/js/animations.js",
  "./assets/css/index.css",
  "./assets/font/bootstrap-icons.css",
  "./assets/font/fonts/bootstrap-icons.woff",
  "./assets/font/fonts/bootstrap-icons.woff2",
  "./assets/img/icon-192.png",
  "./assets/img/icon-512.png",
  "./assets/img/tkode.jpeg",
  "./assets/img/WhatsApp%20Image%202026-08-21%20at%2001.00.04.jpeg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName.startsWith("toussaint-portfolio-") &&
                cacheName !== CACHE_NAME,
            )
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;

          const appShellPage = await caches.match(
            new URL("./", self.registration.scope).href,
          );
          if (appShellPage) return appShellPage;

          return Response.error();
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
