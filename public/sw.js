const CACHE_VERSION = 'deboa-cache-v1'
const APP_SHELL_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/pwa-192.svg',
  '/pwa-512.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(APP_SHELL_CACHE)
    }),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key)),
      )
    }),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  const requestUrl = new URL(event.request.url)
  const isSameOrigin = requestUrl.origin === self.location.origin

  if (!isSameOrigin) {
    return
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const cloned = response.clone()
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put('/index.html', cloned)
          })
          return response
        })
        .catch(() => caches.match('/index.html')),
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response
          }

          const cloned = response.clone()
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(event.request, cloned)
          })
          return response
        })
        .catch(() => caches.match('/index.html'))
    }),
  )
})
