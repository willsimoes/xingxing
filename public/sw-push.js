self.addEventListener('push', (event) => {
  let titulo = 'Xingxing'
  let corpo = ''
  let url = '/'
  try {
    const dados = event.data ? event.data.json() : {}
    if (typeof dados.title === 'string' && dados.title.trim()) titulo = dados.title
    if (typeof dados.body === 'string') corpo = dados.body
    if (typeof dados.url === 'string' && dados.url.startsWith('/')) url = dados.url
  } catch {
    corpo = event.data ? event.data.text() : ''
  }

  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: corpo,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const destino = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) => {
      for (const janela of janelas) {
        if (janela.url.startsWith(self.location.origin) && 'focus' in janela) return janela.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(destino)
      return undefined
    }),
  )
})
