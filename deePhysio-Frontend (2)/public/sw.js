// ClinicPilot Clinical SaaS Service Worker
const CACHE_VERSION = 'clinicpilot-v2.0.0';
const STATIC_CACHE = `clinicpilot-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `clinicpilot-dynamic-${CACHE_VERSION}`;

// Precache essential application shell assets
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/logo.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png'
];

// Sensitive endpoint substrings that MUST NEVER be cached locally
const SENSITIVE_API_PATTERNS = [
  '/api/auth',
  '/api/users',
  '/api/patients',
  '/api/clinical-notes',
  '/api/notes',
  '/api/billing',
  '/api/invoices',
  '/api/payments',
  '/api/backup',
  '/api/audit-logs',
  '/api/otp',
  '/api/whatsapp',
  '/api/integrations',
  '/api/saas'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache incomplete:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
            console.log('[SW] Removing stale cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Listen for SKIP_WAITING message sent from Update Notification UI
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests
  if (req.method !== 'GET') {
    return;
  }

  // Skip chrome-extension schemes or non-HTTP(S)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Check if request is sensitive API
  const isSensitive = SENSITIVE_API_PATTERNS.some((pattern) => url.pathname.includes(pattern));
  if (isSensitive) {
    // Network-only for sensitive APIs. Let NetworkManager / catch block handle offline states
    event.respondWith(
      fetch(req).catch(() => {
        return new Response(
          JSON.stringify({
            success: false,
            offline: true,
            message: 'Device is currently offline. Please reconnect to access real-time clinical data.'
          }),
          {
            status: 503,
            statusText: 'Service Unavailable (Offline)',
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // Navigation requests (HTML pages) -> Network-first with cache fallback to /index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const indexCached = await caches.match('/index.html');
          if (indexCached) return indexCached;
          const rootCached = await caches.match('/');
          if (rootCached) return rootCached;

          return new Response(
            `<!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>ClinicPilot - Offline</title>
              <style>
                body { margin:0; font-family: system-ui, -apple-system, sans-serif; background: #0F172A; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 20px; box-sizing: border-box; }
                .card { max-width: 400px; background: #1E293B; padding: 32px; border-radius: 20px; border: 1px solid #334155; }
                h1 { font-size: 20px; font-weight: 800; margin-bottom: 8px; color: #2EA7B8; }
                p { font-size: 13px; color: #94A3B8; line-height: 1.5; margin-bottom: 24px; }
                button { background: #2EA7B8; color: #fff; border: none; font-weight: 700; padding: 12px 24px; border-radius: 12px; cursor: pointer; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>Device Offline</h1>
                <p>ClinicPilot requires an active internet connection to securely synchronize clinical data. Please check your network and reconnect.</p>
                <button onclick="window.location.reload()">Retry Connection</button>
              </div>
            </body>
            </html>`,
            {
              headers: { 'Content-Type': 'text/html;charset=utf-8' },
              status: 200
            }
          );
        })
    );
    return;
  }

  // Static assets (JS, CSS, fonts, images) -> Stale-While-Revalidate with error-safe catch
  const isStaticAsset = (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2')
  );

  if (isStaticAsset) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        const fetchPromise = fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(req, clone));
            }
            return networkResponse;
          })
          .catch(() => null);

        if (cachedResponse) {
          // Trigger background revalidation
          fetchPromise;
          return cachedResponse;
        }

        return fetchPromise.then((networkResponse) => {
          if (networkResponse) return networkResponse;
          // Fallback response for missing offline asset to prevent unhandled promise rejection
          return new Response('', {
            status: 503,
            statusText: 'Service Unavailable (Offline Asset)'
          });
        });
      })
    );
    return;
  }

  // All other public requests
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});
