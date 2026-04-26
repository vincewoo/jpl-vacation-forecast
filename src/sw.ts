/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, NetworkOnly } from 'workbox-strategies'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

declare const self: ServiceWorkerGlobalScope

// Handle messages from workbox-window and the app.
// IMPORTANT: Any message received with a MessageChannel port MUST be responded to
// or the port closed, otherwise Chrome logs:
// "Promised response from onMessage listener went out of scope"
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting())
    // Acknowledge the port so workbox-window's messageSW() resolves cleanly
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ type: 'SKIP_WAITING_ACK' })
    }
    return
  }

  // Respond to any other port-bearing message so no port goes orphaned
  if (event.ports && event.ports[0]) {
    event.ports[0].postMessage({ received: true })
  }
})

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// Never cache Firebase auth token endpoints — stale tokens break Firestore writes
registerRoute(
  ({ url }) =>
    url.hostname === 'securetoken.googleapis.com' ||
    url.hostname === 'identitytoolkit.googleapis.com',
  new NetworkOnly()
)

// NetworkFirst for other Google APIs (Firebase, etc.)
registerRoute(
  ({ url }) => url.hostname.endsWith('.googleapis.com'),
  new NetworkFirst({
    cacheName: 'google-apis-cache',
    networkTimeoutSeconds: 10,
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  })
)

// NetworkFirst for Firebase Realtime Database
registerRoute(
  ({ url }) => url.hostname.endsWith('.firebaseio.com'),
  new NetworkFirst({
    cacheName: 'firebase-cache',
    networkTimeoutSeconds: 10,
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  })
)
