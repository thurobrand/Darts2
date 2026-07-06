const IMAGE_CACHE = 'darts2-image-cache-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => name.startsWith('darts2-image-cache-') && name !== IMAGE_CACHE)
        .map((name) => caches.delete(name))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  const isImageRequest = request.destination === 'image' || /\.(png|jpg|jpeg|gif|webp|svg|avif)$/i.test(url.pathname);
  if (!isImageRequest) {
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(request);
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      return cachedResponse || Response.error();
    }
  })());
});
