const CACHE_NAME = "cricket-app-cache-v1";

const urlsToCache = [
  "/", // homepage
];

// Install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
});

// Fetch
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only cache home & blog detail pages
  if (
    request.mode === "navigate" &&
    (request.url.endsWith("/") || request.url.includes("/profiles/"))
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the response for offline use
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});
