// Minimal service worker — does nothing, just suppresses 404 logs.
self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", () => self.clients.claim())