const CACHE_NAME = 'photoverse-cache-v5'; // Incrementado para forzar actualización
const URLS_TO_CACHE = [
  // App Shell
  '/',
  '/index.html',
  '/manifest.json',

  // Icons
  '/icon-48x48.png',
  '/icon-72x72.png',
  '/icon-96x96.png',
  '/icon-128x128.png',
  '/icon-144x144.png',
  '/icon-192x192.png',
  '/icon-256x256.png',
  '/icon-384x384.png',
  '/icon-512x512.png',
  
  // Scripts & Styles (Local)
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.tsx',
  '/translations.ts',
  '/services/geminiService.ts',
  '/components/SplashScreen.tsx',
  '/components/UploadScreen.tsx',
  '/components/ProcessingScreen.tsx',
  '/components/ResultScreen.tsx',
  '/components/ClayButton.tsx',
  '/components/SelectionCard.tsx',
  '/components/InstallPromptModal.tsx',
  '/components/UpdateToast.tsx', // Nuevo componente

  // CDN Resources
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://aistudiocdn.com/@google/genai@^1.20.0',
  'https://aistudiocdn.com/react@^19.1.1',
  'https://aistudiocdn.com/react-dom@^19.1.1',
  'https://aistudiocdn.com/lucide-react@^0.544.0'
];

// 1. INSTALACIÓN: Cachear recursos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
      // NOTA: Ya no usamos skipWaiting() aquí automáticamente para evitar
      // romper la app mientras el usuario la usa. Lo haremos vía mensaje.
  );
});

// 2. ACTIVACIÓN: Limpiar cachés viejas
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Tomar control de inmediato tras activar
  );
});

// 3. FETCH: Estrategia Cache First, Network Fallback
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;

        return fetch(event.request).then(
          networkResponse => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                if (!event.request.url.includes('generativelanguage')) {
                    cache.put(event.request, responseToCache);
                }
              });
            return networkResponse;
          }
        ).catch(error => {
            console.error('Fetching failed:', error);
            // Aquí se podría retornar una página offline personalizada
        });
      })
  );
});

// 4. MENSAJES: Escuchar orden de actualizar
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
