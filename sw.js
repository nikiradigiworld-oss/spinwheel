const CACHE = 'spinsip-v2'

const PRECACHE = [
  '/spinwheel/',
  '/spinwheel/index.html',
  '/spinwheel/manifest.json',
  '/spinwheel/favicon.svg',
]

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)

  if (url.hostname.includes('supabase.co')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)))
    return
  }

  if (
    url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|webp|woff2?|ico)$/) ||
    url.pathname.startsWith('/spinwheel/assets/')
  ) {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(e.request)
        if (cached) return cached
        const fresh = await fetch(e.request)
        if (fresh.ok) cache.put(e.request, fresh.clone())
        return fresh
      })
    )
    return
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()))
        return res
      })
      .catch(() => caches.match(e.request) || caches.match('/spinwheel/'))
  )
})

// ── Push Notifications ───────────────────────────────────────────────────────

self.addEventListener('push', e => {
  let data = { title: 'Spin & SIP Money', body: 'You have a new notification!', icon: '/spinwheel/favicon.svg' }
  try { data = { ...data, ...e.data.json() } } catch {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    data.icon || '/spinwheel/favicon.svg',
      badge:   '/spinwheel/favicon.svg',
      tag:     data.tag  || 'spinsip',
      data:    { url: data.url || '/spinwheel/' },
      vibrate: [200, 100, 200],
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/spinwheel/'
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes('spinwheel'))
      if (existing) return existing.focus()
      return clients.openWindow(url)
    })
  )
})
