const CACHE_NAME = 'immunitrack-parent-v1';
const APP_ASSETS = [
  '/manifest.webmanifest',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
  '/pwa-maskable-512.png',
  '/apple-touch-icon.png',
];

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ImmuniTrack</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: linear-gradient(180deg, #eff6ff, #f8fafc);
        color: #0f172a;
        font-family: Arial, Helvetica, sans-serif;
      }
      main {
        width: min(28rem, calc(100vw - 2rem));
        border-radius: 1.5rem;
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
        padding: 1.5rem;
      }
      h1 {
        margin: 0 0 0.75rem;
        font-size: 1.25rem;
      }
      p {
        margin: 0;
        line-height: 1.6;
        color: #475569;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>You're offline right now</h1>
      <p>
        ImmuniTrack will open again once your connection is back. Any pages you
        already visited may still be available from cache.
      </p>
    </main>
  </body>
</html>`;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      ),
      self.clients.claim(),
    ])
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (
    request.mode === 'navigate' &&
    (url.pathname === '/' ||
      url.pathname === '/login' ||
      url.pathname.startsWith('/user'))
  ) {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticAsset(request));
  }
});

async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response(OFFLINE_HTML, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  }
}

async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, response.clone());
  return response;
}

function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/_next/image') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.webmanifest')
  );
}
