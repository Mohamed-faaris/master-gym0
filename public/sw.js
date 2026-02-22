const IMAGE_CACHE = 'master-gym-images-v1'
const IMAGE_PATHS = ['/transformation/']

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const requestUrl = new URL(request.url)
  const isImageRequest = request.destination === 'image'
  const isTransformationImage = IMAGE_PATHS.some((path) =>
    requestUrl.pathname.startsWith(path),
  )

  // Cache-first for image requests and transformation gallery images.
  if (!isImageRequest && !isTransformationImage) return

  event.respondWith(
    caches.open(IMAGE_CACHE).then(async (cache) => {
      const cached = await cache.match(request, { ignoreVary: true })
      if (cached) return cached

      const response = await fetch(request)
      if (response.ok) {
        cache.put(request, response.clone())
      }
      return response
    }),
  )
})
